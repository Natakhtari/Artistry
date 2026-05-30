#!/usr/bin/env bash
# Downloads all seed artwork images into the API container and updates the media table.
set -euo pipefail

API_CONTAINER="artistry_api"
DB_CONTAINER="artistry_postgres"
DB_USER="artistry"
DB_NAME="artistry"

declare -A ROWS=(
  [4]="https://picsum.photos/seed/alice1/960/960"
  [5]="https://picsum.photos/seed/alice2/960/960"
  [6]="https://picsum.photos/seed/alice3/960/960"
  [7]="https://picsum.photos/seed/alice4/960/960"
  [8]="https://picsum.photos/seed/alice5/960/960"
  [9]="https://picsum.photos/seed/alice6/960/960"
  [10]="https://picsum.photos/seed/alice7/960/960"
  [11]="https://picsum.photos/seed/alice8/960/960"
  [12]="https://cdn.pixabay.com/photo/2016/11/29/09/32/concept-1868728_960_720.jpg"
  [13]="https://cdn.pixabay.com/photo/2017/08/30/01/05/milky-way-2695569_960_720.jpg"
  [14]="https://cdn.pixabay.com/photo/2016/11/29/03/53/architecture-1867187_960_720.jpg"
  [15]="https://cdn.pixabay.com/photo/2016/11/29/12/13/fence-1869401_960_720.jpg"
  [16]="https://cdn.pixabay.com/photo/2016/11/29/02/05/audience-1866738_960_720.jpg"
  [17]="https://cdn.pixabay.com/photo/2017/02/08/17/46/sunset-2048727_960_720.jpg"
  [18]="https://cdn.pixabay.com/photo/2016/11/23/15/32/piano-1853301_960_720.jpg"
  [19]="https://cdn.pixabay.com/photo/2016/11/29/04/19/beach-1867285_960_720.jpg"
  [20]="https://picsum.photos/seed/claire1/960/960"
  [21]="https://picsum.photos/seed/claire2/960/960"
  [22]="https://picsum.photos/seed/claire3/960/960"
  [23]="https://picsum.photos/seed/claire4/960/960"
  [24]="https://picsum.photos/seed/claire5/960/960"
  [25]="https://picsum.photos/seed/claire6/960/960"
  [26]="https://picsum.photos/seed/claire7/960/960"
  [27]="https://picsum.photos/seed/claire8/960/960"
  [28]="https://cdn.pixabay.com/photo/2016/11/18/17/46/house-1836070_960_720.jpg"
  [29]="https://cdn.pixabay.com/photo/2015/01/08/18/29/entrepreneur-593358_960_720.jpg"
  [30]="https://cdn.pixabay.com/photo/2018/03/10/12/00/teamwork-3213924_960_720.jpg"
  [31]="https://cdn.pixabay.com/photo/2016/11/29/13/23/animal-1868911_960_720.jpg"
  [32]="https://cdn.pixabay.com/photo/2016/11/29/10/41/architecture-1868668_960_720.jpg"
  [33]="https://cdn.pixabay.com/photo/2015/04/23/22/00/tree-736885_960_720.jpg"
  [34]="https://cdn.pixabay.com/photo/2016/05/05/02/37/sunset-1373171_960_720.jpg"
  [35]="https://cdn.pixabay.com/photo/2014/12/15/17/19/painting-576798_960_720.jpg"
  [36]="https://picsum.photos/seed/evan1/960/960"
  [37]="https://picsum.photos/seed/evan2/960/960"
  [38]="https://picsum.photos/seed/evan3/960/960"
  [39]="https://picsum.photos/seed/evan4/960/960"
  [40]="https://picsum.photos/seed/evan5/960/960"
  [41]="https://picsum.photos/seed/evan6/960/960"
  [42]="https://picsum.photos/seed/evan7/960/960"
  [43]="https://picsum.photos/seed/evan8/960/960"
)

# user_id for each media row
declare -A USER_MAP=(
  [4]=4  [5]=4  [6]=4  [7]=4  [8]=4  [9]=4  [10]=4 [11]=4
  [12]=5 [13]=5 [14]=5 [15]=5 [16]=5 [17]=5 [18]=5 [19]=5
  [20]=6 [21]=6 [22]=6 [23]=6 [24]=6 [25]=6 [26]=6 [27]=6
  [28]=7 [29]=7 [30]=7 [31]=7 [32]=7 [33]=7 [34]=7 [35]=7
  [36]=8 [37]=8 [38]=8 [39]=8 [40]=8 [41]=8 [42]=8 [43]=8
)

TMP_DIR=$(mktemp -d)
trap "rm -rf $TMP_DIR" EXIT

echo "=== Downloading 40 seed images ==="
for media_id in "${!ROWS[@]}"; do
  url="${ROWS[$media_id]}"
  user_id="${USER_MAP[$media_id]}"
  filename="seed_${media_id}.jpg"
  dest="$TMP_DIR/$filename"

  echo "  media_id=$media_id user=$user_id  ← $url"
  curl -sL --max-time 30 -o "$dest" "$url" || { echo "  FAILED: $url"; continue; }

  # Copy into container
  docker exec "$API_CONTAINER" mkdir -p "/var/www/html/public/uploads/$user_id"
  docker cp "$dest" "$API_CONTAINER:/var/www/html/public/uploads/$user_id/$filename"

  # Update DB
  local_url="http://localhost:8742/uploads/${user_id}/${filename}"
  docker exec "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" \
    -c "UPDATE media SET file_url = '$local_url' WHERE id = $media_id;" \
    -q
done

echo ""
echo "=== Done! All images are now served locally. ==="
