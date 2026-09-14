use imagequant::{Attributes, Image, RGBA};
use rgb::FromSlice;
use wasm_bindgen::prelude::*;
use wasm_bindgen::Clamped;

#[wasm_bindgen]
pub enum QuantizeMode {
    Rgba = 0,
    AlphaOnly = 1,
    Zx = 2,
}

/// Alpha is linear coverage rather than an sRGB-encoded value, so the greyscale
/// image the alpha-only mode builds is tagged linear. (0.0 would mean sRGB.)
const LINEAR_GAMMA: f64 = 1.0;

/// The gamma of everything else, and libimagequant's own default.
const SRGB_GAMMA: f64 = 0.0;

fn remap(
    attr: &Attributes,
    image: &mut Image<'_>,
    dither: f32,
) -> Result<(Vec<RGBA>, Vec<u8>), imagequant::Error> {
    let mut result = attr.quantize(image)?;
    result.set_dithering_level(dither)?;
    result.remapped(image)
}

fn quantize_rgba(
    attr: &Attributes,
    pixels: &[RGBA],
    width: usize,
    height: usize,
    dither: f32,
) -> Result<Vec<u8>, imagequant::Error> {
    let mut image = Image::new_borrowed(attr, pixels, width, height, SRGB_GAMMA)?;
    let (palette, indexes) = remap(attr, &mut image, dither)?;

    Ok(indexes
        .iter()
        .flat_map(|&i| {
            let colour = palette[usize::from(i)];
            [colour.r, colour.g, colour.b, colour.a]
        })
        .collect())
}

/// Quantizes only the alpha channel, passing colour through untouched.
///
/// This is for lossy WebP, which re-encodes colour with a DCT - so palette
/// quantizing RGB beforehand is wasted work at best - while storing the alpha
/// plane losslessly, where fewer distinct values compress a lot better.
///
/// The alpha channel goes in as an opaque greyscale image, so libimagequant's
/// adaptive level picking and dither maps apply to alpha exactly as they would
/// to colour. A uniform posterisation would be much worse on the clustered
/// alpha histograms real images have.
fn quantize_alpha(
    attr: &Attributes,
    pixels: &[RGBA],
    width: usize,
    height: usize,
    dither: f32,
) -> Result<Vec<u8>, imagequant::Error> {
    let greyscale: Vec<RGBA> = pixels
        .iter()
        .map(|px| RGBA::new(px.a, px.a, px.a, u8::MAX))
        .collect();

    let mut image = Image::new(attr, greyscale, width, height, LINEAR_GAMMA)?;
    let (palette, indexes) = remap(attr, &mut image, dither)?;

    Ok(pixels
        .iter()
        .zip(&indexes)
        .flat_map(|(px, &i)| [px.r, px.g, px.b, palette[usize::from(i)].r])
        .collect())
}

/// Indexes 0-7 are the 'regular' colours and 8-14 the 'bright' ones, so a
/// colour's bright twin is its index plus 7. Black is only listed once, as
/// index 0, because it's identical in both brightnesses.
const ZX_COLOURS: [RGBA; 15] = [
    RGBA::new(0, 0, 0, 255),
    RGBA::new(0, 0, 215, 255),
    RGBA::new(215, 0, 0, 255),
    RGBA::new(215, 0, 215, 255),
    RGBA::new(0, 215, 0, 255),
    RGBA::new(0, 215, 215, 255),
    RGBA::new(215, 215, 0, 255),
    RGBA::new(215, 215, 215, 255),
    RGBA::new(0, 0, 255, 255),
    RGBA::new(255, 0, 0, 255),
    RGBA::new(255, 0, 255, 255),
    RGBA::new(0, 255, 0, 255),
    RGBA::new(0, 255, 255, 255),
    RGBA::new(255, 255, 0, 255),
    RGBA::new(255, 255, 255, 255),
];

const ZX_BLOCK: usize = 8;

/// A block can only hold two colours, and they must either both be regular or
/// both be bright. Returns `other` shifted into `first`'s brightness, which can
/// collapse it onto `first` - black needs no shifting, being in both.
fn zx_harmonise(first: usize, other: usize) -> usize {
    if first == 0 || other == 0 {
        other
    } else if first >= 8 && other < 8 {
        other + 7
    } else if first < 8 && other >= 8 {
        other - 7
    } else {
        other
    }
}

/// Euclidean distance. libimagequant has better metrics, but they need a
/// conversion to LAB, which isn't worth it just to rank 15 fixed colours.
fn zx_nearest(px: RGBA) -> usize {
    let distance = |colour: &RGBA| {
        let channel = |a: u8, b: u8| {
            let d = i32::from(a) - i32::from(b);
            d * d
        };
        channel(colour.r, px.r) + channel(colour.g, px.g) + channel(colour.b, px.b)
    };

    ZX_COLOURS
        .iter()
        .enumerate()
        .min_by_key(|(_, colour)| distance(colour))
        .map_or(0, |(i, _)| i)
}

/// The ZX Spectrum has one bit per pixel, but can assign two colours to each
/// 8x8 block.
fn quantize_zx(
    pixels: &[RGBA],
    width: usize,
    height: usize,
    dither: f32,
    speed: i32,
) -> Result<Vec<u8>, imagequant::Error> {
    // One set of settings for every block. Quality is deliberately left at its
    // default: a minimum quality aborts the whole quantization when it can't be
    // met, and a single awkward 8x8 block shouldn't fail the entire image.
    let mut attr = Attributes::new();
    attr.set_speed(speed)?;
    attr.set_max_colors(2)?;

    let mut output = vec![0u8; width * height * 4];

    for block_y in (0..height).step_by(ZX_BLOCK) {
        for block_x in (0..width).step_by(ZX_BLOCK) {
            // Blocks hanging off the right or bottom edge get clipped to fit.
            let block_width = (width - block_x).min(ZX_BLOCK);
            let block_height = (height - block_y).min(ZX_BLOCK);

            let mut popularity = [0u32; ZX_COLOURS.len()];
            let mut block = Vec::with_capacity(block_width * block_height);

            for y in block_y..block_y + block_height {
                for x in block_x..block_x + block_width {
                    let px = pixels[y * width + x];
                    block.push(px);
                    popularity[zx_nearest(px)] += 1;
                }
            }

            // The three most popular, most popular first. A stable sort keeps
            // the lowest index on ties.
            let mut ranked: [usize; ZX_COLOURS.len()] = std::array::from_fn(|i| i);
            ranked.sort_by_key(|&i| std::cmp::Reverse(popularity[i]));
            let [first, second, third] = [ranked[0], ranked[1], ranked[2]];

            let mut second = zx_harmonise(first, second);
            if second == first {
                // Harmonising collapsed the two choices into one, so fall back
                // to the third most popular.
                second = zx_harmonise(first, third);
            }

            let mut image =
                Image::new_borrowed(&attr, &block, block_width, block_height, SRGB_GAMMA)?;
            image.add_fixed_color(ZX_COLOURS[first])?;
            if second != first {
                image.add_fixed_color(ZX_COLOURS[second])?;
            }

            let (palette, indexes) = remap(&attr, &mut image, dither)?;

            for y in 0..block_height {
                for x in 0..block_width {
                    let colour = palette[usize::from(indexes[y * block_width + x])];
                    let i = ((block_y + y) * width + block_x + x) * 4;
                    output[i..i + 4].copy_from_slice(&[colour.r, colour.g, colour.b, colour.a]);
                }
            }
        }
    }

    Ok(output)
}

fn run(
    pixels: &[RGBA],
    width: usize,
    height: usize,
    mode: QuantizeMode,
    max_colors: u32,
    dither: f32,
    speed: i32,
) -> Result<Vec<u8>, imagequant::Error> {
    if let QuantizeMode::Zx = mode {
        // ZX blocks hold two colours by definition, so max_colors doesn't apply.
        return quantize_zx(pixels, width, height, dither, speed);
    }

    let mut attr = Attributes::new();
    attr.set_speed(speed)?;
    attr.set_max_colors(max_colors)?;

    // `set_quality` is deliberately not called. Its defaults - aim for the best
    // quality the colour budget allows, never give up - are what we want, and
    // its two knobs don't earn their place in a tool with a live preview: the
    // target duplicates `max_colors` (the result is whichever binds first), and
    // the minimum only turns a preview into an error when it can't be met.

    match mode {
        QuantizeMode::AlphaOnly => quantize_alpha(&attr, pixels, width, height, dither),
        _ => quantize_rgba(&attr, pixels, width, height, dither),
    }
}

#[wasm_bindgen]
pub fn quantize(
    input: &[u8],
    width: usize,
    height: usize,
    mode: QuantizeMode,
    max_colors: u32,
    dither: f32,
    // 1-10. Higher is faster and slightly worse; libimagequant's own default
    // is 4.
    speed: i32,
) -> Result<Clamped<Vec<u8>>, JsError> {
    if input.len() < width * height * 4 {
        return Err(JsError::new("Input is smaller than width * height * 4"));
    }

    run(
        input.as_rgba(),
        width,
        height,
        mode,
        max_colors,
        dither,
        speed,
    )
    .map(Clamped)
    .map_err(|error| JsError::new(&error.to_string()))
}
