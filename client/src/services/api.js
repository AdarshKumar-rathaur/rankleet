import axios from "axios";
import { getFriendlyErrorMessage, API_ERRORS, API_ENDPOINTS } from "../utils/apiConstants";

const API_URL = import.meta.env.VITE_API_URL;

if (!API_URL) {
  console.error("VITE_API_URL is not configured");
}

const API = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
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
 * Adds authorization token and validates request
 */
API.interceptors.request.use(
  (req) => {
    const token = localStorage.getItem("token");

    if (token) {
      // Validate token format
      if (typeof token !== "string" || token.split(".").length !== 3) {
        console.warn("Invalid token format detected");
        localStorage.removeItem("token");
      } else {
        req.headers.Authorization = `Bearer ${token}`;
      }
    }

    return req;
  },
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

    // Handle token expiration: remove token but do NOT force a full reload.
    // Let calling components decide how to handle unauthenticated state.
    if (status === 401) {
      // Prefer server-provided message for 401 (e.g., invalid credentials)
      const authMessage = data?.message || API_ERRORS.UNAUTHORIZED;
      localStorage.removeItem("token");

      // Determine if this was a login attempt — if so, don't trigger global redirect
      const reqUrl = error.config?.url || "";
      const isLoginAttempt = reqUrl.includes(API_ENDPOINTS.AUTH.LOGIN);

      if (!isLoginAttempt) {
        // Notify the app that the session is unauthorized so it can redirect gracefully
        try {
          window.dispatchEvent(
            new CustomEvent("app:unauthorized", { detail: { message: authMessage } })
          );
        } catch (e) {
          // ignore if dispatch fails (e.g., non-browser env)
        }
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
