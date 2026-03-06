import { Navigate } from "react-router-dom";

function ProtectedRoute({ children }) {
  const token = localStorage.getItem("token");

  // Validate token format (basic check)
  if (!token || typeof token !== 'string' || token.split('.').length !== 3) {
    localStorage.removeItem("token");
    return <Navigate to="/" replace />;
  }

  return children;
}

export default ProtectedRoute;