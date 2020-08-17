set -e

docker build -t squoosh-rust - < ../rust.Dockerfile
docker run --rm -v $PWD:/src squoosh-rust "$@"
