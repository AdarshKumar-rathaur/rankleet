/**
 * API Constants and Routes
 * Centralized API endpoint definitions
 */

export const API_ENDPOINTS = {
  // Auth
  AUTH: {
    REGISTER: "/auth/register",
    LOGIN: "/auth/login",
    LOGOUT: "/auth/logout",
    ME: "/auth/me",
  },

  // Users
  USERS: {
    PROFILE: "/users/profile",
    GROUPS: "/users/groups",
    LEETCODE_TOTALS: "/users/leetcode-totals",
    REFRESH: "/users/refresh",
    SYNC_POINTS: "/users/sync-points",
    MASTERY: "/users/profile", // mastery path is part of profile
  },

  // Groups
  GROUPS: {
    CREATE: "/groups/create",
    JOIN: (inviteCode) => `/groups/join/${inviteCode}`,
    GET_BY_ID: (id) => `/groups/${id}`,
    LEADERBOARD: (id) => `/groups/${id}/leaderboard`,
    LEAVE: (id) => `/groups/${id}/leave`,
    TRANSFER_OWNERSHIP: (id) => `/groups/${id}/transfer-ownership`,
    DELETE: (id) => `/groups/${id}`,
  },

  // Bounties
  BOUNTIES: {
    CREATE: "/bounties/create",
    GET_BY_GROUP: (groupId) => `/bounties/group/${groupId}`,
    JOIN: (bountyId) => `/bounties/${bountyId}/join`,
    RESOLVE: "/bounties/resolve",
  },

  // AI Activity
  AI_ACTIVITY: {
    GET_FEED: "/ai-activity/feed",
    GET_BY_GROUP: (groupId) => `/ai-activity/group/${groupId}`,
    GENERATE: (groupId) => `/ai-activity/generate-weekly/${groupId}`,
    LIKE: (activityId) => `/ai-activity/${activityId}/like`,
  },

  // Health
  HEALTH: "/health",
};

export const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL ||
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? "http://127.0.0.1:5000" : "https://rankleet.onrender.com");

/**
 * API Error Messages
 */
export const API_ERRORS = {
  NETWORK_ERROR: "Network error - please check your connection",
  TIMEOUT_ERROR: "Request timeout - server took too long to respond",
  UNAUTHORIZED: "Your session has expired. Please log in again.",
  FORBIDDEN: "You don't have permission to access this resource",
  NOT_FOUND: "Resource not found",
  VALIDATION_ERROR: "Please check your input and try again",
  SERVER_ERROR: "Server error - please try again later",
  UNKNOWN_ERROR: "An unexpected error occurred",
};

/**
 * HTTP Status Codes with friendly messages
 */
export const HTTP_STATUS = {
  200: { message: "Success", friendly: "Request successful" },
  201: { message: "Created", friendly: "Resource created successfully" },
  400: { message: "Bad Request", friendly: API_ERRORS.VALIDATION_ERROR },
  401: { message: "Unauthorized", friendly: API_ERRORS.UNAUTHORIZED },
  403: { message: "Forbidden", friendly: API_ERRORS.FORBIDDEN },
  404: { message: "Not Found", friendly: API_ERRORS.NOT_FOUND },
  422: { message: "Validation Failed", friendly: API_ERRORS.VALIDATION_ERROR },
  429: { message: "Too Many Requests", friendly: "Too many requests. Please try again later." },
  500: { message: "Server Error", friendly: API_ERRORS.SERVER_ERROR },
  503: { message: "Service Unavailable", friendly: "Server is temporarily unavailable" },
};

/**
 * Get friendly error message
 */
export const getFriendlyErrorMessage = (status, customMessage) => {
  if (customMessage) return customMessage;
  return HTTP_STATUS[status]?.friendly || API_ERRORS.UNKNOWN_ERROR;
};
