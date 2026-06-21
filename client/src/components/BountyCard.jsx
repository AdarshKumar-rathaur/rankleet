import PropTypes from "prop-types";
import { useState } from "react";

const objectiveLabel = {
  EASY: "Easy solves",
  MEDIUM: "Medium solves",
  HARD: "Hard solves",
  TOTAL: "Total solves",
};

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

export default function BountyCard({ bounty, onJoin }) {
  const [showDetails, setShowDetails] = useState(false);
  const [isJoining, setIsJoining] = useState(false);

  const currentUserId = getCurrentUserId();
  const isOpen = bounty.status === "OPEN";
  const deadlineDate = new Date(bounty.deadline);
  const isExpired = new Date() >= deadlineDate;
  const hasJoined = bounty.participants?.some(
    (participant) => participant.user && participant.user._id?.toString() === currentUserId
  );
  const displayDeadline = new Date(deadlineDate.getTime() - 1);

  const handleJoin = async (e) => {
    e.stopPropagation();
    if (!isOpen || isJoining) return;
    setIsJoining(true);
    try {
      await onJoin?.(bounty._id);
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <div
      className={`p-5 rounded-2xl backdrop-blur-md border transition-all duration-300 hover:shadow-lg ${
        isOpen ? "border-blue-500/25 bg-blue-900/10" : "border-gray-500/20 bg-gray-900/20"
      }`}
      onClick={() => setShowDetails(!showDetails)}
    >
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="min-w-0">
          <h3 className="text-xl font-semibold text-white truncate">{bounty.title}</h3>
          <p className="text-sm text-gray-400 truncate">
            {objectiveLabel[bounty.objectiveType] || bounty.objectiveType} • {bounty.targetAmount}
          </p>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${isOpen ? "bg-blue-500/20 text-blue-300" : "bg-gray-700/20 text-gray-300"}`}>
          {bounty.status}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm text-gray-300 mb-4">
        <div className="rounded-xl bg-white/5 p-3">
          <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Pool</p>
          <p className="text-lg font-semibold text-white">{bounty.totalPool}</p>
        </div>
        <div className="rounded-xl bg-white/5 p-3">
          <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Participants</p>
          <p className="text-lg font-semibold text-white">{bounty.participants?.length || 0}</p>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-gray-400 mb-4">
        <span>Deadline: {displayDeadline.toLocaleDateString()} at midnight</span>
        <span>{hasJoined ? "You joined" : isExpired ? "Expired" : "Open to join"}</span>
      </div>

      {showDetails && bounty.description && (
        <div className="mb-4 text-sm text-gray-300">
          {bounty.description}
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={handleJoin}
          disabled={!isOpen || isExpired || hasJoined || isJoining}
          className="flex-1 px-4 py-3 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-semibold transition hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {hasJoined ? "Joined" : isExpired ? "Expired" : isJoining ? "Joining..." : "Join Bounty"}
        </button>
      </div>
    </div>
  );
}

BountyCard.propTypes = {
  bounty: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    objectiveType: PropTypes.oneOf(["EASY", "MEDIUM", "HARD", "TOTAL"]).isRequired,
    targetAmount: PropTypes.number.isRequired,
    deadline: PropTypes.string.isRequired,
    totalPool: PropTypes.number,
    status: PropTypes.oneOf(["OPEN", "RESOLVED"]),
    participants: PropTypes.array,
    description: PropTypes.string,
  }).isRequired,
  onJoin: PropTypes.func,
};
