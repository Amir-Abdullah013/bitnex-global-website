'use client';

import { useState, useEffect, useCallback } from 'react';

/**
 * useLoadingManager Hook - Manages loading states with timeout protection
 * 
 * Features:
 * - 6-second timeout protection
 * - Force stop capability
 * - Clear console logging
 * - No infinite loops
 */
const useLoadingManager = (initialLoading = false, timeout = 6000) => {
  const [isLoading, setIsLoading] = useState(initialLoading);
  const [timeoutId, setTimeoutId] = useState(null);
  const [forceStopped, setForceStopped] = useState(false);

  // Console logging for debugging
  useEffect(() => {
    console.log(`useLoadingManager: isLoading=${isLoading}, forceStopped=${forceStopped}, timeoutId=${timeoutId}`);
  }, [isLoading, forceStopped, timeoutId]);

  // Set loading state
  const setLoading = useCallback((loading) => {
    console.log(`useLoadingManager: Setting loading to ${loading}`);
    setIsLoading(loading);
    
    if (!loading) {
      // Clear timeout when loading stops
      if (timeoutId) {
        console.log('useLoadingManager: Clearing timeout');
        clearTimeout(timeoutId);
        setTimeoutId(null);
      }
      setForceStopped(false);
    }
  }, [timeoutId]);

  // Force stop loading
  const forceStop = useCallback(() => {
    console.warn('useLoadingManager: Force stopping loading');
    setForceStopped(true);
    setIsLoading(false);
    
    if (timeoutId) {
      clearTimeout(timeoutId);
      setTimeoutId(null);
    }
  }, [timeoutId]);

  // Start loading with timeout
  const startLoading = useCallback((customTimeout = timeout) => {
    console.log(`useLoadingManager: Starting loading with ${customTimeout}ms timeout`);
    setIsLoading(true);
    setForceStopped(false);
    
    // Clear existing timeout
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    
    // Set new timeout
    const id = setTimeout(() => {
      console.warn(`useLoadingManager: Timeout reached after ${customTimeout}ms - force stopping`);
      setIsLoading(false);
      setForceStopped(true);
    }, customTimeout);
    
    setTimeoutId(id);
  }, [timeout, timeoutId]);

  // Stop loading
  const stopLoading = useCallback(() => {
    console.log('useLoadingManager: Stopping loading');
    setIsLoading(false);
    setForceStopped(false);
    
    if (timeoutId) {
      clearTimeout(timeoutId);
      setTimeoutId(null);
    }
  }, [timeoutId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      console.log('useLoadingManager: Cleaning up on unmount');
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [timeoutId]);

  return {
    isLoading,
    forceStopped,
    setLoading,
    forceStop,
    startLoading,
    stopLoading
  };
};

export default useLoadingManager;

