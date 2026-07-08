import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import API from "../services/api";
import { API_ENDPOINTS } from "../utils/apiConstants";

function ProtectedRoute({ children }) {
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    let isMounted = true;

    API.get(API_ENDPOINTS.AUTH.ME)
      .then(() => {
        if (isMounted) setStatus("authorized");
      })
      .catch(() => {
        if (isMounted) setStatus("unauthorized");
      });

    return () => {
      isMounted = false;
    };
  }, []);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
        <div className="text-center">
          <p className="text-lg font-medium">Checking session...</p>
        </div>
      </div>
    );
  }

  if (status === "unauthorized") {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default ProtectedRoute;