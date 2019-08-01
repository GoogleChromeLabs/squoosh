use wasm_bindgen::prelude::*;

#[wasm_bindgen(catch)]
pub fn optimise(data: &[u8], level: u8) -> Vec<u8> {
  let options = oxipng::Options::from_preset(level);
  oxipng::optimize_from_memory(data, &options).unwrap_throw()
}
