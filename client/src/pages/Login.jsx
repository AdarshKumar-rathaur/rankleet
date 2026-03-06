import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import API from "../services/api";
import { API_ENDPOINTS } from "../utils/apiConstants";

function Login() {
  const navigate = useNavigate();

  useEffect(() => {
    if (localStorage.getItem("token")) {
      navigate("/dashboard");
    }
  }, [navigate]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setError("");
    
    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }

    if (email.length > 255) {
      setError("Invalid email format");
      return;
    }

    setLoading(true);
    try {
      const res = await API.post(API_ENDPOINTS.AUTH.LOGIN, {
        email: email.toLowerCase().trim(),
        password,
      });

      if (!res.data.token) {
        setError("Invalid response from server");
        return;
      }

      localStorage.setItem("token", res.data.token);
      setError("");
      navigate("/dashboard");
    } catch (err) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="backdrop-blur-lg bg-gray-800/80 border border-gray-700 p-10 rounded-2xl shadow-xl w-96">
        <h1 className="text-4xl font-bold text-center text-indigo-400 mb-2">
          ⚡RankLeet
        </h1>

        <p className="text-center text-gray-400 mb-8">
          Compete. Track. Improve.
        </p>

        <input
          type="email"
          placeholder="Email"
          className="w-full p-3 mb-4 rounded-lg bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <div className="relative mb-6">
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

        {error && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500 rounded text-red-400 text-sm">
            {error}
          </div>
        )}

        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full bg-indigo-500 hover:bg-indigo-600 disabled:bg-indigo-700 disabled:cursor-not-allowed p-3 rounded-lg font-semibold transition duration-200"
        >
          {loading ? "Logging in..." : "Login"}
        </button>

        <p className="text-center text-gray-400 mt-6">
          Don’t have an account?
          <Link to="/register" className="text-indigo-400 hover:underline ml-2">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Login;
