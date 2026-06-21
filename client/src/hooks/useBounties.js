import { useCallback, useState } from "react";
import API from "../services/api";
import { API_ENDPOINTS } from "../utils/apiConstants";

export function useBounties() {
  const [bounties, setBounties] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchBounties = useCallback(async (groupId) => {
    setLoading(true);
    setError("");
    try {
      const res = await API.get(API_ENDPOINTS.BOUNTIES.GET_BY_GROUP(groupId));
      const rawData = res.data?.data || res.data;
      const list = Array.isArray(rawData) ? rawData : [];
      setBounties(list);
      return list;
    } catch (err) {
      const message = err.message || "Failed to load bounties";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const createBounty = useCallback(async (payload) => {
    setError("");
    const res = await API.post(API_ENDPOINTS.BOUNTIES.CREATE, payload);
    const created = res.data?.data || res.data;
    setBounties((prev) => [created, ...prev]);
    return created;
  }, []);

  const joinBounty = useCallback(async (bountyId, wager) => {
    setError("");
    const res = await API.post(API_ENDPOINTS.BOUNTIES.JOIN(bountyId), { wager });
    const updated = res.data?.data || res.data;
    setBounties((prev) => prev.map((b) => (b._id === bountyId ? updated : b)));
    return updated;
  }, []);

  return {
    bounties,
    loading,
    error,
    fetchBounties,
    createBounty,
    joinBounty,
    setBounties,
  };
}
