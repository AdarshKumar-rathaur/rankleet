import axios from "axios";
import { getFriendlyErrorMessage, API_ERRORS, API_ENDPOINTS } from "../utils/apiConstants";

const DEFAULT_API_URL = "/api";
let API_URL = import.meta.env.VITE_API_URL || DEFAULT_API_URL;

if (import.meta.env.MODE === "development") {
  if (typeof API_URL === "string") {
    const normalizedUrl = API_URL.trim().replace(/\/$/, "");
    if (normalizedUrl === "http://localhost:5000/api" || normalizedUrl === "http://127.0.0.1:5000/api") {
      API_URL = DEFAULT_API_URL;
      console.warn(
        `Detected local backend API URL in development; switching to proxy path ${DEFAULT_API_URL} to preserve cookies.`
      );
    }
  }
}

if (!import.meta.env.VITE_API_URL) {
  console.warn(`VITE_API_URL is not configured, defaulting to ${DEFAULT_API_URL}`);
}

const API = axios.create({
  baseURL: API_URL,
  timeout: 60000,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

// Simple in-memory cache for GET requests
const getCache = new Map();
const DEFAULT_TTL = 30 * 1000; // 30 seconds

const makeCacheKey = (url, config) => {
  const params = config && config.params ? JSON.stringify(config.params) : "";
  return `${url}|${params}`;
};

const cachedGet = async (url, config = {}, ttl = DEFAULT_TTL) => {
  const key = makeCacheKey(url, config);
  const entry = getCache.get(key);
  const now = Date.now();
  if (entry && now - entry.ts < ttl) {
    return { data: entry.data, fromCache: true };
  }

  const res = await API.get(url, config);
  getCache.set(key, { ts: Date.now(), data: res.data });
  return { data: res.data, fromCache: false };
};

const invalidateCache = (urlPrefix) => {
  if (!urlPrefix) {
    getCache.clear();
    return;
  }
  for (const key of Array.from(getCache.keys())) {
    if (key.startsWith(urlPrefix)) {
      getCache.delete(key);
    }
  }
};

/**
 * Request Interceptor
 * No client-side token is stored; credentials are sent via cookies.
 */
API.interceptors.request.use(
  (req) => req,
  (error) => {
    console.error("Request interceptor error:", error);
    return Promise.reject(error);
  }
);

/**
 * Response Interceptor
 * Handles errors and formats responses
 */
API.interceptors.response.use(
  (response) => {
    // Validate response data
    if (!response.data) {
      console.warn("Empty response data received");
      return {
        data: {},
        status: response.status,
        statusText: response.statusText,
      };
    }

    return response;
  },
  (error) => {
    // Handle network errors
    if (!error.response) {
      if (error.code === "ECONNABORTED") {
        error.message = API_ERRORS.TIMEOUT_ERROR;
      } else if (error.message === "Network Error") {
        error.message = API_ERRORS.NETWORK_ERROR;
      } else if (!navigator.onLine) {
        error.message = "No internet connection";
      }
      return Promise.reject({
        status: 0,
        message: error.message || API_ERRORS.UNKNOWN_ERROR,
        isNetworkError: true,
      });
    }

    const { status, data } = error.response;

    // Handle authentication failure; credentials are cookie-based.
    if (status === 401) {
      const authMessage = data?.message || API_ERRORS.UNAUTHORIZED;

      const reqUrl = error.config?.url || "";
      const isAuthAttempt = reqUrl.includes(API_ENDPOINTS.AUTH.LOGIN) || reqUrl.includes(API_ENDPOINTS.AUTH.ME);
      const isExpectedUnauth = reqUrl.includes(API_ENDPOINTS.AUTH.ME);

      if (!isAuthAttempt) {
        try {
          window.dispatchEvent(
            new CustomEvent("app:unauthorized", { detail: { message: authMessage } })
          );
        } catch {
          // ignore if dispatch fails (e.g., non-browser env)
        }
      }

      // Don't log expected 401s on auth check endpoints
      if (import.meta.env.MODE === "development" && !isExpectedUnauth) {
        console.error(`[API Error ${status}]`, authMessage, data);
      }

      return Promise.reject({
        status,
        message: authMessage,
        data,
        isAuthError: true,
      });
    }

    // Get friendly error message
    const message = data?.message || getFriendlyErrorMessage(status);

    // Log errors in development
    if (import.meta.env.MODE === "development") {
      console.error(`[API Error ${status}]`, message, data);
    }

    return Promise.reject({
      status,
      message,
      data,
      isAuthError: status === 401,
      isPermissionError: status === 403,
      isValidationError: status === 400 || status === 422,
      isRateLimited: status === 429,
    });
  }
);

export { cachedGet, invalidateCache };
export default API;
