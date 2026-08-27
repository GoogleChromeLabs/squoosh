#[cfg(feature = "parallel")]
pub use wasm_bindgen_rayon::init_thread_pool;

use oxipng::{BitDepth, ColorType, Deflater, ZopfliOptions};
use wasm_bindgen::prelude::*;
use wasm_bindgen::Clamped;

#[wasm_bindgen]
pub fn optimise(
    data: Clamped<Vec<u8>>,
    width: u32,
    height: u32,
    level: u8,
    interlace: bool,
    zopfli: bool,
    preserve_alpha: bool,
) -> Vec<u8> {
    let mut options = oxipng::Options::from_preset(level);

    // optimize_alpha rewrites the colour channels of fully-transparent pixels to
    // whatever compresses best. That's invisible when the image is composited
    // normally, but it is destructive - so "preserve alpha" turns it off.
    options.optimize_alpha = !preserve_alpha;

    // oxipng 10 changed Options::interlace from Option<Interlacing> to
    // Option<bool> (true = Adam7, false = none).
    options.interlace = Some(interlace);

    if zopfli {
        // Zopfli compresses noticeably better than libdeflater at a large cost
        // in time. ZopfliOptions::default() is 15 iterations, which is upstream's
        // own default for `oxipng --zopfli`.
        options.deflater = Deflater::Zopfli(ZopfliOptions::default());
    }

    let raw = oxipng::RawImage::new(width, height, ColorType::RGBA, BitDepth::Eight, data.0)
        .unwrap_throw();
    raw.create_optimized_png(&options).unwrap_throw()
}
