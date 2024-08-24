#include <errno.h>
#include <stdint.h>
#include <stdlib.h>
#include <string.h>
#include <tiffio.h>

typedef struct cursor {
  const char* data;
  tmsize_t size;
  tmsize_t off;
} cursor_t;

typedef union cd_as_cursor {
  thandle_t client;
  cursor_t* cursor;
} cd_as_cursor_t;

static tmsize_t _cursor_read_proc(thandle_t clientdata, void* buf, tmsize_t len) {
  cd_as_cursor_t cdc;
  cdc.client = clientdata;
  cursor_t* c = cdc.cursor;

  tmsize_t nremain = c->size - c->off;
  tmsize_t nread = nremain > len ? len : nremain;

  memcpy(buf, (const void*)(c->data + c->off), (size_t)nread);
  c->off += nread;
  return (tmsize_t)nread;
}

static tmsize_t _cursor_write_proc(thandle_t clientdata, void* buf, tmsize_t size) {
  (void)clientdata, (void)buf, (void)size;
  return 0;
}

static toff_t _cursor_seek_proc(thandle_t clientdata, toff_t off, int whence) {
  cd_as_cursor_t cdc;
  cdc.client = clientdata;
  cursor_t* c = cdc.cursor;

  tmsize_t off_m = (tmsize_t)off;
  if ((toff_t)off_m != off) {
    errno = EINVAL;
    return (toff_t)-1;
  }

  switch (whence) {
    case SEEK_SET:
      c->off = off_m;
      break;
    case SEEK_CUR:
      c->off += off_m;
      break;
    case SEEK_END:
      if (off_m <= c->size) {
        c->off = c->size - off_m;
        break;
      }
      __attribute__((fallthrough));
    default:
      errno = EINVAL;
      return (toff_t)-1;
  }
  return (toff_t)c->off;
}

static int _cursor_close_proc(thandle_t clientdata) {
  cd_as_cursor_t cdc;
  cdc.client = clientdata;
  free(cdc.cursor);
  return 0;
}

static uint64_t _cursor_size_proc(thandle_t clientdata) {
  cd_as_cursor_t cdc;
  cdc.client = clientdata;
  return (uint64_t)cdc.cursor->size;
}

static int _cursor_map_proc(thandle_t clientdata, void** pbase, toff_t* psize) {
  cd_as_cursor_t cdc;
  cdc.client = clientdata;
  cursor_t* c = cdc.cursor;

  // `tif_unix.c` only passes `PROT_READ` to `mmap()`, so dropping `const` should be fine here.
  *pbase = (void*)c->data;
  *psize = (toff_t)c->size;
  return 1;
}

static void _cursor_unmap_proc(thandle_t clientdata, void* base, toff_t size) {
  (void)clientdata, (void)base, (void)size;
}

extern int _return_decoded_image(const uint32_t* raster, uint32_t width, uint32_t height)
    __attribute__((import_name("return_decoded_image")));

__attribute__((export_name("decode"))) int decode(const char* data, const size_t size) {
  static const char* module_name = "tiff_dec";
  if (!data)
    return 0;

  tmsize_t size_m = (tmsize_t)size;
  if (((size_t)size_m) != size) {
    TIFFErrorExtR(NULL, module_name, "Too large image buffer");
    return 0;
  }

  cursor_t* c = malloc(sizeof(cursor_t));
  if (!c)
    return 0;
  c->data = data;
  c->size = size_m;
  c->off = 0;

  cd_as_cursor_t cdc;
  cdc.cursor = c;
  TIFF* tif = TIFFClientOpen("dummy.tif", "r", cdc.client, _cursor_read_proc, _cursor_write_proc,
                             _cursor_seek_proc, _cursor_close_proc, _cursor_size_proc,
                             _cursor_map_proc, _cursor_unmap_proc);
  if (!tif) {
    free(cdc.cursor);
    return 0;
  }

  int ret = 0;

  uint32_t width, height;
  if (TIFFGetField(tif, TIFFTAG_IMAGEWIDTH, &width) == 0 ||
      TIFFGetField(tif, TIFFTAG_IMAGELENGTH, &height) == 0) {
    TIFFErrorExtR(tif, module_name, "Missing image dimension tag");
    goto cleanup_tif;
  }

  uint32_t npixels;
  if (__builtin_umul_overflow(width, height, &npixels)) {
    TIFFErrorExtR(tif, module_name, "Too large image dimension");
    goto cleanup_tif;
  }

  uint32_t* raster = (uint32_t*)malloc(npixels * sizeof(uint32_t));
  if (!raster) {
    TIFFErrorExtR(tif, module_name, "Failed to allocate memory of %d*%d*4 bytes", width, height);
    goto cleanup_tif;
  }

  if (!TIFFReadRGBAImageOriented(tif, width, height, raster, 1, ORIENTATION_TOPLEFT)) {
    goto cleanup_raster;
  }

  ret = _return_decoded_image(raster, width, height);

cleanup_raster:
  free(raster);
cleanup_tif:
  TIFFClose(tif);
  return ret;
}

extern int _log_warning(const char* s, size_t len) __attribute__((import_name("log_warning")));

extern int _log_error(const char* s, size_t len) __attribute__((import_name("log_error")));

// Override unix error handlers from `tiff_unix.c`.
static void _extern_warning_handler(const char* module, const char* fmt, va_list ap) {
  (void)module;
  char buf[256];
  vsnprintf(buf, sizeof(buf), fmt, ap);
  _log_warning(buf, strlen(buf));
}
TIFFErrorHandler _TIFFwarningHandler = _extern_warning_handler;

static void _extern_error_handler(const char* module, const char* fmt, va_list ap) {
  (void)module;
  char buf[256];
  vsnprintf(buf, sizeof(buf), fmt, ap);
  _log_error(buf, strlen(buf));
}
TIFFErrorHandler _TIFFerrorHandler = _extern_error_handler;

// Stubbing libc to remove `environ_get*` WASI imports.
char* getenv(const char* name) {
  (void)name;
  return NULL;
}

// Stubbing libc to remove `fd_*` WASI imports.
_Noreturn void __assert_fail(const char* expr, const char* file, int line, const char* func) {
  // Modified from
  // https://github.com/WebAssembly/wasi-libc/blob/wasi-sdk-20/libc-top-half/musl/src/exit/assert.c
  char buf[256];
  snprintf(buf, sizeof(buf), "Assertion failed: %s (%s: %s: %d)\n", expr, file, func, line);
  _log_error(buf, strlen(buf));
  abort();
}
