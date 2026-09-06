import { BrowserRouter as Router, Navigate, Outlet, Route, Routes } from "react-router-dom"

import Landing from "./pages/Landing"
import LoginPage from "./pages/LoginPage"
import Dashboard from "./pages/Dashboard"
import CoursesPage from "./pages/Courses"
import FacultyPage from "./pages/Faculty"
import RoomPage from "./pages/Rooms"
import TimetablePage from "./pages/Timetable"
import NotificationsPage from "./pages/Notifications"
import FacultyAiStudio from "./pages/FacultyAiStudio"

import { AppShell } from "./components/app/AppShell"
import { CampusProvider } from "./components/app/CampusProvider"
import { ToastProvider } from "./components/app/Toast"
import { AuthProvider } from "./context/AuthContext"
import ProtectedRoute from "./components/ProtectedRoute"

/** Everything behind the rail shares one data cache and one frame. */
function Workspace() {
  return (
    <ProtectedRoute>
      <ToastProvider>
        <CampusProvider>
          <AppShell>
            <Outlet />
          </AppShell>
        </CampusProvider>
      </ToastProvider>
    </ProtectedRoute>
  )
}

/** Role gate for a single destination, rendered inside the shell. */
function RequireRole({ roles, children }) {
  return <ProtectedRoute allowedRoles={roles}>{children}</ProtectedRoute>
}

const STAFF = ["admin", "faculty"]
const EVERYONE = ["admin", "faculty", "student"]

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* public */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<LoginPage />} />

          {/* authenticated workspace */}
          <Route element={<Workspace />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route
              path="/faculty-ai"
              element={
                <RequireRole roles={STAFF}>
                  <FacultyAiStudio />
                </RequireRole>
              }
            />
            <Route
              path="/courses"
              element={
                <RequireRole roles={STAFF}>
                  <CoursesPage />
                </RequireRole>
              }
            />
            <Route
              path="/faculty"
              element={
                <RequireRole roles={STAFF}>
                  <FacultyPage />
                </RequireRole>
              }
            />
            <Route
              path="/rooms"
              element={
                <RequireRole roles={STAFF}>
                  <RoomPage />
                </RequireRole>
              }
            />
            <Route
              path="/timetables"
              element={
                <RequireRole roles={EVERYONE}>
                  <TimetablePage />
                </RequireRole>
              }
            />
            <Route
              path="/notifications"
              element={
                <RequireRole roles={EVERYONE}>
                  <NotificationsPage />
                </RequireRole>
              }
            />
          </Route>

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  )
}
