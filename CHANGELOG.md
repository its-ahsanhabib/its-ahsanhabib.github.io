# Changelog

Newest first. One entry per change set, with dates as YYYY-MM-DD.

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
