//! This is a module that provides `malloc` and `free` for `libdeflate`.
//! These implementations are compatible with the standard signatures
//! but use Rust allocator instead of including libc one as well.
//!
//! Rust allocator APIs requires passing size and alignment to the
//! `dealloc` function. This is different from C API, which only
//! expects a pointer in `free` and expects allocators to take care of
//! storing any necessary information elsewhere.
//!
//! In order to simulate C API, we allocate a `size_and_data_ptr`
//! of size `sizeof(usize) + size` where `size` is the requested number
//! of bytes. Then, we store `size` at the beginning of the allocated
//! chunk (within those `sizeof(usize)` bytes) and return
//! `data_ptr = size_and_data_ptr + sizeof(usize)` to the calleer:
//!
//! [`size`][...actual data]
//! -^------------------ `size_and_data_ptr`
//! ---------^---------- `data_ptr`
//!
//! Then, in `free`, the caller gives us `data_ptr`. We can subtract
//! `sizeof(usize)` back and get the original `size_and_data_ptr`.
//! At this point we can read `size` back and call the Rust `dealloc`
//! for the whole allocated chunk.
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
pub unsafe extern "C" fn free(data_ptr: *mut u8) {
    let size_and_data_ptr = data_ptr.sub(size_of::<usize>());
    let size = *(size_and_data_ptr as *const usize);
    dealloc(size_and_data_ptr, layout_for(size))
}
