use std::sync::OnceLock;

use fast_image_resize::images::{TypedImage, TypedImageRef};
use fast_image_resize::pixels::{U16x3, U8x4, U16};
use fast_image_resize::{Filter, FilterType, ResizeAlg, ResizeOptions, Resizer};
use wasm_bindgen::prelude::*;
use wasm_bindgen::Clamped;

/// Resampling filters, mapped from the JS-side method names in
/// `features/processors/resize/shared/meta.ts`.
#[wasm_bindgen]
pub enum ResizeFilter {
    Triangle = 0,
    Catrom = 1,
    Mitchell = 2,
    Lanczos = 3,
    Box = 4,
    Hamming = 5,
}

fn sinc(x: f64) -> f64 {
    if x == 0.0 {
        1.0
    } else {
        let x = x * std::f64::consts::PI;
        x.sin() / x
    }
}

/// Sinc windowed by a wider sinc. `R` is the radius in source pixels, so
/// `R == 3` reproduces `FilterType::Lanczos3` exactly.
fn lanczos<const R: u32>(x: f64) -> f64 {
    let radius = f64::from(R);
    if x <= -radius || x >= radius {
        return 0.0;
    }
    sinc(x) * sinc(x / radius)
}

/// `fir::Filter` stores a bare `fn` pointer rather than a boxed closure, so a
/// user-chosen radius has to be monomorphised rather than captured. Anything
/// outside the range the UI offers falls back to the Lanczos3 default.
fn lanczos_filter(radius: u32) -> Filter {
    macro_rules! filter {
        ($r:literal) => {
            Filter::new(concat!("Lanczos", $r), lanczos::<$r>, $r as f64).unwrap()
        };
    }

    match radius {
        1 => filter!(1),
        2 => filter!(2),
        4 => filter!(4),
        5 => filter!(5),
        6 => filter!(6),
        7 => filter!(7),
        8 => filter!(8),
        9 => filter!(9),
        10 => filter!(10),
        _ => filter!(3),
    }
}

/// sRGB <-> linear-light conversion tables. ~66KB of tables and ~66k `powf`
/// calls to build, so it outlives the call that first needs it.
///
/// This is `fast_image_resize`'s own `create_srgb_mapper()` inlined, so that
/// premultiplication can be folded into the same pass. Letting the resizer do
/// it instead costs a whole extra read-and-write of the linear source - 258MB
/// of memory traffic on a 16MP image - and drags in its 512KB static
/// reciprocal table for 16-bit alpha division.
struct SrgbLut {
    to_linear: [u16; 256],
    to_srgb: Vec<u8>,
}

impl SrgbLut {
    fn new() -> Self {
        let mut to_linear = [0u16; 256];
        for (i, out) in to_linear.iter_mut().enumerate() {
            let v = i as f32 / 255.0;
            let linear = if v < 0.04045 {
                v / 12.92
            } else {
                ((v + 0.055) / 1.055).powf(2.4)
            };
            *out = (linear * 65535.0).round() as u16;
        }

        let to_srgb = (0..=u16::MAX)
            .map(|i| {
                let v = f32::from(i) / 65535.0;
                let srgb = if v < 0.0031308 {
                    v * 12.92
                } else {
                    1.055 * v.powf(1.0 / 2.4) - 0.055
                };
                (srgb * 255.0).round() as u8
            })
            .collect();

        Self { to_linear, to_srgb }
    }

    /// Converts to premultiplied linear light, splitting alpha out into its own
    /// plane - or dropping it entirely when the source is fully opaque, which
    /// saves a quarter of the convolution work and all of the alpha traffic.
    ///
    /// Alpha is rescaled but never gamma-transformed; it was never encoded.
    fn to_linear(&self, src: &[U8x4], premultiply: bool) -> (Vec<U16x3>, Option<Vec<U16>>) {
        // Short-circuits on the first transparent pixel, so this only costs a
        // full scan for the images that go on to benefit from it.
        let opaque = src.iter().all(|px| px.0[3] == u8::MAX);

        // `with_capacity` + `push` writes each pixel exactly once. Filling a
        // `TypedImage::new` instead would zero the whole buffer first, which is
        // another 97MB of memory traffic on a 16MP source.
        let mut rgb = Vec::with_capacity(src.len());
        let mut alpha = (!opaque).then(|| Vec::with_capacity(src.len()));

        for px in src {
            let [r, g, b, a] = px.0;
            // `255` is the identity, so this is one loop for both cases rather
            // than a branch per pixel.
            let scale = if premultiply { u32::from(a) } else { 255 };
            let convert =
                |v: u8| ((u32::from(self.to_linear[usize::from(v)]) * scale + 127) / 255) as u16;

            rgb.push(U16x3::new([convert(r), convert(g), convert(b)]));
            if let Some(alpha) = &mut alpha {
                alpha.push(U16::new(u16::from(a) * 257));
            }
        }

        (rgb, alpha)
    }

    fn to_srgb(&self, rgb: &[U16x3], alpha: Option<&[U16]>, dst: &mut [U8x4], premultiply: bool) {
        for (i, (rgb, dst)) in rgb.iter().zip(dst).enumerate() {
            let [r, g, b] = rgb.0;
            let a = alpha.map_or(u16::MAX, |alpha| alpha[i].0);
            let scale = if premultiply && a != 0 {
                65535.0 / f32::from(a)
            } else {
                1.0
            };
            // Ringing filters can push a premultiplied channel above its own
            // alpha, so undoing the premultiply has to clamp.
            let convert = |v: u16| self.to_srgb[(f32::from(v) * scale).min(65535.0) as usize];
            dst.0 = [
                convert(r),
                convert(g),
                convert(b),
                ((u32::from(a) + 128) / 257) as u8,
            ];
        }
    }
}

fn srgb_lut() -> &'static SrgbLut {
    static LUT: OnceLock<SrgbLut> = OnceLock::new();
    LUT.get_or_init(SrgbLut::new)
}

#[wasm_bindgen]
pub fn resize(
    input_image: &[u8],
    input_width: u32,
    input_height: u32,
    output_width: u32,
    output_height: u32,
    filter: ResizeFilter,
    lanczos_radius: u32,
    premultiply: bool,
    color_space_conversion: bool,
    // Crops the source to the output's aspect ratio before resampling, rather
    // than stretching to it. `centering` picks which part survives the crop:
    // (0, 0) keeps the top left, (0.5, 0.5) the middle, (1, 1) the bottom right.
    fit_to_output: bool,
    centering_x: f64,
    centering_y: f64,
) -> Result<Clamped<Vec<u8>>, JsError> {
    let mut options = ResizeOptions::new()
        .resize_alg(ResizeAlg::Convolution(match filter {
            ResizeFilter::Triangle => FilterType::Bilinear,
            ResizeFilter::Catrom => FilterType::CatmullRom,
            ResizeFilter::Mitchell => FilterType::Mitchell,
            ResizeFilter::Lanczos => FilterType::Custom(lanczos_filter(lanczos_radius)),
            ResizeFilter::Box => FilterType::Box,
            ResizeFilter::Hamming => FilterType::Hamming,
        }))
        // Premultiplies before convolving and undoes it after, which is what
        // stops the colour of transparent pixels bleeding into their visible
        // neighbours.
        .use_alpha(premultiply);

    if fit_to_output {
        options = options.fit_into_destination(Some((centering_x, centering_y)));
    }

    let src = TypedImageRef::<U8x4>::from_buffer(input_width, input_height, input_image)?;
    let mut resizer = Resizer::new();
    let mut output = vec![0u8; output_width as usize * output_height as usize * 4];

    // `resize_typed` rather than `resize`: the latter matches the pixel type at
    // runtime, so it monomorphises the convolution for all 13 types the crate
    // supports.
    if color_space_conversion {
        // Convolution has to happen in linear light to be correct, and
        // fast_image_resize has no SIMD128 kernels for f32 - so u16 is the widest
        // intermediate that stays on the fast path. 16 bits still resolves the
        // darkest sRGB step into ~20 linear levels.
        //
        // The channels go through as a U16x3 plane plus a separate U16 alpha
        // plane rather than as U16x4. Interleaved 16-bit RGBA would drag in the
        // crate's 512KB static reciprocal table for 16-bit alpha division -
        // 86% of the module - and this path is already reading every source
        // pixel to convert it, so splitting the planes here is free.
        let lut = srgb_lut();
        // Premultiplication happened in `to_linear`, so the resizer must not
        // do it again.
        let options = options.use_alpha(false);

        let (rgb, alpha) = lut.to_linear(src.pixels(), premultiply);
        let rgb_src = TypedImage::from_pixels(input_width, input_height, rgb)?;
        let mut rgb_dst = TypedImage::<U16x3>::new(output_width, output_height);
        resizer.resize_typed(&rgb_src, &mut rgb_dst, &options)?;

        let alpha_dst = match alpha {
            Some(alpha) => {
                let alpha_src = TypedImage::from_pixels(input_width, input_height, alpha)?;
                let mut alpha_dst = TypedImage::<U16>::new(output_width, output_height);
                resizer.resize_typed(&alpha_src, &mut alpha_dst, &options)?;
                Some(alpha_dst)
            }
            None => None,
        };

        let mut dst = TypedImage::<U8x4>::from_buffer(output_width, output_height, &mut output)?;
        lut.to_srgb(
            rgb_dst.pixels(),
            alpha_dst.as_ref().map(TypedImage::pixels),
            dst.pixels_mut(),
            premultiply,
        );
    } else {
        let mut dst = TypedImage::<U8x4>::from_buffer(output_width, output_height, &mut output)?;
        resizer.resize_typed(&src, &mut dst, &options)?;
    }

    Ok(Clamped(output))
}
