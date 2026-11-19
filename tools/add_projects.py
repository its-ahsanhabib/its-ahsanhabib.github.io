#!/usr/bin/env python3
"""Add projects to portfolio.json from a spec file, compressing their images into the site.

Usage (run from the repo root):
    python3 tools/add_projects.py SPEC.json DOWNLOAD_DIR

SPEC.json is a list of project entries in the portfolio.json format (see PORTFOLIO.md), plus
one extra key per entry:

    "_files": {"cover": "p4-3.jpg", "bench": "p4-1.jpg"}

which maps an image NAME to a file in DOWNLOAD_DIR. Each file is converted to
portfolio/images/<id>/<NAME>.jpg (max 1600px, JPEG q82, metadata stripped). In "blocks",
write "src": "<NAME>" and it is replaced with the real path. "cover" is required.

New entries are inserted at the top of portfolio.json. Display order is decided by
featured -> year -> file order, so position only matters between equal entries.
Requires ImageMagick (`convert`).
"""
import json, os, subprocess, sys

spec_path, dl = sys.argv[1], sys.argv[2]
spec = json.load(open(spec_path))
cur = json.load(open("portfolio.json"))
clash = {p["id"] for p in cur} & {p["id"] for p in spec}
sys.exit(f"ids already exist: {clash}") if clash else None

ORDER = ["id", "title", "summary", "year", "featured", "categories", "cover", "meta", "links", "blocks"]
out = []
for p in spec:
    d = f"portfolio/images/{p['id']}"
    os.makedirs(d, exist_ok=True)
    paths = {}
    for name, src in p.pop("_files").items():
        dst = f"{d}/{name}.jpg"
        subprocess.run(["convert", os.path.join(dl, src), "-auto-orient", "-strip", "-resize", "1600x1600>",
                        "-background", "white", "-flatten", "-interlace", "JPEG", "-quality", "82", dst], check=True)
        paths[name] = dst
    p["cover"] = paths["cover"]
    for b in p.get("blocks", []):
        if b.get("src") in paths:
            b["src"] = paths[b["src"]]
        for k in ("src", "poster"):
            if k in b and not b[k].startswith("http") and not os.path.exists(b[k]):
                sys.exit(f"{p['id']}: missing file {b[k]}")
    out.append({k: p[k] for k in ORDER if k in p})
    print("added", p["id"])

json.dump(out + cur, open("portfolio.json", "w"), ensure_ascii=False, indent=2)
open("portfolio.json", "a").write("\n")
print(f"portfolio.json now has {len(out) + len(cur)} projects")
