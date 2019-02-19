use std::slice::from_raw_parts_mut;

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
        o.unwrap()
    }
}

const TILE_SIZE: usize = 16;

#[no_mangle]
fn rotate(width: usize, height: usize, rotate: usize) {
    let num_pixels = width * height;
    let in_b: &mut [u32];
    let out_b: &mut [u32];
    unsafe {
        in_b = from_raw_parts_mut::<u32>(8 as *mut u32, num_pixels);
        out_b = from_raw_parts_mut::<u32>((num_pixels * 4 + 8) as *mut u32, num_pixels);
    }

    match rotate {
        0 => {
            for i in 0..num_pixels {
                *out_b.get_mut(i).unwrap_hard() = *in_b.get(i).unwrap_hard();
            }
        }
        90 => {
            let new_width = height;
            let _new_height = width;
            for y_start in (0..height).step_by(TILE_SIZE) {
                for x_start in (0..width).step_by(TILE_SIZE) {
                    for y in y_start..(y_start + TILE_SIZE).min(height) {
                        for x in x_start..(x_start + TILE_SIZE).min(width) {
                            let new_x = (new_width - 1) - y;
                            let new_y = x;
                            *out_b.get_mut(new_y * new_width + new_x).unwrap_hard() =
                                *in_b.get(y * width + x).unwrap_hard();
                        }
                    }
                }
            }
        }
        180 => {
            for i in 0..num_pixels {
                *out_b.get_mut(num_pixels - 1 - i).unwrap_hard() = *in_b.get(i).unwrap_hard();
            }
        }
        270 => {
            let new_width = height;
            let new_height = width;
            for y_start in (0..height).step_by(TILE_SIZE) {
                for x_start in (0..width).step_by(TILE_SIZE) {
                    for y in y_start..(y_start + TILE_SIZE).min(height) {
                        for x in x_start..(x_start + TILE_SIZE).min(width) {
                            let new_x = y;
                            let new_y = new_height - 1 - x;
                            *out_b.get_mut(new_y * new_width + new_x).unwrap_hard() =
                                *in_b.get(y * width + x).unwrap_hard();
                        }
                    }
                }
            }
        }
        _ => std::process::abort(),
    }
}
