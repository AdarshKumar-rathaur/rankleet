import { Link, useNavigate, useLocation } from "react-router-dom";

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();

  const logout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="backdrop-blur-xl border-b border-white/10 bg-gray-950/80 px-8 py-4 flex justify-between items-center sticky top-0 z-40">
      <Link
        to="/dashboard"
        className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent hover:opacity-80 transition-opacity"
      >
        ⚡ RankLeet
      </Link>

      <div className="flex items-center gap-2">
        <Link
          to="/dashboard"
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
            isActive("/dashboard")
              ? "bg-blue-500/20 border border-blue-500/30 text-blue-300"
              : "text-gray-400 hover:text-white hover:bg-white/5"
          }`}
        >
          🏠 Dashboard
        </Link>

        <Link
          to="/mastery"
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
            isActive("/mastery")
              ? "bg-purple-500/20 border border-purple-500/30 text-purple-300"
              : "text-gray-400 hover:text-white hover:bg-white/5"
          }`}
        >
          🎯 Mastery Plan
        </Link>

        <button
          onClick={logout}
          className="ml-2 px-4 py-2 rounded-lg text-sm font-medium border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-all duration-200"
        >
          Logout
        </button>
      </div>
    </nav>
  );
}

export default Navbar;
