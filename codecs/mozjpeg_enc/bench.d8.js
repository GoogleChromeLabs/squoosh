import mozjpeg from "./mozjpeg_enc.js";
import mozjpegSimd from "./mozjpeg_enc_simd.js";

const width = 2048;
const height = 2048;
const size = width * height * 4;
const data = new Uint8ClampedArray(size);
for(let i = 0; i < size; i++) {
	data[i] = Math.random() * 256;
}

mozjpeg({
	onRuntimeInitialized() {
		const start = performance.now();
		const result = this.encode(data, width, height, {
		  quality: 75,
		  baseline: false,
		  arithmetic: false,
		  progressive: true,
		  optimize_coding: true,
		  smoothing: 0,
		  color_space: 3,
		  quant_table: 3,
		  trellis_multipass: false,
		  trellis_opt_zero: false,
		  trellis_opt_table: false,
		  trellis_loops: 1,
		  auto_subsample: true,
		  chroma_subsample: 2,
		  separate_chroma_quality: false,
		  chroma_quality: 75,
		});
		const end = performance.now();
		console.log("No SIMD", end - start);
	}
})

mozjpegSimd({
	onRuntimeInitialized() {
		const start = performance.now();
		const result = this.encode(data, width, height, {
		  quality: 75,
		  baseline: false,
		  arithmetic: false,
		  progressive: true,
		  optimize_coding: true,
		  smoothing: 0,
		  color_space: 3,
		  quant_table: 3,
		  trellis_multipass: false,
		  trellis_opt_zero: false,
		  trellis_opt_table: false,
		  trellis_loops: 1,
		  auto_subsample: true,
		  chroma_subsample: 2,
		  separate_chroma_quality: false,
		  chroma_quality: 75,
		});
		const end = performance.now();
		console.log("SIMD", end - start);
	}
})
