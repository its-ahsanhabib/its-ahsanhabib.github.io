#!/usr/bin/env python3
"""Import all posts from a somewhereinblog.net blog into blog.json (+ images into images/blog/).

Usage (from the repo root):
    python3 tools/import_somewhereinblog.py            # writes blog.json, keeps hand-written posts
    python3 tools/import_somewhereinblog.py --dry-run  # only prints what it found

How it works: the blog's first page lists 15 posts; older ones come from the same JSON
endpoint the site's "load more" button uses (/blogger-posts/<owner>/<blog>/<last-post-id>).
Each post page is then fetched (1 s apart) and cleaned:
  - images are removed (KEEP_IMAGES = False). If turned on: cms.somewhereinblog.net images are
    dead (404) and dropped, others are downloaded into images/blog/
  - posts in EXCLUDE_IDS (removed by the owner) are never imported
  - only simple tags are kept (p, br, strong/b, em/i, u, a, img, ul/ol/li, blockquote)
  - posts with no text and no image left are skipped
Entries already in blog.json that did not come from somewhereinblog (no "source" on that
site) are kept, so hand-written posts survive a re-import.
"""
import html as H
import json, os, re, subprocess, sys, time

BLOG = "ahkshopno"
OWNER_ID, BLOG_ID = "94553", "94525"   # from the blog page's JS (blog_owner_id / blog_id)
BASE = "https://www.somewhereinblog.net"
UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/130 Safari/537.36"
IMG_DIR = "images/blog"
DRY = "--dry-run" in sys.argv
KEEP_IMAGES = False  # owner's choice (2026-11-21): no images in blog posts

# Posts the owner removed from the site (reposted news, personal/gift/picture posts). Never re-import.
EXCLUDE_IDS = {
    "29654441", "29898217", "29648246", "29969226", "29932433", "29756692", "29747422", "29746100",
    "29746040", "29744861", "29723984", "29645924", "29642269", "29641313", "29638047", "29637892",
}


def get(url, xhr=False, binary=False):
    args = ["curl", "-s", "--compressed", "-L", "--max-time", "40", "-A", UA]
    if xhr:
        args += ["-H", "X-Requested-With: XMLHttpRequest"]
    out = subprocess.run(args + [url], capture_output=True).stdout
    return out if binary else out.decode("utf-8", "replace")


BN_DIGITS = str.maketrans("০১২৩৪৫৬৭৮৯", "0123456789")
MONTHS = [("জানু", 1), ("ফেব্রু", 2), ("মার্চ", 3), ("এপ্রি", 4), ("মে", 5), ("জুন", 6), ("জুলা", 7),
          ("আগ", 8), ("সেপ্টে", 9), ("অক্টো", 10), ("নভে", 11), ("ডিসে", 12)]


def iso_date(bn):
    m = re.search(r"(\d{1,2})\s*\S*\s+(\S+?),\s*(\d{4})", bn.translate(BN_DIGITS))
    if not m:
        return None
    mon = next((n for k, n in MONTHS if m.group(2).startswith(k)), None)
    return f"{int(m.group(3)):04d}-{mon:02d}-{int(m.group(1)):02d}" if mon else None


KEEP = {"p", "br", "strong", "b", "em", "i", "u", "a", "img", "ul", "ol", "li", "blockquote"}


def clean(c, pid):
    c = re.sub(r"<div\s*$", "", c.rstrip())  # partial tag left by the split on post-stats
    c = re.sub(r"<script.*?</script>|<style.*?</style>|<!--.*?-->", "", c, flags=re.S)
    images, dead = [], [0]

    def img(m):
        src = re.search(r'src\s*=\s*["\']([^"\']+)["\']', m.group(0))
        if not KEEP_IMAGES:
            return ""
        if not src or "cms.somewhereinblog.net" in src.group(1):
            dead[0] += 1
            return ""  # dead image host
        url = src.group(1)
        name = re.sub(r"[^A-Za-z0-9._-]", "_", url.split("/")[-1].split("?")[0])[-80:]
        local = f"{IMG_DIR}/{name}"
        if not DRY and not os.path.exists(local):
            data = get(url, binary=True)
            if data[:4] in (b"\x89PNG", b"GIF8") or data[:2] == b"\xff\xd8":
                open(local, "wb").write(data)
            else:
                return ""
        emoticon = "emot" in name
        if not emoticon:
            images.append(local)
        return f'<img src="{local}" alt=""{" class=\"emoticon\"" if emoticon else ""}>'

    c = re.sub(r"<img\b[^>]*>", img, c, flags=re.I)

    def tag(m):
        closing, name, attrs = m.group(1), m.group(2).lower(), m.group(3)
        if name not in KEEP:
            return " " if name in ("div", "span", "font", "center") else ""
        if name == "img":
            return m.group(0)  # already rebuilt above
        if name == "a" and not closing:
            href = re.search(r'href\s*=\s*["\']([^"\']+)["\']', attrs)
            return f'<a href="{H.escape(href.group(1))}" target="_blank" rel="noopener">' if href else ""
        if name == "b":
            name = "strong"
        if name == "i":
            name = "em"
        return f"<{closing}{name}>" if name != "br" else "<br>"

    c = re.sub(r"<(/?)([a-zA-Z0-9]+)([^>]*)>", tag, c)
    c = re.sub(r"[ \t\r\n]+", " ", c)
    c = re.sub(r"<p>\s*(<br>\s*)*</p>", "", c)
    c = re.sub(r"^(\s*<br>\s*)+|(\s*<br>\s*)+$", "", c.strip())
    if not c.startswith("<p>"):
        c = f"<p>{c}</p>"
    return c.strip(), images, dead[0]


def main():
    first = get(f"{BASE}/blog/{BLOG}")
    ids = list(dict.fromkeys(re.findall(r'class="post-title" data-id="(\d+)"', first)))
    while ids:
        time.sleep(1)
        batch = json.loads(get(f"{BASE}/blogger-posts/{OWNER_ID}/{BLOG_ID}/{ids[-1]}", xhr=True) or "[]")
        new = [b["postId"] for b in batch if b["postId"] not in ids]
        if not new:
            break
        ids += new
    print(f"found {len(ids)} post ids", file=sys.stderr)
    if KEEP_IMAGES:
        os.makedirs(IMG_DIR, exist_ok=True)

    posts, skipped = [], []
    for pid in ids:
        if pid in EXCLUDE_IDS:
            skipped.append((pid, "excluded by owner")); continue
        time.sleep(1)
        page = get(f"{BASE}/blog/{BLOG}/{pid}")
        if 'class="single-full-post"' not in page:
            skipped.append((pid, "page not found")); continue
        body = page.split('class="single-full-post"', 1)[1]
        title = re.search(r'<h2 class="post-title[^"]*">(.*?)</h2>', body, re.S)
        date = re.search(r'<div class="author">(.*?)</div>', body, re.S)
        c = body.split('<div class="blog-content">', 1)[1].split('class="post-stats"', 1)[0]
        c = c.split('<div style="color:#999a9c; font-size:70%">', 1)[0]
        html, images, dead = clean(c, pid)
        text = H.unescape(re.sub(r"<[^>]+>", " ", html))
        text = re.sub(r"\s+", " ", text).strip()
        t = H.unescape(re.sub(r"<[^>]+>", "", title.group(1))).strip() if title else ""
        d = re.sub(r"\s+", " ", H.unescape(date.group(1))).strip() if date else ""
        if (len(text) < 20 and not images) or (dead >= 3 and len(text) < 80 and not images):
            skipped.append((pid, f"only lost images left: {t}")); continue
        posts.append({
            "id": pid, "title": t, "date": iso_date(d), "lang": "bn",
            "summary": (text[:157] + "…") if len(text) > 160 else text,
            "cover": images[0] if images else None,
            "html": html, "source": f"{BASE}/blog/{BLOG}/{pid}",
        })
        print(pid, d, t[:40], file=sys.stderr)

    keep = []
    if os.path.exists("blog.json"):
        keep = [p for p in json.load(open("blog.json")) if "somewhereinblog.net" not in (p.get("source") or "")]
    out = sorted(keep + posts, key=lambda p: p.get("date") or "", reverse=True)
    for pid, why in skipped:
        print("skipped", pid, why, file=sys.stderr)
    if DRY:
        print(f"dry run: {len(posts)} imported, {len(keep)} kept", file=sys.stderr); return
    json.dump(out, open("blog.json", "w"), ensure_ascii=False, indent=2)
    open("blog.json", "a").write("\n")
    print(f"blog.json: {len(out)} posts ({len(posts)} imported, {len(keep)} hand-written kept)", file=sys.stderr)


if __name__ == "__main__":
    main()
