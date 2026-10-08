# Flyer Studio

A web app for the church media team to make "Happy Birthday" flyers in seconds. Type the name and date,
add a photo (the background is removed automatically), pick a theme, and download a 2160 x 2700 PNG ready
for Instagram or WhatsApp. It installs on a phone like an app and works offline.

Stack: React, Vite, TypeScript, Tailwind CSS v4, `html-to-image`, `@imgly/background-removal`, `vite-plugin-pwa`.

## Run it

```bash
npm install
npm run dev
```

The first `npm run dev` (and `npm run build`) downloads about 100 MB of background-removal model files into
`public/bgdata/` (one time, skipped afterwards). They are served from the app's own origin so cut-outs work
offline. If you ever need to fetch them by hand: `npm run fetch-model`. If `public/bgdata/` is missing at
runtime, the app falls back to the public CDN automatically.

Other scripts:

| Command | What it does |
| --- | --- |
| `npm run build` | Type-checks and builds to `dist/` (also generates the service worker) |
| `npm run preview` | Serves the production build at http://localhost:4173 (use this to test install and offline) |
| `npm run icons` | Rebuilds the PWA icons from the logo (see below) |

## The app

Five pages and a full-screen editor, on hash URLs (for example `#/flyers`), so any host works with no rewrite rules:

| Page | What it does |
| --- | --- |
| Home | Upcoming birthdays, recent flyers, quick template picks |
| Flyers | Saved flyers (thumbnail, duplicate, delete) |
| Templates | The six templates as live previews; one tap starts a flyer |
| Birthdays | The church's birthday list (month and day only); "Make flyer" pre-fills the editor |
| Settings | Church name, logo variants, default template, default birthday message, install |
| Editor | Content, Design, Photo and Branding tabs beside a large canvas. Phones get a bottom tab bar with a sheet |

Saved flyers (with the cut-out portrait) live in IndexedDB; birthdays, branding settings, saved colour sets and
your last-used options live in localStorage. Everything stays on the device.

## Project layout

```
public/brand/        logo.png (+ optional logo-light.png) and the generated PWA icons
src/config/          brand.ts, themes.ts, treatments.ts, layouts.ts, fonts.ts: what you would edit
src/pages/           Home, Flyers, Templates, Birthdays, Settings, Editor (+ useEditor.ts, all editor state)
src/components/      Shell (navigation), editor/panels, Flyer (the artwork), FlyerPreview, ui (design system)
src/lib/             dates, name splitting, text fitting, photo cut-out, masks, logo, export, stores, router
scripts/             icon and model download scripts
```

The flyer is one `<Flyer />` component that takes a typed props object. It is drawn on a 1080 px wide canvas;
every position and size in `src/config/layouts.ts` is a fraction of the canvas, so all three aspect ratios share
one design. The interface itself uses a small token set in `src/index.css` (warm neutrals, the church maroon as the
only accent, 4 px spacing grid, Instrument Serif for page titles and Hanken Grotesk for everything else).

## Photo blending

The portrait is blended into the artwork with soft masks, never a plain border. Each template points at a
*treatment* in `src/config/treatments.ts`; the operator can override it in the Photo tab.

| Treatment | Used by | Look |
| --- | --- | --- |
| Editorial | Sunset Gold | Soft bottom fade, gentle side blending, warm haze over the chest |
| Royal | Royal Purple & Gold | Clean edge, subtle contact shadow, controlled fade |
| Elegant | Emerald & Cream, Rose & Blush | Feathered on all sides, quiet |
| Modern | Deep Blue & Silver, Midnight | Crisp angled cut at the base |

A treatment sets feathering per edge (a fraction of the portrait's own size), the angle of the bottom fade, where
the torso dissolves into the flyer, an optional shadow and how far the haze climbs. The face is never blurred or
distorted: the top edge is left crisp. If a photo has no transparency (background removal skipped), it is blended
with wider feathering and a soft oval so no rectangle shows. Zoom, horizontal and vertical position, flip, overlap
with the headline and crop (under the Crop disclosure) are all in the Photo tab; dragging on the canvas also works.
To add a treatment, add an entry to `treatments` and point a theme's `treatment` at its id.

## Branding

**Replace the logo.** Drop your file at `public/brand/logo.png` (transparent PNG, no code changes).
The logo is placed at the bottom centre of every flyer. It is trimmed to its visible pixels, and if its
colour would not read on the current theme it is swapped automatically:

1. if `public/brand/logo-light.png` exists it is used on dark backgrounds,
2. otherwise the logo is recoloured to the theme's name colour (light backdrop) or headline colour (dark backdrop).

If your logo image already contains the church name, set `logoIncludesName: true` in `src/config/brand.ts`
so the name is not printed twice. If the logo is a dark file, you can set `logoVariant: 'dark'`
(the default `'auto'` detects it).

**Change the church name.** Edit `churchName` in `src/config/brand.ts`. The same file holds `installName`
and `shortName`, which become the PWA name and home-screen label.

**Regenerate icons.** After changing the logo, run:

```bash
npm run icons
```

This composes the logo on a solid dark maroon square (`scripts/make-icon-source.mjs`) and generates
`pwa-64x64`, `pwa-192x192`, `pwa-512x512`, `maskable-icon-512x512`, `apple-touch-icon-180x180` and
`favicon.ico` into `public/brand/` using `@vite-pwa/assets-generator` (`pwa-assets.config.ts`). Change the
background colour in both files if you change the brand colour.

## Add a theme

Add the object below, plus a `treatment` id (see Photo blending).

Open `src/config/themes.ts` and add an object to the `themes` array:

```ts
{
  id: 'ruby-gold',            // unique, no spaces
  treatment: 'royal',         // photo blend: editorial, royal, elegant or modern
  label: 'Ruby & Gold',       // shown on the theme button
  background: '#1a0408',      // near-black base
  glow: '#e0143c',            // light bleeding in from the left and right edges
  panelFrom: '#f0b94a',       // panel gradient start (top left)
  panelTo: '#fff1b8',         // panel gradient end
  headline: '#fbeed8',        // HAPPY BIRTHDAY colour
  name: '#6b0b1f',            // name block colour (also tints the logo on light backdrops)
  date: '#3d0712',            // date block colour
  confetti: '#d9a441',        // confetti colour
}
```

That is all; it appears in the app immediately. Operators can also tweak colours with the pickers and save
their own named themes (kept in the browser's localStorage).

## Fonts

Operators pick the headline font and the name font in the **Fonts** section (8 choices each, shown with a
live sample). The choice is remembered. Fonts are self-hosted through `@fontsource` packages
(`src/fonts.ts`), so they are bundled, cached for offline use, and the export always waits for them to load
before rendering. Very tall fonts are automatically capped so the headline never runs into the photo.

**Add a font:** `npm i @fontsource/<name>`, import its latin css in `src/fonts.ts`, then add an entry to
`headlineFonts` and/or `nameFonts` in `src/config/fonts.ts` (`tall` is the vertical stretch multiplier:
about 1 for condensed faces, 0.9 for normal serifs, 0.8 for already-tall faces). The date and church name
fonts are fixed in the same file.

## PWA

- `registerType: "prompt"`: when a new version is deployed, an "Update available, tap to refresh" toast appears.
- The app shell, fonts and every JS chunk are precached. The model files in `public/bgdata/` are cached the
  first time a photo is processed (cache-first), so cut-outs work offline after the first run. A one-time
  "Preparing the photo tool. This only happens once." message shows during that first download.
- "Install app" appears on Android and desktop Chrome (via `beforeinstallprompt`). On iPhone it shows the
  Add to Home Screen steps instead, since iOS has no install prompt.
- "Offline ready" shows in the header once everything is cached.
- iOS meta tags and `viewport-fit=cover` with safe-area padding are set in `index.html` and the layout.

### Sharing and saving on phones

- **Share** uses the Web Share API with the PNG attached, so the team can send it straight to WhatsApp or
  Instagram. If file sharing is not supported it saves the file instead. Some browsers expire the tap during
  the render; in that case a "Your flyer is ready" sheet appears with a fresh **Share now** button.
- **Download PNG** is a normal download. In the installed iOS app, where downloads of generated files are not
  supported, it opens the share sheet (choose Save Image) or shows the image to press and hold.

## Deploy

HTTPS is required for the service worker, install prompt and Web Share. Both hosts below give you HTTPS.

**Vercel:** import the repo, framework preset "Vite", build command `npm run build`, output directory `dist`.
**Netlify:** build command `npm run build`, publish directory `dist`.

The build downloads the model files on the host (needs internet during build, which both providers have).
They add about 100 MB to the deployed site. If you would rather not host them, delete `public/bgdata/` and
the `prebuild` script entry; the app then uses the public CDN and the service worker caches those files
instead.

## Testing the PWA locally

```bash
npm run build && npm run preview
```

Open http://localhost:4173, wait for "Offline ready", then stop the preview server and reload: the app still
loads. In Chrome DevTools, Application tab, the manifest and service worker show as valid. (Current
Lighthouse versions no longer include a separate PWA category; use the DevTools Application panel's
installability check instead.)

## Notes

- Export size: the PNG is 2160 x 2700 (2x the design size) and is usually 8 to 12 MB because of the film grain.
- Background removal runs in the browser and takes 10 to 40 seconds on a phone. If it fails, the original
  photo is used and a message explains what to do.
- Settings (name, theme, colours, saved themes, layout options) are remembered in localStorage; the photo is not.
