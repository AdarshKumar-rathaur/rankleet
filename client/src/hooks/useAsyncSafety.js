/**
 * useAsyncEffect Hook
 * Safely manages async operations with cleanup on unmount
 * Prevents memory leaks and stale state updates
 */

import { useEffect, useRef } from 'react';

export const useAsyncEffect = (asyncFn, dependencies = []) => {
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;

    (async () => {
      if (!isMountedRef.current) return;
      await asyncFn();
    })();

    return () => {
      isMountedRef.current = false;
    };
  }, dependencies);
};

/**
 * useSafeState Hook
 * Only updates state if component is still mounted
 * Prevents "Can't perform a React state update on an unmounted component" warnings
 */

import { useState } from 'react';

export const useSafeState = (initialValue) => {
  const [state, setState] = useState(initialValue);
  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const setSafeState = (newValue) => {
    if (isMountedRef.current) {
      setState(newValue);
    }
  };

  return [state, setSafeState];
};

/**
 * useAbortController Hook
 * Provides AbortController for cancelling fetch requests on unmount
 */

export const useAbortController = () => {
  const abortControllerRef = useRef(null);

  useEffect(() => {
    abortControllerRef.current = new AbortController();
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  return abortControllerRef.current;
};
