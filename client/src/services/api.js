import axios from "axios";
import { getFriendlyErrorMessage, API_ERRORS } from "../utils/apiConstants";

const API_URL = import.meta.env.VITE_API_URL;

if (!API_URL) {
  console.error("VITE_API_URL is not configured");
}

const API = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

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

    // Handle token expiration
    if (status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/";
      return Promise.reject({
        status,
        message: API_ERRORS.UNAUTHORIZED,
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

export default API;
