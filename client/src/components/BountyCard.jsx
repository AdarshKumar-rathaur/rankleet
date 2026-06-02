import PropTypes from "prop-types";
import { useState } from "react";

/**
 * Get current user ID from JWT token stored in localStorage
 */
function getCurrentUserId() {
  try {
    const token = localStorage.getItem("token");
    if (!token) return null;
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.id || null;
  } catch {
    return null;
  }
}

export default function BountyCard({ bounty, onAccept, onClaim }) {
  const [showDetails, setShowDetails] = useState(false);
  const [isActing, setIsActing] = useState(false);

  const currentUserId = getCurrentUserId();

  const statusColors = {
    active: "border-blue-500/30 bg-blue-900/10",
    completed: "border-emerald-500/30 bg-emerald-900/10",
    claimed: "border-gray-500/30 bg-gray-900/10",
  };

  const statusBadgeColors = {
    active: "bg-blue-500/20 text-blue-300 border border-blue-500/30",
    completed: "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30",
    claimed: "bg-gray-500/20 text-gray-300 border border-gray-500/30",
  };

  const status = bounty.claimed ? "claimed" : bounty.completed ? "completed" : "active";

  const difficultyEmoji = { Easy: "🟢", Medium: "🟡", Hard: "🔴" };

  // Check if current user has already accepted this bounty
  const hasAccepted = currentUserId
    ? (bounty.acceptedBy || []).some(
        (id) => (typeof id === "object" ? id._id?.toString() : id?.toString()) === currentUserId
      )
    : false;

  // Check if current user has already claimed this bounty
  const hasClaimed = currentUserId
    ? (bounty.claimedBy || []).some(
        (id) => (typeof id === "object" ? id._id?.toString() : id?.toString()) === currentUserId
      )
    : false;

  const handleAccept = async (e) => {
    e.stopPropagation();
    if (isActing) return;
    setIsActing(true);
    try {
      await onAccept?.(bounty._id);
    } finally {
      setIsActing(false);
    }
  };

  const handleClaim = async (e) => {
    e.stopPropagation();
    if (isActing) return;
    setIsActing(true);
    try {
      await onClaim?.(bounty._id);
    } finally {
      setIsActing(false);
    }
  };

  return (
    <div
      className={`p-4 rounded-xl backdrop-blur-md border transition-all duration-300 hover:shadow-lg cursor-pointer ${statusColors[status]}`}
      onClick={() => setShowDetails(!showDetails)}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0 mr-3">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg flex-shrink-0">{difficultyEmoji[bounty.difficulty] || "⚡"}</span>
            <h3 className="font-semibold text-white truncate">{bounty.goal}</h3>
          </div>
          {bounty.description && (
            <p className="text-xs text-gray-400 truncate">{bounty.description}</p>
          )}
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap flex-shrink-0 ${statusBadgeColors[status]}`}>
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
      </div>

      {/* Points & Creator */}
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-1 text-yellow-400 font-bold">
          ⭐ {bounty.points} pts
        </div>
        <p className="text-xs text-gray-500">by {bounty.createdBy?.name || "Unknown"}</p>
      </div>

      {/* Expanded Details */}
      {showDetails && (
        <div className="border-t border-white/10 pt-3 mt-3 space-y-3">
          {bounty.description && (
            <div>
              <p className="text-xs text-gray-400 mb-1">Description</p>
              <p className="text-sm text-gray-300">{bounty.description}</p>
            </div>
          )}

          <div className="flex flex-wrap gap-3 text-xs text-gray-400">
            <span>Created: {new Date(bounty.createdAt).toLocaleDateString()}</span>
            {bounty.deadline && (
              <span className="text-orange-400">
                Due: {new Date(bounty.deadline).toLocaleDateString()}
              </span>
            )}
            {bounty.acceptedBy?.length > 0 && (
              <span className="text-blue-400">{bounty.acceptedBy.length} accepted</span>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-1">
            {/* Accept: show when active and user hasn't accepted yet */}
            {status === "active" && !hasAccepted && (
              <button
                onClick={handleAccept}
                disabled={isActing}
                className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg text-xs font-medium text-white transition-colors"
              >
                {isActing ? "..." : "✋ Accept Bounty"}
              </button>
            )}

            {/* Already accepted badge */}
            {status === "active" && hasAccepted && (
              <div className="flex-1 px-3 py-2 rounded-lg text-xs font-medium text-blue-300 bg-blue-900/20 border border-blue-500/20 text-center">
                ✓ Accepted
              </div>
            )}

            {/* Claim: show when completed, user accepted it, and hasn't claimed yet */}
            {status === "completed" && hasAccepted && !hasClaimed && (
              <button
                onClick={handleClaim}
                disabled={isActing}
                className="flex-1 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-lg text-xs font-medium text-white transition-colors"
              >
                {isActing ? "..." : "🎁 Claim Reward"}
              </button>
            )}

            {/* Already claimed badge */}
            {hasClaimed && (
              <div className="flex-1 px-3 py-2 rounded-lg text-xs font-medium text-emerald-300 bg-emerald-900/20 border border-emerald-500/20 text-center">
                ✓ Reward Claimed
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

BountyCard.propTypes = {
  bounty: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    goal: PropTypes.string.isRequired,
    description: PropTypes.string,
    difficulty: PropTypes.oneOf(["Easy", "Medium", "Hard"]).isRequired,
    points: PropTypes.number.isRequired,
    completed: PropTypes.bool,
    claimed: PropTypes.bool,
    acceptedBy: PropTypes.array,
    claimedBy: PropTypes.array,
    createdBy: PropTypes.shape({
      _id: PropTypes.string,
      name: PropTypes.string,
    }),
    deadline: PropTypes.string,
    createdAt: PropTypes.string,
  }).isRequired,
  onAccept: PropTypes.func,
  onClaim: PropTypes.func,
};
