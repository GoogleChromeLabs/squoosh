#[cfg(feature = "parallel")]
pub use wasm_bindgen_rayon::init_thread_pool;

use oxipng::{BitDepth, ColorType, Deflater, ZopfliOptions};
use wasm_bindgen::prelude::*;
use wasm_bindgen::Clamped;

/// Highest level oxipng itself defines a preset for.
const MAX_OXIPNG_PRESET: u8 = 6;

#[wasm_bindgen]
pub fn optimise(
    data: Clamped<Vec<u8>>,
    width: u32,
    height: u32,
    level: u8,
    interlace: bool,
    preserve_alpha: bool,
) -> Vec<u8> {
    // Level 7 is ours, not oxipng's: it means "preset 6, but deflate with Zopfli
    // instead of libdeflate".
    //
    // Zopfli is deliberately NOT an independent toggle. At presets 0-4
    // oxipng sets fast_evaluation, which picks a filter using a cheap
    // libdeflater evaluator and then runs the main deflater exactly once on that
    // one winner (see perform_trials in oxipng's src/lib.rs). So combining
    // Zopfli with a low preset does one Zopfli deflate of a filter chosen
    // without Zopfli - the preset barely changes the result, and measured output
    // sizes for presets 1 and 2 came out byte-identical. Only presets 5 and 6
    // clear fast_evaluation and actually trial every filter through the main
    // deflater, which is where Zopfli earns its cost. Hence Zopfli rides on top
    // of preset 6 and nothing else.
    //
    // Clamp before calling from_preset: it accepts anything but logs
    // "Level 7 and above don't exist yet" for out-of-range values.
    let zopfli = level > MAX_OXIPNG_PRESET;
    let mut options = oxipng::Options::from_preset(level.min(MAX_OXIPNG_PRESET));

    // optimize_alpha rewrites the colour channels of fully-transparent pixels to
    // whatever compresses best. That's invisible when the image is composited
    // normally, but it is destructive - so "preserve alpha" turns it off.
    options.optimize_alpha = !preserve_alpha;

    // oxipng 10 changed Options::interlace from Option<Interlacing> to
    // Option<bool> (true = Adam7, false = none).
    options.interlace = Some(interlace);

    if zopfli {
        // ZopfliOptions::default() is 15 iterations, which is upstream's own
        // default for `oxipng --zopfli`.
        options.deflater = Deflater::Zopfli(ZopfliOptions::default());
    }

    let raw = oxipng::RawImage::new(width, height, ColorType::RGBA, BitDepth::Eight, data.0)
        .unwrap_throw();
    raw.create_optimized_png(&options).unwrap_throw()
}
