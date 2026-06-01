import PropTypes from "prop-types";
import { useNavigate } from "react-router-dom";

export default function ArenaCard({ group, members }) {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/group/${group.inviteCode}`);
  };

  // Generate avatar colors based on member index
  const getAvatarColor = (index) => {
    const colors = [
      "bg-blue-500",
      "bg-purple-500",
      "bg-pink-500",
      "bg-indigo-500",
      "bg-violet-500",
    ];
    return colors[index % colors.length];
  };

  // Display up to 4 member avatars (overlapping)
  const displayedMembers = members?.slice(0, 4) || [];
  const additionalCount = Math.max(0, (members?.length || 0) - 4);

  return (
    <div
      onClick={handleClick}
      className="group relative h-64 rounded-2xl backdrop-blur-xl border border-white/10 bg-gradient-to-br from-gray-900/40 to-gray-900/10 shadow-xl hover:shadow-2xl cursor-pointer overflow-hidden transition-all duration-300 transform hover:scale-105 hover:border-white/20"
    >
      {/* Animated gradient background */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10" />

      {/* Mini Activity Chart (Placeholder with styled bars) */}
      <div className="absolute top-4 right-4 flex items-end gap-1 h-12 opacity-60 group-hover:opacity-100 transition-opacity">
        {[...Array(7)].map((_, i) => (
          <div
            key={i}
            className="w-1.5 bg-gradient-to-t from-emerald-500 to-emerald-300 rounded-t-sm"
            style={{ height: `${Math.random() * 100}%` }}
          />
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10 p-6 h-full flex flex-col justify-between">
        {/* Header */}
        <div>
          <h3 className="text-xl font-bold text-white mb-1 group-hover:text-blue-300 transition-colors">
            {group.name}
          </h3>
          <p className="text-xs text-gray-400">
            {displayedMembers.length} {displayedMembers.length === 1 ? "fighter" : "fighters"}
          </p>
        </div>

        {/* Member Avatars - Overlapping */}
        <div className="flex items-center -space-x-3">
          {displayedMembers.map((member, index) => (
            <div
              key={member._id || index}
              className={`w-8 h-8 rounded-full ${getAvatarColor(index)} border-2 border-gray-900 flex items-center justify-center text-white text-xs font-semibold shadow-lg hover:scale-110 transition-transform`}
              title={member.name}
            >
              {member.name?.charAt(0).toUpperCase() || "?"}
            </div>
          ))}
          {additionalCount > 0 && (
            <div className="w-8 h-8 rounded-full bg-gray-700 border-2 border-gray-900 flex items-center justify-center text-white text-xs font-semibold shadow-lg">
              +{additionalCount}
            </div>
          )}
        </div>
      </div>

      {/* Neon bottom accent */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    </div>
  );
}

ArenaCard.propTypes = {
  group: PropTypes.shape({
    _id: PropTypes.string,
    name: PropTypes.string.isRequired,
    inviteCode: PropTypes.string.isRequired,
  }).isRequired,
  members: PropTypes.arrayOf(
    PropTypes.shape({
      _id: PropTypes.string,
      name: PropTypes.string,
    })
  ),
};

ArenaCard.defaultProps = {
  members: [],
};
