//! C ABI over jixel, for enc/jixel_enc.cpp to bind to JS with embind.

use std::ffi::{c_char, CString};

use jixel::{
    Arbiter, CodingTransform, DecodingSpeed, EncodeConfig, GroupOrder, JpegTranscodeConfig,
    LossyModular, Speed,
};

/// Mirrors `JixelOptions` in enc/jixel_enc.cpp - keep the field order and
/// types in step.
#[repr(C)]
pub struct EncodeOptions {
    lossless: bool,
    quality: f32,
    /// 0-5, fastest first.
    speed: u8,
    /// Lossy only: 1 is a single pass, 2-4 that many VarDCT passes.
    progressive_passes: u32,
    /// Lossless only: the Squeeze transform.
    progressive: bool,
    patches: bool,
    splines: bool,
    dots: bool,
    lossy_modular: u8,
    coding_transform: u8,
    learned_rate: bool,
    fill_invisible: bool,
    decoding_speed: u8,
    /// Lossy VarDCT only: code the DC as its own squeezed frame, for previews
    /// from 1:256 up to 1:8.
    progressive_dc: bool,
    /// 0 = Scanline, 1 = CenterFirst, 2 = Diagonals. Lossy VarDCT only.
    group_order: u8,
    /// 0 = SSIMULACRA2, 1 = ColorVideoVDP. Lossy only.
    arbiter: u8,
    num_threads: u32,
}

/// Mirrors `JixelTranscodeOptions` in enc/jixel_enc.cpp.
#[repr(C)]
pub struct TranscodeOptions {
    speed: u8,
    jpeg_reconstruction: bool,
    num_threads: u32,
}

/// Either `data`/`len` (the encoded file) or `error` (a NUL-terminated
/// message) is set. Release it with `jixel_free`.
#[repr(C)]
pub struct Output {
    data: *mut u8,
    len: usize,
    error: *mut c_char,
}

impl Output {
    fn new(result: Result<Vec<u8>, String>) -> Self {
        match result {
            Ok(bytes) => {
                let bytes = Box::into_raw(bytes.into_boxed_slice());
                Self {
                    data: bytes.cast(),
                    len: bytes.len(),
                    error: std::ptr::null_mut(),
                }
            }
            Err(message) => Self {
                data: std::ptr::null_mut(),
                len: 0,
                // Error messages don't contain NULs, but don't panic if one does.
                error: CString::new(message.replace('\0', "")).unwrap().into_raw(),
            },
        }
    }
}

/// Speeds by index, fastest first, matching `effort - 1` on the JS side.
fn speed(index: u8) -> Result<Speed, String> {
    Ok(match index {
        0 => Speed::UltraFast,
        1 => Speed::Fastest,
        2 => Speed::Fast,
        3 => Speed::Medium,
        4 => Speed::Slow,
        5 => Speed::ExtraSlow,
        _ => return Err("Invalid speed".into()),
    })
}

/// The channels the image actually needs. jixel encodes whatever it's handed,
/// so an opaque image passed as RGBA gets a (cheap, but not free) all-255 alpha
/// channel, and a grey one gets two chroma channels and is declared as colour.
fn channels(data: &[u8]) -> (bool, bool) {
    let mut gray = true;
    let mut opaque = true;
    for px in data.as_chunks::<4>().0 {
        gray &= px[0] == px[1] && px[1] == px[2];
        opaque &= px[3] == 255;
        if !gray && !opaque {
            break;
        }
    }
    (gray, opaque)
}

fn encode(
    data: &[u8],
    width: usize,
    height: usize,
    options: &EncodeOptions,
) -> Result<Vec<u8>, String> {
    let mut config = EncodeConfig::default().with_quality(options.quality);
    // Set directly rather than through with_speed(), which also turns patches
    // on at Slow and above - that's left to `options.patches`.
    config.speed = speed(options.speed)?;
    config.num_threads = options.num_threads.max(1) as usize;
    config.lossless = options.lossless;
    // jixel reads each of these in both modes, in its own way, so pass on only
    // the one meant for this mode.
    config.progressive = options.lossless && options.progressive;
    config.progressive_passes = if options.lossless {
        None
    } else {
        Some(options.progressive_passes.clamp(1, 4))
    };
    config.patches = options.patches;
    config.splines = options.splines;
    config.dots = options.dots;
    config.lossy_modular = match options.lossy_modular {
        0 => LossyModular::Off,
        1 => LossyModular::Auto,
        2 => LossyModular::Force,
        _ => return Err("Invalid lossy modular mode".into()),
    };
    config.coding_transform = match options.coding_transform {
        0 => CodingTransform::Xyb,
        1 => CodingTransform::YCbCr,
        2 => CodingTransform::Rgb,
        _ => return Err("Invalid coding transform".into()),
    };
    config.progressive_dc = options.progressive_dc;
    config.group_order = match options.group_order {
        0 => GroupOrder::Scanline,
        1 => GroupOrder::CenterFirst,
        2 => GroupOrder::Diagonals,
        _ => return Err("Invalid group order".into()),
    };
    config.arbiter = match options.arbiter {
        0 => Arbiter::Ssimulacra2,
        1 => Arbiter::Cvvdp,
        _ => return Err("Invalid arbiter".into()),
    };
    config.learned_rate = options.learned_rate;
    config.fill_invisible = options.fill_invisible;
    let decoding_speed = match options.decoding_speed {
        0 => DecodingSpeed::Slow,
        1 => DecodingSpeed::Fast,
        2 => DecodingSpeed::Fastest,
        _ => return Err("Invalid decoding speed".into()),
    };
    // jixel documents this as lossless-only, but lossy reads it too: anything
    // but the default silently turns splines and dots off. The UI only offers
    // it for lossless, so a value left over from there mustn't leak into lossy.
    config.decoding_speed = if options.lossless {
        decoding_speed
    } else {
        DecodingSpeed::Slow
    };

    let pixels = data.as_chunks::<4>().0;
    let result = match channels(data) {
        (true, true) => {
            let luma: Vec<u8> = pixels.iter().map(|px| px[0]).collect();
            jixel::encode_image_gray(&luma, width, height, &config)
        }
        (true, false) => {
            let luma_alpha: Vec<u8> = pixels.iter().flat_map(|px| [px[0], px[3]]).collect();
            jixel::encode_image_gray_alpha(&luma_alpha, width, height, &config)
        }
        (false, true) => {
            let rgb: Vec<u8> = pixels.iter().flat_map(|px| [px[0], px[1], px[2]]).collect();
            jixel::encode_image(&rgb, width, height, &config)
        }
        (false, false) => jixel::encode_image_with_alpha(data, width, height, &config),
    };

    result.map_err(|err| err.to_string())
}

fn transcode(data: &[u8], options: &TranscodeOptions) -> Result<Vec<u8>, String> {
    let config = JpegTranscodeConfig::default()
        .with_speed(speed(options.speed)?)
        .with_num_threads(options.num_threads.max(1) as usize)
        .with_jpeg_reconstruction(options.jpeg_reconstruction);

    jixel::encode_jpeg_lossless_with_config(data, &config).map_err(|err| err.to_string())
}

/// Encode `len` bytes of RGBA8 pixels.
///
/// # Safety
///
/// `data` must point to `len` readable bytes, and `options` and `out` must be
/// valid.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn jixel_encode(
    data: *const u8,
    len: usize,
    width: u32,
    height: u32,
    options: *const EncodeOptions,
    out: *mut Output,
) {
    let data = unsafe { std::slice::from_raw_parts(data, len) };
    let options = unsafe { &*options };
    let result = encode(data, width as usize, height as usize, options);
    unsafe { out.write(Output::new(result)) };
}

/// Losslessly recompress `len` bytes of JPEG file as JPEG XL. Exif and XMP are
/// always carried over; `jpeg_reconstruction` additionally stores what it
/// takes to rebuild the original file byte for byte.
///
/// # Safety
///
/// As `jixel_encode`.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn jixel_transcode(
    data: *const u8,
    len: usize,
    options: *const TranscodeOptions,
    out: *mut Output,
) {
    let data = unsafe { std::slice::from_raw_parts(data, len) };
    let options = unsafe { &*options };
    unsafe { out.write(Output::new(transcode(data, options))) };
}

/// Release what an `Output` holds.
///
/// # Safety
///
/// `out` must have been filled by `jixel_encode` or `jixel_transcode`, and not
/// freed already.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn jixel_free(out: *mut Output) {
    let out = unsafe { &mut *out };
    if !out.data.is_null() {
        drop(unsafe { Box::from_raw(std::ptr::slice_from_raw_parts_mut(out.data, out.len)) });
        out.data = std::ptr::null_mut();
    }
    if !out.error.is_null() {
        drop(unsafe { CString::from_raw(out.error) });
        out.error = std::ptr::null_mut();
    }
}
