/**
 * useError Hook
 * Manages error state with auto-clear functionality
 */

import { useState, useCallback, useEffect, useRef } from "react";

export const useError = (initialError = "", autoCleanupTime = 5000) => {
  const [error, setError] = useState(initialError);
  const [lastError, setLastError] = useState(null);

  const setErrorWithCleanup = useCallback((newError) => {
    setError(newError);
    setLastError(newError);

    if (autoCleanupTime > 0 && newError) {
      const timer = setTimeout(() => {
        setError("");
      }, autoCleanupTime);

      return () => clearTimeout(timer);
    }
  }, [autoCleanupTime]);

  const clearError = useCallback(() => {
    setError("");
  }, []);

  return {
    error,
    setError: setErrorWithCleanup,
    clearError,
    hasError: !!error,
    lastError,
  };
};

/**
 * useLoading Hook
 * Manages loading state globally
 */
export const useLoading = () => {
  const [loading, setLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  const startLoading = () => setLoading(true);
  const stopLoading = () => setLoading(false);
  const finishInitialLoad = () => setIsInitialLoading(false);

  return {
    loading,
    isInitialLoading,
    startLoading,
    stopLoading,
    finishInitialLoad,
  };
};

/**
 * useLocalStorage Hook
 * Safely manages localStorage with JSON serialization
 */
export const useLocalStorage = (key, initialValue) => {
  const [storedValue, setStoredValue] = useState(() => {
    if (typeof window === "undefined") {
      return initialValue;
    }

    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading from localStorage (${key}):`, error);
      return initialValue;
    }
  });

  const setValue = (value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      if (typeof window !== "undefined") {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.error(`Error writing to localStorage (${key}):`, error);
    }
  };

  const removeValue = () => {
    try {
      setStoredValue(initialValue);
      if (typeof window !== "undefined") {
        window.localStorage.removeItem(key);
      }
    } catch (error) {
      console.error(`Error removing from localStorage (${key}):`, error);
    }
  };

  return [storedValue, setValue, removeValue];
};

/**
 * useAsync Hook
 * Handles async operations with loading/error/data states
 */
export const useAsync = (asyncFunction, immediate = true) => {
  const [status, setStatus] = useState("idle");
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const execute = useCallback(async () => {
    setStatus("pending");
    setData(null);
    setError(null);

    try {
      const response = await asyncFunction();
      setData(response);
      setStatus("success");
      return response;
    } catch (err) {
      setError(err);
      setStatus("error");
      throw err;
    }
  }, [asyncFunction]);

  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, [execute, immediate]);

  return {
    execute,
    status,
    data,
    error,
    isLoading: status === "pending",
    isError: status === "error",
    isSuccess: status === "success",
  };
};

/**
 * usePrevious Hook
 * Tracks previous value of a variable
 */
export const usePrevious = (value) => {
  const ref = useRef();

  useEffect(() => {
    ref.current = value;
  }, [value]);

  return ref.current;
};
