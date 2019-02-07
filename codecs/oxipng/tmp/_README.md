I’m trying to activate [the `wasm_syscall` feature][1] in Rust’s stdlib for WebAssembly.

Here is my `Cargo.toml` and my `Xargo.toml`. But even with this setup the generated wasm file is still hard-coded to panic.

**HELP?**

My current command to compile is:

```
xargo build --target wasm32-unknown-unknown --release
```

If you have [`wasm2wat`][2] installed, you can verify the generate code via

```
wasm2wat target/wasm32-unknown-unknown/release/loltest.wasm | grep -A5 perform::
```

[1]: https://github.com/rust-lang/rust/blob/b139669f374eb5024a50eb13f116ff763b1c5935/src/libstd/sys/wasm/mod.rs#L309
[2]: https://github.com/WebAssembly/wabt
