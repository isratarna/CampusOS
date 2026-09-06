import { useEffect, useMemo, useRef, useState } from "react"
import {
  clamp,
  lerp,
  useImageSequence,
  useMedia,
  useReducedMotion,
  useScrollDirection,
  useSectionProgress,
} from "./hooks"

/* ============================================================
   Frame 01 in ref/vid is fully transparent (avg alpha 0), so the
   scrub runs 02 -> 30. 29 frames.
   ============================================================ */
const FRAME_NUMBERS = Array.from({ length: 29 }, (_, i) => i + 2)
const FRAMES = FRAME_NUMBERS.map((n) => `/sequence/${String(n).padStart(2, "0")}.png`)

/* Native size of every PNG in the sequence. Only used to size the canvas
   backing store sensibly - drawing still reads each image's own dimensions,
   so a re-export at a different resolution degrades to a slightly loose
   cap rather than a wrong picture. */
const FRAME_W = 1280
const FRAME_H = 720

/* Top / bottom edge colour of every frame, median-sampled from the
   PNGs themselves. The pinned backdrop is interpolated between these
   so the canvas never shows a visible box - the studio sweep in the
   render becomes the page background. */
const FRAME_EDGES = [
  ["#fefefc", "#faf9f5"], // 02
  ["#fefefc", "#faf9f5"], // 03
  ["#fefefc", "#faf9f5"], // 04
  ["#fefefc", "#faf8f4"], // 05
  ["#fefdfb", "#f9f7f3"], // 06
  ["#fbf9f7", "#8a8a86"], // 07  (camera pulls back through the edge)
  ["#b3b3b3", "#d5d2d1"], // 08
  ["#b3b3b3", "#e3e2df"], // 09
  ["#b2b2b2", "#e1e0de"], // 10
  ["#b2b2b2", "#e0e0de"], // 11
  ["#b1b1b1", "#dcdcda"], // 12
  ["#b1b1b1", "#dadad8"], // 13
  ["#b1b1b1", "#dadad8"], // 14
  ["#b1b1b1", "#dadad8"], // 15
  ["#b1b1b1", "#dcdcda"], // 16
  ["#b1b1b1", "#dddddb"], // 17
  ["#b1b1b1", "#dddddb"], // 18
  ["#b1b1b1", "#dcdcda"], // 19
  ["#b1b1b1", "#dbdbd9"], // 20
  ["#b1b1b1", "#dadad8"], // 21
  ["#b1b1b1", "#dadad8"], // 22
  ["#b1b1b1", "#dadad8"], // 23
  ["#b1b1b1", "#d9d9d6"], // 24
  ["#b1b1b1", "#d9d9d6"], // 25
  ["#b1b1b1", "#d8d8d5"], // 26
  ["#b1b1b1", "#d8d8d5"], // 27
  ["#b1b1b1", "#d8d8d5"], // 28
  ["#b1b1b1", "#d9d8d5"], // 29
  ["#b1b1b1", "#d8d8d5"], // 30
]

/* ============================================================
   Scrub feel. Shorter than a full linear scrub so the teardown
   doesn't outstay its welcome, and the mapping from scroll to
   frame is eased rather than linear: the render leads slightly
   on entry, then decelerates into the last layer.

   EASE_MIX blends linear (0) with easeOutCubic (1). Keep it low.
   The curve is a garnish on the pacing, not the pacing itself -
   at 0.5 the opening ran away from the first caption before it
   could be read. At 0.22 the section opens ~1.3x the average
   frame rate and settles at ~0.78x: legibly non-linear, never
   startling, and the tail still moves.
   ============================================================ */
const SCRUB_VH = 480
const SCRUB_VH_NARROW = 400
const EASE_MIX = 0.22
const easeScrub = (p) => {
  const inv = 1 - p
  return lerp(p, 1 - inv * inv * inv, EASE_MIX)
}

export const DECONSTRUCT_EXIT_COLOR = "#d8d8d5"

const hexToRgb = (h) => [
  parseInt(h.slice(1, 3), 16),
  parseInt(h.slice(3, 5), 16),
  parseInt(h.slice(5, 7), 16),
]
const RGB_EDGES = FRAME_EDGES.map(([a, b]) => [hexToRgb(a), hexToRgb(b)])
const mixRgb = (a, b, t) =>
  `rgb(${Math.round(lerp(a[0], b[0], t))}, ${Math.round(lerp(a[1], b[1], t))}, ${Math.round(
    lerp(a[2], b[2], t)
  )})`

/* ---------- narrative beats keyed to scrub progress ---------- */
const CHAPTERS = [
  {
    id: "surface",
    rail: "Surface",
    n: "Layer 01",
    title: "This is what a student sees.",
    body: "One calm screen. Classes today, work due this week, the courses they are enrolled in. Everything above the fold, nothing to hunt for.",
    at: 0,
  },
  {
    id: "split",
    rail: "Split",
    n: "Layer 02",
    title: "Now pull it apart.",
    body: "The chrome lifts away first. What looks like a single page is a stack of independent surfaces, each one rendering from its own source of truth.",
    at: 0.17,
  },
  {
    id: "planes",
    rail: "Planes",
    n: "Layer 03",
    title: "Every plane is a live service.",
    body: "Courses, faculty, rooms and timetables are separate collections in MongoDB. The dashboard is only the place where they happen to meet.",
    at: 0.4,
  },
  {
    id: "modules",
    rail: "Modules",
    n: "Layer 04",
    title: "The modules keep running.",
    body: "Detached from the layout, each card is still bound to real data. Move a class and the count, the roster and the room availability all move with it.",
    at: 0.62,
  },
  {
    id: "intel",
    rail: "Intelligence",
    n: "Layer 05",
    title: "Gemini threads it back together.",
    body: "The assistant reads every layer at once, finds the clashes a human scheduler misses, and proposes a timetable that actually fits.",
    at: 0.82,
  },
]

const CHIPS = [
  { label: "Courses", meta: "11 active", k: "#2563eb", at: 0.28 },
  { label: "Faculty", meta: "load balanced", k: "#16a34a", at: 0.4 },
  { label: "Rooms", meta: "utilisation", k: "#7c4dff", at: 0.5 },
  { label: "Timetable", meta: "draft → published", k: "#f5b42b", at: 0.6 },
  { label: "Conflicts", meta: "0 unresolved", k: "#e8503a", at: 0.72 },
  { label: "AI Assistant", meta: "gemini-2.5-flash", k: "#4dd9ff", at: 0.85 },
]

export default function Deconstruct() {
  const sectionRef = useRef(null)
  const pinRef = useRef(null)
  const canvasRef = useRef(null)
  const uiRef = useRef(null)

  const urls = useMemo(() => FRAMES, [])
  const { images, loaded, total, ready } = useImageSequence(urls)

  const reduced = useReducedMotion()
  const isNarrow = useMedia("(max-width: 720px)")
  const dir = useScrollDirection()

  // progress mirrored into React only for the overlay copy; the canvas
  // itself is driven imperatively so it never waits on a re-render
  const [chapter, setChapter] = useState(0)
  const [display, setDisplay] = useState({ frame: 1, p: 0 })

  const targetRef = useRef(0) // 0..last, fractional
  const currentRef = useRef(0)
  const rawRef = useRef(0)

  /* ---------- scroll -> target frame ---------- */
  // Ease here, once, so the chapter copy, the chips and the counter all key
  // off the same eased progress the frames do. Easing only the frames would
  // drift the captions out of sync with the render they describe.
  useSectionProgress(sectionRef, (p) => {
    const eased = easeScrub(p)
    rawRef.current = eased
    targetRef.current = eased * (urls.length - 1)
  })

  /* ---------- draw loop ---------- */
  useEffect(() => {
    const canvas = canvasRef.current
    const pin = pinRef.current
    const section = sectionRef.current
    if (!canvas || !pin || !section) return

    const ctx = canvas.getContext("2d", { alpha: true })
    let raf = 0
    let lastT = 0
    let vw = 0
    let vh = 0
    let dpr = 1
    let lastDrawn = -1
    let lastChapter = -1
    let lastFrameLabel = -1

    const resize = () => {
      const r = pin.getBoundingClientRect()
      vw = Math.max(1, Math.round(r.width))
      vh = Math.max(1, Math.round(r.height))

      // The source frames are 1280x720. On a wide or retina display a dpr-2
      // backing store means every draw upscales them 3-4x past their own
      // resolution - 4x the fill rate for detail that does not exist in the
      // PNG. Cap the backing store at ~1.15x native instead: same picture,
      // a fraction of the per-frame cost, and two of these are composited
      // every single frame of the scrub.
      const drawnW = FRAME_W * Math.min(vw / FRAME_W, vh / FRAME_H)
      const maxDpr = Math.max(1, (FRAME_W * 1.15) / Math.max(1, drawnW))
      dpr = Math.min(window.devicePixelRatio || 1, 2, maxDpr)
      canvas.width = Math.round(vw * dpr)
      canvas.height = Math.round(vh * dpr)
      canvas.style.width = `${vw}px`
      canvas.style.height = `${vh}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      // Default smoothing on purpose. "high" is a materially slower resample
      // and it ran twice per frame; at these scales it bought nothing.
      rect = null
      lastDrawn = -1
    }

    /* The scale is always uniform, so the 16:9 render is never stretched.
       Width is always filled - an empty margin down the side of the stage is
       what reads as broken, and on any window wider than 16:9 filling it also
       covers the height, so the frame edge-to-edge fills the screen.

       On a viewport TALLER than the frame, covering the height would mean
       throwing away the sides, where the sidebar and the third stat column
       live. So we only take the full cover while it costs a modest extra
       zoom (<=18%); past that we hold at fill-width and let the matched
       backdrop take the top and bottom, which is where the overlay UI sits
       anyway. In practice: desktop and laptop windows fill completely, a
       portrait phone keeps every column of the dashboard. */
    // Every frame in the sequence is the same size, so the destination rect
    // only changes on resize. Cached lazily because the first paint can land
    // before any image has decoded.
    let rect = null

    const fit = (img) => {
      const fillW = vw / img.naturalWidth
      const fillH = vh / img.naturalHeight
      const s = fillH <= fillW * 1.18 ? Math.max(fillW, fillH) : fillW
      const w = img.naturalWidth * s
      const h = img.naturalHeight * s
      // when the frame overflows we centre the crop; when it letterboxes we
      // nudge it off dead-centre so it sits in the optical middle between the
      // top tag row and the bottom scroll hint
      const slack = vh - h
      const y = slack > h * 0.5 ? (slack / 2) * 0.86 : slack / 2
      return [Math.round((vw - w) / 2), Math.round(y), Math.round(w), Math.round(h)]
    }

    // Writing a custom property invalidates style for the whole pinned
    // subtree, so skip the write when the rounded colour is unchanged -
    // neighbouring frames share edge colours for most of the sequence.
    const varCache = new Map()
    const setVar = (name, value) => {
      if (varCache.get(name) === value) return
      varCache.set(name, value)
      pin.style.setProperty(name, value)
    }

    const paint = (pos) => {
      const list = images.current
      const last = urls.length - 1
      const i = Math.floor(pos)
      // Blend across nearly the whole frame interval so no still ever sits
      // frozen mid-scroll. Smootherstep keeps the curve pinned near 0 / 1
      // at the ends and crosses the ghosty middle fast, so we get
      // continuous motion without the double exposure a linear fade gives.
      const raw = pos - i
      const t = clamp((raw - 0.08) / 0.84)
      const f = t * t * t * (t * (t * 6 - 15) + 10)
      const a = list[clamp(i, 0, last)]
      const b = list[clamp(i + 1, 0, last)]

      ctx.clearRect(0, 0, vw, vh)

      if (a) {
        if (!rect) rect = fit(a)
        const [x, y, w, h] = rect
        ctx.globalAlpha = 1
        ctx.drawImage(a, x, y, w, h)
        // Pin the backdrop gradient to the drawn band and hold the end
        // colours outside it. On a tall phone the render letterboxes, and
        // without this the page gradient runs at a different rate than the
        // one baked into the frame - which shows up as a seam at the edge.
        setVar("--band-a", `${clamp((y / vh) * 100, 0, 100).toFixed(2)}%`)
        setVar("--band-b", `${clamp(((y + h) / vh) * 100, 0, 100).toFixed(2)}%`)
      }
      // cross-fade the next frame in. 29 stills would otherwise step;
      // this makes the scrub read as continuous motion.
      if (b && b !== a && f > 0.001) {
        if (!rect) rect = fit(b)
        const [x, y, w, h] = rect
        ctx.globalAlpha = f
        ctx.drawImage(b, x, y, w, h)
        ctx.globalAlpha = 1
      }

      // backdrop interpolated from the frames' own edge colours
      const ea = RGB_EDGES[clamp(i, 0, last)]
      const eb = RGB_EDGES[clamp(i + 1, 0, last)]
      setVar("--bg-a", mixRgb(ea[0], eb[0], raw))
      setVar("--bg-b", mixRgb(ea[1], eb[1], raw))
    }

    const tick = (now) => {
      const dt = Math.min(now - lastT, 64) || 16.7
      lastT = now

      const target = targetRef.current
      // Ease toward the scroll target so flicks feel weighted. The rate is
      // resolved per millisecond rather than per frame, so a 120Hz display
      // and a 60Hz one settle over the same wall-clock time and a dropped
      // frame catches up instead of snapping.
      const k = reduced ? 1 : 1 - Math.pow(1 - 0.24, dt / 16.667)
      currentRef.current = lerp(currentRef.current, target, k)
      if (Math.abs(currentRef.current - target) < 0.0015) currentRef.current = target

      const pos = currentRef.current
      // 1/100 of a frame is an alpha step of ~0.02 in the fastest part of the
      // crossfade - below the visible threshold, and half the composites of
      // the 1/200 gate this used to run.
      const rounded = Math.round(pos * 100) / 100

      if (rounded !== lastDrawn) {
        lastDrawn = rounded
        paint(pos)

        const p = rawRef.current
        // amber bloom rises as the AI connections light up
        setVar("--glow", (Math.max(0, p - 0.5) * 0.34).toFixed(3))
        setVar("--veil", (1 - clamp(p / 0.12)).toFixed(3))

        const frameLabel = Math.round(pos) + 1
        let ch = 0
        for (let n = 0; n < CHAPTERS.length; n++) if (p >= CHAPTERS[n].at) ch = n

        if (ch !== lastChapter || frameLabel !== lastFrameLabel) {
          lastChapter = ch
          lastFrameLabel = frameLabel
          setChapter(ch)
          setDisplay({ frame: frameLabel, p })
        }
      }
      raf = requestAnimationFrame(tick)
    }

    resize()
    window.addEventListener("resize", resize)
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(resize) : null
    ro?.observe(pin)

    // Park the loop while the teardown is off screen. Two 1280x720 draws a
    // frame is real work, and burning it behind the fold is what makes the
    // rest of the page stutter on the way down to this section.
    const start = () => {
      if (raf) return
      lastT = performance.now()
      raf = requestAnimationFrame(tick)
    }
    const stop = () => {
      if (!raf) return
      cancelAnimationFrame(raf)
      raf = 0
    }

    const io =
      typeof IntersectionObserver !== "undefined"
        ? new IntersectionObserver(([e]) => (e.isIntersecting ? start() : stop()), {
            rootMargin: "20% 0px",
          })
        : null
    if (io) io.observe(section)
    else start()

    return () => {
      stop()
      window.removeEventListener("resize", resize)
      ro?.disconnect()
      io?.disconnect()
    }
    // `loaded` is deliberately not a dep: paint reads images.current live, so
    // rebuilding this loop 29 times while the sequence preloads only costs
    // teardown churn during the most jank-sensitive moment on the page.
  }, [images, urls.length, reduced])

  const p = display.p
  const scrubVh = isNarrow ? SCRUB_VH_NARROW : SCRUB_VH
  const pct = Math.round(p * 100)

  return (
    <section
      id="deconstruct"
      className="lp-dx"
      ref={sectionRef}
      style={{ height: `${scrubVh}svh` }}
      aria-label="Interactive teardown of the CampusOS dashboard"
    >
      <div className="lp-dx-pin" ref={pinRef}>
        <canvas className="lp-dx-canvas" ref={canvasRef} aria-hidden="true" />
        <div className="lp-dx-veil" aria-hidden="true" />

        {/* left progress rail */}
        <div className="lp-dx-rail" aria-hidden="true">
          {CHAPTERS.map((c, i) => (
            <div key={c.id} className={`step${i === chapter ? " on" : ""}`}>
              <i />
              <span>{c.rail}</span>
            </div>
          ))}
        </div>

        {/* right layer chips */}
        <div className="lp-dx-chips" aria-hidden="true">
          {CHIPS.map((c) => (
            <div
              key={c.label}
              className={`lp-dx-chip${p >= c.at ? " on" : ""}`}
              style={{ "--k": c.k }}
            >
              <b />
              {c.label}
              <em>{c.meta}</em>
            </div>
          ))}
        </div>

        <div className="lp-dx-ui" ref={uiRef}>
          <div className="lp-dx-top">
            <span className="lp-dx-tag">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                <path d="M12 2 2 7l10 5 10-5-10-5Z" />
                <path d="m2 17 10 5 10-5M2 12l10 5 10-5" />
              </svg>
              Live teardown
            </span>
            <span className="lp-dx-counter lp-mono">
              <b>{String(display.frame).padStart(2, "0")}</b>
              <span>/ {total}</span>
            </span>
          </div>

          {/* caption stack removed - the render speaks for itself; this
              spacer keeps the top / bottom grid rows in place */}
          <div className="lp-dx-mid" aria-hidden="true" />

          <div className="lp-dx-bot">
            <span className={`lp-dx-hint${dir === "up" ? " up" : ""}${p > 0.92 ? " hide" : ""}`}>
              <span className="ar">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6">
                  <path d="M12 5v14M19 12l-7 7-7-7" />
                </svg>
              </span>
              {dir === "up" ? "Scrolling up · rebuilding" : "Keep scrolling · deconstructing"}
              <span className="lp-mono" style={{ opacity: 0.55 }}>{pct}%</span>
            </span>
          </div>
        </div>

        {!ready && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "grid",
              placeContent: "center",
              gap: 14,
              justifyItems: "center",
              zIndex: 5,
              background: "rgba(246,244,239,.55)",
              backdropFilter: "blur(3px)",
              pointerEvents: "none",
            }}
          >
            <span className="lp-eyebrow">
              <span className="dot" />
              Loading teardown
            </span>
            <div style={{ width: 180, height: 2, background: "rgba(14,16,19,.12)", borderRadius: 2 }}>
              <div
                style={{
                  width: `${(loaded / total) * 100}%`,
                  height: "100%",
                  background: "#0e1013",
                  borderRadius: 2,
                  transition: "width .3s cubic-bezier(.22,1,.36,1)",
                }}
              />
            </div>
            <span className="lp-mono" style={{ fontSize: 11, color: "#9aa0a8" }}>
              {loaded} / {total} frames
            </span>
          </div>
        )}
      </div>
    </section>
  )
}
