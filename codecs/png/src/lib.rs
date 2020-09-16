use std::io::Cursor;

use wasm_bindgen::prelude::*;
use web_sys::ImageData;

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

    ImageData::new_with_u8_clamped_array_and_sh(
        wasm_bindgen::Clamped(&mut buf),
        info.width,
        info.height,
    )
    .unwrap()
}
