import { useState } from "react";
import PropTypes from "prop-types";

const SORT_OPTIONS = [
  { value: "score", label: "🏆 Rank Score" },
  { value: "total", label: "📚 Total Solved" },
  { value: "contestRating", label: "🎯 Contest Rating" },
  { value: "bountyPoints", label: "⭐ Bounty Points" },
];

const AVATAR_COLORS = [
  "bg-blue-500", "bg-purple-500", "bg-pink-500",
  "bg-indigo-500", "bg-emerald-500", "bg-orange-500",
];

function getInitials(name) {
  if (!name || typeof name !== "string") return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

function getRankBadge(index) {
  if (index === 0) return "🥇";
  if (index === 1) return "🥈";
  if (index === 2) return "🥉";
  return index + 1;
}

function getSortValue(user, sortBy) {
  switch (sortBy) {
    case "score":        return user.stats?.score || 0;
    case "total":        return user.stats?.total || 0;
    case "contestRating": return user.contestRating || 0;
    case "bountyPoints": return user.bountyPoints || 0;
    default:             return user.stats?.score || 0;
  }
}

function getDisplayValue(user, sortBy) {
  const val = getSortValue(user, sortBy);
  return val.toLocaleString();
}

function Leaderboard({ members }) {
  const [sortBy, setSortBy] = useState("score");

  const sortedMembers = [...(members || [])].sort(
    (a, b) => getSortValue(b, sortBy) - getSortValue(a, sortBy)
  );

  if (!members || members.length === 0) {
    return (
      <div className="p-8 text-center text-gray-400 rounded-xl backdrop-blur-xl border border-white/10 bg-gradient-to-br from-gray-900/40 to-gray-900/10">
        <p className="text-2xl mb-2">👥</p>
        <p>No members yet</p>
      </div>
    );
  }

  const currentLabel = SORT_OPTIONS.find((o) => o.value === sortBy)?.label || "Rank Score";

  return (
    <div className="space-y-4">
      {/* Header with filter */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Leaderboard</h3>
        <div className="relative">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="appearance-none pl-3 pr-8 py-2 rounded-lg border border-white/10 bg-gray-800 text-white text-sm focus:outline-none focus:border-indigo-500/50 transition-colors cursor-pointer"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value} className="bg-gray-800 text-white">
                {opt.label}
              </option>
            ))}
          </select>
          {/* Custom dropdown arrow */}
          <div className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-gray-400 text-xs">
            ▼
          </div>
        </div>
      </div>

      {/* Sorted label */}
      <p className="text-xs text-gray-500">Sorted by {currentLabel}</p>

      {/* Member rows */}
      {sortedMembers.map((user, index) => (
        <div
          key={user._id || `user-${index}`}
          className={`flex items-center justify-between p-4 rounded-xl border transition-all duration-200 hover:scale-[1.01]
            ${index === 0 ? "bg-yellow-600/15 border-yellow-500/40" : ""}
            ${index === 1 ? "bg-gray-400/10 border-gray-400/30" : ""}
            ${index === 2 ? "bg-orange-600/15 border-orange-500/40" : ""}
            ${index > 2 ? "bg-gray-800/60 border-white/5" : ""}
          `}
        >
          {/* Rank */}
          <div className="text-2xl font-bold w-10 flex-shrink-0 text-center">
            {getRankBadge(index)}
          </div>

          {/* Avatar */}
          <div
            className={`w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xs font-bold ${AVATAR_COLORS[index % AVATAR_COLORS.length]}`}
            title={user.name}
          >
            {getInitials(user.name)}
          </div>

          {/* Name & stats */}
          <div className="flex-1 ml-3 min-w-0">
            <p className="font-semibold text-white truncate">{user.name}</p>
            <p className="text-gray-400 text-xs mt-0.5">
              <span className="text-green-400">E:{user.stats?.easy || 0}</span>
              {" · "}
              <span className="text-yellow-400">M:{user.stats?.medium || 0}</span>
              {" · "}
              <span className="text-red-400">H:{user.stats?.hard || 0}</span>
            </p>
          </div>

          {/* Score */}
          <div className="text-right flex-shrink-0 ml-3">
            <div className="text-lg font-bold text-indigo-400">
              {getDisplayValue(user, sortBy)}
            </div>
            <div className="text-xs text-gray-500">
              {sortBy === "score" && "pts"}
              {sortBy === "total" && "solved"}
              {sortBy === "contestRating" && "rating"}
              {sortBy === "bountyPoints" && "bounty pts"}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

Leaderboard.propTypes = {
  members: PropTypes.arrayOf(
    PropTypes.shape({
      _id: PropTypes.string,
      name: PropTypes.string,
      stats: PropTypes.shape({
        easy: PropTypes.number,
        medium: PropTypes.number,
        hard: PropTypes.number,
        total: PropTypes.number,
        score: PropTypes.number,
      }),
      contestRating: PropTypes.number,
      bountyPoints: PropTypes.number,
    })
  ),
};

export default Leaderboard;
