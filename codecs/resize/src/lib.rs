extern crate cfg_if;
extern crate resize;
extern crate wasm_bindgen;

mod utils;

use cfg_if::cfg_if;
use resize::Pixel;
use resize::Type;
use wasm_bindgen::prelude::*;
use wasm_bindgen::Clamped;

mod srgb;
use srgb::{linear_to_srgb, Clamp};

cfg_if! {
    // When the `wee_alloc` feature is enabled, use `wee_alloc` as the global
    // allocator.
    if #[cfg(feature = "wee_alloc")] {
        extern crate wee_alloc;
        #[global_allocator]
        static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;
    }
}

include!("./lut.inc");

// If `with_space_conversion` is true, this function returns 2 functions that
// convert from sRGB to linear RGB and vice versa. If `with_space_conversion` is
// false, the 2 functions returned do nothing.
fn srgb_converter_funcs(with_space_conversion: bool) -> (fn(u8) -> f32, fn(f32) -> u8) {
    if with_space_conversion {
        (
            |v| SRGB_TO_LINEAR_LUT[v as usize],
            |v| (linear_to_srgb(v) * 255.0).clamp(0.0, 255.0) as u8,
        )
    } else {
        (
            |v| (v as f32) / 255.0,
            |v| (v * 255.0).clamp(0.0, 255.0) as u8,
        )
    }
}

// If `with_alpha_premultiplication` is true, this function returns a function
// that premultiply the alpha channel with the given channel value and another
// function that reverses that process. If `with_alpha_premultiplication` is
// false, the functions just return the channel value.
fn alpha_multiplier_funcs(
    with_alpha_premultiplication: bool,
) -> (fn(f32, f32) -> f32, fn(f32, f32) -> f32) {
    if with_alpha_premultiplication {
        (|v, a| v * a, |v, a| v / a)
    } else {
        (|v, _a| v, |v, _a| v)
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
    premultiply: bool,
    color_space_conversion: bool,
) -> Clamped<Vec<u8>> {
    let typ = match typ_idx {
        0 => Type::Triangle,
        1 => Type::Catrom,
        2 => Type::Mitchell,
        3 => Type::Lanczos3,
        _ => panic!("Nope"),
    };
    let num_input_pixels = input_width * input_height;
    let num_output_pixels = output_width * output_height;

    let mut output_image = vec![0u8; num_output_pixels * 4];

    // If both options are false, there is no preprocessing on the pixel values
    // and we can skip the loop.
    if !premultiply && !color_space_conversion {
        let mut resizer = resize::new(
            input_width,
            input_height,
            output_width,
            output_height,
            Pixel::RGBA,
            typ,
        );
        resizer.resize(input_image.as_slice(), output_image.as_mut_slice());
        return Clamped(output_image);
    }

    // Otherwise, we convert to f32 images to keep the
    // conversions as lossless and high-fidelity as possible.
    let (to_linear, to_srgb) = srgb_converter_funcs(color_space_conversion);
    let (premultiplier, demultiplier) = alpha_multiplier_funcs(premultiply);

    let mut preprocessed_input_image: Vec<f32> = Vec::with_capacity(input_image.len());
    preprocessed_input_image.resize(input_image.len(), 0.0f32);
    for i in 0..num_input_pixels {
        for j in 0..3 {
            preprocessed_input_image[4 * i + j] = premultiplier(
                to_linear(input_image[4 * i + j]),
                (input_image[4 * i + 3] as f32) / 255.0,
            );
        }
        preprocessed_input_image[4 * i + 3] = (input_image[4 * i + 3] as f32) / 255.0;
    }

    let mut unprocessed_output_image = vec![0.0f32; num_output_pixels * 4];

    let mut resizer = resize::new(
        input_width,
        input_height,
        output_width,
        output_height,
        Pixel::RGBAF32,
        typ,
    );
    resizer.resize(
        preprocessed_input_image.as_slice(),
        unprocessed_output_image.as_mut_slice(),
    );

    for i in 0..num_output_pixels {
        for j in 0..3 {
            output_image[4 * i + j] = to_srgb(demultiplier(
                unprocessed_output_image[4 * i + j],
                unprocessed_output_image[4 * i + 3],
            ));
        }
        output_image[4 * i + 3] = (unprocessed_output_image[4 * i + 3] * 255.0)
            .round()
            .clamp(0.0, 255.0) as u8;
    }

    return Clamped(output_image);
}
