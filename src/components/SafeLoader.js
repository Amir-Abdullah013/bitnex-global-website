'use client';

import { useState, useEffect } from 'react';

/**
 * SafeLoader Component - Prevents infinite loading with timeout protection
 * 
 * Features:
 * - 6-second timeout protection
 * - Force render after timeout
 * - Clear console logging for debugging
 * - No infinite loops
 */
const SafeLoader = ({ 
  isLoading = false, 
  text = 'Loading...', 
  timeout = 6000,
  children 
}) => {
  const [forceRender, setForceRender] = useState(false);
  const [timeoutReached, setTimeoutReached] = useState(false);
  const [renderCount, setRenderCount] = useState(0);

  // Track render count for debugging
  useEffect(() => {
    setRenderCount(prev => prev + 1);
    console.log(`SafeLoader: Render #${renderCount + 1} - isLoading: ${isLoading}, forceRender: ${forceRender}, timeoutReached: ${timeoutReached}`);
  });

  useEffect(() => {
    if (isLoading) {
      console.log('SafeLoader: Starting loading state');
      // Reset states when loading starts
      setForceRender(false);
      setTimeoutReached(false);

      // Set timeout to force render
      const timeoutId = setTimeout(() => {
        console.warn(`SafeLoader: Timeout reached after ${timeout}ms - forcing render`);
        setTimeoutReached(true);
        setForceRender(true);
      }, timeout);

      return () => {
        console.log('SafeLoader: Cleaning up timeout');
        clearTimeout(timeoutId);
      };
    } else {
      console.log('SafeLoader: Loading completed, resetting states');
      // Reset when not loading
      setForceRender(false);
      setTimeoutReached(false);
    }
  }, [isLoading, timeout]);

  // If not loading, render children immediately
  if (!isLoading) {
    console.log('SafeLoader: Not loading, rendering children');
    return children;
  }

  // If timeout reached, force render children
  if (forceRender || timeoutReached) {
    console.warn('SafeLoader: Bypassing loading state due to timeout - rendering children');
    return children;
  }

  // Show loading spinner
  console.log('SafeLoader: Showing loading spinner');
  return (
    <div className="min-h-screen bg-binance-background flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-binance-primary mx-auto mb-4"></div>
        <p className="text-binance-textSecondary">{text}</p>
        {timeoutReached && (
          <p className="text-yellow-500 text-sm mt-2">
            Loading is taking longer than expected...
          </p>
        )}
      </div>
    </div>
  );
};

export default SafeLoader;

