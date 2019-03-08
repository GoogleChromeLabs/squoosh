extern crate cfg_if;
extern crate resize;
extern crate wasm_bindgen;

mod utils;

use cfg_if::cfg_if;
use resize::Pixel::RGBA;
use resize::Type;
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
    mut input_image: Vec<u8>,
    input_width: usize,
    input_height: usize,
    output_width: usize,
    output_height: usize,
    typ_idx: usize,
    premultiply: bool,
) -> Vec<u8> {
    let typ = match typ_idx {
        0 => Type::Triangle,
        1 => Type::Catrom,
        2 => Type::Mitchell,
        3 => Type::Lanczos3,
        _ => panic!("Nope"),
    };
    let num_input_pixels = input_width * input_height;
    let num_output_pixels = output_width * output_height;

    if premultiply {
        for i in 0..num_input_pixels {
            for j in 0..3 {
                input_image[4 * i + j] = ((input_image[4 * i + j] as f32)
                    * (input_image[4 * i + 3] as f32)
                    / 255.0) as u8;
            }
        }
    }

    let mut resizer = resize::new(
        input_width,
        input_height,
        output_width,
        output_height,
        RGBA,
        typ,
    );
    let mut output_image = Vec::<u8>::with_capacity(num_output_pixels * 4);
    output_image.resize(num_output_pixels * 4, 0);
    resizer.resize(input_image.as_slice(), output_image.as_mut_slice());

    if premultiply {
        for i in 0..num_output_pixels {
            for j in 0..3 {
                // We don’t need to worry about division by zero, as division by zero
                // is well-defined on floats to return `±Inf`. ±Inf is converted to 0
                // when casting to integers.
                output_image[4 * i + j] = ((output_image[4 * i + j] as f32) * 255.0
                    / (output_image[4 * i + 3] as f32))
                    as u8;
            }
        }
    }

    return output_image;
}
