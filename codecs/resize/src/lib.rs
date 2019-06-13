extern crate cfg_if;
extern crate resize;
extern crate wasm_bindgen;

mod utils;

use cfg_if::cfg_if;
use resize::Pixel::RGBA;
use resize::Type;
use wasm_bindgen::prelude::*;

mod srgb;
use srgb::Clamp;

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
fn converter_funcs(with_space_conversion: bool) -> ((fn(u8) -> f32), (fn(f32) -> u8)) {
    if with_space_conversion {
        (
            |v| SRGB_TO_LINEAR_LUT[v as usize] * 255.0,
            |v| (LINEAR_TO_SRGB_LUT[v as usize] * 255.0) as u8,
        )
    } else {
        (|v| v as f32, |v| v as u8)
    }
}

// If `with_alpha_premultiplication` is true, this function returns a function
// that premultiply the alpha channel with the given channel value and another
// function that reverses that process. If `with_alpha_premultiplication` is
// false, the functions just return the channel value.
fn alpha_multiplier_funcs(
    with_alpha_premultiplication: bool,
) -> ((fn(f32, u8) -> u8), (fn(u8, u8) -> f32)) {
    if with_alpha_premultiplication {
        (
            |v, a| (v * (a as f32) / 255.0) as u8,
            |v, a| (v as f32) * 255.0 / (a as f32).clamp(0.0, 255.0),
        )
    } else {
        (|v, _a| v as u8, |v, _a| v as f32)
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
    color_space_conversion: bool,
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

    let (to_linear, to_color_space) = converter_funcs(color_space_conversion);
    let (premultiplier, demultiplier) = alpha_multiplier_funcs(premultiply);

    // If both options are false, there is no preprocessing on the pixel valus
    // and we can skip the loop.
    if premultiply || color_space_conversion {
        for i in 0..num_input_pixels {
            for j in 0..3 {
                input_image[4 * i + j] =
                    premultiplier(to_linear(input_image[4 * i + j]), input_image[4 * i + 3]);
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

    if premultiply || color_space_conversion {
        for i in 0..num_output_pixels {
            for j in 0..3 {
                // We don’t need to worry about division by zero, as division by zero
                // is well-defined on floats to return ±Inf. ±Inf is converted to 0
                // when casting to integers.
                output_image[4 * i + j] = to_color_space(demultiplier(
                    output_image[4 * i + j],
                    output_image[4 * i + 3],
                ));
            }
        }
    }

    return output_image;
}
