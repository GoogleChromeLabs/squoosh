use crossbeam_deque::Injector;
use once_cell::sync::OnceCell;
use wasm_bindgen::prelude::*;
use wasm_bindgen::JsValue;

#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace = Array, js_name = of)]
    fn array_of_2(a: JsValue, b: JsValue) -> JsValue;
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
