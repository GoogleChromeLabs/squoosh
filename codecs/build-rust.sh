set -e

if [ ! -z "$RUST_IMG" ]
then
  # Get part after ":" (https://stackoverflow.com/a/15149278/439965).
  IMG_SUFFIX=-${RUST_IMG#*:}
fi
IMG_NAME=squoosh-rust$IMG_SUFFIX
docker build -t $IMG_NAME --build-arg RUST_IMG - < ../rust.Dockerfile
docker run -it --rm -v $PWD:/src $IMG_NAME "$@"
