import { useState, useMemo } from "react";
import PropTypes from "prop-types";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine,
} from "recharts";

const RANGES = [
  { label: "All", months: null },
  { label: "1Y",  months: 12 },
  { label: "6M",  months: 6 },
  { label: "3M",  months: 3 },
];

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="px-3 py-2 rounded-lg border border-blue-500/30 bg-gray-950/95 text-xs shadow-xl max-w-[180px]">
      <p className="text-gray-400 mb-1">{d.fullLabel}</p>
      {d.title && <p className="text-gray-500 text-[10px] mb-1 truncate">{d.title}</p>}
      <p className="text-blue-300 font-bold text-sm">{d.rating}</p>
      {d.rank > 0 && <p className="text-gray-500">Rank #{d.rank.toLocaleString()}</p>}
    </div>
  );
};

export default function ContestGraph({ contestHistory = [] }) {
  const [range, setRange] = useState("All");

  const { filtered, chartData } = useMemo(() => {
    if (!contestHistory?.length) return { filtered: [], chartData: [] };

    const sorted = [...contestHistory]
      .map((e) => ({ ...e, _date: new Date(e.date) }))
      .sort((a, b) => a._date - b._date);

    const sel = RANGES.find((r) => r.label === range);
    const cutoff = sel?.months ? new Date() : null;
    if (cutoff) cutoff.setMonth(cutoff.getMonth() - sel.months);
    const filt = cutoff ? sorted.filter((e) => e._date >= cutoff) : sorted;

    // Build chart data with fully unique X-axis labels
    const seenLabels = new Map();
    const data = filt.map((e) => {
      // Use full "Apr 26" format — always includes day, guarantees uniqueness per contest
      const label = e._date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      // If somehow two contests land on the exact same day, disambiguate with a counter
      const count = seenLabels.get(label) || 0;
      seenLabels.set(label, count + 1);
      const uniqueLabel = count > 0 ? `${label} (${count + 1})` : label;
      return {
        date: uniqueLabel,
        fullLabel: e._date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }),
        rating: e.rating,
        rank: e.rank || 0,
        title: e.title || "",
      };
    });

    return { filtered: filt, chartData: data };
  }, [contestHistory, range]);

  const allRatings = filtered.map((e) => e.rating).filter(Boolean);
  const latestRating = allRatings[allRatings.length - 1] || 0;
  const peakRating   = allRatings.length ? Math.max(...allRatings) : 0;
  const firstRating  = allRatings[0] || 0;
  const ratingChange = latestRating - firstRating;
  const totalContests = contestHistory.length;

  // Y-axis domain with padding
  const minR = allRatings.length ? Math.min(...allRatings) : 0;
  const maxR = allRatings.length ? Math.max(...allRatings) : 100;
  const pad  = Math.max(50, Math.round((maxR - minR) * 0.15));
  const yMin = Math.max(0, minR - pad);
  const yMax = maxR + pad;

  if (!contestHistory?.length) {
    return (
      <div className="p-8 rounded-2xl backdrop-blur-xl border border-white/10 bg-gradient-to-br from-gray-900/40 to-gray-900/10 flex flex-col items-center justify-center gap-3 min-h-[200px]">
        <span className="text-4xl">📊</span>
        <p className="text-gray-400 text-sm text-center">
          Contest history will appear here after your first contest sync
        </p>
        <p className="text-gray-600 text-xs">Data updates every 30 minutes</p>
      </div>
    );
  }

  return (
    <div className="p-5 rounded-2xl backdrop-blur-xl border border-white/10 bg-gradient-to-br from-blue-900/15 to-indigo-900/10 shadow-xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-base font-semibold text-white flex items-center gap-2">
            📈 Contest Rating
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            {`${totalContests} contest${totalContests !== 1 ? "s" : ""} participated`}
          </p>
        </div>

        {/* Range filter */}
        <div className="flex gap-1 bg-gray-800/60 rounded-lg p-1">
          {RANGES.map((r) => (
            <button
              key={r.label}
              onClick={() => setRange(r.label)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all duration-150 ${
                range === r.label
                  ? "bg-blue-500/30 text-blue-300 border border-blue-500/40"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="p-2.5 rounded-lg bg-blue-900/20 border border-blue-500/15">
          <p className="text-xs text-gray-500">Current</p>
          <p className="text-lg font-bold text-white">{latestRating}</p>
        </div>
        <div className="p-2.5 rounded-lg bg-purple-900/20 border border-purple-500/15">
          <p className="text-xs text-gray-500">Peak</p>
          <p className="text-lg font-bold text-white">{peakRating}</p>
        </div>
        <div className="p-2.5 rounded-lg bg-indigo-900/20 border border-indigo-500/15">
          <p className="text-xs text-gray-500">Change</p>
          <p className={`text-lg font-bold ${ratingChange >= 0 ? "text-emerald-400" : "text-red-400"}`}>
            {ratingChange >= 0 ? "+" : ""}{ratingChange}
          </p>
        </div>
      </div>

      {/* Chart */}
      {chartData.length > 0 ? (
        <div className="w-full min-w-0 h-52">
          <ResponsiveContainer width="100%" height={208}>
            <LineChart
              data={chartData}
              margin={{ top: 4, right: 8, left: -20, bottom: chartData.length > 12 ? 20 : 0 }}
            >
              <defs>
                <linearGradient id="ratingGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#60a5fa" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#60a5fa" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
              <XAxis
                dataKey="date"
                stroke="rgba(255,255,255,0.2)"
                tick={{
                  fill: "rgba(255,255,255,0.4)",
                  fontSize: 10,
                  ...(chartData.length > 12 ? { angle: -40, textAnchor: "end", dy: 4 } : {}),
                }}
                tickLine={false}
                axisLine={false}
                // Show at most 6 evenly-spaced ticks to avoid crowding
                interval={Math.max(0, Math.ceil(chartData.length / 6) - 1)}
              />
              <YAxis
                domain={[yMin, yMax]}
                stroke="rgba(255,255,255,0.2)"
                tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10 }}
                tickLine={false}
                axisLine={false}
                width={48}
              />
              <Tooltip content={<CustomTooltip />} />
              {peakRating > 0 && (
                <ReferenceLine
                  y={peakRating}
                  stroke="rgba(168,85,247,0.4)"
                  strokeDasharray="4 4"
                  label={{ value: "Peak", fill: "rgba(168,85,247,0.7)", fontSize: 10, position: "insideTopRight" }}
                />
              )}
              <Line
                type="monotone"
                dataKey="rating"
                stroke="#60a5fa"
                strokeWidth={2}
                dot={chartData.length <= 20 ? { fill: "#60a5fa", r: 3, strokeWidth: 0 } : false}
                activeDot={{ r: 5, fill: "#93c5fd", strokeWidth: 0 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="h-52 flex items-center justify-center text-gray-500 text-sm">
          No data in selected range
        </div>
      )}
    </div>
  );
}

ContestGraph.propTypes = {
  contestHistory: PropTypes.arrayOf(
    PropTypes.shape({
      rating: PropTypes.number,
      date: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
      rank: PropTypes.number,
      title: PropTypes.string,
    })
  ),
};