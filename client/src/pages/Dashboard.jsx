import { useEffect, useState } from "react";
import API from "../services/api";
import { API_ENDPOINTS } from "../utils/apiConstants";
import Navbar from "../components/Navbar";
import { useNavigate } from "react-router-dom";

function Dashboard() {
  const [profile, setProfile] = useState(null);
  const [groups, setGroups] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [groupError, setGroupError] = useState("");
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const profileRes = await API.get(API_ENDPOINTS.USERS.PROFILE);
        setProfile(profileRes.data);

        const groupsRes = await API.get(API_ENDPOINTS.USERS.GROUPS);
        setGroups(groupsRes.data || []);
        setGroupError("");
      } catch (err) {
        console.error("Failed to fetch data", err);
        setGroupError(err.message || "Failed to load dashboard");
        setProfile(null);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const createGroup = async () => {
    try {
      const res = await API.post(API_ENDPOINTS.GROUPS.CREATE, { name: groupName });
      setGroups([...groups, res.data]);
      setShowCreate(false);
      setGroupName("");
      navigate(`/group/${res.data._id}`);
    } catch (err) {
      alert(err.message || "Error creating group");
      setShowCreate(false);
      setGroupName("");
    }
  };

  const joinGroup = async () => {
    try {
      const res = await API.post(API_ENDPOINTS.GROUPS.JOIN(inviteCode));
      setShowJoin(false);
      setInviteCode("");
      navigate(`/group/${res.data.groupId}`);
    } catch (err) {
      alert(err.message || "Invalid invite code");
      setShowJoin(false);
      setInviteCode("");
    }
  };

  if (loading) return <div className="p-10 text-center text-gray-400">Loading dashboard...</div>;

  if (!profile) return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Navbar />
      <div className="p-10 text-center">
        <p className="text-red-400">{groupError || "Failed to load profile"}</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Navbar />

      <div className="p-8 max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Welcome {profile.name}</h1>

        {/* Stats */}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
          <div className="bg-gray-800 p-6 rounded-xl">
            <p className="text-gray-400">Easy</p>
            <h2 className="text-2xl text-green-400 font-bold">
              {profile.stats.easy}
            </h2>
          </div>

          <div className="bg-gray-800 p-6 rounded-xl">
            <p className="text-gray-400">Medium</p>
            <h2 className="text-2xl text-yellow-400 font-bold">
              {profile.stats.medium}
            </h2>
          </div>

          <div className="bg-gray-800 p-6 rounded-xl">
            <p className="text-gray-400">Hard</p>
            <h2 className="text-2xl text-red-400 font-bold">
              {profile.stats.hard}
            </h2>
          </div>

          <div className="bg-indigo-600 p-6 rounded-xl">
            <p className="text-gray-200">Score</p>
            <h2 className="text-2xl font-bold">{profile.stats.score}</h2>
          </div>
        </div>

        {/* Groups Section */}

        {groupError && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500 rounded text-red-400">
            {groupError}
          </div>
        )}

        <div className="bg-gray-800 p-6 rounded-xl">
          <div className="flex justify-between mb-6">
            <h2 className="text-xl font-semibold">Your Groups</h2>

            <div className="space-x-3">
              <button
                onClick={() => setShowCreate(true)}
                className="bg-indigo-500 px-4 py-2 rounded hover:bg-indigo-600"
              >
                Create
              </button>

              <button
                onClick={() => setShowJoin(true)}
                className="bg-green-500 px-4 py-2 rounded hover:bg-green-600"
              >
                Join
              </button>
            </div>
          </div>

          {groups.length === 0 ? (
            <p className="text-gray-400">No groups yet</p>
          ) : (
            <div className="space-y-3">
              {groups.map((group) => (
                <div
                  key={group._id}
                  onClick={() => navigate(`/group/${group._id}`)}
                  className="bg-gray-700 p-4 rounded cursor-pointer hover:bg-gray-600"
                >
                  <p className="font-semibold">{group.name}</p>
                  <p className="text-sm text-gray-400">{group.members?.length || 0} members</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create Group Modal */}

      {showCreate && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60" onClick={() => setShowCreate(false)}>
          <div className="bg-gray-800 p-6 rounded-xl w-80" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl">Create Group</h2>
              <button
                onClick={() => setShowCreate(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <input
              placeholder="Group name"
              className="w-full p-2 bg-gray-700 rounded mb-4 text-white"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
            />

            <button
              onClick={createGroup}
              className="w-full bg-indigo-500 p-2 rounded hover:bg-indigo-600"
            >
              Create
            </button>
          </div>
        </div>
      )}

      {/* Join Group Modal */}

      {showJoin && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60" onClick={() => setShowJoin(false)}>
          <div className="bg-gray-800 p-6 rounded-xl w-80" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl">Join Group</h2>
              <button
                onClick={() => setShowJoin(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <input
              placeholder="Invite Code"
              className="w-full p-2 bg-gray-700 rounded mb-4 text-white"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
            />

            <button
              onClick={joinGroup}
              className="w-full bg-green-500 p-2 rounded hover:bg-green-600"
            >
              Join
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
