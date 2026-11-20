# itsahsan.me: portfolio of Ahsan Habib

Notes for anyone (human or AI) changing this site. Keep this file and `CHANGELOG.md` updated
whenever something structural changes.

## What it is
- A static site on **GitHub Pages**, served at **https://itsahsan.me** (`CNAME`). There is no build
  step: push to `main` and it's live.
- A jQuery one-page template from around 2016. Sections in `index.html`: `#home`, `#about`, `#resume`,
  `#portfolio`, `#blog` (labelled "Writing"), `#contact`. Navigation uses hash URLs (`#/portfolio`)
  via `jquery.address`.
- GitHub Pages is **case-sensitive**: a path in JSON/HTML must match the filename's case exactly.
  This has broken images before.

## Key files
| File | Purpose |
|---|---|
| `index.html` | All sections, the about/resume text, category filter buttons (`#filters`) |
| `portfolio.json` | **All projects.** The grid and the detail views are rendered from it |
| `js/main.js` | Top of file: project rendering (`getProjects`, `sortProjects`, `renderProject`, `renderBlock`). Below: template code (page transitions, `showProjectDetails` overlay, masonry) |
| `css/main.css` | Template styles; site-specific additions are at the end (`PROJECTS`, `WRITING`) |
| `css/home.css` | Home page ("Spotlight" design): wide photo + left text on desktop, `home-portrait.jpg` face crop on portrait screens, featured tiles, stats. Has height-based rules so everything fits on short screens |
| `PORTFOLIO.md` | Project entry format, for humans |
| `portfolio/images/<project-id>/` | Images for each project (older projects use loose files in `portfolio/images/`) |
| `portfolio-item-01..17.html` | Redirect stubs only, kept for old shared links. Don't add new ones. `-07` (removed project) redirects to `#/portfolio` |
| `tools/` | Scripts for importing LinkedIn posts as projects (below) |

## Projects (portfolio.json)
Entry fields: `id`, `title`, `summary`, `year`, `featured`, `categories`, `cover`, optional
`meta` (object shown as facts row), optional `links` ([{label,url}]), `blocks` (ordered content).
Block types: `image` {src, caption?}, `video` {src, poster?, caption?}, `youtube` {id},
`heading` {text}, `text` {html}, `embed` {src}. Full example in `PORTFOLIO.md`.

- URL of a project: `itsahsan.me/#/portfolio/<id>`. Old ids `portfolio-item-NN` must keep working.
- Display order: `featured` first → `year` desc → order in the file.
- The home page shows the first 3 featured projects as tiles (`HOME_FEATURED_COUNT` in `js/main.js`), so `featured` + order also controls the home page.
- `categories` must match `data-filter` values in `index.html` `#filters`: `Electronics`, `iOT`,
  `AI`, `Automation`, `Embedded_System`, `Power`, `3D`, `Robotics_Mechatronics`,
  `Sketch_Photography`, `Thinking_Traveling`. Empty filters hide automatically.
- `Thinking_Traveling` is used for non-project posts (seminars, reflections, tools).
- Images: compress before adding (max 1600px, JPEG). Prefer YouTube for long videos; local mp4s
  should be 720p and a few MB.

## Workflow: LinkedIn posts → projects
The owner shares `lnkd.in/p/...` links and sometimes says which posts to merge into one project.
1. `python3 tools/linkedin_fetch.py /tmp/li p1=<url> p2=<url> ...`
   This resolves the links, reads the public embed page, and saves text and media to `/tmp/li/dl/`.
   LinkedIn profile pages block automated reads, but post embeds work.
2. Look at the images (e.g. `montage` contact sheet), pick a cover, write captions.
3. Write a spec JSON (portfolio.json format + `_files` map). Rewrite the post text lightly: keep
   the owner's voice, fix typos, drop hashtags and emojis, split it into headings and paragraphs. Add a
   "View on LinkedIn" link using the clean post URL (without query string).
4. `python3 tools/add_projects.py spec.json /tmp/li/dl` compresses the images into
   `portfolio/images/<id>/` and adds the entries to `portfolio.json`.
5. Check it locally: `python3 -m http.server 8800` → `http://localhost:8800/#/portfolio/<id>`.
6. Add a line to `CHANGELOG.md`.

Before publishing, flag these to the owner: personal content (family), names of collaborators,
employer/NDA-sensitive products, and anything you guessed (captions, years, categories).

## Conventions
- Commit only when asked. The owner merges branches into `main` themselves. Don't push without asking.
- Contact/social: LinkedIn `embedwithahsan`, GitHub `its-ahsanhabib`, email `habib.ahsan.dev@gmail.com`,
  WhatsApp `+8801738889858` (sidebar + Contact). No Facebook/Twitter/Instagram.
- Contact map: Leaflet + OpenStreetMap tiles (no API key). Don't switch back to CARTO/Google tiles without a key. The "Writing" section links to
  LinkedIn recent activity.
- Don't reintroduce PHP/server code; GitHub Pages is static only.

## Open items
- The About counters and the home stats row (10+ yrs / 5 companies / 1000+ units / 2 awards) and the
  home typing text have not been checked against LinkedIn. The owner needs to supply the current values.
  The stats appear in two places: `#about` fun-facts and `.hv-stats` in `#home`.
- 3 old raw videos (`weaving.mp4`, `weaving2.mp4`, `RGB led.mp4`, ~22 MB) are not compressed yet.
- Unused older media in `portfolio/images/` (BMS, GRBL, baby tracker, testimonials, sketches) could
  become projects.
