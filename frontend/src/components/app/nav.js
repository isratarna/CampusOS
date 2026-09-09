import {
  Bell,
  BookOpen,
  CalendarDays,
  DoorOpen,
  LayoutGrid,
  Sparkles,
  Users,
} from "lucide-react"

/* ============================================================
   Navigation model.

   One source of truth for the sidebar, the topbar breadcrumb and
   each page's sub-menu. Sections group destinations by the job the
   user came to do; `views` are the sub-menus inside a destination
   and double as deep links (?view=<id>).

   `roles` lists who may reach a destination. It is the same list the
   router gates on, so the rail never shows a link that would bounce
   the visitor off an access screen. Students get the three read-only
   destinations; staff get the estate.
   ============================================================ */

export const ROLES = ["admin", "faculty", "student"]
const STAFF = ["admin", "faculty"]

export const NAV_SECTIONS = [
  {
    id: "overview",
    label: "Overview",
    items: [
      {
        id: "dashboard",
        label: "Dashboard",
        rail: "Home",
        icon: LayoutGrid,
        path: "/dashboard",
        accent: "amber",
        roles: ROLES,
        description: "Everything happening across campus today.",
        views: [
          { id: "today", label: "Today" },
          { id: "capacity", label: "Capacity" },
          { id: "activity", label: "Activity" },
        ],
      },
    ],
  },
  {
    id: "academics",
    label: "Academics",
    items: [
      {
        id: "courses",
        label: "Courses",
        rail: "Courses",
        icon: BookOpen,
        path: "/courses",
        accent: "blue",
        roles: STAFF,
        description: "The catalogue every timetable is built from.",
        views: [
          { id: "catalogue", label: "Catalogue" },
          { id: "departments", label: "Departments" },
          { id: "prerequisites", label: "Prerequisites" },
        ],
      },
      {
        id: "faculty",
        label: "Faculty",
        rail: "Faculty",
        icon: Users,
        path: "/faculty",
        accent: "violet",
        roles: STAFF,
        description: "Who teaches what, and when they are free.",
        views: [
          { id: "directory", label: "Directory" },
          { id: "availability", label: "Availability" },
          { id: "workload", label: "Workload" },
        ],
      },
      {
        id: "faculty-ai",
        label: "AI Studio",
        rail: "Studio",
        icon: Sparkles,
        path: "/faculty-ai",
        accent: "violet",
        roles: STAFF,
        description: "Draft course blueprints, exams and rubric grading.",
        views: [
          { id: "blueprint", label: "Blueprint" },
          { id: "exam", label: "Exam" },
          { id: "grading", label: "Grading" },
        ],
      },
    ],
  },
  {
    id: "campus",
    label: "Campus",
    items: [
      {
        id: "rooms",
        label: "Rooms",
        rail: "Rooms",
        icon: DoorOpen,
        path: "/rooms",
        accent: "green",
        roles: STAFF,
        description: "Every teachable space and how hard it works.",
        views: [
          { id: "inventory", label: "Inventory" },
          { id: "availability", label: "Availability" },
          { id: "utilisation", label: "Utilisation" },
        ],
      },
    ],
  },
  {
    id: "scheduling",
    label: "Scheduling",
    items: [
      {
        id: "timetables",
        label: "Timetables",
        rail: "Schedule",
        icon: CalendarDays,
        path: "/timetables",
        accent: "cyan",
        roles: ROLES,
        description: "Draft, generate and publish the semester.",
        views: [
          { id: "schedules", label: "Schedules" },
          { id: "generate", label: "Generate" },
          { id: "conflicts", label: "Conflicts" },
        ],
      },
    ],
  },
  {
    id: "signals",
    label: "Signals",
    items: [
      {
        id: "notifications",
        label: "Alerts",
        rail: "Alerts",
        icon: Bell,
        path: "/notifications",
        accent: "red",
        roles: ROLES,
        description: "Announcements and everything that needs a look.",
        views: [
          { id: "inbox", label: "Inbox" },
          { id: "unread", label: "Unread" },
          { id: "compose", label: "Compose" },
        ],
      },
    ],
  },
]

/** Flattened destinations, in sidebar order. */
export const NAV_ITEMS = NAV_SECTIONS.flatMap((section) =>
  section.items.map((item) => ({ ...item, section: section.label }))
)

/** The rail for one role: sections keep their order, empty ones drop out. */
export function navSectionsForRole(role) {
  const who = role || "student"
  return NAV_SECTIONS.map((section) => ({
    ...section,
    items: section.items.filter((item) => !item.roles || item.roles.includes(who)),
  })).filter((section) => section.items.length > 0)
}

export function navItem(id) {
  return NAV_ITEMS.find((item) => item.id === id)
}

export function navItemByPath(pathname) {
  return NAV_ITEMS.find((item) => item.path === pathname)
}
