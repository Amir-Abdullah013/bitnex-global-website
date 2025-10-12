'use client';

import { useState, useEffect } from 'react';

/**
 * Simple, Reliable Loader Component
 * No complex logic, just shows loading state
 */
const SimpleLoader = ({ 
  isLoading = false, 
  text = 'Loading...',
  children 
}) => {
  const [showLoader, setShowLoader] = useState(false);

  useEffect(() => {
    if (isLoading) {
      setShowLoader(true);
    } else {
      // Small delay to prevent flickering
      const timer = setTimeout(() => {
        setShowLoader(false);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  if (!showLoader) {
    return children;
  }

  return (
    <div className="min-h-screen bg-binance-background flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-binance-primary mx-auto mb-4"></div>
        <p className="text-binance-textSecondary">{text}</p>
      </div>
    </div>
  );
};

export default SimpleLoader;

