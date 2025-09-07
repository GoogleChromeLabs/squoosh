#[cfg(feature = "parallel")]
pub use wasm_bindgen_rayon::init_thread_pool;

use oxipng::{BitDepth, ColorType, Deflaters, Interlacing};
use std::num::NonZeroU8;
use wasm_bindgen::prelude::*;
use wasm_bindgen::Clamped;

#[wasm_bindgen]
pub fn optimise(
    data: Clamped<Vec<u8>>,
    width: u32,
    height: u32,
    level: u8,
    interlace: bool,
    deflater: u8,
    iterations: u8,
    compression_level: u8,
) -> Vec<u8> {
    let def = match deflater {
        0 => Deflaters::Libdeflater {
            compression: compression_level,
        },
        1 => Deflaters::Zopfli {
            iterations: NonZeroU8::new(iterations).unwrap(),
        },
        _ => panic!("Invalid deflater id"),
    };
    let mut options = oxipng::Options::from_preset(level);
    options.optimize_alpha = true;
    options.deflate = def;
    options.interlace = Some(if interlace {
        Interlacing::Adam7
    } else {
        Interlacing::None
    });

    let raw = oxipng::RawImage::new(width, height, ColorType::RGBA, BitDepth::Eight, data.0)
        .unwrap_throw();
    raw.create_optimized_png(&options).unwrap_throw()
}
