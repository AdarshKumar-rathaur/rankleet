import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../services/api";
import { API_ENDPOINTS } from "../utils/apiConstants";
import { parseInviteCode } from "../utils/helpers";

function Join() {
  const { inviteCode: paramInvite } = useParams();

  const navigate = useNavigate();

  const [message, setMessage] = useState("Joining group...");
  const [isError, setIsError] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [isJoining, setIsJoining] = useState(false);

  const joinGroup = async (provided) => {
    if (isJoining) return; // Prevent double-click
    setIsJoining(true);
    const token = localStorage.getItem("token");

    // Determine invite code from param, provided input, or internal input field
    const raw = provided || paramInvite || inputValue;

    // Parse possible full URLs to get the code
    const code = parseInviteCode(raw);

    if (!code) {
      setMessage("Invalid invite link or code");
      setIsError(true);
      setIsJoining(false);
      return;
    }

    if (!token) {
      // Redirect to login and preserve invite code so user can join after login
      navigate(`/?invite=${code}`);
      setIsJoining(false);
      return;
    }

    try {
      const res = await API.post(API_ENDPOINTS.GROUPS.JOIN(code), {});
      const groupId = res?.data?.inviteCode;
      if (groupId) {
        setMessage("Joined successfully! Redirecting...");
        setIsError(false);
        setTimeout(() => {
          if (res.data.inviteCode) {
            navigate(`/group/${res.data.inviteCode}`);
          }
        }, 1500);
      } else {
        throw new Error("Server did not return a valid Group ID");
      }
    } catch (error) {
      const errorMsg =
        error.response?.data?.message || "Invalid or expired invite link";
      setMessage(errorMsg);
      setIsError(true);
    } finally {
      setIsJoining(false);
    }
  };

  useEffect(() => {
    // Only call if we have an inviteCode
    if (paramInvite) {
      joinGroup(paramInvite);
    }
  }, [paramInvite, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
      <div
        className={`p-8 rounded-xl text-center shadow ${isError ? "bg-red-500/20 border border-red-500" : "bg-gray-800"}`}
      >
        <h1 className="text-2xl font-bold mb-4">RankLeet</h1>

        <p className={`mb-6 ${isError ? "text-red-400" : "text-gray-300"}`}>
          {message}
        </p>

        {isError && (
          <button
            onClick={() => navigate("/")}
            className="bg-indigo-500 hover:bg-indigo-600 px-4 py-2 rounded"
          >
            Back to Home
          </button>
        )}
        {!paramInvite && (
          <div className="mt-4">
            <p className="mb-2 text-sm text-gray-400">Or paste invite code / link to join:</p>
            <input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Invite code or full link"
              disabled={isJoining}
              className="w-full p-2 mb-2 bg-gray-700 rounded text-white disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <button
              onClick={() => joinGroup(inputValue)}
              disabled={isJoining}
              className="bg-green-500 px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isJoining ? "Joining..." : "Join"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default Join;
