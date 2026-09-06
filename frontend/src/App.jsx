import Dashboard from "./pages/Dashboard";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import CoursesPage from "./pages/Courses";
import FacultyPage from "./pages/Faculty";
import RoomPage from "./pages/Rooms";
import TimetablePage from "./pages/Timetable";
import NotificationsPage from "./pages/Notifications";
import FacultyAiStudio from "./pages/FacultyAiStudio";
import LoginPage from "./pages/LoginPage";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public Login Route */}
          <Route path="/login" element={<LoginPage />} />

          {/* Protected Routes with Role Checks */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/faculty-ai"
            element={
              <ProtectedRoute allowedRoles={["admin", "faculty"]}>
                <FacultyAiStudio />
              </ProtectedRoute>
            }
          />
          <Route
            path="/courses"
            element={
              <ProtectedRoute allowedRoles={["admin", "faculty"]}>
                <CoursesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/faculty"
            element={
              <ProtectedRoute allowedRoles={["admin", "faculty"]}>
                <FacultyPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/rooms"
            element={
              <ProtectedRoute allowedRoles={["admin", "faculty"]}>
                <RoomPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/timetables"
            element={
              <ProtectedRoute allowedRoles={["admin", "faculty", "student"]}>
                <TimetablePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/notifications"
            element={
              <ProtectedRoute allowedRoles={["admin", "faculty", "student"]}>
                <NotificationsPage />
              </ProtectedRoute>
            }
          />

          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
