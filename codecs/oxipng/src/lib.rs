extern crate cfg_if;
extern crate wasm_bindgen;
// extern crate oxipng;

mod utils;

use cfg_if::cfg_if;
use wasm_bindgen::prelude::*;
use std::time::{Instant};
cfg_if! {
    // When the `wee_alloc` feature is enabled, use `wee_alloc` as the global
    // allocator.
    if #[cfg(feature = "wee_alloc")] {
        extern crate wee_alloc;
        #[global_allocator]
        static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;
    }
}

// #[wasm_bindgen]
// extern {
//   #[wasm_bindgen(js_namespace = console)]
//   fn log(s: &str);
// }

// #[wasm_bindgen]
// pub fn compress(img: Vec<u8>, level: u8) -> Vec<u8> {
//   log(&format!("len: {}, level: {}", img.len(), level));
//   let mut options = oxipng::Options::from_preset(level);
//   options.threads = 0;
//   let result = oxipng::optimize_from_memory(img.as_slice(), &options);
//   match result {
//     Ok(v) => v,
//     Err(e) => e.to_string().as_bytes().to_vec()
//   }
// }

#[wasm_bindgen]
pub fn doit() -> u32 {
  let start = Instant::now();
  start.elapsed().as_secs() as u32
}
