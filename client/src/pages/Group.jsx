import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API, { cachedGet, invalidateCache } from "../services/api";
import { API_ENDPOINTS } from "../utils/apiConstants";
import { getFrontendUrl } from "../utils/helpers";
import Navbar from "../components/Navbar";
import Leaderboard from "../components/Leaderboard";
import BountyBoard from "../components/BountyBoard";
import AIActivityFeed from "../components/AIActivityFeed";

function Group() {
  const { inviteCode } = useParams();
  const navigate = useNavigate();

  const [members, setMembers] = useState([]);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [group, setGroup] = useState(null);
  const [user, setUser] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // New state from Integration Guide
  const [aiActivity, setAiActivity] = useState([]);
  const [bounties, setBounties] = useState([]);

  const frontendURL = getFrontendUrl();
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
      const groupRes = await cachedGet(
        API_ENDPOINTS.GROUPS.GET_BY_ID(inviteCode),
      );
      setGroup(groupRes.data || groupRes.data);

      // Fetch leaderboard (cached)
      const leaderboardRes = await cachedGet(
        API_ENDPOINTS.GROUPS.LEADERBOARD(inviteCode),
      );
      setMembers(leaderboardRes.data || leaderboardRes.data);

      try {
        // 1. Extract the actual MongoDB _id from the group response we just got
        const actualGroup = groupRes.data?.data || groupRes.data;
        const actualGroupId = actualGroup._id;

        // 2. Pass actualGroupId instead of inviteCode
        const aiRes = await cachedGet(
          API_ENDPOINTS.AI_ACTIVITY.GET_BY_GROUP(actualGroupId),
        );
        setAiActivity(aiRes.data?.data || aiRes.data || []);

        const bountyRes = await cachedGet(
          API_ENDPOINTS.BOUNTIES.GET_BY_GROUP(actualGroupId),
        );
        setBounties(bountyRes.data?.data || bountyRes.data || []);
      } catch (err) {
        console.warn("Failed to fetch AI activity or bounties:", err);
      }

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
    if (isDeleting || !confirm("Delete this group permanently?")) return;
    setIsDeleting(true);
    try {
      await API.delete(API_ENDPOINTS.GROUPS.DELETE(inviteCode));
      // Invalidate caches related to this group and user groups
      invalidateCache(`/groups/${inviteCode}`);
      invalidateCache(API_ENDPOINTS.USERS.GROUPS);
      navigate("/dashboard");
    } catch (err) {
      alert(err.response?.data?.message || "Delete failed");
    } finally {
      setIsDeleting(false);
    }
  };

  // Check if current user is the group creator (handling both populated and unpopulated cases)
  const isCreator =
    user &&
    (group?.createdBy === user._id || group?.createdBy?._id === user._id);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white">
        <Navbar />
        <div className="p-10 text-center text-gray-400">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 text-white">
        <Navbar />
        <div className="p-10 text-center">
          <p className="text-red-400">{error}</p>
          <button
            onClick={() => navigate("/dashboard")}
            className="mt-4 px-4 py-2 bg-blue-600 rounded hover:bg-blue-700 transition"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-white">
      <Navbar />
      <div className="relative z-10 max-w-7xl mx-auto p-8">
        {/* Header */}
        <h1 className="text-4xl font-bold mb-8 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
          🏆 {group?.name || "Group"} Arena
        </h1>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {/* Left Column: Leaderboard + Bounties */}
          <div className="lg:col-span-2 space-y-8">
            {/* Leaderboard Section */}
            <div>
              <h2 className="text-2xl font-bold mb-6">📊 Rankings</h2>
              <Leaderboard members={members} />
            </div>

            {/* Bounty Board Section */}
            <div>
              <BountyBoard
                groupId={group?._id}
                isGroupCreator={isCreator}
                // Optional: pass bounties if your component takes them as props instead of fetching them internally
                bounties={bounties}
              />
            </div>
          </div>

          {/* Right Column: Invite + AI Activity */}
          <div className="space-y-8">
            {/* Invite Members Card */}
            <div className="p-6 rounded-2xl backdrop-blur-xl border border-white/10 bg-gradient-to-br from-gray-900/40 to-gray-900/10">
              <h3 className="text-lg font-bold mb-4">📤 Invite Members</h3>
              <div className="bg-gray-800/50 p-3 rounded-lg mb-3 break-all text-sm text-gray-300 font-mono">
                {inviteLink}
              </div>
              <button
                onClick={copyLink}
                className="w-full px-4 py-2 rounded-lg backdrop-blur-md border border-blue-500/30 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 font-medium transition-all"
              >
                {copied ? "✓ Copied!" : "📋 Copy Invite"}
              </button>

              {isCreator && (
                <button
                  onClick={deleteGroup}
                  disabled={isDeleting}
                  className="w-full mt-3 px-4 py-2 rounded-lg backdrop-blur-md border border-red-500/30 bg-red-500/20 hover:bg-red-500/30 text-red-300 font-medium transition-all disabled:opacity-50"
                >
                  {isDeleting ? "Deleting..." : "🗑️ Delete Group"}
                </button>
              )}
            </div>

            {/* AI Activity Feed */}
            <div>
              <h3 className="text-lg font-bold mb-4">🤖 Weekly Hype</h3>
              <AIActivityFeed feedItems={aiActivity} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Group;
