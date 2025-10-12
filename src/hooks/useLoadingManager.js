/**
 * Loading Manager Hook
 * Manages loading states with timeout protection
 */

import { useState, useEffect, useCallback } from 'react';

export const useLoadingManager = (initialLoading = false, timeout = 5000) => {
  const [isLoading, setIsLoading] = useState(initialLoading);
  const [timeoutReached, setTimeoutReached] = useState(false);
  const [forceRender, setForceRender] = useState(false);

  // Timeout protection
  useEffect(() => {
    if (isLoading) {
      const timeoutId = setTimeout(() => {
        console.warn(`useLoadingManager: Timeout reached after ${timeout}ms`);
        setTimeoutReached(true);
        setForceRender(true);
        setIsLoading(false); // Force stop loading
      }, timeout);

      return () => clearTimeout(timeoutId);
    } else {
      setTimeoutReached(false);
      setForceRender(false);
    }
  }, [isLoading, timeout]);

  const startLoading = useCallback(() => {
    setIsLoading(true);
    setTimeoutReached(false);
    setForceRender(false);
  }, []);

  const stopLoading = useCallback(() => {
    setIsLoading(false);
    setTimeoutReached(false);
    setForceRender(false);
  }, []);

  const forceStop = useCallback(() => {
    console.warn('useLoadingManager: Force stopping loading');
    setIsLoading(false);
    setTimeoutReached(true);
    setForceRender(true);
  }, []);

  return {
    isLoading: isLoading && !forceRender,
    timeoutReached,
    forceRender,
    startLoading,
    stopLoading,
    forceStop
  };
};
