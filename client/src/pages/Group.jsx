import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../services/api";
import { API_ENDPOINTS } from "../utils/apiConstants";
import Navbar from "../components/Navbar";
import Leaderboard from "../components/Leaderboard";

function Group() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [members, setMembers] = useState([]);
  const [inviteCode, setInviteCode] = useState("");
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [group, setGroup] = useState(null);
  const [user, setUser] = useState(null);

  const frontendURL =
    import.meta.env.VITE_FRONTEND_URL || window.location.origin;

  const inviteLink = `${frontendURL}/join/${inviteCode}`;

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError("");
      try {
        // Validate group ID format
        if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
          setError("Invalid group ID");
          setLoading(false);
          return;
        }

        // Fetch group details
        const groupRes = await API.get(API_ENDPOINTS.GROUPS.GET_BY_ID(id));
        setGroup(groupRes.data);
        setInviteCode(groupRes.data.inviteCode || "");

        // Fetch leaderboard
        const leaderboardRes = await API.get(API_ENDPOINTS.GROUPS.LEADERBOARD(id));
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

    fetchData();
  }, [id]);

  const copyLink = () => {
    navigator.clipboard.writeText(inviteLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {
      alert("Failed to copy to clipboard");
    });
  };

  const deleteGroup = async () => {
    if (!confirm("Are you sure you want to delete this group? This action cannot be undone.")) return;
    try {
      await API.delete(API_ENDPOINTS.GROUPS.DELETE(id));
      navigate("/dashboard");
    } catch (err) {
      alert(err.message || "Failed to delete group");
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
          <div className="text-center text-gray-400 py-10">Loading group data...</div>
        ) : (
          <>
            <div className="bg-gray-800 p-4 rounded-lg mb-8 flex justify-between items-center">
              <div className="text-gray-300 text-sm break-all">
                Invite Link:
                <span className="ml-2 text-indigo-400 font-mono text-xs">
                  {inviteCode ? inviteLink : "No invite code"}
                </span>
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={copyLink}
                  disabled={!inviteCode}
                  className="bg-indigo-500 px-4 py-1 rounded hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  {copied ? "✓ Copied" : "Copy"}
                </button>

                {user && group && group.createdBy && user._id === group.createdBy._id && (
                  <button
                    onClick={deleteGroup}
                    className="bg-red-500 px-4 py-1 rounded hover:bg-red-600 transition"
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