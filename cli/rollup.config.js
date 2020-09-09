import resolve from "@rollup/plugin-node-resolve";
import cjs from "@rollup/plugin-commonjs";
import { terser } from "rollup-plugin-terser";
import asset from "./lib/asset-plugin.js";
import json from "./lib/json-plugin.js";

export default {
  input: "src/index.js",
  output: {
    dir: "build",
    format: "cjs",
    assetFileNames: "[name]-[hash][extname]"
  },
  plugins: [
    resolve(),
    cjs(),
    asset(),
    json(),
    terser({
      mangle: true
    })
  ],
  external: [
    "os",
    "path",
    "fs",
    "worker_threads",
    "events",
    "child_process",
    "crypto"
  ]
};
