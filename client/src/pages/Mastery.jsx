import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import MasteryPathCard from "../components/MasteryPathCard";
import API, { cachedGet, invalidateCache } from "../services/api";
import { API_ENDPOINTS } from "../utils/apiConstants";

function Mastery() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [toast, setToast] = useState(null); // { type: "success"|"error", message }
  const navigate = useNavigate();
  const refreshTimerRef = useRef(null);
  const mountedRef = useRef(true);
  const toastTimerRef = useRef(null);

  const showToast = (type, message) => {
    setToast({ type, message });
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToast(null), 4000);
  };

  const fetchProfile = async (bustCache = false) => {
    try {
      if (bustCache) invalidateCache(API_ENDPOINTS.USERS.PROFILE);
      const res = await cachedGet(API_ENDPOINTS.USERS.PROFILE);
      const data = res.data;
      if (!mountedRef.current) return;
      setProfile(data);
      setError("");

      if (!data.masteryPath) {
        setIsGenerating(true);
        // Use the sync refresh endpoint — it fetches from LeetCode and generates mastery path
        refreshTimerRef.current = setTimeout(async () => {
          if (!mountedRef.current) return;
          try {
            const refreshRes = await API.post(API_ENDPOINTS.USERS.REFRESH);
            if (!mountedRef.current) return;
            const refreshed = refreshRes.data;
            
            // 🚀 FIX: Safely merge the newly generated data into the state
            setProfile((prev) => ({
              ...prev,
              ...refreshed
            }));
            
            invalidateCache(API_ENDPOINTS.USERS.PROFILE);
            if (refreshed.masteryPath) {
              setIsGenerating(false);
            } else {
              // Still not ready — try once more after another 8s
              refreshTimerRef.current = setTimeout(() => {
                if (mountedRef.current) fetchProfile(true);
              }, 8000);
            }
          } catch (refreshErr) {
            console.warn("[Mastery] Refresh failed:", refreshErr.message);
            // Fall back to re-reading DB
            if (mountedRef.current) fetchProfile(true);
          }
        }, 3000);
      } else {
        setIsGenerating(false);
      }
    } catch (err) {
      if (!mountedRef.current) return;
      setError(err.message || "Failed to load mastery plan");
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  };

  useEffect(() => {
    mountedRef.current = true;
    fetchProfile();
    return () => {
      mountedRef.current = false;
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-white">
      {/* Background blobs */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-violet-500/5 rounded-full blur-3xl" />
      </div>

      <Navbar />

      {/* Toast notification */}
      {toast && (
        <div
          className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-xl border shadow-2xl text-sm font-medium transition-all duration-300 flex items-center gap-2 ${
            toast.type === "success"
              ? "bg-emerald-900/90 border-emerald-500/40 text-emerald-300"
              : "bg-red-900/90 border-red-500/40 text-red-300"
          }`}
        >
          <span>{toast.type === "success" ? "✓" : "⚠"}</span>
          {toast.message}
        </div>
      )}

      <div className="relative z-10 max-w-4xl mx-auto p-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6 group"
          >
            <span className="group-hover:-translate-x-1 transition-transform">←</span>
            Back to Dashboard
          </button>

          <div className="flex items-center gap-3 mb-2">
            <span className="text-4xl">🎯</span>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">
              Mastery Plan
            </h1>
          </div>
          <p className="text-gray-400">Your personalized AI-generated learning roadmap</p>
        </div>

        {/* Loading state */}
        {loading && (
          <div className="p-12 rounded-2xl backdrop-blur-xl border border-purple-500/20 bg-gradient-to-br from-purple-900/20 to-indigo-900/10 text-center">
            <div className="relative w-16 h-16 mx-auto mb-4">
              <div className="absolute inset-0 border-4 border-purple-900/40 rounded-full" />
              <div className="absolute inset-0 border-4 border-transparent border-t-purple-400 border-r-purple-400 rounded-full animate-spin" />
            </div>
            <p className="text-purple-300 font-medium">Loading your mastery plan...</p>
          </div>
        )}

        {/* Error state */}
        {!loading && error && (
          <div className="p-6 rounded-2xl border border-red-500/30 bg-red-900/20 text-red-300">
            <p className="font-medium mb-2">⚠️ Failed to load mastery plan</p>
            <p className="text-sm text-red-400">{error}</p>
            <button
              onClick={() => { setLoading(true); fetchProfile(true); }}
              className="mt-4 px-4 py-2 rounded-lg border border-red-500/30 bg-red-500/20 hover:bg-red-500/30 text-red-300 text-sm font-medium transition-all"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Profile loaded */}
        {!loading && !error && profile && (
          <>
            {/* Stats summary */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="p-4 rounded-xl backdrop-blur-md border border-emerald-500/20 bg-emerald-900/10 text-center">
                <p className="text-2xl font-bold text-emerald-400">{profile.stats?.easy || 0}</p>
                <p className="text-xs text-gray-400 mt-1">Easy Solved</p>
              </div>
              <div className="p-4 rounded-xl backdrop-blur-md border border-yellow-500/20 bg-yellow-900/10 text-center">
                <p className="text-2xl font-bold text-yellow-400">{profile.stats?.medium || 0}</p>
                <p className="text-xs text-gray-400 mt-1">Medium Solved</p>
              </div>
              <div className="p-4 rounded-xl backdrop-blur-md border border-red-500/20 bg-red-900/10 text-center">
                <p className="text-2xl font-bold text-red-400">{profile.stats?.hard || 0}</p>
                <p className="text-xs text-gray-400 mt-1">Hard Solved</p>
              </div>
            </div>

            {/* Generating notice */}
            {isGenerating && !profile.masteryPath && (
              <div className="mb-6 p-4 rounded-xl border border-purple-500/20 bg-purple-900/10 flex items-center gap-3">
                <div className="flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"
                      style={{ animationDelay: `${i * 0.15}s` }}
                    />
                  ))}
                </div>
                <p className="text-purple-300 text-sm">
                  Fetching your LeetCode data and generating your plan...
                </p>
              </div>
            )}

            <MasteryPathCard
              masteryPath={profile.masteryPath}
              isGenerating={isGenerating}
              compact={false}
            />

            {profile.masteryPath && (
              <div className="mt-6 text-center">
                <button
                  onClick={async () => {
                    if (isGenerating) return;
                    setIsGenerating(true);
                    try {
                      // Pass force:true so the server regenerates even if a plan exists
                      const refreshRes = await API.post(API_ENDPOINTS.USERS.REFRESH, { force: true });
                      const refreshed = refreshRes.data;
                      
                      if (mountedRef.current) {
                        // 🚀 FIX: Safely merge the newly refreshed data into the state
                        setProfile((prevProfile) => ({
                          ...prevProfile,
                          ...refreshed
                        }));
                        
                        invalidateCache(API_ENDPOINTS.USERS.PROFILE);
                        showToast("success", "Plan regenerated successfully!");
                      }
                    } catch (err) {
                      console.error("[Mastery] Refresh failed:", err.message);
                      if (mountedRef.current) {
                        showToast("error", "Failed to regenerate plan. Try again.");
                      }
                    } finally {
                      if (mountedRef.current) setIsGenerating(false);
                    }
                  }}
                  disabled={isGenerating}
                  className="px-6 py-2 rounded-lg border border-purple-500/30 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 text-sm font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
                >
                  {isGenerating ? (
                    <>
                      <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>
                      Regenerating...
                    </>
                  ) : (
                    "🔄 Refresh Plan"
                  )}
                </button>
                <p className="text-xs text-gray-600 mt-2">
                  Regenerates your plan based on current progress
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default Mastery;