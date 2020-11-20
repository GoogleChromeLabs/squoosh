use oxipng::AlphaOptim;
use wasm_bindgen::prelude::*;

mod malloc_shim;

#[cfg(feature = "parallel")]
pub mod parallel;

#[wasm_bindgen]
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
