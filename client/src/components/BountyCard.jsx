import PropTypes from "prop-types";
import { useState } from "react";

export default function BountyCard({ bounty, onAccept, onClaim, isLoading }) {
  const [showDetails, setShowDetails] = useState(false);

  const statusColors = {
    active: "border-blue-500/30 bg-blue-900/10",
    completed: "border-emerald-500/30 bg-emerald-900/10",
    claimed: "border-gray-500/30 bg-gray-900/10",
  };

  const statusBadgeColors = {
    active: "bg-blue-500/20 text-blue-300",
    completed: "bg-emerald-500/20 text-emerald-300",
    claimed: "bg-gray-500/20 text-gray-300",
  };

  const status = bounty.claimed ? "claimed" : bounty.completed ? "completed" : "active";
  const difficultyEmoji = {
    Easy: "🟢",
    Medium: "🟡",
    Hard: "🔴",
  };

  return (
    <div
      className={`p-4 rounded-xl backdrop-blur-md border transition-all duration-300 hover:shadow-lg cursor-pointer ${statusColors[status]}`}
      onClick={() => setShowDetails(!showDetails)}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">{difficultyEmoji[bounty.difficulty]}</span>
            <h3 className="font-semibold text-white truncate">{bounty.goal}</h3>
          </div>
          <p className="text-xs text-gray-400">{bounty.description}</p>
        </div>
        <div
          className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${statusBadgeColors[status]}`}
        >
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </div>
      </div>

      {/* Points & Creator */}
      <div className="flex items-center justify-between text-sm mb-3">
        <div className="flex items-center gap-1 text-yellow-400">
          ⭐ <span className="font-bold">{bounty.points}</span> pts
        </div>
        <p className="text-xs text-gray-500">by {bounty.createdBy?.name || "Unknown"}</p>
      </div>

      {/* Expanded Details */}
      {showDetails && (
        <div className="border-t border-white/10 pt-3 mt-3 space-y-3">
          <div>
            <p className="text-xs text-gray-400 mb-1">Details:</p>
            <p className="text-sm text-gray-300">{bounty.description}</p>
          </div>
          <div className="flex gap-2">
            <p className="text-xs text-gray-400">
              Created: {new Date(bounty.createdAt).toLocaleDateString()}
            </p>
            {bounty.deadline && (
              <p className="text-xs text-orange-400">
                Due: {new Date(bounty.deadline).toLocaleDateString()}
              </p>
            )}
          </div>

          {/* Action Buttons */}
          {status === "active" && !bounty.claimedBy?.includes(localStorage.getItem("userId")) && (
            <div className="flex gap-2 pt-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onAccept?.(bounty._id);
                }}
                disabled={isLoading}
                className="flex-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg text-xs font-medium text-white transition-colors"
              >
                {isLoading ? "..." : "Accept Bounty"}
              </button>
            </div>
          )}

          {status === "completed" && !bounty.claimedBy?.includes(localStorage.getItem("userId")) && (
            <div className="flex gap-2 pt-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onClaim?.(bounty._id);
                }}
                disabled={isLoading}
                className="flex-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-lg text-xs font-medium text-white transition-colors"
              >
                {isLoading ? "..." : "Claim Reward"}
              </button>
            </div>
          )}
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
    claimedBy: PropTypes.arrayOf(PropTypes.string),
    createdBy: PropTypes.shape({
      _id: PropTypes.string,
      name: PropTypes.string,
    }),
    deadline: PropTypes.string,
    createdAt: PropTypes.string,
  }).isRequired,
  onAccept: PropTypes.func,
  onClaim: PropTypes.func,
  isLoading: PropTypes.bool,
};

BountyCard.defaultProps = {
  isLoading: false,
};
