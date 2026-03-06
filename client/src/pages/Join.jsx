import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../services/api";
import { API_ENDPOINTS } from "../utils/apiConstants";

function Join() {
  const { inviteCode } = useParams();

  const navigate = useNavigate();

  const [message, setMessage] = useState("Joining group...");
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    const joinGroup = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        setMessage("Please login to join a group");
        setIsError(true);
        return;
      }

      if (!inviteCode) {
        setMessage("Invalid invite link");
        setIsError(true);
        return;
      }

      try {
        const res = await API.post(API_ENDPOINTS.GROUPS.JOIN(inviteCode));

        setMessage("Joined successfully! Redirecting...");
        setIsError(false);

        setTimeout(() => {
          navigate(`/group/${res.data.groupId}`);
        }, 1500);
      } catch (error) {
        const errorMsg = error.message || "Invalid or expired invite link";
        setMessage(errorMsg);
        setIsError(true);
      }
    };

    joinGroup();
  }, [inviteCode, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
      <div className={`p-8 rounded-xl text-center shadow ${isError ? "bg-red-500/20 border border-red-500" : "bg-gray-800"}`}>
        <h1 className="text-2xl font-bold mb-4">RankLeet</h1>

        <p className={`mb-6 ${isError ? "text-red-400" : "text-gray-300"}`}>{message}</p>

        {isError && (
          <button
            onClick={() => navigate("/")}
            className="bg-indigo-500 hover:bg-indigo-600 px-4 py-2 rounded"
          >
            Back to Home
          </button>
        )}
      </div>
    </div>
  );
}

export default Join;
