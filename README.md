# Kanji Kōri

Offline-first Japanese-learning PWA, designed for static hosting (including GitHub Pages).

## Design decisions

- No backend, accounts, API calls or runtime dependency on an LLM.
- Relative URLs (`./`) are used so the app works from a GitHub Pages project path, not only `/`.
- Service Worker caches the application shell and curriculum.
- IndexedDB stores progress, review scheduling and settings.
- Curated curriculum data is separate from UI code and can be replaced/expanded independently.
- The local AI layer is intentionally an extension point, not a requirement.
- Browser speech synthesis is used as an optional pronunciation fallback. Production content should add licensed/bundled native recordings and cache them through the Service Worker.
- Stroke data is structured so it can later be replaced with licensed KanjiVG assets. KanjiVG provides Japanese-style stroke-order SVG data under CC BY-SA 3.0: https://kanjivg.tagaini.net/

## Deploy to GitHub Pages

Upload the repository contents to a GitHub repository and enable Pages for the branch/folder containing `index.html`.

No build step is required.

## Suggested production data pipeline

Keep authoritative Japanese data in versioned JSON generated from curated/licensed sources. Store provenance and source version in each dataset release. Generated AI material should reference existing IDs and never create authoritative readings, meanings, stroke order or grammar facts.

## Architecture

`index.html` -> `js/app.js` -> `js/data.js` + `js/db.js` + `js/lesson.js` + `js/stroke.js`

Data is in `data/`. Static assets are in `assets/`. The Service Worker is `sw.js`.
