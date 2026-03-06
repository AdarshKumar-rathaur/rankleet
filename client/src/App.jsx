import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Group from "./pages/Group";
import Join from "./pages/Join";

import ProtectedRoute from "./components/ProtectedRoute";
import ErrorBoundary from "./components/ErrorBoundary";
import ToastContainer from "./components/ToastContainer";

function App() {
  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-900 text-white">
        <BrowserRouter>
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
              path="/group/:id"
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
