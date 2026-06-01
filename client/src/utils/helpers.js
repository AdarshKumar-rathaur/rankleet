/**
 * Common Utility Functions
 * String, date, number formatting and validation
 */

/**
 * Format date to readable string
 */
export const formatDate = (date, format = "MM/DD/YYYY") => {
  if (!date) return "";
  const d = new Date(date);
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const year = d.getFullYear();

  return format
    .replace("MM", month)
    .replace("DD", day)
    .replace("YYYY", year);
};

/**
 * Format relative time (e.g., "2 hours ago")
 */
export const formatRelativeTime = (date) => {
  const now = new Date();
  const diff = now - new Date(date);
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return "just now";
  if (minutes < 60) return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
  if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  if (days < 7) return `${days} day${days > 1 ? "s" : ""} ago`;
  return formatDate(date);
};

/**
 * Truncate string with ellipsis
 */
export const truncateString = (str, length = 50) => {
  if (!str) return "";
  return str.length > length ? str.slice(0, length) + "..." : str;
};

/**
 * Capitalize first letter
 */
export const capitalize = (str) => {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
};

/**
 * Format number with commas
 */
export const formatNumber = (num) => {
  if (typeof num !== "number") return "";
  return num.toLocaleString("en-US");
};

/**
 * Format currency
 */
export const formatCurrency = (amount, currency = "USD") => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency,
  }).format(amount);
};

/**
 * Validate email
 */
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate password strength
 */
export const validatePasswordStrength = (password) => {
  const requirements = {
    minLength: password.length >= 8,
    hasUpperCase: /[A-Z]/.test(password),
    hasLowerCase: /[a-z]/.test(password),
    hasNumber: /\d/.test(password),
    hasSpecialChar: /[!@#$%^&*]/.test(password),
  };

  return {
    ...requirements,
    score: Object.values(requirements).filter(Boolean).length,
    isStrong: Object.values(requirements).every(Boolean),
  };
};

/**
 * Generate random string
 */
export const generateRandomString = (length = 10) => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

/**
 * Debounce function
 */
export const debounce = (func, delay = 300) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), delay);
  };
};

/**
 * Throttle function
 */
export const throttle = (func, limit = 300) => {
  let inThrottle;
  return (...args) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

/**
 * Deep clone object
 */
export const deepClone = (obj) => {
  return JSON.parse(JSON.stringify(obj));
};

/**
 * Object to query string
 */
export const objectToQueryString = (obj) => {
  const params = new URLSearchParams();
  Object.entries(obj).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      params.append(key, value);
    }
  });
  return params.toString();
};

/**
 * Sleep function (promise-based timeout)
 */
export const sleep = (ms = 1000) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Parse an invite input which may be a full URL or a raw invite code.
 * Returns the invite code string or null if none found.
 */
export const parseInviteCode = (input) => {
  if (!input || typeof input !== "string") return null;
  const trimmed = input.trim();

  // If it contains the join path, extract the portion after /join/
  const joinIndex = trimmed.indexOf("/join/");
  if (joinIndex !== -1) {
    const after = trimmed.slice(joinIndex + 6);
    const code = after.split(/[/?#]/)[0];
    return code || null;
  }

  // Try parsing as URL and take last pathname segment
  try {
    const u = new URL(trimmed);
    const parts = u.pathname.split("/").filter(Boolean);
    if (parts.length > 0) return parts[parts.length - 1];
  } catch (e) {
    // not a full URL
  }

  // If it's likely an invite code (alphanumeric-ish, length 4-40), accept it
  const codeMatch = trimmed.match(/[A-Za-z0-9_-]{4,40}/);
  return codeMatch ? codeMatch[0] : null;
};

/**
 * Retry function with exponential backoff
 */
export const retryAsync = async (
  asyncFunc,
  maxRetries = 3,
  delay = 1000,
  backoffMultiplier = 2
) => {
  let lastError;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await asyncFunc();
    } catch (error) {
      lastError = error;
      if (i < maxRetries - 1) {
        await sleep(delay * Math.pow(backoffMultiplier, i));
      }
    }
  }

  throw lastError;
};
