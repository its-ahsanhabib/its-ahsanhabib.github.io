#!/usr/bin/env python3
"""Fetch LinkedIn posts (text, images, video) via LinkedIn's public embed page.

Usage:
    python3 tools/linkedin_fetch.py WORK_DIR p1=https://lnkd.in/p/XXXX p2=https://lnkd.in/p/YYYY ...

Use a WORK_DIR outside the repo (e.g. /tmp/li). For each label it prints the post date, clean URL,
full text and downloaded media (WORK_DIR/dl/<label>-<n>.jpg|mp4), and writes WORK_DIR/posts.json.
Post date is decoded from the post id. Only public posts work. Links in the post text are
lnkd.in short links that often don't resolve.
Next step: write a spec and run tools/add_projects.py (see CLAUDE.md).
"""
import sys, re, html, json, subprocess, os, datetime

out = sys.argv[1]
os.makedirs(f"{out}/dl", exist_ok=True); os.makedirs(f"{out}/li", exist_ok=True)
UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Safari/537.36"

def curl(args):
    return subprocess.run(["curl", "-s", "--max-time", "60", "-A", UA] + args, capture_output=True, text=True).stdout

summary = {}
for arg in sys.argv[2:]:
    label, url = arg.split("=", 1)
    full = curl(["-o", "/dev/null", "-w", "%{redirect_url}", url]).strip()
    m = re.search(r"-(ugcPost|share|activity)-(\d+)-", full)
    if not m:
        summary[label] = {"error": "no urn", "redirect": full}; continue
    kind, num = m.groups()
    date = str(datetime.datetime.fromtimestamp((int(num) >> 22) / 1000, datetime.timezone.utc).date())
    page = f"{out}/li/{label}.html"
    curl(["-o", page, f"https://www.linkedin.com/embed/feed/update/urn:li:{kind}:{num}"])
    s = open(page, encoding="utf-8", errors="replace").read()
    t = re.search(r'<p[^>]*attributed-text-segment-list__content[^>]*>(.*?)</p>', s, re.S)
    text = t.group(1) if t else ""
    text = html.unescape(re.sub(r"<[^>]+>", "", re.sub(r"<br\s*/?>", "\n", text))).strip()
    media, seen = [], set()
    for u in re.findall(r'(?:src|data-delayed-url)="(https://media\.licdn\.com/dms/image/[^"]+)"', s):
        u = html.unescape(u)
        if ("feedshare" in u or "videocover" in u or "article-cover" in u) and u.split("/")[6] not in seen:
            seen.add(u.split("/")[6]); media.append(("jpg", u))
    v = re.search(r'data-sources="([^"]+)"', s)
    if v:
        media.append(("mp4", json.loads(html.unescape(v.group(1)))[0]["src"]))
    # documents (PDF carousels) / article links
    doc = re.findall(r'(https://media\.licdn\.com/dms/document/[^"\s]+)', s)
    art = re.findall(r'href="(https://www\.linkedin\.com/pulse/[^"?]+)', s)
    files = []
    for n, (ext, u) in enumerate(media, 1):
        f = f"{out}/dl/{label}-{n}.{ext}"
        curl(["-o", f, u]); files.append(os.path.basename(f))
    clean = full.split("?")[0]
    summary[label] = {"url": clean, "date": date, "text": text, "files": files,
                      "has_doc": bool(doc), "articles": sorted(set(art))[:3]}

json.dump(summary, open(f"{out}/posts.json", "w"), ensure_ascii=False, indent=1)
for k, v in summary.items():
    print(f"\n######## {k}  {v.get('date')}  files={v.get('files')} doc={v.get('has_doc')} art={v.get('articles')}\n{v.get('url', v)}\n{v.get('text', '')}")
