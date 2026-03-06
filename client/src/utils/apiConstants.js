/**
 * API Constants and Routes
 * Centralized API endpoint definitions
 */

export const API_ENDPOINTS = {
  // Auth
  AUTH: {
    REGISTER: "/auth/register",
    LOGIN: "/auth/login",
  },

  // Users
  USERS: {
    PROFILE: "/users/profile",
    GROUPS: "/users/groups",
  },

  // Groups
  GROUPS: {
    CREATE: "/groups/create",
    JOIN: (inviteCode) => `/groups/join/${inviteCode}`,
    GET_BY_ID: (id) => `/groups/${id}`,
    LEADERBOARD: (id) => `/groups/${id}/leaderboard`,
    DELETE: (id) => `/groups/${id}`,
  },

  // Health
  HEALTH: "/health",
};

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
