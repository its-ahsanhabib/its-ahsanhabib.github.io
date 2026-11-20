# Adding a blog post

Every post is one entry in `blog.json`. The Writing page has two columns, each newest first,
tiles 2 per row, 8 at a time with "Load more":
- left **Technological** (`"category": "tech"`): your technical write-ups. Empty for now, so it
  shows a "Read on LinkedIn" note; the note disappears as soon as the first tech post is added.
- right **Philosophical** (`"category": "philosophy"`): the Bengali blog

A post opens at `itsahsan.me/#/blog/<id>`; previous/next stay within the same column.

## Write a new post
Add an entry anywhere in `blog.json` (the order in the file doesn't matter; posts are sorted by date):

```json
{
  "id": "my-first-english-post",
  "category": "tech",
  "title": "Bringing up a new STM32 board",
  "date": "2026-11-21",
  "lang": "en",
  "summary": "One or two lines shown on the card.",
  "cover": "images/blog/stm32-bringup.jpg",
  "text": "First paragraph.\n\nSecond paragraph.\nA line break inside the second paragraph."
}
```

- **id**: lowercase words joined with dashes (imported posts use their somewhereinblog number).
- **category**: `tech` (left column) or `philosophy` (right column).
- **date**: `YYYY-MM-DD`. Sets the order and the date shown.
- **lang**: `bn` for Bengali (uses the Noto Sans Bengali font), `en` for English.
- **summary**: optional but recommended. It's the card text.
- **cover**: optional image shown on the card (put it in `images/blog/`). The imported posts have no images.
- **Body**: use either
  - `text`: plain text. A blank line (`\n\n`) starts a new paragraph, `\n` is a line break, or
  - `html`: simple HTML (`<p>`, `<br>`, `<strong>`, `<em>`, `<a>`, `<img>`, lists).
- **source**: optional link to where it was first published (shown under the post).
- **link**: optional. Instead of a body, a card can point somewhere else (e.g. a LinkedIn post URL
  or `#/portfolio/<id>`).

## Re-import from somewhereinblog
`python3 tools/import_somewhereinblog.py` re-downloads every post from
somewhereinblog.net/blog/ahkshopno, cleans it and rewrites `blog.json`. Posts you wrote by hand
(no somewhereinblog `source`) are kept. Posts in `EXCLUDE_IDS` (16 removed by the owner) are never
re-imported, and images are stripped (`KEEP_IMAGES = False`). Use `--dry-run` to just see what it finds.
