use cfg_if::cfg_if;
use wasm_bindgen::prelude::*;

use dssim_core::{Dssim, ToRGBAPLU};
use imgref;
use rgb::FromSlice;
//use rayon_core;

mod utils;

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
pub fn ssim(data_a: Vec<u8>, data_b: Vec<u8>, width: usize, height: usize) -> f64 {
    let dssim = Dssim::new();

    // FIXME: Creating new Dssim every time is wasteful. In the context
    // of the CLI, one image is highly likely to remain static (i.e. the
    // reference image). dssim_core has a `set_save_ssim_maps`, that should
    // make subsequent comparisons a lot cheaper.

    let image_a = imgref::Img::new(data_a.as_slice().as_rgba().to_rgbaplu(), width, height);
    let a = match dssim.create_image(&image_a) {
        Some(v) => v,
        _ => return -1.0, // FIXME: Use something more idiomatic
    };

    let image_b = imgref::Img::new(data_b.as_slice().as_rgba().to_rgbaplu(), width, height);
    let b = match dssim.create_image(&image_b) {
        Some(v) => v,
        _ => return -1.0, // FIXME: Use something more idiomatic
    };

    //let b = (image_b.as_slice().to_rgbaplu();
    // TODO: Rearchitect entire thing to enable `set_save_ssim_maps`
    // accrossm multiple SSIM calculations.
    dssim.compare(&a, &b).0.into()
}
