use std::io::Cursor;

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

#[wasm_bindgen(catch)]
pub fn encode(data: &[u8], width: u32, height: u32) -> Vec<u8> {
    let mut buffer = Cursor::new(Vec::<u8>::new());

    {
        let mut encoder = png::Encoder::new(&mut buffer, width, height);
        encoder.set_color(png::ColorType::RGBA);
        encoder.set_depth(png::BitDepth::Eight);
        let mut writer = encoder.write_header().unwrap();
        writer.write_image_data(data).unwrap();
    }

    buffer.into_inner()
}

#[wasm_bindgen(catch)]
pub fn decode(data: &[u8]) -> ImageData {
    let mut decoder = png::Decoder::new(Cursor::new(data));
    decoder.set_transformations(png::Transformations::EXPAND);
    let (info, mut reader) = decoder.read_info().unwrap();
    let num_pixels = (info.width * info.height) as usize;
    let mut buf = vec![0; num_pixels * 4];
    reader.next_frame(&mut buf).unwrap();

    // Transformations::EXPAND will make sure color_type is either
    // RGBA or RGB. If it’s RGB, we need inject an alpha channel.
    if info.color_type == png::ColorType::RGB {
        for i in (0..num_pixels).rev() {
            buf[i * 4 + 0] = buf[i * 3 + 0];
            buf[i * 4 + 1] = buf[i * 3 + 1];
            buf[i * 4 + 2] = buf[i * 3 + 2];
            buf[i * 4 + 3] = 255;
        }
    }

    ImageData::new_with_owned_u8_clamped_array_and_sh(
        wasm_bindgen::Clamped(buf),
        info.width,
        info.height,
    )
}
