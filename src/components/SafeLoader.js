/**
 * SafeLoader Component
 * Prevents infinite loading with timeout and fallback
 */

import { useState, useEffect } from 'react';

const SafeLoader = ({ 
  isLoading, 
  text = 'Loading...', 
  timeout = 5000,
  fallback = null,
  children 
}) => {
  const [forceRender, setForceRender] = useState(false);
  const [timeoutReached, setTimeoutReached] = useState(false);

  useEffect(() => {
    if (isLoading) {
      // Reset states when loading starts
      setForceRender(false);
      setTimeoutReached(false);

      // Set timeout to force render
      const timeoutId = setTimeout(() => {
        console.warn(`SafeLoader: Timeout reached after ${timeout}ms - forcing render`);
        setTimeoutReached(true);
        setForceRender(true);
      }, timeout);

      return () => clearTimeout(timeoutId);
    } else {
      // Reset when not loading
      setForceRender(false);
      setTimeoutReached(false);
    }
  }, [isLoading, timeout]);

  // If not loading, render children
  if (!isLoading) {
    return children;
  }

  // If timeout reached, force render children
  if (forceRender || timeoutReached) {
    console.warn('SafeLoader: Bypassing loading state due to timeout');
    return children;
  }

  // Show loading spinner
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