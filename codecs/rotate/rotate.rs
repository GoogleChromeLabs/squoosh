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

#[no_mangle]
fn rotate(input_width: isize, input_height: isize, rotate: isize) {
  let mut i = 0isize;

  // In the straight-copy case, d1 is x, d2 is y.
  // x starts at 0 and increases.
  // y starts at 0 and increases.
  let mut d1_start: isize = 0;
  let mut d1_limit: isize = input_width;
  let mut d1_advance: isize = 1;
  let mut d1_multiplier: isize = 1;
  let mut d2_start: isize = 0;
  let mut d2_limit: isize = input_height;
  let mut d2_advance: isize = 1;
  let mut d2_multiplier: isize = input_width;

  if rotate == 90 {
    // d1 is y, d2 is x.
    // y starts at its max value and decreases.
    // x starts at 0 and increases.
    d1_start = input_height - 1;
    d1_limit = input_height;
    d1_advance = -1;
    d1_multiplier = input_width;
    d2_start = 0;
    d2_limit = input_width;
    d2_advance = 1;
    d2_multiplier = 1;
  } else if rotate == 180 {
    // d1 is x, d2 is y.
    // x starts at its max and decreases.
    // y starts at its max and decreases.
    d1_start = input_width - 1;
    d1_limit = input_width;
    d1_advance = -1;
    d1_multiplier = 1;
    d2_start = input_height - 1;
    d2_limit = input_height;
    d2_advance = -1;
    d2_multiplier = input_width;
  } else if rotate == 270 {
    // d1 is y, d2 is x.
    // y starts at 0 and increases.
    // x starts at its max and decreases.
    d1_start = 0;
    d1_limit = input_height;
    d1_advance = 1;
    d1_multiplier = input_width;
    d2_start = input_width - 1;
    d2_limit = input_width;
    d2_advance = -1;
    d2_multiplier = 1;
  }

  let num_pixels = (input_width * input_height) as usize;
  let in_b: &mut [u32];
  let out_b: &mut [u32];
  unsafe {
    in_b = from_raw_parts_mut::<u32>(4 as *mut u32, num_pixels);
    out_b = from_raw_parts_mut::<u32>((input_width * input_height * 4 + 4) as *mut u32, num_pixels);
  }

  for d2 in 0..d2_limit {
    for d1 in 0..d1_limit {
      let in_idx = (d1_start + d1 * d1_advance) * d1_multiplier + (d2_start + d2 * d2_advance) * d2_multiplier;
      *unwrap_abort(out_b.get_mut(i as usize)) = *unwrap_abort(in_b.get(in_idx as usize));
      i += 1;
    }
  }
}
