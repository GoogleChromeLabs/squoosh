CURRENT_DIRECTORY=$(dirname "$(readlink -f "$0")")
SUB_DIRECTORIES=$(find "$CURRENT_DIRECTORY" -mindepth 1 -maxdepth 1 -type d)

for codec in $SUB_DIRECTORIES
do
  cd $codec
  npm run build
done
