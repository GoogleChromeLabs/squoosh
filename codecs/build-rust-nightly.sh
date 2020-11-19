set -e

docker build -t squoosh-rust-nightly --build-arg RUST_IMG=rustlang/rust@sha256:a7e9ab157d7720536fd8e1db918dde49fb642f2b4db90f97cec2b8b6d6e4250b - < ../rust.Dockerfile
docker run --rm -v $PWD:/src squoosh-rust-nightly "$@"
