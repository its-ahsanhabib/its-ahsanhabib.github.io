# Adding a project

Every project is one entry in `portfolio.json`. The grid card and the detail view are
both built from it, so you don't need an HTML file per project.

1. Put images in `portfolio/images/<project-id>/`. Keep them under ~1600px wide, as JPG,
   and match the filename's upper/lower case exactly in the JSON (GitHub Pages is case-sensitive).
2. Add an entry anywhere in `portfolio.json`:

```json
{
  "id": "ev-charger-firmware",
  "title": "EV Charger Controller Firmware",
  "summary": "One line shown on the grid card.",
  "year": 2025,
  "featured": true,
  "categories": ["Electronics", "Embedded_System", "Power"],
  "cover": "portfolio/images/ev-charger-firmware/cover.jpg",
  "meta": { "Client": "Company name", "Role": "Firmware lead", "Tech": "STM32, FreeRTOS, CAN" },
  "links": [{ "label": "GitHub", "url": "https://github.com/..." }],
  "blocks": [
    { "type": "image", "src": "portfolio/images/ev-charger-firmware/board.jpg", "caption": "optional" },
    { "type": "heading", "text": "About the project" },
    { "type": "text", "html": "<p>Paragraph one.</p><p>Paragraph two.</p>" },
    { "type": "youtube", "id": "VIDEO_ID" },
    { "type": "video", "src": "portfolio/images/ev-charger-firmware/demo.mp4" }
  ]
}
```

- **id**: lowercase words joined with dashes. It becomes the link: `itsahsan.me/#/portfolio/<id>`.
- **year**, **featured**, **meta** and **links** are optional.
- **Order**: featured projects come first, then the newest year. Projects without a year go last.
  Ties keep the order they have in the file.
- **categories** must match a filter in `index.html` (`Electronics`, `iOT`, `AI`, `Automation`,
  `Embedded_System`, `Power`, `3D`, `Robotics_Mechatronics`, `Sketch_Photography`,
  `Thinking_Traveling`). To add a new category, add an `<li>` in `#filters` in `index.html`.
  Filters with no projects are hidden automatically.
- **Videos**: prefer YouTube. If you add a local `.mp4`, compress it first (720p, under ~5 MB).

The old `portfolio-item-NN.html` files are only redirects for links shared in the past. New
projects don't need one.
