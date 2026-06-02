import { useEffect, useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import API from "../services/api";
import { API_ENDPOINTS } from "../utils/apiConstants";

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const inviteParam = params.get("invite");

  useEffect(() => {
    if (localStorage.getItem("token")) {
      if (inviteParam) {
        navigate(`/join/${inviteParam}`);
      } else {
        navigate("/dashboard");
      }
    }
  }, [navigate, inviteParam, location.search]);

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
      
      if (inviteParam) {
        navigate(`/join/${inviteParam}`);
      } else {
        navigate("/dashboard");
      }
    } catch (err) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    // Outer wrapper with ambient background lighting
    <div className="min-h-screen flex items-center justify-center bg-[#050505] bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(99,102,241,0.15),rgba(255,255,255,0))] p-4">
      
      {/* Glassmorphism Card */}
      <div className="relative w-full max-w-md p-10 backdrop-blur-2xl bg-white/[0.03] border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] rounded-3xl overflow-hidden z-10">
        
        {/* Subtle inner glow for the card */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-1/2 bg-indigo-500/10 blur-[50px] rounded-full pointer-events-none" />

        <div className="relative z-20">
          <h1 className="text-4xl font-extrabold text-center flex items-center justify-center gap-2 mb-2">
            <span className="text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]">⚡</span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">
              RankLeet
            </span>
          </h1>

          <p className="text-center text-gray-400 text-sm mb-8 tracking-wide">
            Compete. Track. Improve.
          </p>

          <div className="space-y-4">
            <input
              type="email"
              placeholder="Email"
              className="w-full p-3.5 rounded-xl bg-white/5 text-white border border-white/10 focus:outline-none focus:border-indigo-500/50 focus:bg-white/10 focus:ring-1 focus:ring-indigo-500/50 transition-all placeholder-gray-500"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                className="w-full p-3.5 rounded-xl bg-white/5 text-white border border-white/10 focus:outline-none focus:border-indigo-500/50 focus:bg-white/10 focus:ring-1 focus:ring-indigo-500/50 transition-all placeholder-gray-500"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-sm text-gray-400 hover:text-indigo-400 transition-colors"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm flex items-center gap-2">
              <span>⚠️</span> {error}
            </div>
          )}

          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full mt-6 p-3.5 rounded-xl font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 border border-white/10 shadow-lg shadow-indigo-500/20 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Logging in...
              </span>
            ) : (
              "Login"
            )}
          </button>

          <p className="text-center text-gray-400 text-sm mt-6">
            Don’t have an account?
            <Link to="/register" className="text-indigo-400 hover:text-indigo-300 hover:underline ml-1.5 font-medium transition-colors">
              Register
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;