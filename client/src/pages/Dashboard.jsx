import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import API, { cachedGet, invalidateCache } from "../services/api";
import { API_ENDPOINTS } from "../utils/apiConstants";
import { parseInviteCode } from "../utils/helpers";
import Navbar from "../components/Navbar";
import StatCard from "../components/StatCard";
import ArenaCard from "../components/ArenaCard";
import BountyPointsCard from "../components/BountyPointsCard";
import AIActivityFeed from "../components/AIActivityFeed";
import ContestGraph from "../components/ContestGraph";
import StreakHeatmap from "../components/StreakHeatmap";
import {
  StatCardSkeleton,
  ArenaCardSkeleton,
  ActivityFeedSkeleton,
} from "../components/SkeletonLoaders";
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
  const [leetcodeTotals, setLeetcodeTotals] = useState({
    easy: 900,
    medium: 1800,
    hard: 800,
  });

  const [hasSyncedBountyPoints, setHasSyncedBountyPoints] = useState(false);

  const navigate = useNavigate();
  const abortControllerRef = useRef(null);
  const refreshTimerRef = useRef(null);

  const fetchData = async (signal, bustCache = false) => {
    const hasCache = !!storedProfile || storedGroups.length > 0;
    if (!hasCache) {
      setLoading(true);
    } else {
      setIsRefreshing(true);
    }

    try {
      if (bustCache) {
        invalidateCache(API_ENDPOINTS.USERS.PROFILE);
        invalidateCache(API_ENDPOINTS.USERS.GROUPS);
      }

      const [profileRes, groupsRes, aiRes, totalsRes] = await Promise.all([
        cachedGet(API_ENDPOINTS.USERS.PROFILE),
        cachedGet(API_ENDPOINTS.USERS.GROUPS),
        cachedGet(API_ENDPOINTS.AI_ACTIVITY.GET_FEED).catch(() => ({
          data: [],
        })),
        cachedGet(API_ENDPOINTS.USERS.LEETCODE_TOTALS).catch(() => ({
          data: { easy: 900, medium: 1800, hard: 800 },
        })),
      ]);

      if (signal?.aborted) return;

      const freshProfile = profileRes.data;
      const freshGroups = groupsRes.data || [];
      const rawAiData = aiRes?.data;
      const freshAiActivity = Array.isArray(rawAiData?.data)
        ? rawAiData.data
        : Array.isArray(rawAiData)
          ? rawAiData
          : [];
      const rawTotals = totalsRes?.data;
      const freshTotals = rawTotals?.data || {
        easy: 900,
        medium: 1800,
        hard: 800,
      };

      setProfile(freshProfile);
      setStoredProfile(freshProfile);
      setGroups(freshGroups);
      setStoredGroups(freshGroups);
      setAiActivity(freshAiActivity);
      setLeetcodeTotals(freshTotals);
      setGroupError("");

      // If contest/calendar data is missing, call the sync refresh endpoint
      // which fetches directly from LeetCode and returns updated data
      const missingContest = !freshProfile.contestHistory?.length;
      const missingCalendar =
        !freshProfile.submissionCalendar ||
        Object.keys(freshProfile.submissionCalendar || {}).length === 0;

      if ((missingContest || missingCalendar) && !bustCache) {
        if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
        refreshTimerRef.current = setTimeout(async () => {
          if (signal?.aborted) return;
          try {
            // POST /users/refresh — waits for LeetCode API, returns fresh profile
            const refreshRes = await API.post(API_ENDPOINTS.USERS.REFRESH);
            const refreshedProfile = refreshRes.data;
            if (refreshedProfile && !signal?.aborted) {
              setProfile(refreshedProfile);
              setStoredProfile(refreshedProfile);
              // Also bust the GET /profile cache so next load gets fresh data
              invalidateCache(API_ENDPOINTS.USERS.PROFILE);
            }
          } catch (refreshErr) {
            console.warn(
              "[Dashboard] Sync refresh failed:",
              refreshErr.message,
            );
            // Fall back to re-reading from DB (may still be empty but that's ok)
            invalidateCache(API_ENDPOINTS.USERS.PROFILE);
            try {
              const retryRes = await cachedGet(API_ENDPOINTS.USERS.PROFILE);
              if (retryRes.data && !signal?.aborted) {
                setProfile(retryRes.data);
                setStoredProfile(retryRes.data);
              }
            } catch {
              // silent
            }
          }
        }, 2000); // 2s delay — give the background setImmediate a head start
      }
    } catch (err) {
      if (signal?.aborted) return;
      console.error("Failed to fetch data", err);
      const message = err.message || "Failed to load dashboard";
      const hasCache = !!storedProfile || storedGroups.length > 0;
      setGroupError(hasCache ? `Showing saved data: ${message}` : message);
      if (!hasCache) setProfile(null);
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
        setIsRefreshing(false);
      }
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    abortControllerRef.current = controller;
    fetchData(controller.signal);

    return () => {
      controller.abort();
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    };
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
      await API.post(API_ENDPOINTS.GROUPS.JOIN(code));
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

  const handlePointsSynced = (updatedPoints) => {
    if (!profile) return;
    const refreshedProfile = { ...profile, bountyPoints: updatedPoints };
    setProfile(refreshedProfile);
    setStoredProfile(refreshedProfile);
  };

  // ── Loading skeleton ─────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-white">
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
        </div>
        <Navbar />
        <div className="relative z-10 p-8 max-w-7xl mx-auto">
          <div className="mb-12">
            <div className="h-10 bg-gray-700 rounded w-1/3 mb-4 animate-pulse" />
            <div className="h-4 bg-gray-700 rounded w-1/4 mb-8 animate-pulse" />
            <StatCardSkeleton />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <div className="h-80 bg-gray-800/60 rounded-2xl animate-pulse" />
            <div className="h-80 bg-gray-800/60 rounded-2xl animate-pulse" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <ArenaCardSkeleton />
            </div>
            <div>
              <ActivityFeedSkeleton />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Error / no profile ───────────────────────────────────────────────────
  if (!profile) {
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
  }

  // ── Main render ──────────────────────────────────────────────────────────
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
              <p className="text-gray-400">Keep grinding and climbing the ranks 🚀</p>
            </div>
            {isRefreshing && (
              <div className="flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-md border border-blue-500/30 bg-blue-900/20">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
                <span className="text-sm text-blue-300">Syncing...</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
            <div className="xl:col-span-3 space-y-6">
              <div className="p-6 rounded-2xl backdrop-blur-xl border border-white/10 bg-gradient-to-br from-slate-900/20 to-slate-900/5 shadow-2xl shadow-slate-500/10">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-white">💻 LeetCode Progress</h2>
                    <p className="text-sm text-gray-400">Your solved problems, contests and streaks in one view.</p>
                  </div>
                  <div className="text-sm text-gray-400">{profile.leetcodeUsername}</div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <StatCard
                    difficulty="Easy"
                    count={profile.stats.easy}
                    icon="🟢"
                    color="easy"
                    totalCount={leetcodeTotals.easy}
                  />
                  <StatCard
                    difficulty="Medium"
                    count={profile.stats.medium}
                    icon="🟡"
                    color="medium"
                    totalCount={leetcodeTotals.medium}
                  />
                  <StatCard
                    difficulty="Hard"
                    count={profile.stats.hard}
                    icon="🔴"
                    color="hard"
                    totalCount={leetcodeTotals.hard}
                  />
                  <StatCard
                    difficulty="Total"
                    count={profile.stats.total}
                    icon="🔵"
                    color="total"
                    totalCount={leetcodeTotals.total}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <ContestGraph contestHistory={profile.contestHistory || []} />
                <StreakHeatmap
                  submissionCalendar={profile.submissionCalendar || {}}
                />
              </div>
            </div>

            <div className="xl:col-span-3 space-y-6">
              <div className="p-6 rounded-2xl backdrop-blur-xl border border-white/10 bg-gradient-to-br from-indigo-900/20 to-blue-900/10 shadow-2xl shadow-indigo-500/10">
                <div className="flex items-center justify-between gap-4 mb-4">
                  <div>
                    <h2 className="text-2xl font-bold text-white">🏅 Bounty & Rank</h2>
                    <p className="text-sm text-gray-400">Your competitive currency and ranking summary.</p>
                  </div>
                </div>
                <div className="space-y-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <BountyPointsCard
                    bountyPoints={profile.bountyPoints}
                    onPointsSynced={handlePointsSynced}
                  />
                  <div className="p-6 rounded-2xl border border-white/10 bg-slate-950/60">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-3xl">⭐</span>
                      <div>
                        <h3 className="text-lg font-semibold text-white">Rank Score</h3>
                        <p className="text-sm text-gray-400">A measure of your overall competition strength.</p>
                      </div>
                    </div>
                    <div className="text-5xl font-bold text-white">
                      {profile.stats.score}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Mastery Plan CTA */}
          <div className="mb-8">
            <div
              onClick={() => navigate("/mastery")}
              className="group cursor-pointer p-6 rounded-2xl backdrop-blur-xl border border-purple-500/20 bg-gradient-to-br from-purple-900/20 to-indigo-900/10 shadow-xl hover:shadow-purple-500/20 hover:border-purple-500/30 transition-all duration-300"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="text-4xl">🎯</span>
                  <div>
                    <h2 className="text-xl font-bold text-white mb-1">Your Mastery Plan</h2>
                    <p className="text-gray-400 text-sm">
                      {profile.masteryPath
                        ? `${profile.masteryPath.title || "View your personalized learning roadmap"}`
                        : "AI is generating your personalized learning roadmap..."}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 rounded-lg border border-purple-500/30 bg-purple-500/20 group-hover:bg-purple-500/30 text-purple-300 font-medium text-sm transition-all duration-200">
                  View Plan
                  <span className="group-hover:translate-x-1 transition-transform">→</span>
                </div>
              </div>

              {/* Preview of mastery level if available */}
              {profile.masteryPath?.level && (
                <div className="mt-4 pt-4 border-t border-white/5 flex items-center gap-3">
                  <span className="px-3 py-1 rounded-full text-xs font-semibold border bg-purple-500/20 border-purple-500/30 text-purple-300 capitalize">
                    {profile.masteryPath.level}
                  </span>
                  <span className="text-xs text-gray-500">
                    {profile.masteryPath.steps?.length || 0} steps in your plan
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Left Column: Arenas */}
          <div className="lg:col-span-2 space-y-8">
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-1">🏛️ Your Arenas</h2>
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
          </div>

          {/* Right Column: AI Activity Feed */}
          <div>
            <h2 className="text-2xl font-bold text-white mb-4">
              🤖 AI Activity Feed
            </h2>
            <AIActivityFeed feedItems={aiActivity} />
          </div>
        </div>

        {/* Create Group Modal */}
        {showCreate && (
          <div
            className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-50"
            onClick={() => setShowCreate(false)}
          >
            <div
              className="w-full max-w-md p-8 rounded-2xl backdrop-blur-xl border border-white/10 bg-gradient-to-br from-gray-900/80 to-gray-900/40 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-2xl font-bold mb-4">Create a New Arena</h2>
              <input
                type="text"
                placeholder="Arena name (e.g., 'Tech Giants')"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                onKeyDown={(e) =>
                  e.key === "Enter" && groupName.trim() && createGroup()
                }
                className="w-full p-3 rounded-lg bg-gray-800 border border-white/10 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500/50 mb-4"
              />
              <div className="flex gap-3">
                <button
                  onClick={createGroup}
                  disabled={!groupName.trim() || isCreating}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg text-white font-medium transition-colors"
                >
                  {isCreating ? "Creating..." : "Create"}
                </button>
                <button
                  onClick={() => setShowCreate(false)}
                  className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
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
              className="w-full max-w-md p-8 rounded-2xl backdrop-blur-xl border border-white/10 bg-gradient-to-br from-gray-900/80 to-gray-900/40 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-2xl font-bold mb-4">Join an Arena</h2>
              <input
                type="text"
                placeholder="Paste invite code or link"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                onKeyDown={(e) =>
                  e.key === "Enter" && inviteCode.trim() && joinGroup()
                }
                className="w-full p-3 rounded-lg bg-gray-800 border border-white/10 text-white placeholder-gray-400 focus:outline-none focus:border-emerald-500/50 mb-4"
              />
              <div className="flex gap-3">
                <button
                  onClick={joinGroup}
                  disabled={!inviteCode.trim() || isJoining}
                  className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-lg text-white font-medium transition-colors"
                >
                  {isJoining ? "Joining..." : "Join"}
                </button>
                <button
                  onClick={() => setShowJoin(false)}
                  className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
