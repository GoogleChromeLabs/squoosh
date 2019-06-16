pub fn rgb_to_yuv(c: u32) -> u32 {
    lazy_static! {
        static ref RGB_TO_YUV: Vec<u32> = {
            let mut vec = Vec::with_capacity(16777216);
            for c in 0u32..16777215 {
                let r = ((c & 0xFF0000) >> 16) as f64;
                let g = ((c & 0x00FF00) >> 8) as f64;
                let b = (c & 0x0000FF) as f64;
                let y = (0.299 * r + 0.587 * g + 0.114 * b) as i32;
                let u = (-0.169 * r - 0.331 * g + 0.5 * b) as i32 + 128;
                let v = (0.5 * r - 0.419 * g - 0.081 * b) as i32 + 128;
                vec.push(((y << 16) + (u << 8) + v) as u32);
            }
            vec.push(0);
            vec
        };
    }
    RGB_TO_YUV[(c & MASK_RGB) as usize]
}

pub fn yuv_diff(yuv1: u32, yuv2: u32) -> bool {
    const YMASK: u32 = 0x00FF0000;
    const UMASK: u32 = 0x0000FF00;
    const VMASK: u32 = 0x000000FF;
    const TRY: i32 = 0x00300000;
    const TRU: i32 = 0x00000700;
    const TRV: i32 = 0x00000006;

    ((yuv1 & YMASK) as i32 - (yuv2 & YMASK) as i32).abs() > TRY
        || ((yuv1 & UMASK) as i32 - (yuv2 & UMASK) as i32).abs() > TRU
        || ((yuv1 & VMASK) as i32 - (yuv2 & VMASK) as i32).abs() > TRV
}

pub fn diff(c1: u32, c2: u32) -> bool {
    yuv_diff(rgb_to_yuv(c1), rgb_to_yuv(c2))
}

const MASK_2: u32 = 0x0000FF00;
const MASK_13: u32 = 0x00FF00FF;
const MASK_RGB: u32 = 0x00FFFFFF;
const MASK_ALPHA: u32 = 0xFF000000;

fn interpolate2(c1: u32, w1: i32, c2: u32, w2: i32, s: i32) -> u32 {
    if c1 == c2 {
        c1
    } else {
        (((((c1 & MASK_ALPHA) >> 24) as i32 * w1 + ((c2 & MASK_ALPHA) >> 24) as i32 * w2)
            << (24 - s)) as u32
            & MASK_ALPHA)
            + ((((c1 & MASK_2) as i32 * w1 + (c2 & MASK_2) as i32 * w2) >> s) as u32 & MASK_2)
            + ((((c1 & MASK_13) as i32 * w1 + (c2 & MASK_13) as i32 * w2) >> s) as u32 & MASK_13)
    }
}

fn interpolate3(c1: u32, w1: i32, c2: u32, w2: i32, c3: u32, w3: i32, s: i32) -> u32 {
    (((((c1 & MASK_ALPHA) >> 24) as i32 * w1
        + ((c2 & MASK_ALPHA) >> 24) as i32 * w2
        + ((c3 & MASK_ALPHA) >> 24) as i32 * w3)
        << (24 - s)) as u32
        & MASK_ALPHA)
        + ((((c1 & MASK_2) as i32 * w1 + (c2 & MASK_2) as i32 * w2 + (c3 & MASK_2) as i32 * w3)
            >> s) as u32
            & MASK_2)
        + ((((c1 & MASK_13) as i32 * w1 + (c2 & MASK_13) as i32 * w2 + (c3 & MASK_13) as i32 * w3)
            >> s) as u32
            & MASK_13)
}

pub fn interp1(c1: u32, c2: u32) -> u32 {
    //(c1*3+c2) >> 2;
    interpolate2(c1, 3, c2, 1, 2)
}

pub fn interp2(c1: u32, c2: u32, c3: u32) -> u32 {
    //(c1*2+c2+c3) >> 2;
    interpolate3(c1, 2, c2, 1, c3, 1, 2)
}

pub fn interp3(c1: u32, c2: u32) -> u32 {
    //(c1*7+c2)/8;
    interpolate2(c1, 7, c2, 1, 3)
}

pub fn interp4(c1: u32, c2: u32, c3: u32) -> u32 {
    //(c1*2+(c2+c3)*7)/16;
    interpolate3(c1, 2, c2, 7, c3, 7, 4)
}

pub fn interp5(c1: u32, c2: u32) -> u32 {
    //(c1+c2) >> 1;
    interpolate2(c1, 1, c2, 1, 1)
}

pub fn interp6(c1: u32, c2: u32, c3: u32) -> u32 {
    //(c1*5+c2*2+c3)/8;
    interpolate3(c1, 5, c2, 2, c3, 1, 3)
}

pub fn interp7(c1: u32, c2: u32, c3: u32) -> u32 {
    //(c1*6+c2+c3)/8;
    interpolate3(c1, 6, c2, 1, c3, 1, 3)
}

pub fn interp8(c1: u32, c2: u32) -> u32 {
    //(c1*5+c2*3)/8;
    interpolate2(c1, 5, c2, 3, 3)
}

pub fn interp9(c1: u32, c2: u32, c3: u32) -> u32 {
    //(c1*2+(c2+c3)*3)/8;
    interpolate3(c1, 2, c2, 3, c3, 3, 3)
}

pub fn interp10(c1: u32, c2: u32, c3: u32) -> u32 {
    //(c1*14+c2+c3)/16;
    interpolate3(c1, 14, c2, 1, c3, 1, 4)
}
