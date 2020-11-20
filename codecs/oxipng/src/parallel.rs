use crossbeam_channel::{bounded, Receiver, Sender};
use once_cell::sync::OnceCell;
use wasm_bindgen::prelude::*;
use wasm_bindgen::JsValue;

#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace = Array, js_name = of)]
    fn array_of_2(a: JsValue, b: JsValue) -> JsValue;
}

// This is one of the parts that work around Chromium incorrectly implementing postMessage:
// https://bugs.chromium.org/p/chromium/issues/detail?id=1075645
//
// rayon::ThreadPoolBuilder (used below) executes spawn handler to populate the worker pool,
// and then blocks the current thread until each worker unblocks its (opaque) lock.
//
// Normally, we could use postMessage directly inside the spawn handler to
// post module + memory + threadPtr to each worker, and the block the current thread.
//
// However, that bug means that postMessage is currently delayed until the next event loop,
// which will never spin since we block the current thread, and so the other workers will
// never be able to unblock us.
//
// To work around this problem, we:
// 1) Expose `worker_initializer` that returns module + memory pair (without threadPtr)
//    that workers can be initialised with to become native threads.
//    JavaScript can postMessage this pair in advance, and asynchronously wait for workers
//    to acknowledge the receipt.
// 2) Create a global communication channel on the Rust side using crossbeam.
//    It will be used to send threadPtr to the pre-initialised workers
//    instead of postMessage.
// 3) Provide a separate `start_main_thread` that expects all workers to be ready,
//    and just uses the provided channel to send `threadPtr`s using the
//    shared memory and blocks the current thread until they're all grabbed.
// 4) Provide a `worker_initializer` that is expected to be invoked from various workers,
//    reads one `threadPtr` from the shared channel and starts running it.
static CHANNEL: OnceCell<(Sender<rayon::ThreadBuilder>, Receiver<rayon::ThreadBuilder>)> =
    OnceCell::new();

#[wasm_bindgen]
pub fn worker_initializer(num: usize) -> JsValue {
    CHANNEL.get_or_init(|| bounded(num));
    array_of_2(wasm_bindgen::module(), wasm_bindgen::memory())
}

#[wasm_bindgen]
pub fn start_main_thread() {
    let (sender, _) = CHANNEL.get().unwrap();

    rayon::ThreadPoolBuilder::new()
        .num_threads(sender.capacity().unwrap())
        .spawn_handler(|thread| Ok(sender.send(thread).unwrap_throw()))
        .build_global()
        .unwrap_throw()
}

#[wasm_bindgen]
pub fn start_worker_thread() {
    let (_, receiver) = CHANNEL.get().unwrap();
    receiver.recv().unwrap_throw().run()
}
