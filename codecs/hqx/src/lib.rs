extern crate cfg_if;
extern crate hqx;
extern crate wasm_bindgen;

mod utils;

use cfg_if::cfg_if;
use wasm_bindgen::prelude::*;

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
pub fn resize(
    input_image: Vec<u32>,
    input_width: usize,
    input_height: usize,
    factor: usize,
) -> Vec<u32> {
    let num_output_pixels = input_width * input_height * factor * factor;
    let mut output_image = Vec::<u32>::with_capacity(num_output_pixels * 4);
    output_image.resize(num_output_pixels, 0);

    match factor {
        2 => hqx::hq2x(
            input_image.as_slice(),
            output_image.as_mut_slice(),
            input_width,
            input_height,
        ),
        3 => hqx::hq3x(
            input_image.as_slice(),
            output_image.as_mut_slice(),
            input_width,
            input_height,
        ),
        4 => hqx::hq4x(
            input_image.as_slice(),
            output_image.as_mut_slice(),
            input_width,
            input_height,
        ),
        _ => unreachable!(),
    };

    return output_image;
}
