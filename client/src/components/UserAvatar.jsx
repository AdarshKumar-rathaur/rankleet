import PropTypes from "prop-types";

function getInitials(name) {
  if (!name || typeof name !== "string") return "?";
  const trimmed = name.trim();
  if (!trimmed) return "?";

  const parts = trimmed.split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

function getColor(seed) {
  const colors = [
    "#3b82f6",
    "#8b5cf6",
    "#ec4899",
    "#6366f1",
    "#10b981",
    "#f59e0b",
    "#ef4444",
    "#14b8a6",
  ];

  if (!seed) return colors[0];
  const safeSeed = String(seed);
  const hash = [...safeSeed].reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[hash % colors.length];
}

function buildAvatarDataUrl(name, seed) {
  const initials = getInitials(name);
  const fill = getColor(seed);
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128">
      <rect width="128" height="128" rx="64" fill="${fill}" />
      <circle cx="64" cy="52" r="28" fill="rgba(255,255,255,0.22)" />
      <path d="M28 112c8-20 24-32 36-32s28 12 36 32" fill="rgba(255,255,255,0.18)" />
      <text x="64" y="78" font-size="38" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-weight="700" fill="white">${initials}</text>
    </svg>`;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function UserAvatar({ user, name, avatar, size = "md", className = "", title, imgClassName = "", fallbackClassName = "" }) {
  const displayName = name || user?.name || user?.username || user?.leetcodeUsername || "User";
  const avatarUrl = avatar || user?.avatar || user?.avatarUrl || user?.profilePicture || user?.profileImage || "";
  const seed = user?._id || user?.leetcodeUsername || user?.email || displayName;
  const fallbackSrc = buildAvatarDataUrl(displayName, seed);

  const sizeClasses = {
    xs: "w-6 h-6 text-[10px]",
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-14 h-14 text-lg",
    xl: "w-20 h-20 text-2xl",
  };

  const baseClasses = [
    "rounded-full",
    "object-cover",
    "flex-shrink-0",
    sizeClasses[size] || sizeClasses.md,
    className,
    imgClassName,
    !avatarUrl ? fallbackClassName : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <img
      src={avatarUrl || fallbackSrc}
      alt={displayName}
      title={title || displayName}
      className={baseClasses}
      onError={(event) => {
        if (event.currentTarget.src !== fallbackSrc) {
          event.currentTarget.src = fallbackSrc;
        }
      }}
      loading="lazy"
    />
  );
}

UserAvatar.propTypes = {
  user: PropTypes.shape({
    _id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    name: PropTypes.string,
    username: PropTypes.string,
    leetcodeUsername: PropTypes.string,
    email: PropTypes.string,
    avatar: PropTypes.string,
    avatarUrl: PropTypes.string,
    profilePicture: PropTypes.string,
    profileImage: PropTypes.string,
  }),
  name: PropTypes.string,
  avatar: PropTypes.string,
  size: PropTypes.oneOf(["xs", "sm", "md", "lg", "xl"]),
  className: PropTypes.string,
  title: PropTypes.string,
  imgClassName: PropTypes.string,
  fallbackClassName: PropTypes.string,
};

export default UserAvatar;
