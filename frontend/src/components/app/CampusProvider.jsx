import * as React from "react"
import { api, apiError } from "@/lib/api"

/* ============================================================
   One shared read-cache for the five collections the app is built
   on. Pages render from it immediately on navigation and call
   refresh(key) after a mutation, so the sidebar badge, the
   dashboard totals and each page's list can never disagree.
   ============================================================ */

const ENDPOINTS = {
  courses: "/courses",
  faculty: "/faculty",
  rooms: "/rooms",
  timetables: "/timetables",
  notifications: "/notifications",
}

const KEYS = Object.keys(ENDPOINTS)

const CampusContext = React.createContext(null)

export function CampusProvider({ children }) {
  const [data, setData] = React.useState(() =>
    Object.fromEntries(KEYS.map((k) => [k, []]))
  )
  const [loading, setLoading] = React.useState(() =>
    Object.fromEntries(KEYS.map((k) => [k, true]))
  )
  const [errors, setErrors] = React.useState({})

  const load = React.useCallback(async (key) => {
    setLoading((prev) => ({ ...prev, [key]: true }))
    try {
      const res = await api.get(ENDPOINTS[key])
      setData((prev) => ({ ...prev, [key]: Array.isArray(res.data) ? res.data : [] }))
      setErrors((prev) => ({ ...prev, [key]: null }))
    } catch (err) {
      setErrors((prev) => ({ ...prev, [key]: apiError(err) }))
    } finally {
      setLoading((prev) => ({ ...prev, [key]: false }))
    }
  }, [])

  /** refresh() reloads everything; refresh("courses") reloads one. */
  const refresh = React.useCallback(
    (key) => Promise.all((key ? [key] : KEYS).map(load)),
    [load]
  )

  React.useEffect(() => {
    refresh()
  }, [refresh])

  const value = React.useMemo(
    () => ({ ...data, loading, errors, refresh }),
    [data, loading, errors, refresh]
  )

  return <CampusContext.Provider value={value}>{children}</CampusContext.Provider>
}

export function useCampus() {
  const ctx = React.useContext(CampusContext)
  if (!ctx) throw new Error("useCampus must be used inside <CampusProvider>")
  return ctx
}

/**
 * Compact snapshot handed to the assistant so it can answer questions
 * about the data actually on screen.
 */
export function useAssistantContext() {
  const { courses, faculty, rooms, timetables, notifications } = useCampus()

  return React.useMemo(
    () => ({
      counts: {
        courses: courses.length,
        faculty: faculty.length,
        rooms: rooms.length,
        timetables: timetables.length,
        unreadAlerts: notifications.filter((n) => !n.isRead).length,
      },
      courses: courses.slice(0, 40).map((c) => ({
        code: c.code,
        name: c.name,
        department: c.department,
        credits: c.credits,
        semester: c.semester,
        type: c.type,
      })),
      faculty: faculty.slice(0, 40).map((f) => ({
        name: f.name,
        department: f.department,
        specialization: f.specialization,
        maxHoursPerWeek: f.maxHoursPerWeek,
      })),
      rooms: rooms.slice(0, 40).map((r) => ({
        name: r.name,
        building: r.building,
        capacity: r.capacity,
        type: r.type,
      })),
      timetables: timetables.slice(0, 15).map((t) => ({
        name: t.name,
        semester: t.semester,
        department: t.department,
        status: t.status,
        entries: t.schedule?.length || 0,
        conflicts: t.conflicts?.length || 0,
      })),
    }),
    [courses, faculty, rooms, timetables, notifications]
  )
}
