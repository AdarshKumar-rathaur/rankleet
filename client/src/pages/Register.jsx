import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import API from "../services/api";
import { API_ENDPOINTS } from "../utils/apiConstants";

function Register() {
  const navigate = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    if (localStorage.getItem("token")) {
      navigate("/dashboard");
    }
  }, [navigate]);

  // Form States
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [leetcodeUsername, setLeetcodeUsername] = useState(""); // New state
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState(""); // Separate state
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    setError("");

    // 1. Basic Validation
    if (!name || !email || !password || !passwordConfirm || !leetcodeUsername) {
      setError("Please fill in all fields");
      return;
    }

    // 2. Password Match Check
    if (password !== passwordConfirm) {
      setError("Passwords do not match");
      return;
    }

    // 3. Password Strength Check
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
      setError("Password must contain letters and numbers");
      return;
    }

    if (email.length > 255) {
      setError("Email is too long");
      return;
    }

    setLoading(true);
    try {
      // ✅ Payload matches your backend expectations
      await API.post(API_ENDPOINTS.AUTH.REGISTER, {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password,
        passwordConfirm,
        leetcodeUsername: leetcodeUsername.trim(),
      });

      setError("");
      alert("Account created successfully! Redirecting to login...");
      setTimeout(() => {
        navigate("/");
      }, 1500);
    } catch (err) {
      // Use the friendly error messages from your api.js if available
      setError(err.response?.data?.message || err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 px-4">
      <div className="backdrop-blur-lg bg-gray-800/80 border border-gray-700 p-10 rounded-2xl shadow-xl w-full max-w-md">
        <h1 className="text-4xl font-bold text-center text-indigo-400 mb-2">
          RankLeet
        </h1>
        <p className="text-center text-gray-400 mb-8">Create your account</p>

        {/* Name Input */}
        <input
          placeholder="Full Name"
          className="w-full p-3 mb-4 rounded-lg bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        {/* Email Input */}
        <input
          type="email"
          placeholder="Email"
          className="w-full p-3 mb-4 rounded-lg bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        {/* LeetCode Username Input */}
        <input
          placeholder="LeetCode Username"
          className="w-full p-3 mb-4 rounded-lg bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          value={leetcodeUsername}
          onChange={(e) => setLeetcodeUsername(e.target.value)}
        />

        {/* Password Input */}
        <div className="relative mb-4">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            className="w-full p-3 rounded-lg bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-indigo-400 hover:text-indigo-300 transition"
          >
            {showPassword ? "Hide" : "Show"}
          </button>
        </div>

        {/* Confirm Password Input */}
        <input
          type="password"
          placeholder="Confirm Password"
          className="w-full p-3 mb-6 rounded-lg bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          value={passwordConfirm}
          onChange={(e) => setPasswordConfirm(e.target.value)}
          autoComplete="new-password"
        />

        {error && (
          <div className="mb-6 p-3 bg-red-500/20 border border-red-500 rounded text-red-400 text-sm animate-pulse">
            {error}
          </div>
        )}

        <button
          onClick={handleRegister}
          disabled={loading}
          className="w-full bg-indigo-500 hover:bg-indigo-600 disabled:bg-indigo-700 disabled:cursor-not-allowed p-3 rounded-lg font-semibold transition duration-200 transform active:scale-95 shadow-lg shadow-indigo-500/20"
        >
          {loading ? "Creating account..." : "Register"}
        </button>

        <p className="text-center text-gray-400 mt-6 text-sm">
          Already have an account?
          <Link to="/" className="text-indigo-400 hover:underline ml-2">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Register;