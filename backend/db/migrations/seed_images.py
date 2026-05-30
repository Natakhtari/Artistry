#!/usr/bin/env python3
"""
Downloads all seed artwork images into the artistry_api container
and updates the media table to use local URLs.
"""
import subprocess, urllib.request, tempfile, os, sys

API  = "artistry_api"
DB   = "artistry_postgres"

# (media_id, user_id, external_url)
ROWS = [
    (4,  4, "https://picsum.photos/seed/alice1/960/960"),
    (5,  4, "https://picsum.photos/seed/alice2/960/960"),
    (6,  4, "https://picsum.photos/seed/alice3/960/960"),
    (7,  4, "https://picsum.photos/seed/alice4/960/960"),
    (8,  4, "https://picsum.photos/seed/alice5/960/960"),
    (9,  4, "https://picsum.photos/seed/alice6/960/960"),
    (10, 4, "https://picsum.photos/seed/alice7/960/960"),
    (11, 4, "https://picsum.photos/seed/alice8/960/960"),
    (12, 5, "https://cdn.pixabay.com/photo/2016/11/29/09/32/concept-1868728_960_720.jpg"),
    (13, 5, "https://cdn.pixabay.com/photo/2017/08/30/01/05/milky-way-2695569_960_720.jpg"),
    (14, 5, "https://cdn.pixabay.com/photo/2016/11/29/03/53/architecture-1867187_960_720.jpg"),
    (15, 5, "https://cdn.pixabay.com/photo/2016/11/29/12/13/fence-1869401_960_720.jpg"),
    (16, 5, "https://cdn.pixabay.com/photo/2016/11/29/02/05/audience-1866738_960_720.jpg"),
    (17, 5, "https://cdn.pixabay.com/photo/2017/02/08/17/46/sunset-2048727_960_720.jpg"),
    (18, 5, "https://cdn.pixabay.com/photo/2016/11/23/15/32/piano-1853301_960_720.jpg"),
    (19, 5, "https://cdn.pixabay.com/photo/2016/11/29/04/19/beach-1867285_960_720.jpg"),
    (20, 6, "https://picsum.photos/seed/claire1/960/960"),
    (21, 6, "https://picsum.photos/seed/claire2/960/960"),
    (22, 6, "https://picsum.photos/seed/claire3/960/960"),
    (23, 6, "https://picsum.photos/seed/claire4/960/960"),
    (24, 6, "https://picsum.photos/seed/claire5/960/960"),
    (25, 6, "https://picsum.photos/seed/claire6/960/960"),
    (26, 6, "https://picsum.photos/seed/claire7/960/960"),
    (27, 6, "https://picsum.photos/seed/claire8/960/960"),
    (28, 7, "https://cdn.pixabay.com/photo/2016/11/18/17/46/house-1836070_960_720.jpg"),
    (29, 7, "https://cdn.pixabay.com/photo/2015/01/08/18/29/entrepreneur-593358_960_720.jpg"),
    (30, 7, "https://cdn.pixabay.com/photo/2018/03/10/12/00/teamwork-3213924_960_720.jpg"),
    (31, 7, "https://cdn.pixabay.com/photo/2016/11/29/13/23/animal-1868911_960_720.jpg"),
    (32, 7, "https://cdn.pixabay.com/photo/2016/11/29/10/41/architecture-1868668_960_720.jpg"),
    (33, 7, "https://cdn.pixabay.com/photo/2015/04/23/22/00/tree-736885_960_720.jpg"),
    (34, 7, "https://cdn.pixabay.com/photo/2016/05/05/02/37/sunset-1373171_960_720.jpg"),
    (35, 7, "https://cdn.pixabay.com/photo/2014/12/15/17/19/painting-576798_960_720.jpg"),
    (36, 8, "https://picsum.photos/seed/evan1/960/960"),
    (37, 8, "https://picsum.photos/seed/evan2/960/960"),
    (38, 8, "https://picsum.photos/seed/evan3/960/960"),
    (39, 8, "https://picsum.photos/seed/evan4/960/960"),
    (40, 8, "https://picsum.photos/seed/evan5/960/960"),
    (41, 8, "https://picsum.photos/seed/evan6/960/960"),
    (42, 8, "https://picsum.photos/seed/evan7/960/960"),
    (43, 8, "https://picsum.photos/seed/evan8/960/960"),
]

def run(cmd, **kw):
    return subprocess.run(cmd, check=True, **kw)

def psql(sql):
    run(["docker", "exec", DB, "psql", "-U", "artistry", "-d", "artistry", "-c", sql, "-q"])

print(f"Seeding {len(ROWS)} images...\n")
ok = 0
with tempfile.TemporaryDirectory() as tmp:
    for media_id, user_id, url in ROWS:
        filename = f"seed_{media_id}.jpg"
        local_path = os.path.join(tmp, filename)
        container_dir = f"/var/www/html/public/uploads/{user_id}"
        container_path = f"{container_dir}/{filename}"
        local_url = f"http://localhost:8742/uploads/{user_id}/{filename}"

        print(f"  [{ok+1}/{len(ROWS)}] media={media_id} user={user_id}")
        print(f"         ← {url}")

        try:
            req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
            with urllib.request.urlopen(req, timeout=30) as r, open(local_path, "wb") as f:
                f.write(r.read())
        except Exception as e:
            print(f"         DOWNLOAD FAILED: {e}")
            continue

        run(["docker", "exec", API, "mkdir", "-p", container_dir])
        run(["docker", "cp", local_path, f"{API}:{container_path}"])
        psql(f"UPDATE media SET file_url = '{local_url}' WHERE id = {media_id};")
        print(f"         → {local_url}")
        ok += 1

print(f"\n✓ Done: {ok}/{len(ROWS)} images stored locally.")
