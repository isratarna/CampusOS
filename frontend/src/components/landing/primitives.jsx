import { useEffect, useRef, useState } from "react"
import {
  useCounter,
  useMagnetic,
  useMedia,
  useReducedMotion,
  useReveal,
  useScrollTick,
  useTilt,
} from "./hooks"

/* ---------- Reveal: animate-on-scroll wrapper ---------- */
export function Reveal({
  as = "div",
  delay = 0,
  y = 26,
  scale = 1,
  blur = 5,
  className = "",
  style,
  children,
  ...rest
}) {
  const Tag = as
  const [ref, inView] = useReveal()
  return (
    <Tag
      ref={ref}
      className={`lp-rv${inView ? " in" : ""} ${className}`.trim()}
      style={{
        "--rv-d": `${delay}ms`,
        "--rv-y": `${y}px`,
        "--rv-s": scale,
        "--rv-b": `${blur}px`,
        ...style,
      }}
      {...rest}
    >
      {children}
    </Tag>
  )
}

/* ---------- SplitText: per-word mask reveal ---------- */
export function SplitText({ text, start = 0, step = 62, className = "" }) {
  return (
    <span className={className}>
      {text.split(" ").map((w, i) => (
        <span className="lp-word" key={`${w}-${i}`}>
          <span style={{ "--d": `${start + i * step}ms` }}>{w}</span>
          {i < text.split(" ").length - 1 ? " " : ""}
        </span>
      ))}
    </span>
  )
}

/* ---------- RotatingWord: cycles through nouns in the headline ---------- */
export function RotatingWord({ words, interval = 2400 }) {
  const [i, setI] = useState(0)
  const [prev, setPrev] = useState(-1)
  const reduced = useReducedMotion()

  useEffect(() => {
    if (reduced) return
    const t = setInterval(() => {
      setI((n) => {
        setPrev(n)
        return (n + 1) % words.length
      })
    }, interval)
    return () => clearInterval(t)
  }, [words.length, interval, reduced])

  // size the slot to the longest word so the line never reflows
  const longest = words.reduce((a, b) => (b.length > a.length ? b : a), "")

  return (
    <span className="lp-rot">
      <span style={{ visibility: "hidden", opacity: 0, transform: "none" }} aria-hidden="true">
        {longest}
      </span>
      {words.map((w, n) => (
        <span key={w} className={n === i ? "on" : n === prev ? "out" : ""}>
          {w}
        </span>
      ))}
    </span>
  )
}

/* ---------- MagneticButton ---------- */
export function MagneticButton({ as = "button", className = "", children, pull = 0.26, ...rest }) {
  const Tag = as
  const ref = useMagnetic(pull)
  return (
    <Tag ref={ref} className={className} {...rest}>
      {children}
    </Tag>
  )
}

/* ---------- TiltCard ----------
   Outer div owns grid placement + the reveal; the inner div is the
   card surface and the tilt target, so the whole panel rotates. */
export function TiltCard({ span = "", className = "", children, strength = 6, delay = 0, ...rest }) {
  const tilt = useTilt({ strength })
  const [rv, inView] = useReveal()
  return (
    <div
      ref={rv}
      className={`lp-col ${span} lp-rv${inView ? " in" : ""}`.trim()}
      style={{ "--rv-y": "30px", "--rv-d": `${delay}ms` }}
      {...rest}
    >
      <div ref={tilt} className={`lp-card ${className}`.trim()}>
        <span className="glare" aria-hidden="true" />
        {children}
      </div>
    </div>
  )
}

/* ---------- Counter ---------- */
export function Counter({ to, prefix = "", suffix = "", decimals = 0 }) {
  const [ref, val] = useCounter(to, { decimals })
  return (
    <span ref={ref} className="lp-mono">
      {prefix}
      {decimals ? val.toFixed(decimals) : Math.round(val).toLocaleString()}
      {suffix}
    </span>
  )
}

/* ---------- Marquee ---------- */
export function Marquee({ items }) {
  const doubled = [...items, ...items]
  return (
    <div className="lp-marq">
      <div className="lp-marq-track">
        {doubled.map((t, i) => (
          <span className="lp-marq-item" key={i}>
            <i />
            {t}
          </span>
        ))}
      </div>
    </div>
  )
}

/* ---------- Spotlight: soft glow that trails the cursor ---------- */
export function Spotlight() {
  const ref = useRef(null)
  const fine = useMedia("(hover: hover) and (pointer: fine)")
  const reduced = useReducedMotion()

  useEffect(() => {
    const el = ref.current
    if (!el || !fine || reduced) return
    let raf = 0
    let tx = window.innerWidth / 2
    let ty = window.innerHeight / 2
    let cx = tx
    let cy = ty

    const render = () => {
      cx += (tx - cx) * 0.1
      cy += (ty - cy) * 0.1
      el.style.transform = `translate3d(${cx}px, ${cy}px, 0)`
      raf = requestAnimationFrame(render)
    }
    const move = (e) => {
      tx = e.clientX
      ty = e.clientY
      el.classList.add("on")
    }
    const out = () => el.classList.remove("on")

    window.addEventListener("pointermove", move)
    document.addEventListener("pointerleave", out)
    raf = requestAnimationFrame(render)
    return () => {
      window.removeEventListener("pointermove", move)
      document.removeEventListener("pointerleave", out)
      cancelAnimationFrame(raf)
    }
  }, [fine, reduced])

  return <div className="lp-spot" ref={ref} aria-hidden="true" />
}

/* ---------- FloatingOrbs: parallax blobs behind the hero ---------- */
export function FloatingOrbs() {
  const a = useRef(null)
  const b = useRef(null)
  const c = useRef(null)
  const reduced = useReducedMotion()

  useScrollTick((y) => {
    if (reduced) return
    if (a.current) a.current.style.transform = `translate3d(0, ${y * 0.16}px, 0)`
    if (b.current) b.current.style.transform = `translate3d(0, ${y * -0.09}px, 0)`
    if (c.current) c.current.style.transform = `translate3d(0, ${y * 0.24}px, 0)`
  }, [reduced])

  return (
    <>
      <div className="lp-orb a" ref={a} />
      <div className="lp-orb b" ref={b} />
      <div className="lp-orb c" ref={c} />
    </>
  )
}

/* ---------- TypingChat: the Gemini assistant demo ---------- */
export function TypingChat({ script }) {
  const [ref, inView] = useReveal({ threshold: 0.35 })
  const [step, setStep] = useState(-1)
  const [typed, setTyped] = useState("")
  const [thinking, setThinking] = useState(false)
  const reduced = useReducedMotion()

  useEffect(() => {
    if (!inView) return
    if (reduced) {
      setStep(script.length - 1)
      setTyped(script[script.length - 1]?.text ?? "")
      return
    }

    let alive = true
    let timers = []
    const wait = (ms) => new Promise((r) => timers.push(setTimeout(r, ms)))

    const run = async () => {
      for (let i = 0; i < script.length; i++) {
        if (!alive) return
        const msg = script[i]
        setStep(i)

        if (msg.from === "user") {
          setTyped(msg.text)
          await wait(msg.text.length * 16 + 500)
        } else {
          setThinking(true)
          setTyped("")
          await wait(760)
          if (!alive) return
          setThinking(false)
          for (let n = 1; n <= msg.text.length; n++) {
            if (!alive) return
            setTyped(msg.text.slice(0, n))
            await wait(msg.text[n - 1] === "\n" ? 90 : 15)
          }
          await wait(1500)
        }
      }
      if (!alive) return
      await wait(2200)
      setStep(-1)
      setTyped("")
      run()
    }
    run()

    return () => {
      alive = false
      timers.forEach(clearTimeout)
    }
  }, [inView, script, reduced])

  return (
    <div className="lp-chat" ref={ref}>
      <div className="lp-chat-bar">
        <span className="d" style={{ background: "#e8503a" }} />
        <span className="d" style={{ background: "#f5b42b" }} />
        <span className="d" style={{ background: "#16a34a" }} />
        <span style={{ marginLeft: 8 }}>Scheduling Assistant</span>
        <span style={{ marginLeft: "auto", color: "#56f0a0", fontSize: 10.5 }}>● connected</span>
      </div>
      <div className="lp-chat-body">
        {script.map((m, i) => {
          if (i > step) return null
          const isLast = i === step
          const body = isLast ? typed : m.text
          return (
            <div key={i} className={`lp-msg ${m.from} in`}>
              {isLast && m.from === "bot" && thinking ? (
                <span className="lp-typing">
                  <i />
                  <i />
                  <i />
                </span>
              ) : (
                <>
                  {body.split("\n").map((line, n) => (
                    <span key={n} style={{ display: "block" }}>
                      {line}
                    </span>
                  ))}
                  {isLast && m.from === "bot" && body.length < m.text.length && (
                    <span className="cursor" />
                  )}
                </>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
