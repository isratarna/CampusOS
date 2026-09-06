# Changelog

Every change made to this project, newest first. One entry per change: what
was asked for, what was actually touched, and anything deliberately left alone.

Format: `## YYYY-MM-DD — short title`, then **Request / Changes / Left alone /
Verification**. Add new entries at the top.

---

## 2026-09-06 — Bind the dev server to IPv4 and restore three missing UI exports

**Area:** `frontend/vite.config.js`, `frontend/src/components/app/PageHeader.jsx`,
`frontend/src/components/app/StatCard.jsx`. No backend files were touched.

### Request

Two problems reported in sequence, both blocking local development:

1. `http://localhost:5173/` would not load in the browser.
2. Once it loaded, the app died at runtime with
   `SyntaxError: The requested module '/src/components/app/StatCard.jsx' does not
   provide an export named 'StatRow' (at Dashboard.jsx:18:20)`.

### Context

The two faults are unrelated to each other and neither is what it first looks
like. The dev server was never actually down — Vite was running and answering
requests, just not on the address the browser asked for. And the `StatRow` error
was one symptom of three: the pages had been written against a component API that
was never finished, so fixing only the name in the error message would have
surfaced the next missing export on the following render.

### Changes — the dev server would not load

- **Bound the dev server to IPv4.** Vite's default `server.host` is `"localhost"`,
  which on this machine resolved to the IPv6 loopback only: the listener was
  `[::1]:5173` with nothing on `127.0.0.1:5173`. Browsers that try `127.0.0.1`
  first therefore got "connection refused" from a server that was up and serving
  `200` over `[::1]`. Set `server.host` to `"127.0.0.1"` explicitly, with a
  comment recording why, so both `localhost` and `127.0.0.1` resolve.

### Changes — the missing exports

Three symbols were imported by six pages (`Dashboard`, `Courses`, `Faculty`,
`Rooms`, `Timetable`, `Notifications`) but defined nowhere:

- **`StatRow`** added to `StatCard.jsx` — the grid the metric tiles sit in.
  Defaults to `grid gap-4 sm:grid-cols-2 xl:grid-cols-4` and merges an incoming
  `className`, which is what the call sites already relied on when they pass
  `xl:grid-cols-3` or `xl:grid-cols-4` for rows holding a different tile count.
- **`ViewTabs`** added to `PageHeader.jsx` — the page sub-menu. It delegates to
  the existing `Segmented` control rather than reimplementing the tab strip.
- **`useView`** added to `PageHeader.jsx` — keyed by nav id rather than by a views
  array. It looks the destination's `views` up in `nav.js`, delegates the query
  parameter handling to the `useView` already living in `Segmented.jsx`, and
  returns `[view, setView, views]`, the third element being what pages decorate
  with `count` badges.

- **`PageHeader` taught to read the nav registry.** Found while fixing the above:
  every page calls it with `navId="…"` and `tabs={…}`, but it only accepted
  `eyebrow` / `title` / `description` / `menu`. Each of the six pages would have
  rendered a blank, untitled masthead. It now derives the eyebrow from the nav
  section, and the title and description from the destination's entry in
  `nav.js`, so the masthead cannot drift from the sidebar.

### Left alone

- The explicit `eyebrow`, `title`, `description` and `menu` props on `PageHeader`
  were kept as overrides rather than removed, so the registry is the default and
  not a constraint.
- The `useView` in `Segmented.jsx` was left as it is and reused. The new hook in
  `PageHeader.jsx` wraps it instead of duplicating the `?view=` logic.
- The `react-refresh/only-export-components` lint error on the rewritten
  `PageHeader.jsx` was left in place: `Segmented.jsx`, `CampusProvider.jsx` and
  `Toast.jsx` all already export hooks alongside components, so the new file
  follows the existing project convention rather than breaking from it.
- `backend/server.js:31` computes `process.env.PORT || 5000` and discards the
  result while line 32 passes `process.env.PORT` straight to `app.listen`. The
  fallback is therefore dead, and the server only binds 5000 because `.env` sets
  it. This was reported but not changed, as it was outside the reported faults.

### Verification

- `npx vite build` passes: 1908 modules transformed, no missing exports. This is
  the check that caught `ViewTabs` and `useView` — the browser only reports the
  first failing import per module, so the build, not the console, established
  that the fix was complete.
- All six pages return `200` from the dev server.
- `npx eslint` is clean on the changed files apart from the pre-existing
  fast-refresh convention noted above.
- Both loopback addresses confirmed serving `200` after the config change, and
  the listener confirmed as `127.0.0.1:5173`.
- Not verified: the pages were not opened in a browser, so this establishes that
  the modules resolve and compile, not that every view renders correctly.

---

## 2026-09-06 — Record the completed landing, UI, and documentation work

**Area:** repo-wide polish across the landing page, app shell, and project docs.

### Request

Capture the work completed so far in the project: landing-page teardown tuning,
removal of the caption overlay, the FacultyOS app UI rebuild, and the README /
changelog documentation pass.

### Changes

- Tuned the landing-page scrubbing sequence to feel smoother and more deliberate,
  including wider crossfades, delta-time-based easing, reduced unnecessary paint
  work, and slower, more controlled scroll pacing.
- Removed the caption overlay from the teardown video while keeping the rail,
  chips, hint text, and chapter logic in place for a clean visual result.
- Rebuilt the authenticated app UI around the FacultyOS design system with a new
  color/token layer, app shell, sidebar menu structure, shared domain utilities,
  and reusable component primitives.
- Reworked the project documentation to match the actual codebase: the README was
  aligned with the live folder structure, scripts, routes, models, and env vars,
  and this changelog was created to record the work as it lands.
- Kept the backend logic and existing API contracts intact while the changes were
  focused on frontend experience and project clarity.

### Left alone

- The backend route and model logic was intentionally not expanded during the UI
  rebuild.
- The rest of the landing page outside the Deconstruct section was not changed.
- Existing data contracts and API behavior were preserved unless presentation work
  required a frontend-only adaptation.

### Verification

- `npx eslint` and `npx vite build` were run for the frontend during the landing
  and app work, and the build output stayed clean.
- The documentation refresh was checked against the actual repository structure and
  scripts in the workspace.

---

## 2026-09-06 — Smooth out and re-pace the landing page teardown scrub

**Area:** landing page → "Deconstruct" section (`/`, the scroll-scrubbed frame
sequence). Only `frontend/src/components/landing/Deconstruct.jsx` was touched.

### Request

Three passes, in order:

1. Make the video on the landing page smoother.
2. Make the scroll faster, and make the scroll→animation timing eased rather
   than linear — scoped to the video part of the landing page only.
3. Pass 2 overshot: it became too fast and felt laggy. Fix both.

### Context

The "video" is not a video. It is 29 PNG stills (`public/sequence/02–30.png`,
1280×720, ~22 MB total) composited onto a canvas, with scroll position through a
pinned section driving which frame is drawn. So "smoothness" is three separate
questions — how the stills are blended, how scroll maps onto frame position, and
how much work the paint loop does per frame — and each pass below hits a
different one.

### Changes — pass 1, smoothness

- **Crossfade widened.** The blend between consecutive stills only ran across
  the middle third of each frame interval (`0.34 → 0.66`), so each still sat
  frozen for two-thirds of its interval, snapped, then sat again. With 29 frames
  over 540svh that was the dominant source of the stepping. Now blends across
  `0.08 → 0.92` using smootherstep instead of smoothstep — the wide window
  removes the hold, and the flatter-at-the-ends / steeper-in-the-middle curve
  keeps the double-exposure the narrow window was avoiding down to a brief pass.
- **Easing made framerate-independent.** `lerp(current, target, 0.17)` ran once
  per rAF, so a 120 Hz display settled twice as fast as a 60 Hz one and any
  dropped frame produced a visible jump. The rate is now derived from real delta
  time — `1 - (1 - k)^(dt/16.667)`, `dt` capped at 64 ms.
- **Loop parked when off screen.** Two scaled 1280×720 draws per frame ran
  whether or not the section was visible, which is jank paid by the rest of the
  page. An `IntersectionObserver` (20% margin) now starts/stops the rAF loop and
  resets the frame clock on re-entry so `dt` does not spike.
- **CSS custom-property writes de-duplicated.** `--bg-a`, `--bg-b`, `--glow` and
  `--veil` were written every tick, each invalidating style for the whole pinned
  subtree. Neighbouring frames share edge colours for most of the sequence, so
  the writes now go through a small cache and are skipped when unchanged.
- **Draw effect no longer rebuilt during preload.** `loaded` was in the effect's
  dependency array, so every one of the 29 images finishing tore down and
  recreated the loop, listeners and observers — at the most jank-sensitive
  moment on the page. `paint` reads `images.current` live, so the dependency was
  never needed.

### Changes — pass 2, pacing (values superseded by pass 3)

- Section height `540svh → 400svh` (`420 → 330` under 720px).
- Scroll progress ran through a new `easeScrub` — easeOutCubic blended with
  linear via `EASE_MIX`, then set to `0.5`.
- **The easing is applied once, at the source**, so the rail, the chips and the
  frame counter all key off the same eased progress the frames do. Easing only
  the frame mapping would have left the `CHAPTERS` / `CHIPS` thresholds
  (`at: 0.17`, `0.4`, …) firing at different frames than they were tuned
  against. This part survives pass 3 unchanged.

### Changes — pass 3, correcting the overshoot

*Too fast* — two dials had been turned at once:

- `SCRUB_VH` `400 → 480`, `SCRUB_VH_NARROW` `330 → 400`. Still shorter than the
  original 540, no longer a sprint.
- `EASE_MIX` `0.5 → 0.22`. This was the bigger culprit: at 0.5 the curve opened
  at ~1.75× the average frame rate, and on top of a 26%-shorter section the
  opening ran away from the viewer. At 0.22 it opens ~1.3× and settles ~0.78× —
  legibly non-linear, and the tail still moves.

*Laggy* — mostly cost introduced by pass 1, plus one long-standing one:

- **Removed `imageSmoothingQuality = "high"`** (added in pass 1). A materially
  slower resample, running on two images every frame, buying nothing at these
  scales.
- **Canvas backing store capped at ~1.15× the source resolution.** The real fix.
  The frames are 1280×720 but the canvas was `dpr`-2, so every draw upscaled
  them 3–4× past their own resolution — 4× the fill rate for detail that does
  not exist in the PNG. On a large retina display this alone cuts per-frame
  pixel work by roughly 4×. `FRAME_W` / `FRAME_H` constants were added for the
  cap; drawing still reads each image's own dimensions, so a re-export at a
  different resolution degrades to a loose cap rather than a wrong picture.
- **Repaint gate back to 1/100 of a frame** (pass 1 had tightened it to 1/200) —
  half the composites. The alpha step at 1/100 is ~0.02, below the visible
  threshold.
- **Destination rect cached per resize** instead of `fit()` running twice per
  painted frame; every frame in the sequence is the same size, so it only
  changes on resize.
- **Tracking tightened**, `k` `0.17 → 0.24`. Some of the "laggy" feel was the
  render trailing the pointer rather than dropped frames — the eased mapping
  moves the target further per unit of scroll, so the same smoothing constant
  read as more drag.

### Left alone

- **The rest of the landing page.** `pages/Landing.jsx`,
  `components/landing/hooks.js`, `components/landing/primitives.jsx` and
  `styles/landing.css` are untouched — pass 2 was explicitly scoped to the video
  section, and passes 1 and 3 had no reason to leave it.
- **The frame assets.** Still 29 stills at 1280×720. This is the real ceiling:
  the blending now hides the steps well, but genuinely film-like motion needs a
  re-export at 60+ frames, or an actual `.mp4` / `.webm` scrubbed via
  `currentTime`. 22 MB of PNGs is already most of the page's weight.
- **`prefers-reduced-motion`** still snaps straight to the target frame with no
  smoothing, as before.

### Verification

`npx eslint` clean and `npx vite build` clean in `frontend/` after each pass.
(The "chunks larger than 500 kB" warning is pre-existing and unrelated.)

Not verified by running the page — the pacing numbers in pass 3 are a considered
retune, not a measured one, and `EASE_MIX` / `SCRUB_VH` at the top of the file
are the two dials to turn if the feel is still off.

---

## 2026-09-06 — Rebuild the application UI on the FacultyOS design system

**Area:** the authenticated app (`/dashboard`, `/courses`, `/faculty`, `/rooms`,
`/timetables`, `/notifications`) — everything behind the landing page.

> **Status: in progress.** The design-system foundation and the app shell are
> written; the six page rewrites are still landing. This entry is being updated
> as the work completes rather than split across several entries.

### Request

Use the reference sheets in `frontend/ref/dash/` (`image.png`, `background.png`)
as the design direction for the project UI. Keep the name **FacultyOS**. No
generic emoji or icon glyphs — use a real icon library (`lucide-react`). Use
micro-transitions, stay consistent with the rest of the project, keep the design
minimalistic and user-friendly, and split the components across multiple menus
for better navigation.

### Context

`ref/dash/image.png` is a full design sheet: brand palette, an Inter type scale,
a 4/8/16/24/32/48 spacing system, shadcn-style component specs, a sidebar icon
rail, stat cards, meters, a table, and a warm paper background with Bauhaus
blocks, halftone patches and printer's crop marks.

The app pages were on a dark slate/cyan glassmorphism theme that matched neither
that sheet nor the existing landing page, which already ships a FacultyOS system
in `frontend/src/styles/landing.css` (ink `#0E1013`, bone `#F6F4EF`, amber
`#F5B42B`, blue `#2563EB`). The new app tokens are reconciled against **both**,
so the landing page and the app now read as one product.

### Changes

**`frontend/src/index.css`** — replaced the stock shadcn neutral theme with the
FacultyOS token layer.

- `@theme` now declares the real palette: ink / bone / paper / mut / line
  neutrals, and amber, blue, red, violet, green, cyan accents each with a `-soft`
  companion for tinted fills.
- Radii dropped to a print-like `2–8px` scale (the old `0.625rem` default was far
  rounder than the reference).
- Added shared easing curves (`--ease-out-quint`, `--ease-in-out-quint`,
  `--ease-spring`) and a three-step shadow scale, so every component animates and
  elevates off the same values.
- Kept the shadcn semantic bridge (`--color-primary`, `--color-border`, …) but
  repointed it at the FacultyOS palette, so the existing `components/ui/*`
  primitives inherit the new look without being rewritten.
- Body now sets Inter, the landing page's `font-feature-settings`, and a global
  blue focus ring.

**`frontend/src/styles/app.css`** *(new)* — the app's texture and motion layer,
written as plain CSS so it does not depend on Tailwind's layer ordering.

- `.co-paper` / `.co-grain`: the warm ground plus an SVG `feTurbulence` grain,
  generated rather than shipped as a bitmap.
- `.co-halftone`, `.co-rule`, `.co-leader`: the dot screen, hairline rules and
  the dotted leader that runs between a label and its value.
- `.co-eyebrow`, `.co-index`, `.co-num`: the tracked-uppercase label, the
  monospace section number, and tabular figures for every metric.
- One motion vocabulary — `co-rise`, `co-fade`, `co-slide-left`, `co-pop`,
  `co-sweep`, `co-ping`, `co-spin` — plus `.co-stagger`, which gives a list or
  grid a 40 ms-per-child entrance without any JS.
- `.co-press` and `.co-lift`: the single press curve and the single hover-lift
  shared by every interactive surface, which is what keeps the micro-transitions
  consistent across pages.
- `.co-skeleton` shimmer, `.co-scroll` scrollbars, and a
  `prefers-reduced-motion` block that neutralises all of the above.

**`frontend/src/lib/api.js`** *(new)* — one axios instance on
`VITE_API_URL || http://localhost:5000/api`, replacing the hard-coded
`http://localhost:5000/...` string repeated at ~20 call sites. `apiError()`
turns an axios failure into a message worth showing a user.

**`frontend/src/lib/domain.js`** *(new)* — the shared vocabulary the pages kept
redefining: `DAYS` / `DAY_KEYS` / `TIME_SLOTS`, the option lists for course type,
room type, timetable status and notification type, and the `ACCENTS` map that
resolves one accent key to matching classes for a chip, a tag, a bar and a dot.
Plus the formatters (`relativeTime`, `formatDate`, `initials`, `titleCase`,
`slotMinutes`, `pct`, `pluralise`).

**`frontend/src/components/app/primitives.jsx`** *(new)* — the editorial kit
every page composes from: `Eyebrow`, `SectionLabel`, `Panel`, `PanelHead`,
`IconChip`, `StatusTag`, `Meter`, `SegmentBar`, `EmptyState`, `Skeleton`,
`Spinner`, `ErrorNote`, `DetailRow`, `CropMarks`.

**`frontend/src/components/app/nav.js`** *(new)* — the navigation model, and the
answer to the "split into multiple menus" part of the request. Five sections —
**Overview**, **Academics**, **Campus**, **Scheduling**, **Signals** — each
holding destinations that carry their own sub-menu `views`. Those views double as
deep links (`?view=<id>`), so a sub-menu is addressable from the sidebar, the
breadcrumb and the URL.

**`frontend/src/components/app/Sidebar.jsx`** *(new)* — the rail from the
reference sheet. Collapsed (76px) it is stacked glyph-over-caption blocks on ink
with the active one filled amber; expanded (244px) it becomes a full menu showing
section headings and the sub-menu of whichever destination you are inside. The
expanded/collapsed choice persists in `localStorage`, and the whole thing slides
over a scrim on mobile.

**`frontend/src/components/app/Decor.jsx`** *(new)* — the page furniture from
`background.png`: Bauhaus blocks, halftone patches, crop lines and a
registration mark. Deliberately quiet — shapes sit at the extreme edges, mostly
cropped off-canvas, at 6–16% opacity, with opaque paper panels on top.

### Left alone

- **The landing page.** `pages/Landing.jsx`, `components/landing/*` and
  `styles/landing.css` are untouched; the app tokens were matched to them rather
  than the other way round.
- **The backend.** No route, model or generator changes — this is a presentation
  layer rebuild against the existing API surface.
- **`components/ui/*`.** The shadcn primitives inherit the new palette through
  the semantic bridge instead of being rewritten.

### Verification

Pending — a `vite build` and a run-through of every route will be recorded here
once the page rewrites land.

---
## 2026-09-06 — Remove the caption text overlaying the teardown video

**Area:** landing page → "Deconstruct" section (`/`, the scroll-scrubbed frame
sequence)

### Request

Remove the text that displays over the video on the landing page — the block
reading `LAYER 01` / *"This is what a student sees."* / *"One calm screen…"*
that sat on top of the scrubbing render.

### Changes

**`frontend/src/components/landing/Deconstruct.jsx`**

- Removed the `.lp-dx-mid` caption stack. It mapped over `CHAPTERS` and rendered,
  for each of the five layers, a `.lp-dx-cap` card with the eyebrow (`c.n`), the
  heading (`c.title`) and the body copy (`c.body`).
- Kept an empty `<div className="lp-dx-mid" aria-hidden="true" />` as a spacer.
  `.lp-dx-ui` is a grid with `grid-template-rows: auto 1fr auto` (top bar /
  captions / bottom hint); deleting the middle child outright would have pulled
  the bottom hint up into the `1fr` row.
- Dropped the `--scrim-rgb` custom property from the paint loop, along with the
  `top` / `bot` edge-colour arrays that fed only that calculation. The
  `--bg-a` / `--bg-b` backdrop interpolation is untouched.

**`frontend/src/styles/landing.css`**

- Deleted `.lp-dx-pin::after` — a radial-gradient haze anchored at `27% 52%`
  whose only job was to lighten the render behind the caption so the text stayed
  readable. With the text gone it just washed out the left side of the video.
- Deleted the now-dead `.lp-dx-cap` rules (`.lp-dx-cap`, `.lp-dx-cap.on`,
  `.lp-dx-cap .n`, `.lp-dx-cap h3`, `.lp-dx-cap p`).
- Kept `.lp-dx-mid` and its responsive overrides; updated its comment to describe
  its new job as a spacer rather than an indented caption stack.

### Left alone

- The left progress rail (`.lp-dx-rail`, Surface → Intelligence).
- The right layer chips (`.lp-dx-chips`).
- The "Live teardown" tag and frame counter (`.lp-dx-top`).
- The "Keep scrolling · deconstructing" hint (`.lp-dx-bot`).
- The `CHAPTERS` array — `rail` and `at` still drive the rail and chapter state.
  The now-unused `title`, `body` and `n` fields were left in place so the copy is
  easy to restore.

### Verification

`npx vite build` in `frontend/` — built clean in ~6s. (The "chunks larger than
500 kB" warning is pre-existing and unrelated.)

---

## 2026-09-06 — Project documentation

**Area:** repo root

### Changes

- Rewrote `README.md` against the actual codebase: real folder layout, real
  scripts, the six Express routers and their endpoints, the five Mongoose
  models, the real environment variables (`MONGO_URI`, `PORT`,
  `GOOGLE_API_KEY`, `VITE_API_URL`) and the Gemini integration points.
  The previous README described a structure that did not exist (a `controllers/`
  folder, a top-level `ai/` folder) and ended with a leftover chatbot prompt.
- Added this `CHANGELOG.md` and removed the one-off
  `CHANGES-deconstruct-captions.md`, folding its content into the entry above.
