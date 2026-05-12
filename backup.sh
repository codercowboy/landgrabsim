DATE=$(date +"%Y%m%d-%H%M%S")
FILE="land-grab-sim-${DATE}.tar.gz"
tar -cvzf "../${FILE}" -C .. land-grab-sim
FILE_SIZE=`du -sh "../${FILE}" | awk '{print $1}'`
echo "backed up to ${FILE}, size: ${FILE_SIZE}"
