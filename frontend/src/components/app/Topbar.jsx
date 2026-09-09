import * as React from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { cn } from "@/lib/utils"
import { navItemByPath } from "./nav"
import { useCampus } from "./CampusProvider"
import { Eyebrow, IconChip } from "./primitives"
import { titleCase } from "@/lib/domain"
import RoleNavbarBadge from "@/components/RoleNavbarBadge"
import {
  Bell,
  BookOpen,
  ChevronRight,
  CornerDownLeft,
  DoorOpen,
  Menu,
  Search,
  Sparkles,
  Users,
} from "lucide-react"

/* ------------------------------------------------------------
   Quick find — one search box across courses, faculty and rooms,
   served from the shared cache so it answers without a round trip.
   ------------------------------------------------------------ */

function useQuickFind(query) {
  const { courses, faculty, rooms } = useCampus()

  return React.useMemo(() => {
    const q = query.trim().toLowerCase()
    if (q.length < 2) return []

    const hit = (text) => String(text || "").toLowerCase().includes(q)

    const results = [
      ...courses
        .filter((c) => hit(c.code) || hit(c.name) || hit(c.department))
        .map((c) => ({
          id: `course-${c._id}`,
          icon: BookOpen,
          tone: "blue",
          title: `${c.code} — ${c.name}`,
          meta: titleCase(c.department),
          to: "/courses",
        })),
      ...faculty
        .filter((f) => hit(f.name) || hit(f.department) || f.specialization?.some(hit))
        .map((f) => ({
          id: `faculty-${f._id}`,
          icon: Users,
          tone: "violet",
          title: f.name,
          meta: titleCase(f.department),
          to: "/faculty",
        })),
      ...rooms
        .filter((r) => hit(r.name) || hit(r.building) || hit(r.type))
        .map((r) => ({
          id: `room-${r._id}`,
          icon: DoorOpen,
          tone: "green",
          title: r.name,
          meta: `${titleCase(r.building)} · ${r.capacity} seats`,
          to: "/rooms",
        })),
    ]

    return results.slice(0, 7)
  }, [query, courses, faculty, rooms])
}

function QuickFind() {
  const [query, setQuery] = React.useState("")
  const [open, setOpen] = React.useState(false)
  const [cursor, setCursor] = React.useState(0)
  const boxRef = React.useRef(null)
  const inputRef = React.useRef(null)
  const navigate = useNavigate()
  const results = useQuickFind(query)

  React.useEffect(() => setCursor(0), [query])

  // close on outside click
  React.useEffect(() => {
    const onDown = (e) => {
      if (!boxRef.current?.contains(e.target)) setOpen(false)
    }
    document.addEventListener("mousedown", onDown)
    return () => document.removeEventListener("mousedown", onDown)
  }, [])

  // focus with ctrl/cmd-K
  React.useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault()
        inputRef.current?.focus()
        setOpen(true)
      }
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [])

  const go = (result) => {
    if (!result) return
    navigate(result.to)
    setQuery("")
    setOpen(false)
    inputRef.current?.blur()
  }

  const onKeyDown = (e) => {
    if (e.key === "Escape") {
      setOpen(false)
      inputRef.current?.blur()
    } else if (e.key === "ArrowDown") {
      e.preventDefault()
      setCursor((c) => Math.min(c + 1, results.length - 1))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setCursor((c) => Math.max(c - 1, 0))
    } else if (e.key === "Enter") {
      go(results[cursor])
    }
  }

  const showPanel = open && query.trim().length >= 2

  return (
    <div ref={boxRef} className="relative hidden min-w-0 flex-1 md:block md:max-w-sm">
      <Search
        className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-mut-2"
        strokeWidth={2.1}
      />
      <input
        ref={inputRef}
        value={query}
        onChange={(e) => {
          setQuery(e.target.value)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
        placeholder="Find a course, lecturer or room"
        aria-label="Quick find"
        className={cn(
          "h-9 w-full rounded-sm border border-line bg-bone pl-9 pr-16 text-[13px] text-ink",
          "placeholder:text-mut-2 transition-colors duration-200",
          "hover:border-mut-2/60 focus:border-blue focus:bg-paper focus:outline-none"
        )}
      />
      <kbd
        className={cn(
          "pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 rounded-[3px]",
          "border border-line bg-paper px-1.5 py-0.5 font-mono text-[10px] text-mut-2"
        )}
      >
        ⌘K
      </kbd>

      {showPanel && (
        <div
          className={cn(
            "co-pop absolute left-0 right-0 top-11 z-50 overflow-hidden rounded-md",
            "border border-line bg-paper shadow-pop"
          )}
        >
          {results.length === 0 ? (
            <p className="px-4 py-6 text-center text-xs text-mut">
              Nothing matches “{query.trim()}”.
            </p>
          ) : (
            <ul className="max-h-80 overflow-y-auto py-1">
              {results.map((r, i) => (
                <li key={r.id}>
                  <button
                    type="button"
                    onMouseEnter={() => setCursor(i)}
                    onClick={() => go(r)}
                    className={cn(
                      "flex w-full items-center gap-3 px-3 py-2 text-left transition-colors duration-150",
                      i === cursor ? "bg-bone" : "bg-transparent"
                    )}
                  >
                    <IconChip icon={r.icon} tone={r.tone} size="sm" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-medium text-ink">
                        {r.title}
                      </span>
                      <span className="block truncate text-[11px] text-mut">{r.meta}</span>
                    </span>
                    {i === cursor && (
                      <CornerDownLeft className="size-3.5 shrink-0 text-mut-2" strokeWidth={2.2} />
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}

/* ------------------------------------------------------------
   Topbar
   ------------------------------------------------------------ */

export function Topbar({ onOpenMobile, onOpenAssistant }) {
  const { pathname } = useLocation()
  const { notifications } = useCampus()
  const item = navItemByPath(pathname)
  const unread = notifications.filter((n) => !n.isRead).length

  const today = React.useMemo(
    () =>
      new Date().toLocaleDateString(undefined, {
        weekday: "short",
        day: "numeric",
        month: "short",
      }),
    []
  )

  return (
    <header
      className={cn(
        "sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-line px-4 sm:px-6",
        "bg-bone/85 backdrop-blur-md supports-[backdrop-filter]:bg-bone/70"
      )}
    >
      <button
        type="button"
        onClick={onOpenMobile}
        className="co-press grid size-9 shrink-0 place-items-center rounded-sm border border-line bg-paper text-ink hover:bg-bone-2 lg:hidden"
        aria-label="Open menu"
      >
        <Menu className="size-4" strokeWidth={2.2} />
      </button>

      {/* breadcrumb */}
      <div className="flex min-w-0 shrink items-center gap-2">
        <Eyebrow className="hidden shrink-0 sm:inline">{item?.section || "FacultyOS"}</Eyebrow>
        <ChevronRight className="hidden size-3 shrink-0 text-mut-2 sm:block" strokeWidth={2.4} />
        <span className="truncate text-[13px] font-semibold tracking-[-0.01em] text-ink">
          {item?.label || "FacultyOS"}
        </span>
      </div>

      <div className="flex-1" />

      <QuickFind />

      {/* actions */}
      <div className="flex shrink-0 items-center gap-1.5">
        <span className="co-index hidden lg:block">{today}</span>

        <button
          type="button"
          onClick={onOpenAssistant}
          className="co-press hidden h-9 items-center gap-2 rounded-sm border border-line bg-paper px-3 text-[12px] font-semibold text-ink hover:border-amber hover:bg-amber/10 sm:flex"
        >
          <Sparkles className="size-3.5 text-amber-deep" strokeWidth={2.3} />
          Assistant
        </button>

        <Link
          to="/notifications"
          aria-label={unread ? `Alerts, ${unread} unread` : "Alerts"}
          className="co-press relative grid size-9 place-items-center rounded-sm border border-line bg-paper text-ink hover:bg-bone-2"
        >
          <Bell className="size-4" strokeWidth={2.1} />
          {unread > 0 && (
            <span className="co-pop absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-red px-1 text-[9px] font-bold text-white">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </Link>

        <div className="ml-1">
          <RoleNavbarBadge />
        </div>
      </div>
    </header>
  )
}
