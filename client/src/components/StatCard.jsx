import { useEffect, useState } from "react";
import PropTypes from "prop-types";

export default function StatCard({ difficulty, count, icon, color, totalCount }) {
  const [animatedCount, setAnimatedCount] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const interval = setInterval(() => {
      setAnimatedCount((prev) => {
        if (prev < count) {
          return Math.min(prev + Math.ceil(count / 30), count);
        }
        clearInterval(interval);
        return count;
      });
    }, 30);
    return () => clearInterval(interval);
  }, [count]);

  const percentage = totalCount > 0 ? (animatedCount / totalCount) * 100 : 0;
  const circumference = 2 * Math.PI * 45; // radius = 45
  const offset = circumference - (percentage / 100) * circumference;

  const colorMap = {
    easy: {
      ring: "stroke-emerald-500",
      glow: "shadow-emerald-500/50",
      bg: "from-emerald-900/20 to-emerald-900/5",
      text: "text-emerald-400",
    },
    medium: {
      ring: "stroke-yellow-500",
      glow: "shadow-yellow-500/50",
      bg: "from-yellow-900/20 to-yellow-900/5",
      text: "text-yellow-400",
    },
    hard: {
      ring: "stroke-red-500",
      glow: "shadow-red-500/50",
      bg: "from-red-900/20 to-red-900/5",
      text: "text-red-400",
    },
  };

  const colors = colorMap[color] || colorMap.easy;

  return (
    <div
      className={`relative p-6 rounded-2xl backdrop-blur-xl border border-white/10 bg-gradient-to-br ${colors.bg} shadow-2xl ${colors.glow} transition-all duration-700 transform ${
        mounted ? "scale-100 opacity-100" : "scale-95 opacity-0"
      } hover:border-white/20 hover:shadow-2xl`}
    >
      {/* Animated background glow */}
      <div
        className={`absolute inset-0 rounded-2xl opacity-0 blur-xl transition-opacity duration-1000 ${colors.glow}`}
        style={{ pointerEvents: "none" }}
      />

      {/* Content */}
      <div className="relative z-10 flex items-center justify-between">
        {/* SVG Circle Progress */}
        <div className="relative w-28 h-28 flex-shrink-0">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            {/* Background circle */}
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="rgba(255, 255, 255, 0.1)"
              strokeWidth="3"
            />
            {/* Animated progress circle */}
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              className={colors.ring}
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              style={{
                transition: "stroke-dashoffset 0.5s ease-out",
              }}
            />
          </svg>
          {/* Center text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-2xl font-bold ${colors.text}`}>
              {animatedCount}
            </span>
            <span className="text-xs text-gray-400">Solved</span>
          </div>
        </div>

        {/* Stats Info */}
        <div className="flex-1 ml-6">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-3xl">{icon}</span>
            <h3 className={`text-lg font-semibold ${colors.text}`}>
              {difficulty}
            </h3>
          </div>
          <p className="text-xs text-gray-400 mb-3">
            {count > 0
              ? `You're doing great! Keep grinding!`
              : "Start solving problems"}
          </p>
          {/* Neon accent line */}
          <div className={`h-1 bg-gradient-to-r from-transparent via-${color}-500 to-transparent rounded-full`} />
        </div>
      </div>
    </div>
  );
}

StatCard.propTypes = {
  difficulty: PropTypes.string.isRequired,
  count: PropTypes.number.isRequired,
  icon: PropTypes.string.isRequired,
  color: PropTypes.oneOf(["easy", "medium", "hard"]).isRequired,
  totalCount: PropTypes.number,
};

StatCard.defaultProps = {
  totalCount: 100,
};
