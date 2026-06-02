import PropTypes from "prop-types";
import { useEffect, useState } from "react";

/** Returns a relative-time string like "2 hours ago", "Yesterday", "3 days ago" */
function relativeTime(dateStr) {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  if (isNaN(diffMs)) return "";

  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr  = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffSec < 60)  return "just now";
  if (diffMin < 60)  return `${diffMin} minute${diffMin !== 1 ? "s" : ""} ago`;
  if (diffHr < 24)   return `${diffHr} hour${diffHr !== 1 ? "s" : ""} ago`;
  if (diffDay === 1) return "Yesterday";
  if (diffDay < 7)   return `${diffDay} days ago`;
  if (diffDay < 30)  return `${Math.floor(diffDay / 7)} week${Math.floor(diffDay / 7) !== 1 ? "s" : ""} ago`;
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

const TYPE_STYLES = {
  roast: {
    icon: "🔥",
    bg: "from-red-900/20 to-orange-900/20",
    border: "border-red-500/30",
    accent: "bg-red-500/20 text-red-300",
  },
  hype: {
    icon: "🚀",
    bg: "from-green-900/20 to-emerald-900/20",
    border: "border-green-500/30",
    accent: "bg-green-500/20 text-green-300",
  },
  insight: {
    icon: "🧠",
    bg: "from-blue-900/20 to-indigo-900/20",
    border: "border-blue-500/30",
    accent: "bg-blue-500/20 text-blue-300",
  },
};

export default function AIActivityFeed({ feedItems = [] }) {
  const [displayedItems, setDisplayedItems] = useState([]);

  useEffect(() => {
    if (!Array.isArray(feedItems) || feedItems.length === 0) {
      setDisplayedItems([]);
      return;
    }

    // Deduplicate by _id, keep 5 most recent
    const seen = new Set();
    const unique = feedItems.filter((item) => {
      const key = item._id || item.content;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    const recent = unique.slice(0, 5);

    setDisplayedItems([]);

    const timeouts = recent.map((item, index) =>
      setTimeout(() => {
        setDisplayedItems((prev) => {
          if (prev.some((p) => (p._id || p.content) === (item._id || item.content))) return prev;
          return [...prev, item];
        });
      }, index * 200)
    );

    return () => timeouts.forEach(clearTimeout);
  }, [feedItems]);

  // Actionable Empty State integrated into your dark-mode UI
  if (displayedItems.length === 0) {
    return (
      <div className="p-8 rounded-2xl backdrop-blur-xl border border-dashed border-white/20 bg-gradient-to-br from-gray-900/40 to-gray-900/10 flex flex-col items-center justify-center text-center transition-all duration-300">
        <span className="text-4xl mb-3 block">🎮</span>
        <h3 className="text-lg font-semibold text-white mb-2">No Activity Yet</h3>
        <p className="text-gray-400 text-sm mb-5 max-w-sm leading-relaxed">
          Your AI Activity Feed is empty. Join an arena or create a group with your friends to see weekly AI roasts, hypes, and insights!
        </p>
        <button 
          onClick={() => window.location.href = '/groups'} 
          className="px-5 py-2.5 bg-blue-600/80 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors border border-blue-500/50 shadow-lg"
        >
          Find a Group
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar pr-1">
      {displayedItems.map((item, index) => {
        const style = TYPE_STYLES[item.type] || TYPE_STYLES.insight;
        return (
          <div
            key={item._id || `feed-${index}`}
            className={`p-4 rounded-xl backdrop-blur-md border transition-all duration-500 ${style.border} bg-gradient-to-br ${style.bg} hover:shadow-lg`}
            style={{ animation: `slideInLeft 0.3s ease-out ${index * 0.1}s both` }}
          >
            <div className="flex items-start gap-3">
              <span className="text-2xl flex-shrink-0">{style.icon}</span>
              <div className="flex-1 min-w-0">
                {item.group?.name && (
                  <p className="text-xs text-gray-400 mb-1">🏛️ {item.group.name}</p>
                )}
                <p className="text-sm text-white leading-relaxed break-words">{item.content}</p>
                <p className="text-xs text-gray-500 mt-2">{relativeTime(item.createdAt)}</p>
              </div>
              {item.type && (
                <span className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap flex-shrink-0 ${style.accent}`}>
                  {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

AIActivityFeed.propTypes = {
  feedItems: PropTypes.arrayOf(
    PropTypes.shape({
      _id: PropTypes.string,
      type: PropTypes.oneOf(["roast", "hype", "insight"]),
      content: PropTypes.string.isRequired,
      group: PropTypes.shape({
        _id: PropTypes.string,
        name: PropTypes.string,
      }),
      createdAt: PropTypes.string.isRequired,
    })
  ),
};

AIActivityFeed.defaultProps = {
  feedItems: [],
};