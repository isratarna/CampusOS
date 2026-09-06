import { useEffect, useRef, useState, useCallback } from "react"

/* ============================================================
   A single shared rAF loop. Every scroll-driven effect on the
   page subscribes here instead of adding its own listener, so
   we do one layout read per frame no matter how many effects
   are live.
   ============================================================ */

const subs = new Set()
let running = false
let rafId = 0

const frame = () => {
  const y = window.scrollY || window.pageYOffset
  const vh = window.innerHeight
  for (const fn of subs) {
    try {
      fn(y, vh)
    } catch {
      /* keep the loop alive if one subscriber throws */
    }
  }
  rafId = requestAnimationFrame(frame)
}

const subscribe = (fn) => {
  subs.add(fn)
  if (!running) {
    running = true
    rafId = requestAnimationFrame(frame)
  }
  return () => {
    subs.delete(fn)
    if (subs.size === 0 && running) {
      running = false
      cancelAnimationFrame(rafId)
    }
  }
}

/* ---------- small math helpers ---------- */
export const clamp = (v, a = 0, b = 1) => (v < a ? a : v > b ? b : v)
export const lerp = (a, b, t) => a + (b - a) * t
export const mapRange = (v, inA, inB, outA, outB) =>
  outA + ((clamp(v, Math.min(inA, inB), Math.max(inA, inB)) - inA) / (inB - inA || 1)) * (outB - outA)
export const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3)

/* ---------- reduced motion ---------- */
export function useReducedMotion() {
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    const on = () => setReduced(mq.matches)
    on()
    mq.addEventListener("change", on)
    return () => mq.removeEventListener("change", on)
  }, [])
  return reduced
}

/* ---------- media query ---------- */
export function useMedia(query) {
  const [hit, setHit] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia(query)
    const on = () => setHit(mq.matches)
    on()
    mq.addEventListener("change", on)
    return () => mq.removeEventListener("change", on)
  }, [query])
  return hit
}

/* ============================================================
   useReveal — animate-on-scroll. Adds `.in` once the element
   crosses the threshold. `once: false` re-plays on exit.
   ============================================================ */
export function useReveal({ threshold = 0.18, once = true, rootMargin = "0px 0px -8% 0px" } = {}) {
  const ref = useRef(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (typeof IntersectionObserver === "undefined") {
      setInView(true)
      return
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true)
          if (once) io.unobserve(el)
        } else if (!once) {
          setInView(false)
        }
      },
      { threshold, rootMargin }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [threshold, once, rootMargin])

  return [ref, inView]
}

/* ============================================================
   useSectionProgress — 0 at the moment the element's top hits
   the top of the viewport, 1 when its bottom reaches the
   bottom. This is what drives the pinned scrub sections, so it
   reads backwards on scroll-up for free.
   ============================================================ */
export function useSectionProgress(ref, onProgress) {
  const cb = useRef(onProgress)
  cb.current = onProgress

  useEffect(() => {
    const el = ref.current
    if (!el) return
    let last = -1

    // getBoundingClientRect + offsetHeight are both forced layouts, and this
    // ran twice per subscriber per animation frame while the scrub is on
    // screen. The section's document position only moves when something
    // above it reflows, so measure once and re-measure on resize instead of
    // on every frame.
    let top = 0
    let height = 0
    const measure = () => {
      const rect = el.getBoundingClientRect()
      top = rect.top + (window.scrollY || window.pageYOffset)
      height = el.offsetHeight
    }
    measure()

    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(measure) : null
    ro?.observe(el)
    ro?.observe(document.documentElement)
    window.addEventListener("resize", measure)
    // late-loading images above the fold can shift the section down after
    // the first measurement
    window.addEventListener("load", measure)

    const off = subscribe((y, vh) => {
      const span = height - vh
      const p = span > 0 ? clamp((y - top) / span) : 0
      if (p !== last) {
        last = p
        cb.current(p)
      }
    })

    return () => {
      off()
      ro?.disconnect()
      window.removeEventListener("resize", measure)
      window.removeEventListener("load", measure)
    }
  }, [ref])
}

/* ============================================================
   useScrollValue — generic subscriber for anything that needs
   the raw scroll position each frame.
   ============================================================ */
export function useScrollTick(onTick, deps = []) {
  const cb = useRef(onTick)
  cb.current = onTick
  useEffect(() => subscribe((y, vh) => cb.current(y, vh)), deps) // eslint-disable-line react-hooks/exhaustive-deps
}

/* ============================================================
   useParallax — translates the element on Y as it travels
   through the viewport. speed < 0 drifts against the scroll.
   ============================================================ */
export function useParallax(speed = 0.14, { axis = "y", max = 260 } = {}) {
  const ref = useRef(null)
  const reduced = useReducedMotion()

  useEffect(() => {
    const el = ref.current
    if (!el || reduced) return
    let cur = 0
    return subscribe((y, vh) => {
      const rect = el.getBoundingClientRect()
      if (rect.bottom < -200 || rect.top > vh + 200) return
      // distance of the element centre from the viewport centre
      const d = rect.top + rect.height / 2 - vh / 2
      const target = clamp(-d * speed, -max, max)
      cur = lerp(cur, target, 0.12)
      el.style.transform =
        axis === "y" ? `translate3d(0, ${cur.toFixed(2)}px, 0)` : `translate3d(${cur.toFixed(2)}px, 0, 0)`
    })
  }, [speed, axis, max, reduced])

  return ref
}

/* ============================================================
   useTilt — 3D card tilt + a glare hotspot that tracks the
   pointer. Falls back to nothing on touch / reduced motion.
   ============================================================ */
export function useTilt({ strength = 7, scale = 1.012 } = {}) {
  const ref = useRef(null)
  const reduced = useReducedMotion()
  const fine = useMedia("(hover: hover) and (pointer: fine)")

  useEffect(() => {
    const el = ref.current
    if (!el || reduced || !fine) return

    let raf = 0
    let tx = 0
    let ty = 0
    let cx = 0
    let cy = 0
    let active = false

    const render = () => {
      cx = lerp(cx, tx, 0.14)
      cy = lerp(cy, ty, 0.14)
      el.style.transform = `perspective(1000px) rotateX(${cy.toFixed(2)}deg) rotateY(${cx.toFixed(
        2
      )}deg) scale(${active ? scale : 1})`
      if (active || Math.abs(cx - tx) > 0.01 || Math.abs(cy - ty) > 0.01) {
        raf = requestAnimationFrame(render)
      } else {
        el.style.transform = ""
        raf = 0
      }
    }

    const kick = () => {
      if (!raf) raf = requestAnimationFrame(render)
    }

    const move = (e) => {
      const r = el.getBoundingClientRect()
      const px = (e.clientX - r.left) / r.width
      const py = (e.clientY - r.top) / r.height
      tx = (px - 0.5) * strength * 2
      ty = -(py - 0.5) * strength * 2
      el.style.setProperty("--mx", `${px * 100}%`)
      el.style.setProperty("--my", `${py * 100}%`)
      kick()
    }

    const enter = () => {
      active = true
      kick()
    }
    const leave = () => {
      active = false
      tx = 0
      ty = 0
      kick()
    }

    el.addEventListener("pointermove", move)
    el.addEventListener("pointerenter", enter)
    el.addEventListener("pointerleave", leave)
    return () => {
      el.removeEventListener("pointermove", move)
      el.removeEventListener("pointerenter", enter)
      el.removeEventListener("pointerleave", leave)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [strength, scale, reduced, fine])

  return ref
}

/* ============================================================
   useMagnetic — button drifts toward the cursor, snaps back.
   ============================================================ */
export function useMagnetic(pull = 0.3) {
  const ref = useRef(null)
  const reduced = useReducedMotion()
  const fine = useMedia("(hover: hover) and (pointer: fine)")

  useEffect(() => {
    const el = ref.current
    if (!el || reduced || !fine) return

    let raf = 0
    let tx = 0
    let ty = 0
    let cx = 0
    let cy = 0

    const render = () => {
      cx = lerp(cx, tx, 0.18)
      cy = lerp(cy, ty, 0.18)
      el.style.transform = `translate3d(${cx.toFixed(2)}px, ${cy.toFixed(2)}px, 0)`
      if (Math.abs(cx - tx) > 0.05 || Math.abs(cy - ty) > 0.05) {
        raf = requestAnimationFrame(render)
      } else {
        raf = 0
      }
    }
    const kick = () => {
      if (!raf) raf = requestAnimationFrame(render)
    }

    const move = (e) => {
      const r = el.getBoundingClientRect()
      tx = (e.clientX - (r.left + r.width / 2)) * pull
      ty = (e.clientY - (r.top + r.height / 2)) * pull
      kick()
    }
    const leave = () => {
      tx = 0
      ty = 0
      kick()
    }

    el.addEventListener("pointermove", move)
    el.addEventListener("pointerleave", leave)
    return () => {
      el.removeEventListener("pointermove", move)
      el.removeEventListener("pointerleave", leave)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [pull, reduced, fine])

  return ref
}

/* ============================================================
   useCounter — counts up to `to` once the element is in view.
   ============================================================ */
export function useCounter(to, { duration = 1700, decimals = 0 } = {}) {
  const [ref, inView] = useReveal({ threshold: 0.5 })
  const [val, setVal] = useState(0)
  const reduced = useReducedMotion()

  useEffect(() => {
    if (!inView) return
    if (reduced) {
      setVal(to)
      return
    }
    let raf = 0
    const t0 = performance.now()
    const step = (t) => {
      const p = clamp((t - t0) / duration)
      setVal(Number((to * easeOutCubic(p)).toFixed(decimals)))
      if (p < 1) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [inView, to, duration, decimals, reduced])

  return [ref, val]
}

/* ============================================================
   useScrollDirection — "down" | "up", debounced so it doesn't
   flicker on trackpad jitter.
   ============================================================ */
export function useScrollDirection() {
  const [dir, setDir] = useState("down")
  useEffect(() => {
    let last = window.scrollY
    let acc = 0
    return subscribe((y) => {
      const d = y - last
      last = y
      if (Math.abs(d) < 0.5) return
      acc = Math.sign(d) === Math.sign(acc) ? acc + d : d
      if (acc > 14) {
        setDir("down")
        acc = 0
      } else if (acc < -14) {
        setDir("up")
        acc = 0
      }
    })
  }, [])
  return dir
}

/* ============================================================
   usePageProgress — 0..1 for the whole document, for the top bar.
   ============================================================ */
export function usePageProgress() {
  const [p, setP] = useState(0)
  useEffect(() =>
    subscribe((y, vh) => {
      const h = document.documentElement.scrollHeight - vh
      setP(h > 0 ? clamp(y / h) : 0)
    })
  , [])
  return p
}

/* ============================================================
   useImageSequence — preloads the frame set and reports
   progress. Frames decode off the main thread where supported
   so the first paint isn't janky.
   ============================================================ */
export function useImageSequence(urls) {
  const imagesRef = useRef([])
  const [loaded, setLoaded] = useState(0)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let cancelled = false
    const imgs = new Array(urls.length)
    imagesRef.current = imgs
    let done = 0

    const settle = () => {
      if (cancelled) return
      done += 1
      setLoaded(done)
      if (done === urls.length) setReady(true)
    }

    urls.forEach((src, i) => {
      const img = new Image()
      img.decoding = "async"
      // the first frames matter most — they gate the first paint
      if (i < 4) img.fetchPriority = "high"
      img.onload = () => {
        imgs[i] = img
        if (img.decode) {
          img.decode().then(settle, settle)
        } else {
          settle()
        }
      }
      img.onerror = settle
      img.src = src
    })

    return () => {
      cancelled = true
    }
  }, [urls])

  return { images: imagesRef, loaded, total: urls.length, ready }
}

/* ============================================================
   useSmoothScrollTo — anchor navigation with an eased glide.
   ============================================================ */
export function useSmoothScrollTo() {
  return useCallback((id) => {
    const el = document.getElementById(id)
    if (!el) return
    const top = el.getBoundingClientRect().top + window.scrollY - 60
    window.scrollTo({ top, behavior: "smooth" })
  }, [])
}
