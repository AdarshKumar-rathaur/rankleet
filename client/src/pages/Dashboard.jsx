import { useEffect, useState } from "react";
import API, { cachedGet, invalidateCache } from "../services/api";
import { API_ENDPOINTS } from "../utils/apiConstants";
import { parseInviteCode } from "../utils/helpers";
import Navbar from "../components/Navbar";
import StatCard from "../components/StatCard";
import ArenaCard from "../components/ArenaCard";
import AIActivityFeed from "../components/AIActivityFeed";
import { useNavigate } from "react-router-dom";
import { useLocalStorage } from "../hooks/useCustomHooks";

function Dashboard() {
  const [storedProfile, setStoredProfile] = useLocalStorage(
    "rankleet-profile",
    null,
  );
  const [storedGroups, setStoredGroups] = useLocalStorage(
    "rankleet-groups",
    [],
  );

  const [profile, setProfile] = useState(storedProfile);
  const [groups, setGroups] = useState(storedGroups);
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [groupError, setGroupError] = useState("");
  const [loading, setLoading] = useState(
    !storedProfile && storedGroups.length === 0,
  );
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);

  const [aiActivity, setAiActivity] = useState([]);

  const navigate = useNavigate();

  const fetchData = async () => {
    const hasCache = !!storedProfile || storedGroups.length > 0;
    if (!hasCache) {
      setLoading(true);
    } else {
      setIsRefreshing(true);
    }

    try {
      // Added AI Activity Feed fetch to the Promise.all array
      const [profileRes, groupsRes, aiRes] = await Promise.all([
        cachedGet(API_ENDPOINTS.USERS.PROFILE),
        cachedGet(API_ENDPOINTS.USERS.GROUPS),
        cachedGet(API_ENDPOINTS.AI_ACTIVITY.GET_FEED).catch(() => ({
          data: [],
        })),
      ]);

      const freshProfile = profileRes.data;
      const freshGroups = groupsRes.data || [];
      const rawAiData = aiRes?.data;
      const freshAiActivity = Array.isArray(rawAiData?.data)
        ? rawAiData.data
        : Array.isArray(rawAiData)
          ? rawAiData
          : [];

      setProfile(freshProfile);
      setStoredProfile(freshProfile);
      setGroups(freshGroups);
      setStoredGroups(freshGroups);
      setAiActivity(freshAiActivity);
      setGroupError("");
    } catch (err) {
      console.error("Failed to fetch data", err);
      const message = err.message || "Failed to load dashboard";
      setGroupError(hasCache ? `Showing saved data: ${message}` : message);
      if (!hasCache) {
        setProfile(null);
      }
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const createGroup = async () => {
    if (isCreating) return;
    setIsCreating(true);
    try {
      const res = await API.post(API_ENDPOINTS.GROUPS.CREATE, {
        name: groupName,
      });
      setGroups([...groups, res.data]);
      setShowCreate(false);
      setGroupName("");
      navigate(`/group/${res.data.inviteCode}`);
      invalidateCache(API_ENDPOINTS.USERS.GROUPS);
      invalidateCache(API_ENDPOINTS.USERS.PROFILE);
    } catch (err) {
      alert(err.message || "Error creating group");
      setShowCreate(false);
      setGroupName("");
    } finally {
      setIsCreating(false);
    }
  };

  const joinGroup = async () => {
    if (isJoining) return;
    setIsJoining(true);
    try {
      const code = parseInviteCode(inviteCode) || inviteCode;
      if (!code) {
        alert("Please provide a valid invite code or link");
        setShowJoin(false);
        setInviteCode("");
        setIsJoining(false);
        return;
      }

      const res = await API.post(API_ENDPOINTS.GROUPS.JOIN(code));
      setShowJoin(false);
      setInviteCode("");
      navigate(`/group/${code}`);
      invalidateCache(API_ENDPOINTS.USERS.GROUPS);
      invalidateCache(`/groups/${code}`);
    } catch (err) {
      alert(err.message || "Invalid invite code");
      setShowJoin(false);
      setInviteCode("");
    } finally {
      setIsJoining(false);
    }
  };

  if (loading)
    return (
      <div className="p-10 text-center text-gray-400">Loading dashboard...</div>
    );

  if (!profile)
    return (
      <div className="min-h-screen bg-gray-900 text-white">
        <Navbar />
        <div className="p-10 text-center">
          <p className="text-red-400">
            {groupError || "Failed to load profile"}
          </p>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-white">
      {/* Animated background gradient */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
      </div>

      <Navbar />

      <div className="relative z-10 p-8 max-w-7xl mx-auto">
        {/* Welcome Section */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Welcome back, {profile.name}!
              </h1>
              <p className="text-gray-400">
                Keep grinding and climbing the ranks 🚀
              </p>
            </div>
            {isRefreshing && (
              <div className="flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-md border border-blue-500/30 bg-blue-900/20">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
                <span className="text-sm text-blue-300">Syncing...</span>
              </div>
            )}
          </div>

          {/* Stats Cards with Glassmorphism & Animation */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              difficulty="Easy"
              count={profile.stats.easy}
              icon="🟢"
              color="easy"
            />
            <StatCard
              difficulty="Medium"
              count={profile.stats.medium}
              icon="🟡"
              color="medium"
            />
            <StatCard
              difficulty="Hard"
              count={profile.stats.hard}
              icon="🔴"
              color="hard"
            />
            {/* Score Card */}
            <div className="p-6 rounded-2xl backdrop-blur-xl border border-white/10 bg-gradient-to-br from-indigo-900/20 to-indigo-900/5 shadow-2xl shadow-indigo-500/20 transition-all duration-700 transform scale-100 opacity-100 hover:border-white/20 hover:shadow-2xl">
              <div className="relative z-10 flex flex-col justify-center h-full">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-3xl">⭐</span>
                  <h3 className="text-lg font-semibold text-indigo-400">
                    Rank Score
                  </h3>
                </div>
                <div className="text-4xl font-bold text-white mb-3">
                  {profile.stats.score}
                </div>
                <div className="h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent rounded-full" />
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Arena & Bounties */}
          <div className="lg:col-span-2 space-y-8">
            {/* Your Arenas Section */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-1">
                    🏛️ Your Arenas
                  </h2>
                  <p className="text-sm text-gray-400">Join the competition</p>
                </div>
                <div className="space-x-3">
                  <button
                    onClick={() => setShowCreate(true)}
                    className="px-4 py-2 rounded-lg backdrop-blur-md border border-blue-500/30 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 font-medium transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/20"
                  >
                    + Create
                  </button>
                  <button
                    onClick={() => setShowJoin(true)}
                    className="px-4 py-2 rounded-lg backdrop-blur-md border border-emerald-500/30 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-medium transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/20"
                  >
                    + Join
                  </button>
                </div>
              </div>

              {groupError && (
                <div className="mb-6 p-4 rounded-xl backdrop-blur-md border border-red-500/30 bg-red-900/20 text-red-300 flex items-start gap-3">
                  <span className="text-xl flex-shrink-0">⚠️</span>
                  <p>{groupError}</p>
                </div>
              )}

              {groups.length === 0 ? (
                <div className="p-12 rounded-2xl backdrop-blur-xl border border-white/10 bg-gradient-to-br from-gray-900/40 to-gray-900/10 text-center">
                  <p className="text-3xl mb-3">🎯</p>
                  <p className="text-gray-400 mb-4">
                    No arenas yet. Create or join one to get started!
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {groups.map((group) => (
                    <ArenaCard
                      key={group.inviteCode}
                      group={group}
                      members={group.members}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Bounties Section */}
            <div>
              <div className="flex items-center gap-2 mb-6">
                <h2 className="text-2xl font-bold text-white">
                  ⚡ Bounty Board
                </h2>
                <span className="px-3 py-1 rounded-full backdrop-blur-md border border-yellow-500/30 bg-yellow-500/20 text-yellow-300 text-xs font-medium">
                  Coming Soon
                </span>
              </div>
              <div className="p-8 rounded-2xl backdrop-blur-xl border border-white/10 bg-gradient-to-br from-gray-900/40 to-gray-900/10 text-center">
                <p className="text-4xl mb-3">🎁</p>
                <p className="text-gray-400">
                  Stake points on goals with your team inside the Arenas!
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: AI Activity Feed */}
          <div>
            <div className="flex items-center gap-2 mb-6">
              <h2 className="text-2xl font-bold text-white">🤖 AI Hype Feed</h2>
              <span className="px-3 py-1 rounded-full backdrop-blur-md border border-purple-500/30 bg-purple-500/20 text-purple-300 text-xs font-medium">
                Beta
              </span>
            </div>
            <AIActivityFeed feedItems={aiActivity} />
          </div>
        </div>
      </div>

      {/* Create Group Modal */}
      {showCreate && (
        <div
          className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-50"
          onClick={() => setShowCreate(false)}
        >
          <div
            className="w-full max-w-md p-8 rounded-2xl backdrop-blur-xl border border-white/10 bg-gradient-to-br from-gray-900/80 to-gray-900/40 shadow-2xl transform transition-all"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Create Arena</h2>
              <button
                onClick={() => setShowCreate(false)}
                className="text-gray-400 hover:text-white text-2xl"
              >
                ✕
              </button>
            </div>

            <input
              placeholder="Arena name"
              className="w-full p-3 mb-4 rounded-lg backdrop-blur-md border border-white/10 bg-white/5 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500/50 transition-colors"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
            />

            <button
              onClick={createGroup}
              disabled={isCreating || !groupName.trim()}
              className="w-full p-3 rounded-lg backdrop-blur-md border border-blue-500/30 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
            >
              {isCreating ? "Creating..." : "Create Arena"}
            </button>
          </div>
        </div>
      )}

      {/* Join Group Modal */}
      {showJoin && (
        <div
          className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-50"
          onClick={() => setShowJoin(false)}
        >
          <div
            className="w-full max-w-md p-8 rounded-2xl backdrop-blur-xl border border-white/10 bg-gradient-to-br from-gray-900/80 to-gray-900/40 shadow-2xl transform transition-all"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Join Arena</h2>
              <button
                onClick={() => setShowJoin(false)}
                className="text-gray-400 hover:text-white text-2xl"
              >
                ✕
              </button>
            </div>

            <input
              placeholder="Invite code or link"
              className="w-full p-3 mb-4 rounded-lg backdrop-blur-md border border-white/10 bg-white/5 text-white placeholder-gray-400 focus:outline-none focus:border-emerald-500/50 transition-colors"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
            />

            <button
              onClick={joinGroup}
              disabled={isJoining || !inviteCode.trim()}
              className="w-full p-3 rounded-lg backdrop-blur-md border border-emerald-500/30 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
            >
              {isJoining ? "Joining..." : "Join Arena"}
            </button>
          </div>
        </div>
      )}

      {/* Add global animation styles */}
      <style>{`
        @keyframes slideInLeft {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        .animate-slideInLeft {
          animation: slideInLeft 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}

export default Dashboard;
