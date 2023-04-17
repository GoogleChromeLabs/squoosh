# Codecs

This folder contains a self-contained sub-project for each encoder and decoder that squoosh supplies.

## Build

You need to have [Docker](https://www.docker.com/) and [Node](https://nodejs.org/) (with npm) installed on your system.

Each subproject can be built by going into its folder and running the following commands:

```
$ npm install
$ npm run build
```

This will build two files: `<codec name>_<enc or dec>.js` and `<codec name>_<enc or dec>.wasm`. It will most likely be necessary to set [`Module["locateFile"]`](https://kripken.github.io/emscripten-site/docs/api_reference/module.html#affecting-execution) to successfully load the `.wasm` file. When the `.js` file is loaded, a global `<codec name>_<enc or dec>` is created with the same API as an [Emscripten `Module`](https://kripken.github.io/emscripten-site/docs/api_reference/module.html).

Each codec will document its API in its README.
