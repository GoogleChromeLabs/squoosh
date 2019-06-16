#[macro_use]
extern crate lazy_static;
extern crate cfg_if;
extern crate wasm_bindgen;

mod common;
mod hq2x;
mod hq3x;
mod hq4x;
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
        2 => hq2x::calculate(
            input_image.as_slice(),
            output_image.as_mut_slice(),
            input_width,
            input_height,
        ),
        3 => hq3x::calculate(
            input_image.as_slice(),
            output_image.as_mut_slice(),
            input_width,
            input_height,
        ),
        4 => hq4x::calculate(
            input_image.as_slice(),
            output_image.as_mut_slice(),
            input_width,
            input_height,
        ),
        _ => unreachable!(),
    };

    return output_image;
}

pub fn main() {
    let img: std::vec::Vec<u32> = vec![
        0, 0, 4288862704, 4288862704, 4288862704, 4288862704, 4288862704, 0, 0, 4288862704,
        4284850137, 4284850137, 4284850137, 4284850137, 0, 4288862704, 0, 4288862704, 4285905392,
        4285905392, 4278388238, 4278391708, 0, 0, 0, 0, 4285905392, 4285905392, 4285905392,
        4278391708, 0, 0, 0, 0, 4279653942, 4279653942, 4279653942, 0, 0, 0, 0, 0, 4280520102,
        4280520102, 4280520102, 0, 0, 0, 0, 0, 4280520102, 4280520102, 4280520102, 0, 0, 0, 0,
        4285905392, 4285905392, 0, 4285905392, 4285905392, 0, 0,
    ];
    let output = resize(img, 8, 8, 2);
    println!("{:?}", output);
}
