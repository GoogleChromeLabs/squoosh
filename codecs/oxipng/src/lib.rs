#[cfg(feature = "parallel")]
pub use wasm_bindgen_rayon::init_thread_pool;

use oxipng::Interlacing;
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn optimise(data: &[u8], level: u8, interlace: bool) -> Vec<u8> {
    let mut options = oxipng::Options::from_preset(level);
    options.optimize_alpha = true;
    options.interlace = Some(if interlace {
        Interlacing::Adam7
    } else {
        Interlacing::None
    });

    oxipng::optimize_from_memory(data, &options).unwrap_throw()
}
