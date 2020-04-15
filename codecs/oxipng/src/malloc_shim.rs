//! This is a module that provides `malloc` and `free` for `libdeflate`.
//! These implementations are compatible with the standard signatures
//! but use Rust allocator instead of including libc one as well.
//!
//! I've raised an upstream issue to hopefully make this easier in
//! future: https://github.com/ebiggers/libdeflate/issues/62

use std::alloc::*;
use std::mem::{align_of, size_of};

unsafe fn layout_for(size: usize) -> Layout {
    Layout::from_size_align_unchecked(size_of::<usize>() + size, align_of::<usize>())
}

#[no_mangle]
pub unsafe extern "C" fn malloc(size: usize) -> *mut u8 {
    let size_and_data_ptr = alloc(layout_for(size));
    *(size_and_data_ptr as *mut usize) = size;
    size_and_data_ptr.add(size_of::<usize>())
}

#[no_mangle]
pub unsafe extern "C" fn free(ptr: *mut u8) {
    let size_and_data_ptr = ptr.sub(size_of::<usize>());
    let size = *(size_and_data_ptr as *const usize);
    dealloc(ptr, layout_for(size))
}
