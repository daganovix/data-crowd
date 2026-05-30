# 🌱 Vegan Map · Europe

A map of vegan restaurants and cafés across Europe. Discover places, **rate**
them, **write notes**, mark the ones you've **visited**, and save the ones you
**want to visit**.

It's a single-page app with **no backend and no login** — restaurant data comes
live from OpenStreetMap, and everything personal (ratings, notes, visited,
want-to-visit) is stored in your browser via `localStorage`.

## Features

- **Live map** of vegan & vegan-friendly spots, loaded on the fly from
  OpenStreetMap as you pan and zoom (Overpass API).
- **City search** to jump anywhere in Europe (Nominatim).
- **Rate** places 1–5 stars and **write private notes**.
- **Mark visited** and keep a **Want-to-visit** wishlist.
- **100% vegan only** filter to hide places that merely have vegan options.
- **Near me** — use your location to recenter the map and sort lists by
  distance (each place shows how far away it is).
- Color-coded pins: green = visited, amber = want to visit, leaf = discovered,
  blue dot = you.
- Three lists in the sidebar: **Discover** (what's on the map now),
  **Want to visit**, and **Visited** (sorted by your rating).
- **Export / import** your data as JSON, so you can back it up or move it to
  another device.

## Tech stack

- React 18 + TypeScript + Vite
- Tailwind CSS
- Leaflet / react-leaflet for the map
- OpenStreetMap Overpass API (places) + Nominatim (search)

## Getting started

```bash
cd vegan-map
npm install
npm run dev
```

Then open the printed URL (defaults to http://localhost:5180).

### Build for production

```bash
npm run build      # outputs to dist/
npm run preview    # serve the production build locally
```

The build is fully static — `dist/` can be hosted on any static host
(Netlify, Vercel, GitHub Pages, S3, …). The Vite `base` is set to `./`
(relative), so it works from any sub-path without extra config.

### Deploy to GitHub Pages

A workflow at `.github/workflows/deploy-vegan-map.yml` builds `vegan-map/` and
publishes it to GitHub Pages automatically. To enable it:

1. In the repo, go to **Settings → Pages** and set **Source: GitHub Actions**.
2. Push to `main` (any change under `vegan-map/`), or run the
   **Deploy Vegan Map to GitHub Pages** workflow manually from the Actions tab.

The site will be served at `https://<owner>.github.io/<repo>/`.

## How data works

- **Restaurant data** is fetched from public Overpass API mirrors based on the
  area you're viewing. Zoom in to at least street/city level to load spots
  (there's an on-screen hint when you're zoomed too far out).
- A place counts as vegan when it's tagged `diet:vegan=yes|only|limited` in
  OpenStreetMap. "100% vegan" = `diet:vegan=only`; otherwise it has vegan
  options.
- **Your data never leaves your device.** It lives in `localStorage` under the
  key `vegan-map:userdata:v1`. Use **Export** (⋮ menu) to back it up.

## Notes & limitations

- Coverage depends on OpenStreetMap. If a place is missing or mislabeled, you
  can improve it directly on [openstreetmap.org](https://www.openstreetmap.org).
- localStorage is per-browser/per-device. Use Export/Import to move your data
  between devices.
