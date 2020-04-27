mod malloc_shim;

use crossbeam_deque::Injector;
use once_cell::sync::OnceCell;
use wasm_bindgen::prelude::*;
use wasm_bindgen::JsValue;
use oxipng::AlphaOptim;

#[wasm_bindgen]
extern "C" {
    type Worker;

    #[wasm_bindgen(js_namespace = Array, js_name = of)]
    fn array_of_2(a: JsValue, b: JsValue) -> JsValue;

    #[wasm_bindgen(method, js_name = postMessage)]
    fn post_message(worker: &Worker, msg: JsValue);
}

static TASKS: OnceCell<Injector<rayon::ThreadBuilder>> = OnceCell::new();

#[wasm_bindgen]
pub fn worker_initializer() -> JsValue {
    TASKS.get_or_init(Injector::new);
    array_of_2(wasm_bindgen::module(), wasm_bindgen::memory())
}

#[wasm_bindgen]
pub fn start_main_thread(num: usize) {
    let tasks = TASKS.get().unwrap();

    rayon::ThreadPoolBuilder::new()
        .num_threads(num)
        .spawn_handler(|thread| Ok(tasks.push(thread)))
        .build_global()
        .unwrap_throw()
}

#[wasm_bindgen]
pub fn start_worker_thread() {
    let tasks = TASKS.get().unwrap();
    loop {
        if let crossbeam_deque::Steal::Success(task) = tasks.steal() {
            return task.run();
        }
    }
}

#[wasm_bindgen(catch)]
pub fn optimise(data: &[u8], level: u8) -> Vec<u8> {
  let mut options = oxipng::Options::from_preset(level);
  options.alphas.insert(AlphaOptim::Black);
  options.alphas.insert(AlphaOptim::White);
  options.alphas.insert(AlphaOptim::Up);
  options.alphas.insert(AlphaOptim::Down);
  options.alphas.insert(AlphaOptim::Left);
  options.alphas.insert(AlphaOptim::Right);

  options.deflate = oxipng::Deflaters::Libdeflater;
  oxipng::optimize_from_memory(data, &options).unwrap_throw()
}
