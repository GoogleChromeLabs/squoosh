extern crate wasm_bindgen;

use wasm_bindgen::prelude::*;
use std::time::{Instant};

#[wasm_bindgen]
pub fn doit() -> u32 {
  let start = Instant::now();
  start.elapsed().as_secs() as u32
}
