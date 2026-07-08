import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API, { cachedGet, invalidateCache } from "../services/api";
import { API_ENDPOINTS } from "../utils/apiConstants";
import { getFrontendUrl } from "../utils/helpers";
import Navbar from "../components/Navbar";
import Leaderboard from "../components/Leaderboard";
import BountyBoard from "../components/BountyBoard";
import AIActivityFeed from "../components/AIActivityFeed";

function GroupSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-white">
      <Navbar />
      <div className="relative z-10 max-w-7xl mx-auto p-4 md:p-6 lg:p-8 animate-pulse">
        {/* Title skeleton */}
        <div className="h-10 bg-gray-700 rounded w-1/3 mb-8" />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left column */}
          <div className="lg:col-span-2 space-y-8">
            {/* Leaderboard skeleton */}
            <div className="space-y-4">
              <div className="h-6 bg-gray-700 rounded w-32 mb-4" />
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center gap-4 p-5 rounded-xl bg-gray-800">
                  <div className="w-10 h-10 bg-gray-700 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-700 rounded w-32" />
                    <div className="h-3 bg-gray-700 rounded w-48" />
                  </div>
                  <div className="w-16 h-6 bg-gray-700 rounded" />
                </div>
              ))}
            </div>
            {/* Bounty skeleton */}
            <div className="space-y-3">
              <div className="h-6 bg-gray-700 rounded w-40 mb-4" />
              {[1, 2].map((i) => (
                <div key={i} className="p-4 rounded-xl bg-gray-800 space-y-2">
                  <div className="h-4 bg-gray-700 rounded w-3/4" />
                  <div className="h-3 bg-gray-700 rounded w-1/2" />
                </div>
              ))}
            </div>
          </div>
          {/* Right column */}
          <div className="space-y-8">
            <div className="p-6 rounded-2xl bg-gray-800 space-y-3">
              <div className="h-5 bg-gray-700 rounded w-32" />
              <div className="h-10 bg-gray-700 rounded" />
              <div className="h-10 bg-gray-700 rounded" />
            </div>
            <div className="space-y-3">
              <div className="h-5 bg-gray-700 rounded w-28" />
              {[1, 2].map((i) => (
                <div key={i} className="p-4 rounded-xl bg-gray-800 space-y-2">
                  <div className="h-4 bg-gray-700 rounded w-full" />
                  <div className="h-3 bg-gray-700 rounded w-2/3" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Group() {
  const { inviteCode } = useParams();
  const navigate = useNavigate();

  const [members, setMembers] = useState([]);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [group, setGroup] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const [aiActivity, setAiActivity] = useState([]);
  const [bounties, setBounties] = useState([]);

  const abortRef = useRef(null);

  const frontendURL = getFrontendUrl();
  const inviteLink = `${frontendURL}/join/${inviteCode}`;

  const fetchData = useCallback(async (signal) => {
    setLoading(true);
    setError("");
    try {
      if (!inviteCode || inviteCode.trim().length === 0) {
        setError("Invalid group ID");
        return;
      }

      const [groupRes, leaderboardRes] = await Promise.all([
        cachedGet(API_ENDPOINTS.GROUPS.GET_BY_ID(inviteCode)),
        cachedGet(API_ENDPOINTS.GROUPS.LEADERBOARD(inviteCode)),
      ]);

      if (signal?.aborted) return;

      const actualGroup = groupRes.data?.data || groupRes.data;
      setGroup(actualGroup);
      setMembers(leaderboardRes.data?.data || leaderboardRes.data || []);

      // Fetch AI activity and bounties using the real MongoDB _id
      const actualGroupId = actualGroup?._id;
      if (actualGroupId) {
        try {
          const [aiRes, bountyRes] = await Promise.all([
            cachedGet(API_ENDPOINTS.AI_ACTIVITY.GET_BY_GROUP(actualGroupId)).catch(() => ({ data: [] })),
            cachedGet(API_ENDPOINTS.BOUNTIES.GET_BY_GROUP(actualGroupId)).catch(() => ({ data: [] })),
          ]);
          if (!signal?.aborted) {
            const fetchedAI = aiRes.data?.data || aiRes.data || [];
            setAiActivity(Array.isArray(fetchedAI) ? fetchedAI : []);
            const rawBounties = bountyRes.data?.data || bountyRes.data;
            setBounties(Array.isArray(rawBounties) ? rawBounties : []);

            // If no AI activity exists for this group, trigger a one-time generation
            if (Array.isArray(fetchedAI) && fetchedAI.length === 0) {
              try {
                const genRes = await API.post(
                  API_ENDPOINTS.AI_ACTIVITY.GENERATE(actualGroupId),
                  { type: "hype" }
                );
                const generated = genRes.data?.data || genRes.data;
                if (generated && !signal?.aborted) {
                  setAiActivity([generated]);
                }
              } catch (genErr) {
                // Generation failed silently — feed just stays empty
                console.warn("[Group] AI generation failed:", genErr.message);
              }
            }
          }
        } catch (err) {
          console.warn("Failed to fetch AI activity or bounties:", err);
        }
      }

      const cachedProfile = JSON.parse(localStorage.getItem("rankleet-profile") || "null");
      if (cachedProfile?._id) {
        setCurrentUserId(cachedProfile._id);
      }
    } catch (err) {
      if (!signal?.aborted) {
        setError(err.message || "Failed to fetch group");
        console.error("Failed to fetch group", err);
      }
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [inviteCode]);

  useEffect(() => {
    const controller = new AbortController();
    abortRef.current = controller;
    fetchData(controller.signal);
    return () => controller.abort();
  }, [fetchData]);

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
      invalidateCache(`/groups/${inviteCode}`);
      invalidateCache(API_ENDPOINTS.USERS.GROUPS);
      navigate("/dashboard");
    } catch (err) {
      alert(err.response?.data?.message || err.message || "Delete failed");
    } finally {
      setIsDeleting(false);
    }
  };

  // Determine if current user is the group creator
  // createdBy is populated as { _id: "..." } from the API
  const creatorId = group?.createdBy?._id?.toString() || group?.createdBy?.toString();
  const isCreator = !!(currentUserId && creatorId && creatorId === currentUserId);

  if (loading) return <GroupSkeleton />;

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 text-white">
        <Navbar />
        <div className="p-10 text-center">
          <p className="text-4xl mb-4">😕</p>
          <p className="text-red-400 mb-6">{error}</p>
          <button
            onClick={() => navigate("/dashboard")}
            className="px-6 py-2 bg-blue-600 rounded-lg hover:bg-blue-700 transition font-medium"
          >
            ← Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-white">
      {/* Background blobs */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
      </div>

      <Navbar />

      <div className="relative z-10 max-w-7xl mx-auto p-4 md:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            🏆 {group?.name || "Group"} Arena
          </h1>
          <p className="text-gray-400 mt-1 text-sm">
            {`${members.length} member${members.length !== 1 ? "s" : ""} competing`}
          </p>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Leaderboard + Bounties */}
          <div className="lg:col-span-2 space-y-8">
            {/* Leaderboard */}
            <div>
              <h2 className="text-2xl font-bold mb-4 text-white">📊 Rankings</h2>
              <Leaderboard members={members} />
            </div>

            {/* Bounty Board */}
            <BountyBoard
              groupId={group?._id}
              isGroupCreator={isCreator}
              initialBounties={bounties}
              onBountiesChange={setBounties}
            />
          </div>

          {/* Right Column: Invite + AI Activity */}
          <div className="space-y-8">
            {/* Invite Card */}
            <div className="p-6 rounded-2xl backdrop-blur-xl border border-white/10 bg-gradient-to-br from-gray-900/60 to-gray-900/20">
              <h3 className="text-lg font-bold mb-4 text-white">📤 Invite Members</h3>
              <div className="bg-gray-800/60 p-3 rounded-lg mb-3 break-all text-sm text-gray-300 font-mono border border-white/5">
                {inviteLink}
              </div>
              <button
                onClick={copyLink}
                className="w-full px-4 py-2 rounded-lg backdrop-blur-md border border-blue-500/30 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 font-medium transition-all duration-200"
              >
                {copied ? "✓ Copied!" : "📋 Copy Invite Link"}
              </button>

              {isCreator && (
                <button
                  onClick={deleteGroup}
                  disabled={isDeleting}
                  className="w-full mt-3 px-4 py-2 rounded-lg backdrop-blur-md border border-red-500/30 bg-red-500/20 hover:bg-red-500/30 text-red-300 font-medium transition-all duration-200 disabled:opacity-50"
                >
                  {isDeleting ? "Deleting..." : "🗑️ Delete Group"}
                </button>
              )}
            </div>

            {/* AI Activity Feed */}
            <div>
              <h3 className="text-lg font-bold mb-4 text-white">🤖 Weekly Hype</h3>
              <AIActivityFeed feedItems={aiActivity} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Group;