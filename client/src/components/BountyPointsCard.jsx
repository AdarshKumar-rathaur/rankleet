import { useState } from "react";
import API from "../services/api";
import { API_ENDPOINTS } from "../utils/apiConstants";

export default function BountyPointsCard({ bountyPoints, onPointsSynced }) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [message, setMessage] = useState("");

  const handleSync = async () => {
    setIsSyncing(true);
    setMessage("");
    try {
      const res = await API.post(API_ENDPOINTS.USERS.SYNC_POINTS);
      const payload = res.data?.data || res.data;
      setMessage(`+${payload.rewardPoints} points synced`);
      onPointsSynced?.(payload.bountyPoints);
    } catch (err) {
      setMessage(err.message || "Sync failed");
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="p-6 rounded-2xl border border-white/10 bg-slate-950/60">
      <div className="flex items-center gap-3 mb-3">
        <div>
          <h3 className="text-lg font-semibold text-white">🎯 Bounty Points</h3>
          <p className="text-sm text-gray-400">Earn points from LeetCode progress and wager them on bounties.</p>
        </div>
        <div className="text-right">
          <p className="text-3xl font-bold text-white">{bountyPoints ?? 0}</p>
          <p className="text-xs text-gray-400">current balance</p>
        </div>
      </div>

      <button
        onClick={handleSync}
        disabled={isSyncing}
        className="w-full px-4 py-3 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-medium transition hover:brightness-110 disabled:opacity-50"
      >
        {isSyncing ? "Syncing..." : "Sync LeetCode Points"}
      </button>

      {message && (
        <p className="mt-3 text-sm text-gray-300">{message}</p>
      )}
    </div>
  );
}
