import {
  Bell,
  BookOpen,
  CalendarDays,
  DoorOpen,
  LayoutGrid,
  Users,
} from "lucide-react"

/* ============================================================
   Navigation model.

   One source of truth for the sidebar, the topbar breadcrumb and
   each page's sub-menu. Sections group destinations by the job the
   user came to do; `views` are the sub-menus inside a destination
   and double as deep links (?view=<id>).
   ============================================================ */

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
        description: "Who teaches what, and when they are free.",
        views: [
          { id: "directory", label: "Directory" },
          { id: "availability", label: "Availability" },
          { id: "workload", label: "Workload" },
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

export function navItem(id) {
  return NAV_ITEMS.find((item) => item.id === id)
}

export function navItemByPath(pathname) {
  return NAV_ITEMS.find((item) => item.path === pathname)
}
