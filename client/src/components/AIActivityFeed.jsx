import PropTypes from "prop-types";
import { useEffect, useState } from "react";

export default function AIActivityFeed({ feedItems = [] }) {
  const [displayedItems, setDisplayedItems] = useState([]);

  useEffect(() => {
    if (!Array.isArray(feedItems) || feedItems.length === 0) return;
    
    // 1. Reset state
    setDisplayedItems([]);

    // 2. LIMIT: Only take the 5 most recent items so it doesn't flood the screen
    const recentItems = feedItems.slice(0, 5);

    // 3. Keep track of all timers so we can clean them up
    const timeouts = recentItems.map((item, index) => {
      return setTimeout(() => {
        setDisplayedItems((prev) => {
          // Double-check that we don't already have this item in state
          if (prev.some((p) => p._id === item._id)) return prev;
          return [...prev, item];
        });
      }, index * 200);
    });

    // 4. Cleanup function to stop timers if the component unmounts
    return () => timeouts.forEach(clearTimeout);
  }, [feedItems]);

  const typeStyles = {
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

  if (displayedItems.length === 0) {
    return (
      <div className="p-6 rounded-2xl backdrop-blur-xl border border-white/10 bg-gradient-to-br from-gray-900/40 to-gray-900/10 text-center">
        <p className="text-gray-400 text-sm">
          🤖 AI Activity Feed coming soon...
        </p>
      </div>
    );
  }

  return (
    // Your original max-h-96 and scrollbar-hide classes remain intact here
    <div className="space-y-3 max-h-96 overflow-y-auto scrollbar-hide">
      {displayedItems.map((item, index) => {
        const style = typeStyles[item.type] || typeStyles.insight;
        return (
          <div
            key={item._id || index}
            className={`p-4 rounded-xl backdrop-blur-md border transition-all duration-500 transform ${style.border} bg-gradient-to-br ${style.bg} hover:shadow-lg animate-slideInLeft`}
            style={{
              animation: `slideInLeft 0.3s ease-out ${index * 0.1}s both`,
            }}
          >
            <div className="flex items-start gap-3">
              <span className="text-2xl flex-shrink-0">{style.icon}</span>
              <div className="flex-1 min-w-0">
                {item.group && (
                  <p className="text-xs text-gray-400 mb-1">
                    🏛️ {item.group.name}
                  </p>
                )}
                <p className="text-sm text-white leading-relaxed break-words">
                  {item.content}
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  {new Date(item.createdAt).toLocaleDateString()}
                </p>
              </div>
              {item.type && (
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap flex-shrink-0 ${style.accent}`}
                >
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
    }),
  ),
};

AIActivityFeed.defaultProps = {
  feedItems: [],
};