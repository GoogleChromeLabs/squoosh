CURRENT_DIRECTORY=$(dirname "$(readlink -f "$0")")

for codec in "avif" "hqx" "imagequant" "jxl" "mozjpeg" "oxipng" "png" "resize" "rotate" "visdif" "webp" "wp2"
do
  cd $CURRENT_DIRECTORY/$codec/
  npm run build
done
