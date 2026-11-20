# Changelog

Newest first. One entry per change set, with dates as YYYY-MM-DD.

## 2026-11-20: Contact map fix and WhatsApp
- Contact map showed "API KEY REQUIRED" tiles: CARTO basemaps now need a key. Switched to
  OpenStreetMap tiles (free, no key; attribution shown) darkened with `.map-tiles-dark` CSS filter.
- Added WhatsApp (`wa.me/8801738889858`) to the sidebar and the Contact "Let's Socialize" row
  (SVG-mask icon, green on hover).
- Follow-up: map darker with a teal tint; WhatsApp and email icons resized to match the other
  social icons (sidebar and Contact).

## 2026-11-20: Sidebar social links
- Removed Facebook, Twitter and Instagram from the sidebar; added an Email icon (mailto, uses
  the pe-7s-mail glyph). Sidebar now: LinkedIn, GitHub, Email. No phone/WhatsApp yet (no number).

## 2026-11-20: Resume update
- Added Maple IT Solutions (Embedded System Engineer, Sep 2026 - Present, Dhaka) with company
  line and 3 bullets; logo (`images/clients/logos/maple-it-solutions.png`, white made transparent)
  added first in the "Worked at" row, which now fits 6 logos (square-logo size rule in `css/main.css`).
- MeldCX entry: title "Electronics Engineer", May 2024 - Sep 2026, Melbourne, Victoria.
- Companies count 5 -> 6 (home stats + About).

## 2026-11-20: Removed project and unused videos
- Removed "Emergency Calling System" (`portfolio-item-07`, it had copy-pasted Pick-and-Place
  content) and its cover image; `portfolio-item-07.html` now redirects to `#/portfolio`.
- Deleted 4 unused videos (`timer.mp4`, `smart door lock.mp4`, `VID_20180306_022907.mp4`,
  `VID_20180411_060039.mp4`), so `portfolio/images` went from 126 MB to 42 MB.

## 2026-11-20: Fix mobile pull-to-refresh on section swipe
- Swiping down at the top of a section on mobile reloaded the page (browser pull-to-refresh)
  instead of going to the previous section. Added `overscroll-behavior-y` on `html, body` (none)
  and `.pt-page` (contain) in `css/main.css`.

## 2026-11-20: New home page ("Spotlight")
- Replaced the home section (keeps the site's grey-teal photo overlay): left-aligned
  "Embedded Systems Engineer" eyebrow, one-line name, typing role, pitch, "All Projects" /
  "Get In Touch" buttons, compact featured-project tiles (first 3 featured from `portfolio.json`,
  kept narrow so they don't cover the face) and a stats row.
- Styles in new `css/home.css`; `renderHomeFeatured()` in `js/main.js`. Responsive: portrait uses
  the face crop; tiles fit the width on phones; less important items hide on short screens.

## 2026-11-20: Responsive home background
- Portrait screens (phones, upright tablets) use `images/site/home-portrait.jpg`, a square face
  crop that fades into navy (#020e24) behind the text. Landscape/desktop keep the wide photo,
  anchored at 72% so the face stays visible (`css/main.css`, "Home background").
- Restored `images/site/home.jpg` at 2400px from the original 3366px (it had been compressed to 1600px).

## 2026-11-19: 16 projects imported from LinkedIn posts
- Added via `tools/` (LinkedIn embed → spec → `add_projects.py`):
  - **Featured:** Lenovo M710q 2nd M.2 slot, 1kW MPPT solar charge controller, Home Assistant
    aquarium controller, BLE passive keyless entry, Universal VTS telematics device, BiTOn EVSE.
  - **Projects:** ArduPilot custom flight controller, versatile IoT gateway, smart plug load
    controller, USB isolation tool, STM32 USB CDC serial (GitHub), VTS enclosure in SolidWorks,
    LC filter energy-harvesting POC (2017).
  - **Thinking & Traveling:** My home lab, Saleae logic analyzer, debugging with an LED.
- Video blocks support `poster` and `caption`.
- Added `CLAUDE.md` (site guide + workflow), this changelog, and `tools/linkedin_fetch.py` and
  `tools/add_projects.py`.

## 2026-11-19: Data-driven portfolio and cleanup
- Portfolio grid and project detail view are now rendered from `portfolio.json` (block-based
  content). All 17 old project pages migrated; `portfolio-item-NN.html` became redirect stubs.
- Sorting: featured → year → file order. Year badge on cards, Featured badge, optional
  meta row and link buttons. Empty category filters hide themselves.
- Fixed: case-mismatched seminar images, Power Meter's wrong cross-link, "Embeded" spelling.
- Removed: duplicate pages 18–21, stale `js/portfolio.json`, header/footer partials, template
  demo pages/images, `server/` PHP, `send-mail.php`, `debug.log`.
- Blog section became "Writing", linking to LinkedIn posts.
- Sidebar: LinkedIn → `embedwithahsan`, added GitHub, copyright "© 2026 Ahsan Habib";
  og: URLs → itsahsan.me.
- Compressed project photos (videos not yet).

## 2026-08 and earlier
See `git log`. Main changes: OpenStreetMap contact map, automatic portfolio loading,
section scroll fixes, resume/about/"worked at" updates, CNAME for itsahsan.me.
