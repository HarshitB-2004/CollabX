import { Routes, Route } from "react-router-dom"

import Login from "./pages/Login"
import Register from "./pages/Register"
import Dashboard from "./pages/Dashboard"
import Tasks from "./pages/Tasks"
import Overview from "./pages/Overview"
import People from "./pages/People"
import ThemeToggle from "./components/ThemeToggle"
import { ProtectedRoute, PublicRoute } from "./components/AuthRoutes"

function App() {
  return (
    <div className="app-frame">
      <div className="app-theme-toggle">
        <ThemeToggle />
      </div>

      <Routes>
        <Route
          path="/"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicRoute>
              <Register />
            </PublicRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/overview"
          element={
            <ProtectedRoute>
              <Overview />
            </ProtectedRoute>
          }
        />
        <Route
          path="/people"
          element={
            <ProtectedRoute>
              <People />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tasks"
          element={
            <ProtectedRoute>
              <Tasks />
            </ProtectedRoute>
          }
        />
      </Routes>
    </div>
  )
}

export default App
