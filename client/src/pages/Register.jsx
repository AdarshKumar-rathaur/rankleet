import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import API from "../services/api";
import { API_ENDPOINTS } from "../utils/apiConstants";

function Register() {
  const navigate = useNavigate();

  useEffect(() => {
    if (localStorage.getItem("token")) {
      navigate("/dashboard");
    }
  }, [navigate]);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [leetcodeUsername, setLeetcodeUsername] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    setError("");

    if (!name || !email || !password || !leetcodeUsername) {
      setError("Please fill in all fields");
      return;
    }

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
      await API.post(API_ENDPOINTS.AUTH.REGISTER, {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password,
        passwordConfirm: password,
        leetcodeUsername: leetcodeUsername.trim(),
      });

      setError("");
      alert("Account created successfully! Redirecting to login...");
      setTimeout(() => {
        navigate("/");
      }, 1000);
    } catch (err) {
      setError(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="backdrop-blur-lg bg-gray-800/80 border border-gray-700 p-10 rounded-2xl shadow-xl w-96">
        <h1 className="text-4xl font-bold text-center text-indigo-400 mb-2">
          RankLeet
        </h1>

        <p className="text-center text-gray-400 mb-8">Create your account</p>

        <input
          placeholder="Full Name"
          className="w-full p-3 mb-4 rounded-lg bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <input
          type="email"
          placeholder="Email"
          className="w-full p-3 mb-4 rounded-lg bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

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
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-indigo-400"
          >
            {showPassword ? "Hide" : "Show"}
          </button>
        </div>

        <input
          type="password"
          placeholder="Confirm Password"
          className="w-full p-3 mb-4 rounded-lg bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
          maxLength="40"
        />

        {error && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500 rounded text-red-400 text-sm">
            {error}
          </div>
        )}

        <button
          onClick={handleRegister}
          disabled={loading}
          className="w-full bg-indigo-500 hover:bg-indigo-600 disabled:bg-indigo-700 disabled:cursor-not-allowed p-3 rounded-lg font-semibold transition duration-200"
        >
          {loading ? "Creating account..." : "Register"}
        </button>

        <p className="text-center text-gray-400 mt-6">
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
