import { Link, useNavigate, useLocation } from "react-router-dom";
import UserAvatar from "./UserAvatar";

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const profile = JSON.parse(localStorage.getItem("rankleet-profile") || "null");

  const logout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="backdrop-blur-xl border-b border-white/10 bg-gray-950/80 px-4 md:px-6 lg:px-8 py-3 md:py-4 flex justify-between items-center sticky top-0 z-40 gap-4">
      <Link
        to="/dashboard"
        className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent hover:opacity-80 transition-opacity"
      >
        ⚡ RankLeet
      </Link>

      <div className="flex items-center gap-2 flex-wrap">
        {profile && (
          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-2 py-1.5">
            <UserAvatar user={profile} size="sm" className="border border-white/10" title={profile.name} />
            <span className="text-sm text-gray-300 hidden sm:inline">{profile.name}</span>
          </div>
        )}
        <Link
          to="/dashboard"
          className={`px-3 md:px-4 py-2 rounded-lg text-xs md:text-sm font-medium transition-all duration-200 ${
            isActive("/dashboard")
              ? "bg-blue-500/20 border border-blue-500/30 text-blue-300"
              : "text-gray-400 hover:text-white hover:bg-white/5"
          }`}
        >
          🏠 Dashboard
        </Link>

        <Link
          to="/mastery"
          className={`px-3 md:px-4 py-2 rounded-lg text-xs md:text-sm font-medium transition-all duration-200 ${
            isActive("/mastery")
              ? "bg-purple-500/20 border border-purple-500/30 text-purple-300"
              : "text-gray-400 hover:text-white hover:bg-white/5"
          }`}
        >
          🎯 Mastery Plan
        </Link>

        <button
          onClick={logout}
          className="px-3 md:px-4 py-2 rounded-lg text-xs md:text-sm font-medium border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-all duration-200"
        >
          Logout
        </button>
      </div>
    </nav>
  );
}

export default Navbar;
