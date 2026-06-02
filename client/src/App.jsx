import { useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Group from "./pages/Group";
import Join from "./pages/Join";
import Mastery from "./pages/Mastery";

import ProtectedRoute from "./components/ProtectedRoute";
import ErrorBoundary from "./components/ErrorBoundary";
import ToastContainer from "./components/ToastContainer";
import AuthListener from "./components/AuthListener";

function App() {
  useEffect(() => {
    const apiUrl = import.meta.env.VITE_API_URL;
    if (!apiUrl) return;

    const pingServer = async () => {
      try {
        await fetch(`${apiUrl}/health`, { method: "GET", cache: "no-store" });
      } catch {
        // Ignore ping failures; this is just a keepalive.
      }
    };

    const intervalId = setInterval(pingServer, 4 * 60 * 1000);
    pingServer();

    return () => clearInterval(intervalId);
  }, []);

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-900 text-white">
        <BrowserRouter>
          <AuthListener />
          <Routes>
            <Route path="/" element={<Login />} />

            <Route path="/register" element={<Register />} />

            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/mastery"
              element={
                <ProtectedRoute>
                  <Mastery />
                </ProtectedRoute>
              }
            />

            <Route
              path="/group/:inviteCode"
              element={
                <ProtectedRoute>
                  <Group />
                </ProtectedRoute>
              }
            />

            <Route path="/join/:inviteCode" element={<Join />} />
          </Routes>
        </BrowserRouter>
        <ToastContainer />
      </div>
    </ErrorBoundary>
  );
}

export default App;
