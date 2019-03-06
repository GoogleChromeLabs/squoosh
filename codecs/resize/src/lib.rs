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
    input_image: Vec<u8>,
    input_width: usize,
    input_height: usize,
    output_width: usize,
    output_height: usize,
    typ_idx: usize,
) -> Vec<u8> {
    let typ = match typ_idx {
        0 => Type::Triangle,
        1 => Type::Catrom,
        2 => Type::Mitchell,
        3 => Type::Lanczos3,
        _ => panic!("Nope"),
    };
    let num_output_pixels = output_width * output_height;
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
    return output_image;
}
