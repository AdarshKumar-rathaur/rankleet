import { useMemo } from "react";
import PropTypes from "prop-types";

const CELL = 11;   // px — cell size
const GAP  = 2;    // px — gap between cells
const STEP = CELL + GAP;

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function getColor(count, max) {
  if (!count || count === 0) return "#161b22";
  const ratio = Math.min(count / Math.max(max, 1), 1);
  if (ratio < 0.25) return "#0e4429";
  if (ratio < 0.50) return "#006d32";
  if (ratio < 0.75) return "#26a641";
  return "#39d353";
}

/** Format a Date to a local YYYY-MM-DD string (avoids UTC off-by-one for non-UTC timezones) */
function localDateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export default function StreakHeatmap({ submissionCalendar = {} }) {
  const { weeks, monthLabels, stats } = useMemo(() => {
    // Build map of localDateKey → count from Unix timestamps (seconds)
    const calMap = {};
    let totalSubs = 0;
    let maxDay = 0;

    Object.entries(submissionCalendar || {}).forEach(([ts, count]) => {
      const d = new Date(parseInt(ts) * 1000);
      const key = localDateKey(d);
      calMap[key] = (calMap[key] || 0) + count;
      totalSubs += count;
      if (calMap[key] > maxDay) maxDay = calMap[key];
    });

    // Today (local midnight)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Start on the Sunday 52 full weeks back from the current week's Sunday
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - today.getDay() - 52 * 7);

    // Calculate current streak: consecutive days ending today going backwards
    let currentStreak = 0;
    const checkDate = new Date(today);
    while (true) {
      const key = localDateKey(checkDate);
      if (calMap[key] > 0) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    const weeksArr = [];
    const monthLabelArr = [];
    let lastMonth = -1;

    for (let w = 0; w < 53; w++) {
      const week = [];
      for (let d = 0; d < 7; d++) {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + w * 7 + d);

        if (date > today) {
          week.push(null); // future cell — transparent
          continue;
        }

        const key = localDateKey(date);
        const count = calMap[key] || 0;
        week.push({
          date: key,
          count,
          display: date.toLocaleDateString("en-US", {
            month: "short", day: "numeric", year: "numeric",
          }),
        });

        // Month label on the first day of each new month
        if (date.getDate() === 1 && date.getMonth() !== lastMonth) {
          monthLabelArr.push({ col: w, label: MONTHS[date.getMonth()] });
          lastMonth = date.getMonth();
        }
      }
      weeksArr.push(week);
    }

    const activeDays = Object.values(calMap).filter((v) => v > 0).length;

    return {
      weeks: weeksArr,
      monthLabels: monthLabelArr,
      stats: { totalSubs, maxDay, currentStreak, activeDays },
    };
  }, [submissionCalendar]);

  const hasData = Object.keys(submissionCalendar || {}).length > 0;

  if (!hasData) {
    return (
      <div className="p-8 rounded-2xl backdrop-blur-xl border border-white/10 bg-gradient-to-br from-gray-900/40 to-gray-900/10 flex flex-col items-center justify-center gap-3 min-h-[200px]">
        <span className="text-4xl">🔥</span>
        <p className="text-gray-400 text-sm text-center">
          Submission activity will appear here after your first sync
        </p>
        <p className="text-gray-600 text-xs">Data updates every 30 minutes</p>
      </div>
    );
  }

  const totalWidth = weeks.length * STEP;

  return (
    <div className="p-5 rounded-2xl backdrop-blur-xl border border-white/10 bg-gradient-to-br from-gray-900/40 to-gray-900/10 shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-white flex items-center gap-2">
          🔥 Submission Activity
        </h3>
        <span className="text-xs text-gray-500">Last 12 months</span>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="p-2.5 rounded-lg bg-emerald-900/20 border border-emerald-500/15">
          <p className="text-xs text-gray-500">Current Streak</p>
          <p className="text-lg font-bold text-white">
            {stats.currentStreak}
            <span className="text-xs text-emerald-400 ml-1">days</span>
          </p>
        </div>
        <div className="p-2.5 rounded-lg bg-green-900/20 border border-green-500/15">
          <p className="text-xs text-gray-500">Total Submissions</p>
          <p className="text-lg font-bold text-white">{stats.totalSubs.toLocaleString()}</p>
        </div>
        <div className="p-2.5 rounded-lg bg-lime-900/20 border border-lime-500/15">
          <p className="text-xs text-gray-500">Active Days</p>
          <p className="text-lg font-bold text-white">{stats.activeDays}</p>
        </div>
      </div>

      {/* Heatmap */}
      <div className="overflow-x-auto">
        <div style={{ minWidth: totalWidth + 28 }}>

          {/* Month labels row */}
          <div className="relative mb-1" style={{ height: 14, marginLeft: 28 }}>
            {monthLabels.map((m, i) => (
              <span
                key={i}
                className="absolute text-[10px] text-gray-500"
                style={{ left: m.col * STEP }}
              >
                {m.label}
              </span>
            ))}
          </div>

          <div className="flex">
            {/* Day-of-week labels (Sun–Sat, only Mon/Wed/Fri shown) */}
            <div className="flex flex-col mr-1" style={{ gap: GAP }}>
              {DAYS.map((label, i) => (
                <div
                  key={i}
                  className="text-[10px] text-gray-500 flex items-center justify-end pr-1"
                  style={{ height: CELL, width: 24 }}
                >
                  {label}
                </div>
              ))}
            </div>

            {/* Week columns — each column = one week, Sun at top, Sat at bottom */}
            <div className="flex" style={{ gap: GAP }}>
              {weeks.map((week, wi) => (
                <div key={wi} className="flex flex-col" style={{ gap: GAP }}>
                  {week.map((day, di) => (
                    <div
                      key={di}
                      title={
                        day
                          ? `${day.display}: ${day.count} submission${day.count !== 1 ? "s" : ""}`
                          : ""
                      }
                      style={{
                        width: CELL,
                        height: CELL,
                        borderRadius: 2,
                        backgroundColor: day
                          ? getColor(day.count, stats.maxDay)
                          : "transparent",
                        transition: "background-color 0.15s",
                      }}
                      className={day ? "hover:opacity-80" : ""}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center justify-end gap-1.5 mt-3">
            <span className="text-[10px] text-gray-500">Less</span>
            {["#161b22", "#0e4429", "#006d32", "#26a641", "#39d353"].map((c) => (
              <div
                key={c}
                style={{ width: CELL, height: CELL, borderRadius: 2, backgroundColor: c }}
              />
            ))}
            <span className="text-[10px] text-gray-500">More</span>
          </div>

        </div>
      </div>
    </div>
  );
}

StreakHeatmap.propTypes = {
  submissionCalendar: PropTypes.object,
};
