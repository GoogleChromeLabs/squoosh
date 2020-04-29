use crossbeam_channel::{Sender, Receiver, bounded};
use once_cell::sync::OnceCell;
use wasm_bindgen::prelude::*;
use wasm_bindgen::JsValue;

#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace = Array, js_name = of)]
    fn array_of_2(a: JsValue, b: JsValue) -> JsValue;
}

static CHANNEL: OnceCell<(Sender<rayon::ThreadBuilder>, Receiver<rayon::ThreadBuilder>)> = OnceCell::new();

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
