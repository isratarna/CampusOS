import { useEffect, useRef, useState } from "react"
import { Link } from "react-router-dom"
import {
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Bell,
  Building2,
  CalendarDays,
  Github,
  LayoutDashboard,
  Radar,
  Sparkles,
  Users,
  Zap,
} from "lucide-react"

import "@/styles/landing.css"
import Deconstruct, { DECONSTRUCT_EXIT_COLOR } from "@/components/landing/Deconstruct"
import {
  Counter,
  FloatingOrbs,
  Marquee,
  MagneticButton,
  Reveal,
  RotatingWord,
  SplitText,
  Spotlight,
  TiltCard,
  TypingChat,
} from "@/components/landing/primitives"
import { clamp, usePageProgress, useScrollTick, useSmoothScrollTo } from "@/components/landing/hooks"

/* ============================================================
   Nav
   ============================================================ */
function Nav() {
  const [stuck, setStuck] = useState(false)
  const [dark, setDark] = useState(false)
  const [open, setOpen] = useState(false)
  const scrollTo = useSmoothScrollTo()

  useScrollTick((y) => {
    setStuck(y > 24)
    // flip to the light-on-dark treatment while the bar sits over a
    // dark section, so the logo never disappears into the background
    const zones = document.querySelectorAll("[data-theme='dark']")
    let over = false
    zones.forEach((z) => {
      const r = z.getBoundingClientRect()
      if (r.top <= 34 && r.bottom >= 34) over = true
    })
    setDark(over)
  })

  const go = (id) => {
    setOpen(false)
    scrollTo(id)
  }

  const links = [
    ["Teardown", "deconstruct"],
    ["Platform", "platform"],
    ["Assistant", "assistant"],
    ["Workflow", "workflow"],
  ]

  return (
    <header className={`lp-nav${stuck ? " stuck" : ""}${dark ? " dark" : ""}`}>
      <div className="lp-wrap lp-navin">
        <a className="lp-logo" href="#top" onClick={(e) => { e.preventDefault(); go("top") }}>
          <span className="lp-logo-mark">
            <i />
            <i />
            <i />
          </span>
          <span className="lp-logo-txt">
            <b>CampusOS</b>
            <small>Smart Classroom</small>
          </span>
        </a>

        <nav className="lp-navlinks">
          {links.map(([label, id]) => (
            <button key={id} className="lp-navlink" onClick={() => go(id)}>
              {label}
            </button>
          ))}
        </nav>

        <div className="lp-navcta">
          <Link to="/dashboard" className="lp-btn ghost desk">
            Sign in
          </Link>
          <MagneticButton as={Link} to="/dashboard" className="lp-btn primary">
            Open dashboard
            <ArrowRight className="arrow" size={15} />
          </MagneticButton>
          <button
            className={`lp-burger${open ? " open" : ""}`}
            onClick={() => setOpen((o) => !o)}
            aria-label="Toggle menu"
            aria-expanded={open}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </div>

      <div className={`lp-mobile${open ? " show" : ""}`}>
        {links.map(([label, id]) => (
          <button key={id} onClick={() => go(id)}>
            {label}
          </button>
        ))}
        <Link to="/dashboard" onClick={() => setOpen(false)}>
          Open dashboard →
        </Link>
      </div>
    </header>
  )
}

/* ============================================================
   Hero
   ============================================================ */
function Hero() {
  const [ready, setReady] = useState(false)
  const scrollTo = useSmoothScrollTo()

  useEffect(() => {
    const t = setTimeout(() => setReady(true), 90)
    return () => clearTimeout(t)
  }, [])

  return (
    <section id="top" className={`lp-hero${ready ? " ready" : ""}`}>
      <div className="lp-hero-bg" aria-hidden="true">
        <div className="lp-grid-bg" />
        <FloatingOrbs />
      </div>

      <div className="lp-wrap lp-hero-in">
        <Reveal delay={120} y={14}>
          <span className="lp-eyebrow">
            <span className="dot" />
            Gemini-powered scheduling · live on campus
          </span>
        </Reveal>

        <h1 className="lp-h1 lp-hero-head">
          <SplitText text="Take the" start={180} />{" "}
          <RotatingWord words={["timetable", "semester", "conflict", "campus"]} />
          <br />
          <SplitText text="apart. Put it back better." start={420} />
        </h1>

        <Reveal delay={760} y={20}>
          <p className="lp-lede">
            CampusOS is one dashboard for courses, faculty, rooms and timetables. Scroll and the
            interface comes apart layer by layer, so you can see exactly which live system is doing
            the work behind every card.
          </p>
        </Reveal>

        <Reveal delay={880} y={20} className="lp-hero-row">
          <MagneticButton as={Link} to="/dashboard" className="lp-btn primary lg">
            Open the dashboard
            <ArrowRight className="arrow" size={16} />
          </MagneticButton>
          <button className="lp-btn ghost lg" onClick={() => scrollTo("deconstruct")}>
            Watch it come apart
            <ArrowRight className="arrow" size={16} />
          </button>
        </Reveal>

        <Reveal delay={1000} y={22} className="lp-hero-meta">
          {[
            [11, "Semester courses"],
            [5, "Classes today"],
            [24, "Faculty scheduled"],
            [0, "Unresolved clashes"],
          ].map(([n, label]) => (
            <div className="lp-stat" key={label}>
              <b>
                <Counter to={n} />
              </b>
              <span>{label}</span>
            </div>
          ))}
        </Reveal>
      </div>

      <div className="lp-scrollcue" aria-hidden="true">
        <span>Scroll</span>
        <i />
      </div>
    </section>
  )
}

/* ============================================================
   Layer legend — sits right under the teardown and blends out of
   the studio grey the frames end on
   ============================================================ */
const LAYERS = [
  {
    k: "#2563eb",
    idx: "01",
    title: "Course catalogue",
    body: "Codes, credits, departments and enrolment caps. The single record every schedule is built from.",
  },
  {
    k: "#16a34a",
    idx: "02",
    title: "Faculty & load",
    body: "Availability windows and teaching hours per lecturer, so nobody gets stacked with back-to-back sessions.",
  },
  {
    k: "#7c4dff",
    idx: "03",
    title: "Rooms & capacity",
    body: "Buildings, floors, seats and equipment. A lab class never lands in a room without the kit.",
  },
  {
    k: "#f5b42b",
    idx: "04",
    title: "Timetable engine",
    body: "Draft, published and archived versions with utilisation metrics attached to every generated plan.",
  },
  {
    k: "#4dd9ff",
    idx: "05",
    title: "Assistant layer",
    body: "Gemini reads the whole context and answers in plain language: who is free, what clashes, what to move.",
  },
]

function LayerLegend() {
  return (
    <section
      className="lp-sec"
      style={{
        background: `linear-gradient(180deg, ${DECONSTRUCT_EXIT_COLOR} 0%, var(--bone) 42%)`,
        paddingTop: "clamp(60px, 8vw, 110px)",
      }}
    >
      <div className="lp-wrap">
        <div className="lp-head">
          <Reveal>
            <span className="lp-eyebrow">The five planes</span>
          </Reveal>
          <Reveal delay={90}>
            <h2 className="lp-h2">Each floating plane is a real collection.</h2>
          </Reveal>
          <Reveal delay={160}>
            <p className="lp-lede">
              Nothing in that teardown is decoration. Every layer maps to a document store, an API
              route and a screen you can open right now.
            </p>
          </Reveal>
        </div>

        <div className="lp-layers">
          {LAYERS.map((l, i) => (
            <Reveal key={l.idx} delay={i * 80} className="lp-layer" style={{ "--k": l.k }}>
              <span className="idx">{l.idx}</span>
              <h4>{l.title}</h4>
              <p>{l.body}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ============================================================
   Platform — bento of the real feature set
   ============================================================ */
function MiniSchedule() {
  const days = ["MON", "TUE", "WED", "THU", "FRI"]
  const tint = ["#2563eb", "#16a34a", "#f5b42b", "#7c4dff", "#2563eb"]
  const cols = [
    [1, 0, 1, 1, 0],
    [0, 1, 1, 0, 1],
    [1, 1, 1, 1, 0],
    [1, 0, 1, 0, 1],
    [0, 1, 1, 1, 0],
  ]
  const clash = [2, 2] // Wed 11:00 — the cell called out in the caption

  return (
    <div className="lp-mini" aria-hidden="true">
      <div className="days">
        {days.map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>
      <div className="grid">
        {cols.map((col, c) => (
          <div className="col" key={c}>
            {col.map((v, r) => {
              const isClash = c === clash[0] && r === clash[1]
              return (
                <div
                  key={r}
                  className={`slot${v ? " f" : ""}${isClash ? " clash" : ""}`}
                  style={{ "--d": `${(c * 5 + r) * 30}ms`, "--k": isClash ? "#e8503a" : tint[c] }}
                />
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}

function Platform() {
  return (
    <section id="platform" className="lp-sec">
      <div className="lp-wrap">
        <div className="lp-head">
          <Reveal>
            <span className="lp-eyebrow">The platform</span>
          </Reveal>
          <Reveal delay={90}>
            <h2 className="lp-h2">Everything a scheduler actually needs.</h2>
          </Reveal>
          <Reveal delay={160}>
            <p className="lp-lede">
              Built on Express and MongoDB, wired to a React front end, and answerable in plain
              English through the assistant.
            </p>
          </Reveal>
        </div>

        <div className="lp-bento">
          <TiltCard span="wide" delay={0}>
            <span className="lp-ico" style={{ "--k": "#e8503a" }}>
              <Radar size={20} />
            </span>
            <h3>Conflict detection that runs while you type</h3>
            <p>
              Double-booked lecturers, rooms over capacity and overlapping slots are surfaced the
              moment they appear, with the exact entries that collide.
            </p>
            <MiniSchedule />
            <div className="meta">
              <AlertTriangle size={13} /> Clash flagged · Wed 11:00 · Room B-204
            </div>
          </TiltCard>

          <TiltCard delay={90}>
            <span className="lp-ico" style={{ "--k": "#f5b42b" }}>
              <Sparkles size={20} />
            </span>
            <h3>Generate a full semester</h3>
            <p>
              Feed in courses, faculty and rooms. Get back a draft timetable with utilisation and
              total teaching hours already calculated.
            </p>
            <div className="meta">
              <Zap size={13} /> Draft → published
            </div>
          </TiltCard>

          <TiltCard delay={0}>
            <span className="lp-ico" style={{ "--k": "#2563eb" }}>
              <BookOpen size={20} />
            </span>
            <h3>Course catalogue</h3>
            <p>Credits, departments and enrolment held in one place and reused by every schedule.</p>
          </TiltCard>

          <TiltCard delay={90}>
            <span className="lp-ico" style={{ "--k": "#16a34a" }}>
              <Users size={20} />
            </span>
            <h3>Faculty load balancing</h3>
            <p>Availability per day and hour caps per lecturer, respected by the generator.</p>
          </TiltCard>

          <TiltCard delay={180}>
            <span className="lp-ico" style={{ "--k": "#7c4dff" }}>
              <Building2 size={20} />
            </span>
            <h3>Room utilisation</h3>
            <p>Buildings, floors, seats and equipment matched to what each class actually requires.</p>
          </TiltCard>

          <TiltCard span="wide" delay={0}>
            <span className="lp-ico" style={{ "--k": "#0e1013" }}>
              <Bell size={20} />
            </span>
            <h3>Notifications that carry the whole story</h3>
            <p>
              Every generation, publish and clash writes a typed notification. Unread counts follow
              you across the sidebar so nothing gets quietly dropped.
            </p>
            <div className="meta">
              <CalendarDays size={13} /> Errors · warnings · successes, all timestamped
            </div>
          </TiltCard>

          <TiltCard delay={90}>
            <span className="lp-ico" style={{ "--k": "#4dd9ff" }}>
              <LayoutDashboard size={20} />
            </span>
            <h3>One overview</h3>
            <p>Counts, recent timetables and alerts on a single screen, refreshed from live routes.</p>
          </TiltCard>
        </div>
      </div>
    </section>
  )
}

/* ============================================================
   Assistant
   ============================================================ */
const SCRIPT = [
  { from: "user", text: "Dr. Rahman has three classes on Tuesday. Can we spread them out?" },
  {
    from: "bot",
    text:
      "Yes. Tuesday currently stacks CSE-401, CSE-407 and CSE-412 back to back from 09:00.\nMoving CSE-412 to Thursday 11:00 keeps Room B-204 free, respects his 4-hour daily cap, and clears the clash with the Year 4 lab.",
  },
  { from: "user", text: "Do it and publish the draft." },
  {
    from: "bot",
    text: "Done. Timetable moved to published, utilisation is now 87%, and 0 conflicts remain.",
  },
]

function Assistant() {
  return (
    <section id="assistant" className="lp-sec lp-ai" data-theme="dark">
      <div className="lp-wrap">
        <div className="lp-ai-grid">
          <div>
            <Reveal>
              <span className="lp-eyebrow">
                <span className="dot" />
                gemini-2.5-flash
              </span>
            </Reveal>
            <Reveal delay={90}>
              <h2 className="lp-h2" style={{ margin: "18px 0 18px" }}>
                Ask the timetable a question.
              </h2>
            </Reveal>
            <Reveal delay={160}>
              <p className="lp-lede">
                The assistant is handed the live schedule as context on every message: who teaches
                what, in which room, at which hour. It answers about your data, not in general.
              </p>
            </Reveal>

            <Reveal delay={220}>
              <div className="lp-ai-list">
                {[
                  ["Reads the full context", "courses · faculty · rooms · slots"],
                  ["Explains the clash", "not just that one exists"],
                  ["Proposes a fix", "that respects every constraint"],
                  ["Answers in your language", "plain English, no query syntax"],
                ].map(([a, b]) => (
                  <div className="row" key={a}>
                    <span className="k">
                      <Sparkles size={13} />
                    </span>
                    <b>{a}</b>
                    <span className="v">{b}</span>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>

          <Reveal delay={140} y={40}>
            <TypingChat script={SCRIPT} />
          </Reveal>
        </div>
      </div>
    </section>
  )
}

/* ============================================================
   Workflow — scroll-linked progress line
   ============================================================ */
const STEPS = [
  {
    t: "Load the catalogue",
    d: "Add courses with their credit hours, department and expected enrolment. Import faculty with the days and hours they are actually free.",
    tags: ["Courses", "Faculty", "Rooms"],
  },
  {
    t: "Describe the constraints",
    d: "Room capacity, equipment, maximum teaching hours per lecturer, and the slots a department will not touch.",
    tags: ["Capacity", "Equipment", "Hour caps"],
  },
  {
    t: "Generate and inspect",
    d: "The engine produces a draft schedule with utilisation and conflict counts attached. Every collision is listed with the entries responsible.",
    tags: ["Draft", "Utilisation", "Conflicts"],
  },
  {
    t: "Resolve, publish, notify",
    d: "Fix what the assistant flags, move the timetable to published, and let typed notifications tell everyone what changed.",
    tags: ["Published", "Notifications"],
  },
]

function Workflow() {
  const ref = useRef(null)
  const lineRef = useRef(null)
  const [active, setActive] = useState(-1)

  useScrollTick((y, vh) => {
    const el = ref.current
    if (!el) return
    const r = el.getBoundingClientRect()
    // the line fills as the list travels up past three-quarters height
    const filled = clamp((vh * 0.75 - r.top) / r.height)
    lineRef.current?.style.setProperty("--p", `${(filled * 100).toFixed(1)}%`)

    let last = -1
    el.querySelectorAll("[data-step]").forEach((b, i) => {
      if (b.getBoundingClientRect().top < vh * 0.62) last = i
    })
    setActive(last)
  })

  return (
    <section id="workflow" className="lp-sec">
      <div className="lp-wrap">
        <div className="lp-head">
          <Reveal>
            <span className="lp-eyebrow">How it runs</span>
          </Reveal>
          <Reveal delay={90}>
            <h2 className="lp-h2">Four steps from a spreadsheet to a published semester.</h2>
          </Reveal>
        </div>

        <div className="lp-flow" ref={ref}>
          <div className="lp-flow-line" ref={lineRef}>
            <i />
          </div>
          {STEPS.map((s, i) => (
            <div className={`lp-step${i <= active ? " on" : ""}`} key={s.t} data-step={i}>
              <span className="bul lp-mono">{String(i + 1).padStart(2, "0")}</span>
              <Reveal delay={60}>
                <h3>{s.t}</h3>
                <p>{s.d}</p>
                <div className="tags">
                  {s.tags.map((t) => (
                    <span className="lp-tag" key={t}>
                      {t}
                    </span>
                  ))}
                </div>
              </Reveal>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ============================================================
   Stats band + marquee
   ============================================================ */
function Band() {
  return (
    <section className="lp-sec lp-band" data-theme="dark" style={{ paddingBottom: 0 }}>
      <div className="lp-wrap">
        <div className="lp-head">
          <Reveal>
            <span className="lp-eyebrow">By the numbers</span>
          </Reveal>
          <Reveal delay={90}>
            <h2 className="lp-h2">A semester, sorted in an afternoon.</h2>
          </Reveal>
        </div>

        <Reveal delay={120}>
          <div className="lp-bandgrid">
            {[
              [<Counter key="a" to={87} suffix="%" />, "Average room utilisation across a published semester plan."],
              [<Counter key="b" to={0} />, "Unresolved clashes left once the assistant has passed over the draft."],
              [<Counter key="c" to={6} />, "Live API surfaces: courses, faculty, rooms, timetables, notifications, AI."],
              [<Counter key="d" to={29} />, "Frames in the teardown above, scrubbed straight from your scroll position."],
            ].map(([v, label], i) => (
              <div className="lp-bandcell" key={i}>
                <b>{v}</b>
                <span>{label}</span>
              </div>
            ))}
          </div>
        </Reveal>
      </div>

      <div style={{ marginTop: "clamp(50px, 7vw, 90px)" }}>
        <Marquee
          items={[
            "Computer Science",
            "Electrical Engineering",
            "Business Administration",
            "Architecture",
            "Pharmacy",
            "Civil Engineering",
            "Textile Engineering",
          ]}
        />
      </div>
    </section>
  )
}

/* ============================================================
   CTA
   ============================================================ */
function CTA() {
  const dots = useRef(null)
  useScrollTick((y, vh) => {
    const el = dots.current
    if (!el) return
    const r = el.getBoundingClientRect()
    if (r.bottom < 0 || r.top > vh) return
    const d = (r.top + r.height / 2 - vh / 2) * -0.07
    el.style.transform = `translate3d(0, ${d.toFixed(1)}px, 0)`
  })

  return (
    <section className="lp-sec" style={{ background: "var(--ink)" }} data-theme="dark">
      <div className="lp-wrap">
        <Reveal y={40}>
          <div className="lp-cta-card">
            <span ref={dots} aria-hidden="true" style={{ position: "absolute", inset: "-40%" }}>
              <span
                style={{
                  position: "absolute",
                  inset: 0,
                  backgroundImage: "radial-gradient(rgba(36,26,2,.16) 1px, transparent 1px)",
                  backgroundSize: "22px 22px",
                  maskImage: "radial-gradient(ellipse 55% 55% at 50% 50%, #000, transparent 74%)",
                  WebkitMaskImage: "radial-gradient(ellipse 55% 55% at 50% 50%, #000, transparent 74%)",
                }}
              />
            </span>
            <span className="lp-eyebrow" style={{ color: "rgba(36,26,2,.6)" }}>
              Ready when you are
            </span>
            <h2>Stop rebuilding the timetable by hand.</h2>
            <p>
              Open the dashboard, load a department, and let the assistant find the clashes before
              your students do.
            </p>
            <div className="lp-hero-row" style={{ justifyContent: "center", marginTop: 6 }}>
              <MagneticButton as={Link} to="/dashboard" className="lp-btn ink lg">
                Open the dashboard
                <ArrowRight className="arrow" size={16} />
              </MagneticButton>
              <MagneticButton as={Link} to="/timetables" className="lp-btn ghost lg" pull={0.18}>
                Browse timetables
                <ArrowUpRight className="arrow" size={16} />
              </MagneticButton>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}

/* ============================================================
   Footer
   ============================================================ */
function Footer() {
  return (
    <footer className="lp-foot" data-theme="dark">
      <div className="lp-wrap">
        <div className="lp-footgrid">
          <div>
            <span className="lp-logo" style={{ marginBottom: 16 }}>
              <span className="lp-logo-mark">
                <i />
                <i />
                <i />
              </span>
              <span className="lp-logo-txt">
                <b>CampusOS</b>
                <small>Smart Classroom</small>
              </span>
            </span>
            <p style={{ fontSize: 13.4, lineHeight: 1.65, maxWidth: "34ch", marginTop: 14 }}>
              A scheduling workspace for departments that have outgrown the spreadsheet.
            </p>
          </div>

          <div>
            <h5>Product</h5>
            <Link to="/dashboard">Dashboard</Link>
            <Link to="/courses">Courses</Link>
            <Link to="/faculty">Faculty</Link>
            <Link to="/rooms">Rooms</Link>
          </div>

          <div>
            <h5>Scheduling</h5>
            <Link to="/timetables">Timetables</Link>
            <Link to="/notifications">Notifications</Link>
            <a href="#deconstruct">Teardown</a>
            <a href="#assistant">Assistant</a>
          </div>

          <div>
            <h5>Project</h5>
            <a href="#platform">Platform</a>
            <a href="#workflow">Workflow</a>
            <a href="#top">Back to top</a>
          </div>
        </div>

        <div className="lp-footbar">
          <span>© {new Date().getFullYear()} CampusOS · Smart Classroom Scheduler</span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
            <Github size={14} /> Built with React, Express, MongoDB and Gemini
          </span>
        </div>
      </div>
    </footer>
  )
}

/* ============================================================
   Page
   ============================================================ */
export default function Landing() {
  const progress = usePageProgress()

  useEffect(() => {
    // the teardown depends on scroll position, so land at the top on
    // a fresh visit rather than wherever the browser restored to
    if ("scrollRestoration" in window.history) {
      const prev = window.history.scrollRestoration
      window.history.scrollRestoration = "manual"
      return () => {
        window.history.scrollRestoration = prev
      }
    }
  }, [])

  return (
    <div className="lp">
      <div className="lp-progress" aria-hidden="true">
        <i style={{ "--p": `${progress * 100}%` }} />
      </div>
      <Spotlight />
      <Nav />

      <main>
        <Hero />
        <Deconstruct />
        <LayerLegend />
        <Platform />
        <Assistant />
        <Workflow />
        <Band />
        <CTA />
      </main>

      <Footer />
    </div>
  )
}
