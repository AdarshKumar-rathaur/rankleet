import { Link, useNavigate } from "react-router-dom";

function Navbar() {
  const navigate = useNavigate();

  const logout = () => {
    localStorage.removeItem("token");

    navigate("/");
  };

  return (
    <div className="bg-gray-800 px-8 py-4 flex justify-between items-center shadow">
      <Link to="/dashboard" className="text-2xl font-bold text-indigo-400">
        RankLeet
      </Link>

      <div className="flex items-center gap-6">
        <Link to="/dashboard" className="text-gray-300 hover:text-white">
          Dashboard
        </Link>

        <button
          onClick={logout}
          className="bg-red-500 px-4 py-1 rounded hover:bg-red-600"
        >
          Logout
        </button>
      </div>
    </div>
  );
}

export default Navbar;
