function Leaderboard({ members }) {
  const getRankBadge = (index) => {
    if (index === 0) return "🥇";
    if (index === 1) return "🥈";
    if (index === 2) return "🥉";

    return index + 1;
  };

  if (!members || members.length === 0) {
    return (
      <div className="p-8 text-center text-gray-400 bg-gray-800 rounded-xl">
        No members yet
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {members.map((user, index) => (
        <div
          key={user._id}
          className={`flex items-center justify-between p-5 rounded-xl shadow transition hover:scale-[1.02]
          ${index === 0 ? "bg-yellow-600/20 border border-yellow-500" : ""}
          ${index === 1 ? "bg-gray-400/10 border border-gray-400" : ""}
          ${index === 2 ? "bg-orange-600/20 border border-orange-500" : ""}
          ${index > 2 ? "bg-gray-800" : ""}
          `}
        >
          {/* Rank */}

          <div className="text-2xl font-bold w-12">{getRankBadge(index)}</div>

          {/* Name */}

          <div className="flex-1 ml-4">
            <p className="font-semibold text-lg">{user.name}</p>

            <p className="text-gray-400 text-sm">
              Easy {user.stats?.easy || 0} · Medium {user.stats?.medium || 0} · Hard{" "}
              {user.stats?.hard || 0}
            </p>
          </div>

          {/* Score */}

          <div className="text-xl font-bold text-indigo-400">
            {user.stats?.score || 0}
          </div>
        </div>
      ))}
    </div>
  );
}

export default Leaderboard;
