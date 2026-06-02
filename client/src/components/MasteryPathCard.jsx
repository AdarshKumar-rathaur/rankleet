import PropTypes from "prop-types";

/**
 * MasteryPathCard
 * Shows the user's AI-generated mastery plan.
 *
 * Props:
 *   masteryPath   - The mastery path object (null while generating)
 *   isGenerating  - true = show spinner, false = show bouncing dots
 *   compact       - true = show only title + first 2 steps (for dashboard teaser)
 */
export default function MasteryPathCard({
  masteryPath = null,
  isGenerating = false,
  compact = false,
}) {
  // ── Loading / generating state ──────────────────────────────────────────
  if (!masteryPath) {
    return (
      <div className="p-8 rounded-2xl backdrop-blur-xl border border-purple-500/20 bg-gradient-to-br from-purple-900/20 to-indigo-900/10 shadow-2xl shadow-purple-500/10 text-center">
        <div className="flex flex-col items-center gap-4">
          {isGenerating ? (
            <>
              {/* Spinner */}
              <div className="relative w-12 h-12">
                <div className="absolute inset-0 border-4 border-purple-900/40 rounded-full" />
                <div className="absolute inset-0 border-4 border-transparent border-t-purple-400 border-r-purple-400 rounded-full animate-spin" />
              </div>
              <p className="text-purple-300 font-medium">Generating your mastery plan...</p>
              <p className="text-gray-500 text-sm">This may take a few seconds</p>
            </>
          ) : (
            <>
              {/* Bouncing dots */}
              <div className="flex gap-2 items-center">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-3 h-3 bg-purple-400 rounded-full animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
              <p className="text-purple-300 font-medium">🎯 Mastery plan is being prepared</p>
              <p className="text-gray-500 text-sm">
                Your personalized plan will appear here shortly
              </p>
            </>
          )}
        </div>
      </div>
    );
  }

  // ── Level badge ─────────────────────────────────────────────────────────
  const levelConfig = {
    beginner: {
      label: "Beginner",
      color: "text-emerald-400",
      bg: "bg-emerald-500/20 border-emerald-500/30",
      icon: "🌱",
    },
    intermediate: {
      label: "Intermediate",
      color: "text-yellow-400",
      bg: "bg-yellow-500/20 border-yellow-500/30",
      icon: "⚡",
    },
    advanced: {
      label: "Advanced",
      color: "text-orange-400",
      bg: "bg-orange-500/20 border-orange-500/30",
      icon: "🔥",
    },
    hard: {
      label: "Hard",
      color: "text-red-400",
      bg: "bg-red-500/20 border-red-500/30",
      icon: "💀",
    },
  };

  // 1. Normalize the stored level field
  const rawLevel = (masteryPath.level || "").toLowerCase().trim();
  let normalizedLevel =
    rawLevel === "expert" || rawLevel === "elite" || rawLevel === "hard" ? "hard" :
    rawLevel === "beginner" ? "beginner" :
    rawLevel === "advanced" ? "advanced" :
    rawLevel === "intermediate" ? "intermediate" :
    null; // unknown — fall through to title inference

  // 2. If stored level is missing/unrecognized, infer from the plan title
  if (!normalizedLevel || !levelConfig[normalizedLevel]) {
    const titleLower = (masteryPath.title || "").toLowerCase();
    if (titleLower.includes("hard") || titleLower.includes("elite") || titleLower.includes("expert")) {
      normalizedLevel = "hard";
    } else if (titleLower.includes("advanced") || titleLower.includes("ascent") || titleLower.includes("competitor")) {
      normalizedLevel = "advanced";
    } else if (titleLower.includes("intermediate") || titleLower.includes("pattern") || titleLower.includes("mastery")) {
      normalizedLevel = "intermediate";
    } else {
      normalizedLevel = "intermediate"; // safe fallback
    }
  }

  const level = levelConfig[normalizedLevel];
  const steps = masteryPath.steps || [];
  const displayedSteps = compact ? steps.slice(0, 2) : steps;

  return (
    <div className="p-6 rounded-2xl backdrop-blur-xl border border-purple-500/20 bg-gradient-to-br from-purple-900/20 to-indigo-900/10 shadow-2xl shadow-purple-500/10 transition-all duration-300 hover:border-purple-500/30">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0 mr-3">
          <h3 className="text-lg font-bold text-white mb-1 leading-tight">
            {masteryPath.title || "Your Mastery Plan"}
          </h3>
          {masteryPath.description && (
            <p className="text-sm text-gray-400 leading-relaxed">
              {masteryPath.description}
            </p>
          )}
        </div>
        <span
          className={`px-3 py-1 rounded-full text-xs font-semibold border whitespace-nowrap flex-shrink-0 ${level.bg} ${level.color}`}
        >
          {level.icon} {level.label}
        </span>
      </div>

      {/* Steps */}
      {displayedSteps.length > 0 && (
        <div className="space-y-3">
          {displayedSteps.map((step, index) => (
            <div
              key={index}
              className="p-4 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 transition-colors duration-200"
            >
              <div className="flex items-start gap-3">
                {/* Day badge */}
                <div className="flex-shrink-0 w-14 min-h-[3rem] rounded-lg bg-purple-500/20 border border-purple-500/30 flex items-center justify-center px-1">
                  <span className="text-xs font-bold text-purple-300 text-center leading-tight">
                    {typeof step.day === "string" && step.day.toLowerCase().includes("day")
                      ? step.day          // AI already included "Day" in the value
                      : `Day ${step.day}` // plain number — prefix it
                    }
                  </span>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-white text-sm mb-1">{step.title}</h4>
                  {step.description && (
                    <p className="text-xs text-gray-400 mb-2 leading-relaxed">
                      {step.description}
                    </p>
                  )}
                  {/* Topics */}
                  {step.topics && step.topics.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {step.topics.map((topic, tIdx) => (
                        <span
                          key={tIdx}
                          className="px-2 py-0.5 rounded-full text-xs bg-indigo-500/20 border border-indigo-500/30 text-indigo-300"
                        >
                          {topic}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Compact mode: show "more steps" hint */}
      {compact && steps.length > 2 && (
        <div className="mt-3 text-center">
          <p className="text-xs text-gray-500">
            +{steps.length - 2} more steps in your full plan
          </p>
        </div>
      )}
    </div>
  );
}

MasteryPathCard.propTypes = {
  masteryPath: PropTypes.shape({
    title: PropTypes.string,
    description: PropTypes.string,
    level: PropTypes.oneOf(["beginner", "intermediate", "advanced"]),
    steps: PropTypes.arrayOf(
      PropTypes.shape({
        day: PropTypes.number,
        title: PropTypes.string,
        description: PropTypes.string,
        topics: PropTypes.arrayOf(PropTypes.string),
      })
    ),
  }),
  isGenerating: PropTypes.bool,
  compact: PropTypes.bool,
};
