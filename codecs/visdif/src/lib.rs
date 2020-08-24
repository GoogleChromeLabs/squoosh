mod utils;

use cfg_if::cfg_if;
use wasm_bindgen::prelude::*;

use dssim::ToRGBAPLU;

cfg_if! {
    // When the `wee_alloc` feature is enabled, use `wee_alloc` as the global
    // allocator.
    if #[cfg(feature = "wee_alloc")] {
        extern crate wee_alloc;
        #[global_allocator]
        static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;
    }
}

#[wasm_bindgen]
#[no_mangle]
pub fn ssim(
    image_a: Vec<u8>,
    image_b: Vec<u8>
) -> f64 {
    let a = image_a.as_slice().to_rgbaplu();
    let b = image_b.as_slice().to_rgbaplu();
    // TODO: Rearchitect entire thing to enable `set_save_ssim_maps`
    // accrossm multiple SSIM calculations.
    dssim::Dssim::new().compare(a, b)
}
