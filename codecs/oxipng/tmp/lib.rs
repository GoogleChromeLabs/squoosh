extern crate wasm_bindgen;

use wasm_bindgen::prelude::*;
use std::thread::spawn;

#[wasm_bindgen]
pub fn doit() {
  // let child = spawn(move || -> u32 {
  //   5
  // });
  // let result = child.join().unwrap();
  let result = spawn();
  println!("Result: {}", result);
}
