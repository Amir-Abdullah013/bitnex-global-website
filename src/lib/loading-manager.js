'use client';

import { useState, useCallback } from 'react';

// Simple loading state manager to prevent infinite loops
export const useLoadingManager = (initialState = false) => {
  const [loading, setLoading] = useState(initialState);
  const [timeoutId, setTimeoutId] = useState(null);

  const startLoading = useCallback((timeout = 5000) => {
    setLoading(true);
    
    // Clear existing timeout
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    
    // Set new timeout
    const id = setTimeout(() => {
      setLoading(false);
    }, timeout);
    
    setTimeoutId(id);
  }, [timeoutId]);

  const stopLoading = useCallback(() => {
    setLoading(false);
    if (timeoutId) {
      clearTimeout(timeoutId);
      setTimeoutId(null);
    }
  }, [timeoutId]);

  const setLoadingState = useCallback((state) => {
    setLoading(state);
    if (!state && timeoutId) {
      clearTimeout(timeoutId);
      setTimeoutId(null);
    }
  }, [timeoutId]);

  return {
    loading,
    startLoading,
    stopLoading,
    setLoading: setLoadingState
  };
};
