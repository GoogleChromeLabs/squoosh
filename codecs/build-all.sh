CURRENT_DIRECTORY=$(dirname "$(readlink -f "$0")")
SUB_DIRECTORIES=$(ls -d $CURRENT_DIRECTORY/*/)

for codec in $SUB_DIRECTORIES
do
  cd $codec
  npm run build
done
