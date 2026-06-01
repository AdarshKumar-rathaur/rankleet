import { useEffect, useState } from "react";
import API from "../services/api";
import { API_ENDPOINTS } from "../utils/apiConstants";
import BountyCard from "./BountyCard";
import PropTypes from "prop-types";

/**
 * BountyBoard Component
 * Displays bounties for a group and allows creating new ones
 *
 * Props:
 *   groupId: String - The group ID to fetch bounties for
 *   isGroupCreator: Boolean - Whether user can create bounties
 */
export default function BountyBoard({ groupId, isGroupCreator = false }) {
  const [bounties, setBounties] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    goal: "",
    description: "",
    difficulty: "Medium",
    points: 10,
    deadline: "",
  });

  // Fetch bounties
  const fetchBounties = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await API.get(API_ENDPOINTS.BOUNTIES.GET_BY_GROUP(groupId));

      // Safely extract the array from the standardized response
      const rawData = res.data?.data || res.data;
      setBounties(Array.isArray(rawData) ? rawData : []);
    } catch (err) {
      setError(err.message || "Failed to load bounties");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (groupId) {
      fetchBounties();
    }
  }, [groupId]);

  // Create bounty
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
      setBounties([res.data, ...bounties]);
      setShowCreate(false);
      setFormData({
        goal: "",
        description: "",
        difficulty: "Medium",
        points: 10,
        deadline: "",
      });
    } catch (err) {
      alert(err.message || "Failed to create bounty");
    } finally {
      setIsCreating(false);
    }
  };

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Accept bounty
  const handleAccept = async (bountyId) => {
    try {
      const res = await API.post(API_ENDPOINTS.BOUNTIES.ACCEPT(bountyId));
      // Update local state
      setBounties((prev) =>
        prev.map((b) => (b._id === bountyId ? res.data : b)),
      );
    } catch (err) {
      alert(err.message || "Failed to accept bounty");
    }
  };

  // Claim bounty
  const handleClaim = async (bountyId) => {
    try {
      const res = await API.post(API_ENDPOINTS.BOUNTIES.CLAIM(bountyId));
      setBounties((prev) =>
        prev.map((b) => (b._id === bountyId ? res.data : b)),
      );
    } catch (err) {
      alert(err.message || "Failed to claim bounty");
    }
  };

  if (loading) {
    return <div className="text-center text-gray-400">Loading bounties...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1">
            ⚡ Bounty Board
          </h2>
          <p className="text-sm text-gray-400">
            {bounties.length} active bounty{bounties.length !== 1 ? "ies" : ""}
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

      {/* Error Message */}
      {error && (
        <div className="p-4 rounded-lg backdrop-blur-md border border-red-500/30 bg-red-900/20 text-red-300">
          {error}
        </div>
      )}

      {/* Bounties List */}
      {bounties.length === 0 ? (
        <div className="p-8 rounded-2xl backdrop-blur-xl border border-white/10 bg-gradient-to-br from-gray-900/40 to-gray-900/10 text-center">
          <p className="text-gray-400">
            No bounties yet. Create one to get started!
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {bounties.map((bounty) => (
            <BountyCard
              key={bounty._id}
              bounty={bounty}
              onAccept={() => handleAccept(bounty._id)}
              onClaim={() => handleClaim(bounty._id)}
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
            className="w-full max-w-md p-8 rounded-2xl backdrop-blur-xl border border-white/10 bg-gradient-to-br from-gray-900/80 to-gray-900/40 shadow-2xl transform transition-all"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Create Bounty</h2>
              <button
                onClick={() => setShowCreate(false)}
                className="text-gray-400 hover:text-white text-2xl"
              >
                ✕
              </button>
            </div>

            {/* Goal Input */}
            <div className="mb-4">
              <label className="block text-sm text-gray-400 mb-2">Goal</label>
              <input
                type="text"
                name="goal"
                placeholder="e.g., Solve 10 Medium problems"
                value={formData.goal}
                onChange={handleChange}
                className="w-full p-3 rounded-lg backdrop-blur-md border border-white/10 bg-white/5 text-white placeholder-gray-400 focus:outline-none focus:border-yellow-500/50 transition-colors"
              />
            </div>

            {/* Description */}
            <div className="mb-4">
              <label className="block text-sm text-gray-400 mb-2">
                Description
              </label>
              <textarea
                name="description"
                placeholder="Optional: Describe the bounty..."
                value={formData.description}
                onChange={handleChange}
                rows={3}
                className="w-full p-3 rounded-lg backdrop-blur-md border border-white/10 bg-white/5 text-white placeholder-gray-400 focus:outline-none focus:border-yellow-500/50 transition-colors resize-none"
              />
            </div>

            {/* Difficulty */}
            <div className="mb-4">
              <label className="block text-sm text-gray-400 mb-2">
                Difficulty
              </label>
              <select
                name="difficulty"
                value={formData.difficulty}
                onChange={handleChange}
                className="w-full p-3 rounded-lg backdrop-blur-md border border-white/10 bg-white/5 text-white focus:outline-none focus:border-yellow-500/50 transition-colors"
              >
                <option value="Easy">🟢 Easy</option>
                <option value="Medium">🟡 Medium</option>
                <option value="Hard">🔴 Hard</option>
              </select>
            </div>

            {/* Points */}
            <div className="mb-4">
              <label className="block text-sm text-gray-400 mb-2">Points</label>
              <input
                type="number"
                name="points"
                min="1"
                max="1000"
                value={formData.points}
                onChange={handleChange}
                className="w-full p-3 rounded-lg backdrop-blur-md border border-white/10 bg-white/5 text-white focus:outline-none focus:border-yellow-500/50 transition-colors"
              />
            </div>

            {/* Deadline (Optional) */}
            <div className="mb-6">
              <label className="block text-sm text-gray-400 mb-2">
                Deadline (Optional)
              </label>
              <input
                type="date"
                name="deadline"
                value={formData.deadline}
                onChange={handleChange}
                className="w-full p-3 rounded-lg backdrop-blur-md border border-white/10 bg-white/5 text-white focus:outline-none focus:border-yellow-500/50 transition-colors"
              />
            </div>

            {/* Submit Button */}
            <button
              onClick={handleCreateBounty}
              disabled={isCreating}
              className="w-full p-3 rounded-lg backdrop-blur-md border border-yellow-500/30 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-300 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
            >
              {isCreating ? "Creating..." : "Create Bounty"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

BountyBoard.propTypes = {
  groupId: PropTypes.string.isRequired,
  isGroupCreator: PropTypes.bool,
};

BountyBoard.defaultProps = {
  isGroupCreator: false,
};
