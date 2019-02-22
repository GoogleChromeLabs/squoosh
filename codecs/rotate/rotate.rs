use std::slice::{from_raw_parts, from_raw_parts_mut};

// This function is taken from Zachary Dremann
// https://github.com/GoogleChromeLabs/squoosh/pull/462
trait HardUnwrap<T> {
    fn unwrap_hard(self) -> T;
}

impl<T> HardUnwrap<T> for Option<T> {
    #[cfg(not(debug_assertions))]
    #[inline]
    fn unwrap_hard(self) -> T {
        match self {
            Some(t) => t,
            None => std::process::abort(),
        }
    }

    #[cfg(debug_assertions)]
    fn unwrap_hard(self) -> T {
        self.unwrap()
    }
}

const TILE_SIZE: usize = 16;

fn get_buffers<'a>(width: usize, height: usize) -> (&'a [u32], &'a mut [u32]) {
    let num_pixels = width * height;
    let in_b: &[u32];
    let out_b: &mut [u32];
    unsafe {
        in_b = from_raw_parts::<u32>(8 as *const u32, num_pixels);
        out_b = from_raw_parts_mut::<u32>((num_pixels * 4 + 8) as *mut u32, num_pixels);
    }
    return (in_b, out_b);
}

#[inline(never)]
fn rotate_0(width: usize, height: usize) {
    let (in_b, out_b) = get_buffers(width, height);
    for (in_p, out_p) in in_b.iter().zip(out_b.iter_mut()) {
        *out_p = *in_p;
    }
}

#[inline(never)]
fn rotate_90(width: usize, height: usize) {
    let (in_b, out_b) = get_buffers(width, height);
    let new_width = height;
    let _new_height = width;
    for y_start in (0..height).step_by(TILE_SIZE) {
        for x_start in (0..width).step_by(TILE_SIZE) {
            for y in y_start..(y_start + TILE_SIZE).min(height) {
                let in_offset = y * width;
                let in_bounds = if x_start + TILE_SIZE < width {
                    (in_offset + x_start)..(in_offset + x_start + TILE_SIZE)
                } else {
                    (in_offset + x_start)..(in_offset + width)
                };
                let in_chunk = in_b.get(in_bounds).unwrap_hard();
                for (x, in_p) in in_chunk.iter().enumerate() {
                    let new_x = (new_width - 1) - y;
                    let new_y = x + x_start;
                    *out_b.get_mut(new_y * new_width + new_x).unwrap_hard() = *in_p;
                }
            }
        }
    }
}

#[inline(never)]
fn rotate_180(width: usize, height: usize) {
    let (in_b, out_b) = get_buffers(width, height);
    for (in_p, out_p) in in_b.iter().zip(out_b.iter_mut().rev()) {
        *out_p = *in_p;
    }
}

#[inline(never)]
fn rotate_270(width: usize, height: usize) {
    let (in_b, out_b) = get_buffers(width, height);
    let new_width = height;
    let new_height = width;
    for y_start in (0..height).step_by(TILE_SIZE) {
        for x_start in (0..width).step_by(TILE_SIZE) {
            for y in y_start..(y_start + TILE_SIZE).min(height) {
                let in_offset = y * width;
                let in_bounds = if x_start + TILE_SIZE < width {
                    (in_offset + x_start)..(in_offset + x_start + TILE_SIZE)
                } else {
                    (in_offset + x_start)..(in_offset + width)
                };
                let in_chunk = in_b.get(in_bounds).unwrap_hard();
                for (x, in_p) in in_chunk.iter().enumerate() {
                    let new_x = y;
                    let new_y = new_height - 1 - (x_start + x);
                    *out_b.get_mut(new_y * new_width + new_x).unwrap_hard() = *in_p;
                }
            }
        }
    }
}

#[no_mangle]
fn rotate(width: usize, height: usize, rotate: usize) {
    match rotate {
        0 => rotate_0(width, height),
        90 => rotate_90(width, height),
        180 => rotate_180(width, height),
        270 => rotate_270(width, height),
        _ => std::process::abort(),
    }
}
