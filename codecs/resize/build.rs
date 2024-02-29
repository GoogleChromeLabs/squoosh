include!("./src/srgb.rs");

use std::io::Write;

fn main() -> std::io::Result<()> {
    let mut srgb_to_linear_lut = String::from("static SRGB_TO_LINEAR_LUT: [f32; 256] = [");
    for i in 0..256 {
        srgb_to_linear_lut.push_str(&format!("{0:.7}", srgb_to_linear((i as f32) / 255.0)));
        srgb_to_linear_lut.push_str(",");
    }
    srgb_to_linear_lut.pop().unwrap();
    srgb_to_linear_lut.push_str("];");

    let mut file = std::fs::File::create("src/lut.inc")?;
    file.write_all(srgb_to_linear_lut.as_bytes())?;
    Ok(())
}
