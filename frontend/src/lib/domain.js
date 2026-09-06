/* ============================================================
   Shared vocabulary for the scheduling domain: the labels, colour
   assignments and formatters that every page needs to agree on.
   Colour keys map to the accent set in index.css.
   ============================================================ */

export const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
]

export const WEEKDAYS = DAYS.slice(0, 5)

/** Lowercase keys, as stored on faculty/room availability documents. */
export const DAY_KEYS = DAYS.map((d) => d.toLowerCase())

/* The teaching slots the backend generator places sessions into
   (backend/utils/timetableGenerator.js). Kept in step so the week
   grid has a row for every slot the API can return. */
export const TIME_SLOTS = [
  { start: "09:00", end: "10:00" },
  { start: "10:00", end: "11:00" },
  { start: "11:15", end: "12:15" },
  { start: "14:15", end: "15:15" },
  { start: "15:15", end: "16:15" },
  { start: "16:30", end: "17:30" },
]

/** Lunch, shown as a divider in the grid rather than a bookable row. */
export const BREAK_SLOT = { start: "12:15", end: "13:15" }

/* ---------- accents ---------- */
/* Each accent resolves to a matching trio of Tailwind classes so that a
   single key drives icon chips, tags and bars identically everywhere. */
export const ACCENTS = {
  blue: { solid: "bg-blue text-white", soft: "bg-blue-soft text-blue", bar: "bg-blue", dot: "bg-blue", ring: "border-blue/30" },
  amber: { solid: "bg-amber text-ink", soft: "bg-amber/15 text-amber-deep", bar: "bg-amber", dot: "bg-amber", ring: "border-amber/40" },
  violet: { solid: "bg-violet text-white", soft: "bg-violet-soft text-violet", bar: "bg-violet", dot: "bg-violet", ring: "border-violet/30" },
  green: { solid: "bg-green text-white", soft: "bg-green-soft text-green", bar: "bg-green", dot: "bg-green", ring: "border-green/30" },
  red: { solid: "bg-red text-white", soft: "bg-red-soft text-red", bar: "bg-red", dot: "bg-red", ring: "border-red/30" },
  cyan: { solid: "bg-cyan text-white", soft: "bg-cyan-soft text-cyan", bar: "bg-cyan", dot: "bg-cyan", ring: "border-cyan/30" },
  ink: { solid: "bg-ink text-paper", soft: "bg-ink/8 text-ink", bar: "bg-ink", dot: "bg-ink", ring: "border-ink/20" },
}

export function accent(key) {
  return ACCENTS[key] || ACCENTS.ink
}

/* ---------- course ---------- */
export const COURSE_TYPES = [
  { value: "lecture", label: "Lecture", accent: "blue" },
  { value: "lab", label: "Lab", accent: "violet" },
  { value: "seminar", label: "Seminar", accent: "green" },
]

/* ---------- room ---------- */
export const ROOM_TYPES = [
  { value: "lecture_hall", label: "Lecture hall", accent: "blue" },
  { value: "lab", label: "Laboratory", accent: "violet" },
  { value: "seminar_room", label: "Seminar room", accent: "green" },
  { value: "auditorium", label: "Auditorium", accent: "amber" },
]

/* ---------- timetable ---------- */
export const TIMETABLE_STATUS = [
  { value: "draft", label: "Draft", accent: "amber" },
  { value: "published", label: "Published", accent: "green" },
  { value: "archived", label: "Archived", accent: "ink" },
]

/* ---------- notification ---------- */
export const NOTIFICATION_TYPES = [
  { value: "info", label: "Info", accent: "blue" },
  { value: "success", label: "Success", accent: "green" },
  { value: "warning", label: "Warning", accent: "amber" },
  { value: "error", label: "Error", accent: "red" },
]

/** Look a value up in one of the option lists above. */
export function option(list, value) {
  return list.find((o) => o.value === value) || { value, label: titleCase(value), accent: "ink" }
}

/* ---------- formatters ---------- */
export function titleCase(value = "") {
  return String(value)
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

export function initials(name = "") {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("")
}

/** "3 minutes ago" / "Tue 4 Mar" once it stops being recent. */
export function relativeTime(value) {
  if (!value) return "—"
  const then = new Date(value)
  if (Number.isNaN(then.getTime())) return "—"
  const diff = Date.now() - then.getTime()
  const mins = Math.round(diff / 60000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.round(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.round(hrs / 24)
  if (days < 7) return `${days}d ago`
  return then.toLocaleDateString(undefined, { day: "numeric", month: "short" })
}

export function formatDate(value) {
  if (!value) return "—"
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return "—"
  return d.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

/** Total minutes a HH:MM..HH:MM span covers. */
export function slotMinutes(start, end) {
  const toMin = (t) => {
    const [h, m] = String(t || "").split(":").map(Number)
    return (h || 0) * 60 + (m || 0)
  }
  return Math.max(0, toMin(end) - toMin(start))
}

export function pluralise(count, singular, plural) {
  return `${count} ${count === 1 ? singular : plural || `${singular}s`}`
}

/** Percentage clamped to 0..100, rounded — used by every meter. */
export function pct(part, whole) {
  if (!whole) return 0
  return Math.max(0, Math.min(100, Math.round((part / whole) * 100)))
}
