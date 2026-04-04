import { Navigate } from "react-router-dom"

const hasToken = () => Boolean(localStorage.getItem("token"))

export const ProtectedRoute = ({ children }) => {
 if (!hasToken()) {
  return <Navigate to="/" replace />
 }

 return children
}

export const PublicRoute = ({ children }) => {
 if (hasToken()) {
  return <Navigate to="/dashboard" replace />
 }

 return children
}
