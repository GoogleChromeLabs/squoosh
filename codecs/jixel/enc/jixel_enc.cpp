#include <emscripten/bind.h>
#include <emscripten/proxying.h>
#include <emscripten/threading.h>
#include <emscripten/val.h>
#include <pthread.h>

#include <algorithm>
#include <cstddef>
#include <cstdint>
#include <memory>
#include <string>
#include <thread>

using namespace emscripten;

// The Rust side's C ABI (src/lib.rs). These structs mirror its #[repr(C)]
// ones, so keep the field order and types in step.
struct JixelOptions {
  bool lossless;
  float quality;
  uint8_t speed;
  uint32_t progressivePasses;
  bool progressive;
  bool patches;
  bool splines;
  bool dots;
  uint8_t lossyModular;
  uint8_t codingTransform;
  bool learnedRate;
  bool fillInvisible;
  uint8_t decodingSpeed;
  bool progressiveDC;
  uint8_t groupOrder;
  uint8_t arbiter;
  uint32_t numThreads;
};

struct JixelTranscodeOptions {
  uint8_t speed;
  bool jpegReconstruction;
  uint32_t numThreads;
};

struct JixelOutput {
  uint8_t* data;
  size_t len;
  char* error;
};

extern "C" {
void jixel_encode(const uint8_t* data, size_t len, uint32_t width, uint32_t height,
                  const JixelOptions* options, JixelOutput* out);
void jixel_transcode(const uint8_t* data, size_t len, const JixelTranscodeOptions* options,
                     JixelOutput* out);
void jixel_free(JixelOutput* out);
}

// More threads than this stopped paying off: on a 14-core machine, 14 threads
// encoded no faster than 8. Each thread also brings its own scratch memory,
// which matters at the higher efforts. Keep in step with POOL_SIZE in the
// Makefile.
#define MAX_THREADS 8

// How many threads jixel is told it may use. It runs on the encode's own
// thread (see Job below), plus that many - 1 in its pool.
static uint32_t threads() {
#ifdef JIXEL_THREADS_FROM_GLOBAL
  // The Makefile's test build.
  return val::global("JIXEL_THREADS").as<uint32_t>();
#else
  return std::min(emscripten_num_logical_cores(), MAX_THREADS);
#endif
}

// One encode or transcode, run on its own pthread so that encode() and
// transcode() can return a promise rather than block the calling thread.
//
// That matters because jixel's threads are pthreads, and every Web Worker
// behind one is started - and, once its thread exits, handed back to the pool -
// by messages to the calling thread. If that thread were blocked for the whole
// encode, as it is for the other codecs, every thread jixel started would have
// to come from the preloaded pool, and couldn't be reused until the encode
// finished. jixel nests pools and scoped threads inside its main pool, so how
// many it starts depends on the image and the options (anything from 0 to
// 3 * cores has been seen), and running out would deadlock Chrome and Safari.
// With the calling thread free, the pool (PTHREAD_POOL_SIZE in the Makefile)
// is just a head start: threads beyond it get a new worker, and finished ones
// go back to the pool as they exit.
struct Job {
  std::string input;
  bool transcode;
  int width;
  int height;
  JixelOptions options;
  JixelTranscodeOptions transcodeOptions;
  JixelOutput out;
  // The promise's resolve function. Only touched on the calling thread, which
  // owns the handle.
  val resolve;
};

// Back on the calling thread: settle the promise with the encoded file, or the
// error message as a string. Errors are returned rather than thrown so nothing
// is skipped on the way out of wasm.
static void finish(void* arg) {
  std::unique_ptr<Job> job(static_cast<Job*>(arg));
  JixelOutput& out = job->out;
  val result = out.error ? val(std::string(out.error))
                         : val::global("Uint8Array").new_(typed_memory_view(out.len, out.data));
  jixel_free(&out);
  job->resolve(result);
}

static val start(std::unique_ptr<Job> job) {
  val resolvers = val::global("Promise").call<val>("withResolvers");
  job->resolve = resolvers["resolve"];
  pthread_t caller = pthread_self();

  std::thread([job = job.release(), caller] {
    const auto* data = reinterpret_cast<const uint8_t*>(job->input.data());
    if (job->transcode) {
      jixel_transcode(data, job->input.size(), &job->transcodeOptions, &job->out);
    } else {
      jixel_encode(data, job->input.size(), job->width, job->height, &job->options, &job->out);
    }
    // The input isn't needed any more, and could be large.
    std::string().swap(job->input);
    emscripten_proxy_async(emscripten_proxy_get_system_queue(), caller, finish, job);
  }).detach();

  return resolvers["promise"];
}

val encode(std::string image, int width, int height, JixelOptions options) {
  options.numThreads = threads();
  auto job = std::make_unique<Job>();
  job->input = std::move(image);
  job->transcode = false;
  job->width = width;
  job->height = height;
  job->options = options;
  return start(std::move(job));
}

val transcode(std::string jpeg, JixelTranscodeOptions options) {
  options.numThreads = threads();
  auto job = std::make_unique<Job>();
  job->input = std::move(jpeg);
  job->transcode = true;
  job->transcodeOptions = options;
  return start(std::move(job));
}

EMSCRIPTEN_BINDINGS(my_module) {
  value_object<JixelOptions>("JixelOptions")
      .field("lossless", &JixelOptions::lossless)
      .field("quality", &JixelOptions::quality)
      .field("speed", &JixelOptions::speed)
      .field("progressivePasses", &JixelOptions::progressivePasses)
      .field("progressive", &JixelOptions::progressive)
      .field("patches", &JixelOptions::patches)
      .field("splines", &JixelOptions::splines)
      .field("dots", &JixelOptions::dots)
      .field("lossyModular", &JixelOptions::lossyModular)
      .field("codingTransform", &JixelOptions::codingTransform)
      .field("learnedRate", &JixelOptions::learnedRate)
      .field("fillInvisible", &JixelOptions::fillInvisible)
      .field("decodingSpeed", &JixelOptions::decodingSpeed)
      .field("progressiveDC", &JixelOptions::progressiveDC)
      .field("groupOrder", &JixelOptions::groupOrder)
      .field("arbiter", &JixelOptions::arbiter);

  value_object<JixelTranscodeOptions>("JixelTranscodeOptions")
      .field("speed", &JixelTranscodeOptions::speed)
      .field("jpegReconstruction", &JixelTranscodeOptions::jpegReconstruction);

  function("encode", &encode);
  function("transcode", &transcode);
}
