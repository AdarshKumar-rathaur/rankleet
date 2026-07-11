import { useEffect, useMemo, useRef, useState } from "react";
import PropTypes from "prop-types";
import { io } from "socket.io-client";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import API from "../services/api";
import { SOCKET_URL } from "../utils/apiConstants";

function ArenaChat({ arenaId, currentUser, members = [] }) {
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [nextCursor, setNextCursor] = useState(null);
  const [socketConnected, setSocketConnected] = useState(false);
  const [onlineUserIds, setOnlineUserIds] = useState([]);
  const [activeUsers, setActiveUsers] = useState([]);
  const [showNewMessageButton, setShowNewMessageButton] = useState(false);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isSending, setIsSending] = useState(false);

  const socketRef = useRef(null);
  const pendingMessageRef = useRef(null);

  const syncArenaUnread = (nextArenaId, delta) => {
    if (typeof window === "undefined") return;
    const storageKey = "rankleet-unread-arenas";
    const current = JSON.parse(localStorage.getItem(storageKey) || "{}");
    const nextValue = Math.max((current[nextArenaId] || 0) + delta, 0);
    current[nextArenaId] = nextValue;
    localStorage.setItem(storageKey, JSON.stringify(current));
    window.dispatchEvent(new CustomEvent("arena:unread-count-changed", { detail: { arenaId: nextArenaId, count: nextValue } }));
  };
  const chatRef = useRef(null);
  const bottomRef = useRef(null);
  const isLoadingOlderRef = useRef(false);
  const isAtBottomRef = useRef(true);

  const memberMap = useMemo(() => {
    return Object.fromEntries((members || []).map((member) => [member._id, member]));
  }, [members]);

  const scrollToBottom = (behavior = "smooth") => {
    bottomRef.current?.scrollIntoView({ behavior, block: "end" });
  };

  useEffect(() => {
    const socket = io(SOCKET_URL, {
      withCredentials: true,
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      forceNew: true,
      path: "/socket.io",
    });
    socketRef.current = socket;

    const handleConnect = () => {
      setSocketConnected(true);
      socket.emit("authenticate", { userId: currentUser?._id });
      socket.emit("join_arena", { arenaId, userId: currentUser?._id });
    };

    const handleDisconnect = () => setSocketConnected(false);
    const handlePresenceUpdate = (userIds) => setOnlineUserIds(userIds);
    const handleArenaPresence = (userIds) => setActiveUsers(userIds);
    const handleArenaMessage = (message) => {
      const incomingSenderId = message.senderId?._id || message.senderId;
      if (pendingMessageRef.current && incomingSenderId === currentUser?._id && message.text === pendingMessageRef.current) {
        pendingMessageRef.current = null;
        setIsSending(false);
      }

      setMessages((prev) => {
        const exists = prev.some((item) => item._id === message._id);
        return exists ? prev : [...prev, message];
      });

      if (isAtBottomRef.current) {
        requestAnimationFrame(() => scrollToBottom("smooth"));
      } else {
        setShowNewMessageButton(true);
        setUnreadCount((count) => count + 1);
        syncArenaUnread(arenaId, 1);
      }
    };

    const handleArenaUnread = ({ message }) => {
      if (!message) return;
      setMessages((prev) => {
        const exists = prev.some((item) => item._id === message._id);
        return exists ? prev : [...prev, message];
      });
      setUnreadCount((count) => count + 1);
      syncArenaUnread(arenaId, 1);
    };

    const handleArenaError = ({ message }) => {
      console.error("Arena socket error:", message);
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("presence:update", handlePresenceUpdate);
    socket.on("arena:presence", handleArenaPresence);
    socket.on("arena:message", handleArenaMessage);
    socket.on("arena:unread", handleArenaUnread);
    socket.on("arena:error", handleArenaError);

    return () => {
      try {
        socket.off("connect", handleConnect);
        socket.off("disconnect", handleDisconnect);
        socket.off("presence:update", handlePresenceUpdate);
        socket.off("arena:presence", handleArenaPresence);
        socket.off("arena:message", handleArenaMessage);
        socket.off("arena:unread", handleArenaUnread);
        socket.off("arena:error", handleArenaError);

        if (socket && socket.connected && typeof socket.emit === "function") {
          socket.emit("leave_arena", { arenaId, userId: currentUser?._id });
        }

        if (socket && socket.connected && typeof socket.disconnect === "function") {
          socket.disconnect();
        }
      } catch (error) {
        console.warn("Arena socket cleanup warning:", error);
      } finally {
        socketRef.current = null;
      }
    };
  }, [arenaId, currentUser?._id]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      syncArenaUnread(arenaId, 0);
    }
  }, [arenaId]);

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      try {
        const res = await API.get(`/arenas/${arenaId}/messages`);
        const incoming = res.data?.messages || [];
        setMessages(incoming);
        setHasMore(Boolean(res.data?.hasMore));
        setNextCursor(res.data?.nextCursor || null);
      } catch (error) {
        console.error("Failed to load arena history", error);
      } finally {
        setLoading(false);
        requestAnimationFrame(() => scrollToBottom("auto"));
      }
    };

    if (arenaId) fetchHistory();
  }, [arenaId]);

  useEffect(() => {
    const container = chatRef.current;
    if (!container) return;

    const handleScroll = () => {
      const nearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 120;
      isAtBottomRef.current = nearBottom;
      setIsAtBottom(nearBottom);
      if (nearBottom) {
        setShowNewMessageButton(false);
        setUnreadCount(0);
      }

      if (container.scrollTop <= 80 && hasMore && !loadingOlder && !isLoadingOlderRef.current) {
        isLoadingOlderRef.current = true;
        setLoadingOlder(true);
        const previousHeight = container.scrollHeight;
        const previousTop = container.scrollTop;
        API.get(`/arenas/${arenaId}/messages?cursor=${nextCursor}`)
          .then((res) => {
            const olderMessages = res.data?.messages || [];
            const cursor = res.data?.nextCursor || null;
            if (olderMessages.length > 0) {
              setMessages((prev) => [...olderMessages, ...prev]);
              requestAnimationFrame(() => {
                if (container) {
                  const newHeight = container.scrollHeight;
                  container.scrollTop = previousTop + (newHeight - previousHeight);
                }
              });
            }
            setHasMore(Boolean(res.data?.hasMore));
            setNextCursor(cursor);
          })
          .catch((error) => console.error("Failed to load older messages", error))
          .finally(() => {
            isLoadingOlderRef.current = false;
            setLoadingOlder(false);
          });
      }
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, [arenaId, hasMore, loadingOlder, nextCursor]);

  const sendMessage = async (e) => {
    e.preventDefault();
    const trimmed = draft.trim();
    if (!trimmed || !currentUser?._id) return;

    setDraft("");
    pendingMessageRef.current = trimmed;
    setIsSending(true);
    requestAnimationFrame(() => scrollToBottom("smooth"));

    try {
      socketRef.current?.emit("arena:send_message", {
        arenaId,
        message: {
          senderId: currentUser._id,
          text: trimmed,
        },
      });

      window.setTimeout(() => {
        if (pendingMessageRef.current === trimmed) {
          pendingMessageRef.current = null;
          setIsSending(false);
        }
      }, 1500);
    } catch (error) {
      pendingMessageRef.current = null;
      setIsSending(false);
      console.error("Failed to send message", error);
    }
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/80 p-4 shadow-xl">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">Arena Chat</h3>
          <p className="text-sm text-gray-400">{socketConnected ? "Connected" : "Connecting"}</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-300">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
          {activeUsers.length} active
        </div>
      </div>

      <div ref={chatRef} className="mb-4 h-96 overflow-y-auto rounded-xl border border-white/10 bg-slate-900/70 p-3">
        {loading ? (
          <div className="text-sm text-gray-400">Loading messages…</div>
        ) : (
          <>
            {loadingOlder && <div className="mb-3 text-center text-xs text-gray-500">Loading earlier messages…</div>}
            {messages.map((message) => {
              const sender = memberMap[message.senderId?._id || message.senderId] || message.senderId;
              const senderId = sender?._id?.toString?.() || message.senderId?._id?.toString?.() || message.senderId?.toString?.() || message.senderId;
              const isMine = senderId === currentUser?._id;
              const isOnline = onlineUserIds.map((id) => id?.toString?.() || id).includes(senderId);

              return (
                <div key={message._id} className={`mb-3 flex ${isMine ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[85%] rounded-2xl px-3 py-2 ${isMine ? "bg-blue-600/90 text-white" : "bg-slate-800 text-gray-100"}`}>
                    <div className="mb-1 flex items-center gap-2 text-[11px] uppercase tracking-wide text-gray-400">
                      <span className="font-semibold text-white">{sender?.name || "Member"}</span>
                      {isOnline && <span className="h-2 w-2 rounded-full bg-emerald-400" />}
                    </div>
                    <div className="prose prose-invert prose-sm max-w-none text-sm">
                      <ReactMarkdown
                        components={{
                          code({ inline, className, children, ...props }) {
                            const match = /language-(\w+)/.exec(className || "");
                            return !inline && match ? (
                              <SyntaxHighlighter style={oneDark} language={match[1]} PreTag="div" {...props}>
                                {String(children).replace(/\n$/, "")}
                              </SyntaxHighlighter>
                            ) : (
                              <code className={className} {...props}>{children}</code>
                            );
                          },
                        }}
                      >
                        {message.text}
                      </ReactMarkdown>
                    </div>
                    <div className="mt-1 text-[10px] text-gray-400">
                      {new Date(message.createdAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </>
        )}
      </div>

      {!isAtBottom && showNewMessageButton && (
        <button
          onClick={() => {
            setShowNewMessageButton(false);
            setUnreadCount(0);
            scrollToBottom("smooth");
          }}
          className="mb-3 w-full rounded-lg border border-blue-500/30 bg-blue-500/20 px-3 py-2 text-sm font-medium text-blue-200"
        >
          New message ↓
        </button>
      )}

      <form onSubmit={sendMessage} className="flex flex-col gap-2">
        <div className="flex gap-2">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={3}
            className="flex-1 rounded-lg border border-white/10 bg-slate-800 px-3 py-2 text-sm text-white outline-none resize-none"
            placeholder="Type a message… Use fenced code blocks like ```js ... ```"
          />
          <button type="submit" className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white self-end">
            Send
          </button>
        </div>
        {isSending && <p className="text-xs text-gray-400">Sending…</p>}
      </form>
    </div>
  );
}

ArenaChat.propTypes = {
  arenaId: PropTypes.string.isRequired,
  currentUser: PropTypes.shape({ _id: PropTypes.string, name: PropTypes.string }),
  members: PropTypes.arrayOf(PropTypes.shape({ _id: PropTypes.string, name: PropTypes.string })),
};

export default ArenaChat;
