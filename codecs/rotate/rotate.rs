use std::slice::from_raw_parts_mut;

// This function is taken from
// https://rustwasm.github.io/book/reference/code-size.html
#[cfg(not(debug_assertions))]
#[inline]
fn unwrap_abort<T>(o: Option<T>) -> T {
    match o {
        Some(t) => t,
        None => std::process::abort(),
    }
}

#[cfg(debug_assertions)]
fn unwrap_abort<T>(o: Option<T>) -> T {
    o.unwrap()
}

#[no_mangle]
fn rotate(width: usize, height: usize, _rotate: usize) {
    let num_pixels = width * height;
    let in_b: &mut [u32];
    let out_b: &mut [u32];
    unsafe {
        in_b = from_raw_parts_mut::<u32>(8 as *mut u32, num_pixels);
        out_b = from_raw_parts_mut::<u32>((num_pixels * 4 + 8) as *mut u32, num_pixels);
    }

    let new_width = height;
    let _new_height = width;
    for y in 0..height {
        for x in 0..width {
            let new_x = (new_width - 1) - y;
            let new_y = x;
            *unwrap_abort(out_b.get_mut(new_y * new_width + new_x)) =
                *unwrap_abort(in_b.get(y * width + x));
        }
    }
}
