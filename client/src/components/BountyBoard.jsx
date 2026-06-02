import { useEffect, useState } from "react";
import API from "../services/api";
import { API_ENDPOINTS } from "../utils/apiConstants";
import BountyCard from "./BountyCard";
import PropTypes from "prop-types";

/**
 * BountyBoard Component
 * Displays bounties for a group and allows creating new ones.
 *
 * Props:
 *   groupId         - MongoDB _id of the group
 *   isGroupCreator  - Whether the current user can create bounties
 *   initialBounties - Pre-fetched bounties array (avoids double-fetch)
 *   onBountiesChange - Callback when bounties list changes
 */
export default function BountyBoard({
  groupId,
  isGroupCreator = false,
  initialBounties = null,
  onBountiesChange,
}) {
  const [bounties, setBounties] = useState(initialBounties || []);
  const [loading, setLoading] = useState(initialBounties === null);
  const [error, setError] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const [formData, setFormData] = useState({
    goal: "",
    description: "",
    difficulty: "Medium",
    points: 10,
    deadline: "",
  });

  // Only fetch if no initialBounties were provided
  useEffect(() => {
    if (initialBounties !== null) {
      setBounties(initialBounties);
      setLoading(false);
      return;
    }
    if (!groupId) return;

    const fetchBounties = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await API.get(API_ENDPOINTS.BOUNTIES.GET_BY_GROUP(groupId));
        const rawData = res.data?.data || res.data;
        const list = Array.isArray(rawData) ? rawData : [];
        setBounties(list);
        onBountiesChange?.(list);
      } catch (err) {
        setError(err.message || "Failed to load bounties");
      } finally {
        setLoading(false);
      }
    };

    fetchBounties();
  }, [groupId, initialBounties]);

  // Sync when parent passes updated initialBounties
  useEffect(() => {
    if (initialBounties !== null) {
      setBounties(initialBounties);
    }
  }, [initialBounties]);

  const updateBounties = (newList) => {
    setBounties(newList);
    onBountiesChange?.(newList);
  };

  const handleCreateBounty = async () => {
    if (!formData.goal.trim()) {
      alert("Please enter a bounty goal");
      return;
    }
    setIsCreating(true);
    try {
      const res = await API.post(API_ENDPOINTS.BOUNTIES.CREATE, {
        groupId,
        ...formData,
      });
      const created = res.data?.data || res.data;
      const newList = [created, ...bounties];
      updateBounties(newList);
      setShowCreate(false);
      setFormData({ goal: "", description: "", difficulty: "Medium", points: 10, deadline: "" });
    } catch (err) {
      alert(err.message || "Failed to create bounty");
    } finally {
      setIsCreating(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAccept = async (bountyId) => {
    try {
      const res = await API.post(API_ENDPOINTS.BOUNTIES.ACCEPT(bountyId));
      const updated = res.data?.data || res.data;
      updateBounties(bounties.map((b) => (b._id === bountyId ? updated : b)));
    } catch (err) {
      alert(err.message || "Failed to accept bounty");
    }
  };

  const handleClaim = async (bountyId) => {
    try {
      const res = await API.post(API_ENDPOINTS.BOUNTIES.CLAIM(bountyId));
      const updated = res.data?.data || res.data;
      updateBounties(bounties.map((b) => (b._id === bountyId ? updated : b)));
    } catch (err) {
      alert(err.message || "Failed to claim bounty");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1">⚡ Bounty Board</h2>
          <p className="text-sm text-gray-400">
            {loading ? "Loading..." : `${bounties.length} ${bounties.length === 1 ? "bounty" : "bounties"}`}
          </p>
        </div>
        {isGroupCreator && (
          <button
            onClick={() => setShowCreate(true)}
            className="px-4 py-2 rounded-lg backdrop-blur-md border border-yellow-500/30 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-300 font-medium transition-all duration-300"
          >
            + Create Bounty
          </button>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 rounded-lg border border-red-500/30 bg-red-900/20 text-red-300 text-sm">
          {error}
        </div>
      )}

      {/* Loading skeletons */}
      {loading && (
        <div className="space-y-3 animate-pulse">
          {[1, 2].map((i) => (
            <div key={i} className="p-4 rounded-xl bg-gray-800 space-y-2">
              <div className="h-4 bg-gray-700 rounded w-3/4" />
              <div className="h-3 bg-gray-700 rounded w-1/2" />
            </div>
          ))}
        </div>
      )}

      {/* Bounties List */}
      {!loading && bounties.length === 0 && (
        <div className="p-8 rounded-2xl backdrop-blur-xl border border-white/10 bg-gradient-to-br from-gray-900/40 to-gray-900/10 text-center">
          <p className="text-3xl mb-3">🎯</p>
          <p className="text-gray-400">
            {isGroupCreator
              ? "No bounties yet. Create one to challenge your group!"
              : "No bounties yet. Ask the group creator to add some!"}
          </p>
        </div>
      )}

      {!loading && bounties.length > 0 && (
        <div className="space-y-3">
          {bounties.map((bounty) => (
            <BountyCard
              key={bounty._id}
              bounty={bounty}
              onAccept={handleAccept}
              onClaim={handleClaim}
            />
          ))}
        </div>
      )}

      {/* Create Bounty Modal */}
      {showCreate && (
        <div
          className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-50"
          onClick={() => setShowCreate(false)}
        >
          <div
            className="w-full max-w-md p-8 rounded-2xl backdrop-blur-xl border border-white/10 bg-gradient-to-br from-gray-900/90 to-gray-900/60 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Create Bounty</h2>
              <button onClick={() => setShowCreate(false)} className="text-gray-400 hover:text-white text-2xl leading-none">✕</button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Goal *</label>
                <input
                  type="text"
                  name="goal"
                  placeholder="e.g., Solve 10 Medium problems this week"
                  value={formData.goal}
                  onChange={handleChange}
                  className="w-full p-3 rounded-lg border border-white/10 bg-white/5 text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500/50 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Description</label>
                <textarea
                  name="description"
                  placeholder="Optional details..."
                  value={formData.description}
                  onChange={handleChange}
                  rows={2}
                  className="w-full p-3 rounded-lg border border-white/10 bg-white/5 text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500/50 transition-colors resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Difficulty</label>
                  <select
                    name="difficulty"
                    value={formData.difficulty}
                    onChange={handleChange}
                    className="w-full p-3 rounded-lg border border-white/10 bg-gray-800 text-white focus:outline-none focus:border-yellow-500/50 transition-colors"
                  >
                    <option value="Easy">🟢 Easy</option>
                    <option value="Medium">🟡 Medium</option>
                    <option value="Hard">🔴 Hard</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-1">Points</label>
                  <input
                    type="number"
                    name="points"
                    min="1"
                    max="1000"
                    value={formData.points}
                    onChange={handleChange}
                    className="w-full p-3 rounded-lg border border-white/10 bg-white/5 text-white focus:outline-none focus:border-yellow-500/50 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Deadline (optional)</label>
                <input
                  type="date"
                  name="deadline"
                  value={formData.deadline}
                  onChange={handleChange}
                  className="w-full p-3 rounded-lg border border-white/10 bg-gray-800 text-white focus:outline-none focus:border-yellow-500/50 transition-colors"
                />
              </div>

              <button
                onClick={handleCreateBounty}
                disabled={isCreating || !formData.goal.trim()}
                className="w-full p-3 rounded-lg border border-yellow-500/30 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-300 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
              >
                {isCreating ? "Creating..." : "⚡ Create Bounty"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

BountyBoard.propTypes = {
  groupId: PropTypes.string,
  isGroupCreator: PropTypes.bool,
  initialBounties: PropTypes.array,
  onBountiesChange: PropTypes.func,
};
