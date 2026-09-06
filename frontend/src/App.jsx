import { BrowserRouter as Router, Navigate, Outlet, Route, Routes } from "react-router-dom"

import Landing from "./pages/Landing"
import Dashboard from "./pages/Dashboard"
import CoursesPage from "./pages/Courses"
import FacultyPage from "./pages/Faculty"
import RoomPage from "./pages/Rooms"
import TimetablePage from "./pages/Timetable"
import NotificationsPage from "./pages/Notifications"

import { AppShell } from "./components/app/AppShell"
import { CampusProvider } from "./components/app/CampusProvider"
import { ToastProvider } from "./components/app/Toast"

/** Everything behind the rail shares one data cache and one frame. */
function Workspace() {
  return (
    <ToastProvider>
      <CampusProvider>
        <AppShell>
          <Outlet />
        </AppShell>
      </CampusProvider>
    </ToastProvider>
  )
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing />} />

        <Route element={<Workspace />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/courses" element={<CoursesPage />} />
          <Route path="/faculty" element={<FacultyPage />} />
          <Route path="/rooms" element={<RoomPage />} />
          <Route path="/timetables" element={<TimetablePage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  )
}
