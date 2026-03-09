import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../services/api";
import { API_ENDPOINTS } from "../utils/apiConstants";
import Navbar from "../components/Navbar";
import Leaderboard from "../components/Leaderboard";

function Group() {
  const { inviteCode } = useParams();
  const navigate = useNavigate();

  const [members, setMembers] = useState([]);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [group, setGroup] = useState(null);
  const [user, setUser] = useState(null);

  const frontendURL =
    import.meta.env.VITE_FRONTEND_URL || window.location.origin;
  const inviteLink = `${frontendURL}/join/${inviteCode}`;

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      // Validate group ID format
      if (!inviteCode || inviteCode.trim().length === 0) {
        setError("Invalid group ID");
        setLoading(false);
        return;
      }

      // Fetch group details
      const groupRes = await API.get(API_ENDPOINTS.GROUPS.GET_BY_ID(inviteCode));
      setGroup(groupRes.data);

      // Fetch leaderboard
      const leaderboardRes = await API.get(
        API_ENDPOINTS.GROUPS.LEADERBOARD(inviteCode),
      );
      setMembers(leaderboardRes.data);

      // Get current user from token (basic parsing)
      const token = localStorage.getItem("token");
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split(".")[1]));
          setUser({ _id: payload.id });
        } catch (e) {
          console.error("Failed to parse token");
        }
      }
    } catch (err) {
      setError(err.message || "Failed to fetch group");
      console.error("Failed to fetch group", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [inviteCode]);

  const copyLink = () => {
    navigator.clipboard
      .writeText(inviteLink)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => alert("Failed to copy"));
  };

  const deleteGroup = async () => {
    if (!confirm("Delete this group permanently?")) return;
    try {
      await API.delete(API_ENDPOINTS.GROUPS.DELETE(inviteCode));
      navigate("/dashboard");
    } catch (err) {
      alert(err.response?.data?.message || "Delete failed");
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Navbar />
      <div className="max-w-4xl mx-auto p-8">
        <h1 className="text-3xl font-bold mb-6 text-center">
          🏆 {group?.name || "Group"} Leaderboard
        </h1>

        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500 rounded text-red-400">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center text-gray-400 py-10">Loading...</div>
        ) : (
          <>
            <div className="bg-gray-800 p-4 rounded-lg mb-8 flex justify-between items-center">
              <div className="text-gray-300 text-sm break-all">
                Invite:{" "}
                <span className="text-indigo-400 font-mono">{inviteLink}</span>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={copyLink}
                  className="bg-indigo-500 px-4 py-1 rounded"
                >
                  {copied ? "✓ Copied" : "Copy"}
                </button>
                {user && group?.createdBy?._id === user._id && (
                  <button
                    onClick={deleteGroup}
                    className="bg-red-500 px-4 py-1 rounded"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
            <Leaderboard members={members} />
          </>
        )}
      </div>
    </div>
  );
}

export default Group;
