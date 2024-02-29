#[cfg(feature = "parallel")]
pub use wasm_bindgen_rayon::init_thread_pool;

use oxipng::AlphaOptim;
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn optimise(data: &[u8], level: u8, interlace: bool) -> Vec<u8> {
    let mut options = oxipng::Options::from_preset(level);
    options.alphas.insert(AlphaOptim::Black);
    options.alphas.insert(AlphaOptim::White);
    options.alphas.insert(AlphaOptim::Up);
    options.alphas.insert(AlphaOptim::Down);
    options.alphas.insert(AlphaOptim::Left);
    options.alphas.insert(AlphaOptim::Right);
    options.interlace = Some(if interlace { 1 } else { 0 });

    options.deflate = oxipng::Deflaters::Libdeflater;
    oxipng::optimize_from_memory(data, &options).unwrap_throw()
}
