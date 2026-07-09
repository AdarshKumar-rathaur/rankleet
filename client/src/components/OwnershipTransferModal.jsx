function OwnershipTransferModal({
  isOpen,
  members,
  currentUserId,
  onCancel,
  onTransfer,
  onDeleteRequest,
  mode = "leave",
  isSubmitting = false,
}) {
  if (!isOpen) return null;

  const eligibleMembers = (members || []).filter((member) => member?._id !== currentUserId);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="w-full max-w-lg mx-4 rounded-2xl border border-white/10 bg-gray-900/95 p-6 shadow-2xl">
        <h2 className="text-2xl font-bold text-white mb-2">
          {mode === "transfer" ? "Transfer Ownership" : "Transfer Ownership"}
        </h2>
        <p className="text-gray-300 mb-5">
          {mode === "transfer"
            ? "Pick another member to become the new owner."
            : "You are the creator of this arena. Pick another member to become the new owner before leaving."}
        </p>

        {eligibleMembers.length === 0 ? (
          <div className="space-y-4">
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 text-amber-200 text-sm">
              You need at least one other member in the arena before you can transfer ownership.
            </div>
            {onDeleteRequest && (
              <button
                type="button"
                onClick={onDeleteRequest}
                disabled={isSubmitting}
                className="w-full rounded-xl border border-red-500/30 bg-red-500/20 px-4 py-3 text-sm font-semibold text-red-200 hover:bg-red-500/30 transition disabled:opacity-50"
              >
                Delete Group Instead
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
            {eligibleMembers.map((member) => (
              <button
                key={member._id}
                type="button"
                onClick={() => onTransfer(member._id)}
                disabled={isSubmitting}
                className="w-full flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-left text-white hover:bg-white/10 transition disabled:opacity-50"
              >
                <div>
                  <div className="font-semibold">{member.name || "Unnamed member"}</div>
                  <div className="text-sm text-gray-400">{member.leetcodeUsername || "No LeetCode username"}</div>
                </div>
                <span className="text-sm text-blue-300">
                  {mode === "transfer" ? "Transfer" : "Transfer & Leave"}
                </span>
              </button>
            ))}
          </div>
        )}

        <div className="mt-6 flex justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-white transition"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default OwnershipTransferModal;