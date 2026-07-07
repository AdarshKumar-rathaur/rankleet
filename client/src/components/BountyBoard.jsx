import { useEffect, useState } from "react";
import API from "../services/api";
import { API_ENDPOINTS } from "../utils/apiConstants";
import BountyCard from "./BountyCard";
import PropTypes from "prop-types";

export default function BountyBoard({
  groupId,
  isGroupCreator = false,
  initialBounties = null,
  onBountiesChange,
}) {
  const [bounties, setBounties] = useState(initialBounties || []);
  const [loading, setLoading] = useState(initialBounties === null);
  const [error, setError] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [wagerModal, setWagerModal] = useState({ open: false, bounty: null });
  const [wagerAmount, setWagerAmount] = useState(10);

  const [formData, setFormData] = useState({
    title: "",
    objectiveType: "EASY",
    targetAmount: 1,
    deadline: "",
    description: "",
  });

  useEffect(() => {
    if (initialBounties !== null) {
      setBounties(initialBounties);
      setLoading(false);
      return;
    }
    if (!groupId) return;

    const fetchBounties = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await API.get(API_ENDPOINTS.BOUNTIES.GET_BY_GROUP(groupId));
        const rawData = res.data?.data || res.data;
        const list = Array.isArray(rawData) ? rawData : [];
        setBounties(list);
        onBountiesChange?.(list);
      } catch (err) {
        setError(err.message || "Failed to load bounties");
      } finally {
        setLoading(false);
      }
    };

    fetchBounties();
  }, [groupId, initialBounties, onBountiesChange]);

  useEffect(() => {
    if (initialBounties !== null) {
      setBounties(initialBounties);
    }
  }, [initialBounties]);

  const updateBounties = (newList) => {
    setBounties(newList);
    onBountiesChange?.(newList);
  };

  const handleCreateBounty = async () => {
    if (!formData.title.trim() || !formData.deadline) {
      alert("Please provide a title and deadline");
      return;
    }
    setIsCreating(true);
    try {
      const res = await API.post(API_ENDPOINTS.BOUNTIES.CREATE, {
        groupId,
        ...formData,
      });
      const created = res.data?.data || res.data;
      const newList = [created, ...bounties];
      updateBounties(newList);
      setShowCreate(false);
      setFormData({
        title: "",
        objectiveType: "EASY",
        targetAmount: 1,
        deadline: "",
        description: "",
      });
    } catch (err) {
      alert(err.message || "Failed to create bounty");
    } finally {
      setIsCreating(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleJoinBounty = async (bountyId) => {
    setError("");
    try {
      const res = await API.post(API_ENDPOINTS.BOUNTIES.JOIN(bountyId), {
        wager: wagerAmount,
      });
      const updated = res.data?.data || res.data;
      updateBounties(bounties.map((b) => (b._id === bountyId ? updated : b)));
      closeWagerModal();
    } catch (err) {
      const status = err?.status || err?.response?.status;
      const message = err?.message || "Failed to join bounty";

      // Treat 'Already joined this bounty' as idempotent success (neutral/ok)
      if (status === 400 && String(message).includes("Already joined")) {
        try {
          // Refresh bounties to reflect any changes (best-effort)
          const r = await API.get(API_ENDPOINTS.BOUNTIES.GET_BY_GROUP(groupId));
          const raw = r.data?.data || r.data;
          const list = Array.isArray(raw) ? raw : [];
          updateBounties(list);
        } catch {
          // ignore refresh errors
        }
        closeWagerModal();
        return;
      }

      alert(message);
    }
  };

  const openWagerModal = (bounty) => {
    setWagerModal({ open: true, bounty });
    setWagerAmount(10);
  };

  const closeWagerModal = () => {
    setWagerModal({ open: false, bounty: null });
    setWagerAmount(10);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1">⚡ Bounty Board</h2>
          <p className="text-sm text-gray-400">
            {loading ? "Loading..." : `${bounties.length} ${bounties.length === 1 ? "bounty" : "bounties"}`}
          </p>
        </div>
        {isGroupCreator && (
          <button
            onClick={() => setShowCreate(true)}
            className="px-4 py-2 rounded-lg backdrop-blur-md border border-yellow-500/30 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-300 font-medium transition-all duration-300"
          >
            + Create Bounty
          </button>
        )}
      </div>

      {error && (
        <div className="p-4 rounded-lg border border-red-500/30 bg-red-900/20 text-red-300 text-sm">
          {error}
        </div>
      )}

      {loading && (
        <div className="space-y-3 animate-pulse">
          {[1, 2].map((i) => (
            <div key={i} className="p-4 rounded-xl bg-gray-800 space-y-2">
              <div className="h-4 bg-gray-700 rounded w-3/4" />
              <div className="h-3 bg-gray-700 rounded w-1/2" />
            </div>
          ))}
        </div>
      )}

      {!loading && bounties.length === 0 && (
        <div className="p-8 rounded-2xl backdrop-blur-xl border border-white/10 bg-gradient-to-br from-gray-900/40 to-gray-900/10 text-center">
          <p className="text-3xl mb-3">🎯</p>
          <p className="text-gray-400">
            {isGroupCreator
              ? "No bounties yet. Create one to challenge your group!"
              : "No bounties yet. Ask the group creator to add some!"}
          </p>
        </div>
      )}

      {!loading && bounties.length > 0 && (
        <div className="space-y-3">
          {bounties.map((bounty) => (
            <BountyCard key={bounty._id} bounty={bounty} onJoin={() => openWagerModal(bounty)} />
          ))}
        </div>
      )}

      {showCreate && (
        <div
          className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-50"
          onClick={() => setShowCreate(false)}
        >
          <div
            className="w-full max-w-md p-8 rounded-2xl backdrop-blur-xl border border-white/10 bg-gradient-to-br from-gray-900/90 to-gray-900/60 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Create Bounty</h2>
              <button onClick={() => setShowCreate(false)} className="text-gray-400 hover:text-white text-2xl leading-none">✕</button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Title *</label>
                <input
                  type="text"
                  name="title"
                  placeholder="e.g., Solve 5 Easy problems"
                  value={formData.title}
                  onChange={handleChange}
                  className="w-full p-3 rounded-lg border border-white/10 bg-white/5 text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500/50 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Objective Type *</label>
                <select
                  name="objectiveType"
                  value={formData.objectiveType}
                  onChange={handleChange}
                  className="w-full p-3 rounded-lg border border-white/10 bg-gray-800 text-white focus:outline-none focus:border-yellow-500/50 transition-colors"
                >
                  <option value="EASY">Easy</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HARD">Hard</option>
                  <option value="TOTAL">Total</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Target *</label>
                  <input
                    type="number"
                    name="targetAmount"
                    min="1"
                    value={formData.targetAmount}
                    onChange={(e) => setFormData((prev) => ({ ...prev, targetAmount: Number(e.target.value) }))}
                    className="w-full p-3 rounded-lg border border-white/10 bg-white/5 text-white focus:outline-none focus:border-yellow-500/50 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-1">Deadline *</label>
                  <input
                    type="date"
                    name="deadline"
                    value={formData.deadline}
                    onChange={(e) => setFormData((prev) => ({ ...prev, deadline: e.target.value }))}
                    className="w-full p-3 rounded-lg border border-white/10 bg-gray-800 text-white focus:outline-none focus:border-yellow-500/50 transition-colors"
                  />
                  <p className="mt-2 text-[11px] text-gray-500">Deadlines are set to midnight UTC on the selected date.</p>
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Description</label>
                <textarea
                  name="description"
                  placeholder="Optional details..."
                  value={formData.description}
                  onChange={handleChange}
                  rows={3}
                  className="w-full p-3 rounded-lg border border-white/10 bg-white/5 text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500/50 transition-colors resize-none"
                />
              </div>

              <button
                onClick={handleCreateBounty}
                disabled={isCreating || !formData.title.trim() || !formData.deadline}
                className="w-full p-3 rounded-lg border border-yellow-500/30 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-300 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
              >
                {isCreating ? "Creating..." : "⚡ Create Bounty"}
              </button>
            </div>
          </div>
        </div>
      )}

      {wagerModal.open && (
        <div
          className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-50"
          onClick={closeWagerModal}
        >
          <div
            className="w-full max-w-md p-8 rounded-2xl backdrop-blur-xl border border-white/10 bg-gradient-to-br from-gray-900/90 to-gray-900/60 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Join Bounty</h2>
              <button onClick={closeWagerModal} className="text-gray-400 hover:text-white text-2xl leading-none">✕</button>
            </div>

            <p className="text-sm text-gray-300 mb-4">{wagerModal.bounty?.title}</p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Wager Amount</label>
                <input
                  type="number"
                  min="1"
                  value={wagerAmount}
                  onChange={(e) => setWagerAmount(Number(e.target.value))}
                  className="w-full p-3 rounded-lg border border-white/10 bg-white/5 text-white focus:outline-none focus:border-yellow-500/50 transition-colors"
                />
              </div>

              <button
                onClick={() => handleJoinBounty(wagerModal.bounty._id)}
                disabled={wagerAmount < 1}
                className="w-full p-3 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
              >
                Join with wager
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

BountyBoard.propTypes = {
  groupId: PropTypes.string,
  isGroupCreator: PropTypes.bool,
  initialBounties: PropTypes.array,
  onBountiesChange: PropTypes.func,
};
