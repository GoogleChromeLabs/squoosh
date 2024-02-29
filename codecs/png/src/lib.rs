use rgb::{
    alt::{GRAY8, GRAYA8},
    AsPixels, FromSlice, RGB8, RGBA8,
};
use wasm_bindgen::prelude::*;
use wasm_bindgen::Clamped;

// Custom ImageData bindings to allow construction with
// a JS-owned copy of the data.
#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(typescript_type = ImageData)]
    pub type ImageData;

    #[wasm_bindgen(constructor)]
    fn new_with_owned_u8_clamped_array_and_sh(
        data: Clamped<Vec<u8>>,
        sw: u32,
        sh: u32,
    ) -> ImageData;
}

#[wasm_bindgen]
pub fn encode(data: &[u8], width: u32, height: u32) -> Vec<u8> {
    let mut buffer = Vec::new();

    {
        let mut encoder = png::Encoder::new(&mut buffer, width, height);
        encoder.set_color(png::ColorType::RGBA);
        encoder.set_depth(png::BitDepth::Eight);
        let mut writer = encoder.write_header().unwrap_throw();
        writer.write_image_data(data).unwrap_throw();
    }

    buffer
}

// Convert pixels in-place within buffer containing source data but preallocated
// for entire [num_pixels * sizeof(RGBA)].
// This works because all the color types are <= RGBA by size.
fn expand_pixels<Src: Copy>(buf: &mut [u8], to_rgba: impl Fn(Src) -> RGBA8)
where
    [u8]: AsPixels<Src> + FromSlice<u8>,
{
    assert!(std::mem::size_of::<Src>() <= std::mem::size_of::<RGBA8>());
    let num_pixels = buf.len() / 4;
    for i in (0..num_pixels).rev() {
        let src_pixel = buf.as_pixels()[i];
        buf.as_rgba_mut()[i] = to_rgba(src_pixel);
    }
}

#[wasm_bindgen]
pub fn decode(mut data: &[u8]) -> ImageData {
    let mut decoder = png::Decoder::new(&mut data);
    decoder.set_transformations(
        png::Transformations::EXPAND | // Turn paletted images into RGB
        png::Transformations::PACKING | // Turn images <8bit to 8bit
        png::Transformations::STRIP_16, // Turn 16bit into 8 bit
    );
    let (info, mut reader) = decoder.read_info().unwrap_throw();
    let num_pixels = (info.width * info.height) as usize;
    let mut buf = vec![0; num_pixels * 4];
    reader.next_frame(&mut buf).unwrap_throw();

    // Transformations::EXPAND will expand indexed palettes and lower-bit
    // grayscales to higher color types, but we still need to transform
    // the rest to RGBA.
    match info.color_type {
        png::ColorType::RGBA => {}
        png::ColorType::RGB => expand_pixels(&mut buf, RGB8::into),
        png::ColorType::GrayscaleAlpha => expand_pixels(&mut buf, GRAYA8::into),
        png::ColorType::Grayscale => {
            expand_pixels(&mut buf, |gray: GRAY8| GRAYA8::from(gray).into())
        }
        png::ColorType::Indexed => {
            unreachable!("Found indexed color type, but expected it to be already expanded")
        }
    }

    ImageData::new_with_owned_u8_clamped_array_and_sh(
        wasm_bindgen::Clamped(buf),
        info.width,
        info.height,
    )
}
