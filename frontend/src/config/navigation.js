import {
  LayoutDashboard,
  Sparkles,
  BookOpen,
  Users,
  Home,
  Calendar,
  Bell,
} from "lucide-react";

export const ALL_NAVIGATION_ITEMS = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    path: "/",
    roles: ["admin", "faculty", "student"],
  },
  {
    id: "faculty-ai",
    label: "Faculty AI Copilot",
    icon: Sparkles,
    path: "/faculty-ai",
    roles: ["admin", "faculty"],
  },
  {
    id: "courses",
    label: "Courses",
    icon: BookOpen,
    path: "/courses",
    roles: ["admin", "faculty"],
  },
  {
    id: "faculty",
    label: "Faculty",
    icon: Users,
    path: "/faculty",
    roles: ["admin", "faculty"],
  },
  {
    id: "rooms",
    label: "Rooms",
    icon: Home,
    path: "/rooms",
    roles: ["admin", "faculty"],
  },
  {
    id: "timetables",
    label: "Timetables",
    icon: Calendar,
    path: "/timetables",
    roles: ["admin", "faculty", "student"],
  },
  {
    id: "notifications",
    label: "Notifications",
    icon: Bell,
    path: "/notifications",
    roles: ["admin", "faculty", "student"],
  },
];

/**
 * Filter navigation items based on user role.
 * Normal users (student) only see 3 items: Dashboard, Timetables, Notifications.
 * Admin & Faculty see all items.
 */
export const getNavigationItemsForRole = (userRole) => {
  const role = userRole || "student";
  return ALL_NAVIGATION_ITEMS.filter((item) => item.roles.includes(role));
};
