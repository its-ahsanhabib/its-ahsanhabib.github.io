# Adding a blog post

Every post is one entry in `blog.json`. The Writing page lists them as cards (newest first,
12 at a time with "Load more"), and a post opens at `itsahsan.me/#/blog/<id>`.

## Write a new post
Add an entry anywhere in `blog.json` (the order in the file doesn't matter; posts are sorted by date):

```json
{
  "id": "my-first-english-post",
  "title": "Bringing up a new STM32 board",
  "date": "2026-11-21",
  "lang": "en",
  "summary": "One or two lines shown on the card.",
  "cover": "images/blog/stm32-bringup.jpg",
  "text": "First paragraph.\n\nSecond paragraph.\nA line break inside the second paragraph."
}
```

- **id**: lowercase words joined with dashes (imported posts use their somewhereinblog number).
- **date**: `YYYY-MM-DD`. Sets the order and the date shown.
- **lang**: `bn` for Bengali (uses the Noto Sans Bengali font), `en` for English.
- **summary**: optional but recommended. It's the card text.
- **cover**: optional image shown on the card (put it in `images/blog/`). The imported posts have no images.
- **Body**: use either
  - `text`: plain text. A blank line (`\n\n`) starts a new paragraph, `\n` is a line break, or
  - `html`: simple HTML (`<p>`, `<br>`, `<strong>`, `<em>`, `<a>`, `<img>`, lists).
- **source**: optional link to where it was first published (shown under the post).

## Re-import from somewhereinblog
`python3 tools/import_somewhereinblog.py` re-downloads every post from
somewhereinblog.net/blog/ahkshopno, cleans it and rewrites `blog.json`. Posts you wrote by hand
(no somewhereinblog `source`) are kept. Posts in `EXCLUDE_IDS` (16 removed by the owner) are never
re-imported, and images are stripped (`KEEP_IMAGES = False`). Use `--dry-run` to just see what it finds.
