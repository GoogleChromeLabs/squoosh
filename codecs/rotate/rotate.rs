use std::slice::from_raw_parts_mut;

// This function is taken from
// https://rustwasm.github.io/book/reference/code-size.html
#[cfg(not(debug_assertions))]
#[inline]
pub fn unwrap_abort<T>(o: Option<T>) -> T {
    use std::process;
    match o {
        Some(t) => t,
        None => process::abort(),
    }
}

// Normal panic-y behavior for debug builds
#[cfg(debug_assertions)]
unsafe fn unchecked_unwrap<T>(o: Option<T>) -> T {
    o.unwrap()
}

fn min<T: Ord>(a: T, b: T) -> T {
  if a < b { a } else { b }
}

#[no_mangle]
fn rotate(input_width: isize, input_height: isize, rotate: isize) {
  // In the straight-copy case
  // x starts at 0 and increases.
  // y starts at 0 and increases.
  let mut x_start: isize = 0;
  let mut x_advance: isize = 1;
  let mut x_multiplier: isize = 1;
  let mut y_start: isize = 0;
  let mut y_advance: isize = 1;
  let mut y_multiplier: isize = input_width;

  if rotate == 90 {
    // Swap x and y.
    // x starts at 0 and increases.
    // y starts at its max value and decreases.
    x_start = 0;
    x_advance = 1;
    x_multiplier = input_height;
    y_start = input_height - 1;
    y_advance = -1;
    y_multiplier = 1;
  } else if rotate == 180 {
    // x starts at its max and decreases.
    // y starts at its max and decreases.
    x_start = input_width - 1;
    x_advance = -1;
    x_multiplier = 1;
    y_start = input_height - 1;
    y_advance = -1;
    y_multiplier = input_width;
  } else if rotate == 270 {
    // Swap x and y.
    // x starts at its max and decreases.
    // y starts at 0 and increases.
    x_start = input_width - 1;
    x_advance = -1;
    x_multiplier = input_height;
    y_start = 0;
    y_advance = 1;
    y_multiplier = 1;
  }

  let num_pixels = (input_width * input_height) as usize;
  let in_b: &mut [u32];
  let out_b: &mut [u32];
  unsafe {
    in_b = from_raw_parts_mut::<u32>(4 as *mut u32, num_pixels);
    out_b = from_raw_parts_mut::<u32>((input_width * input_height * 4 + 4) as *mut u32, num_pixels);
  }

  let tile_size = 16isize;

  for y_offset in (0..input_height).step_by(tile_size as usize) {
    for x_offset in (0..input_width).step_by(tile_size as usize) {
      for y in y_offset..min(y_offset + tile_size, input_height) {
        let in_offset = y * input_width;
        let out_offset = (y * y_advance + y_start) * y_multiplier;

        for x in x_offset..min(x_offset + tile_size, input_width) {
          let in_idx = in_offset + x;
          let out_idx = out_offset + (x_start + x * x_advance) * x_multiplier;
          *unwrap_abort(out_b.get_mut(out_idx as usize)) = *unwrap_abort(in_b.get(in_idx as usize));
        }
      }
    }
  }
}
