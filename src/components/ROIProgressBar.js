'use client';

import { useState, useEffect } from 'react';

const ROIProgressBar = ({ 
  investment, 
  showPercentage = true, 
  showAmount = true,
  size = 'md' 
}) => {
  const [progress, setProgress] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);

  useEffect(() => {
    if (!investment) return;

    const startDate = new Date(investment.startDate);
    const endDate = new Date(investment.endDate);
    const now = new Date();
    
    const totalDuration = endDate.getTime() - startDate.getTime();
    const elapsed = now.getTime() - startDate.getTime();
    
    const progressPercent = Math.min(Math.max((elapsed / totalDuration) * 100, 0), 100);
    const remaining = Math.max(endDate.getTime() - now.getTime(), 0);
    
    setProgress(progressPercent);
    setTimeRemaining(remaining);
  }, [investment]);

  const formatTimeRemaining = (ms) => {
    const days = Math.ceil(ms / (1000 * 60 * 60 * 24));
    if (days <= 0) return 'Completed';
    if (days === 1) return '1 day left';
    return `${days} days left`;
  };

  const getProgressColor = () => {
    if (progress >= 100) return 'bg-green-500';
    if (progress >= 75) return 'bg-blue-500';
    if (progress >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'h-2';
      case 'lg':
        return 'h-4';
      default:
        return 'h-3';
    }
  };

  if (!investment) return null;

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium text-gray-700">Progress</span>
        <span className="text-sm text-gray-600">
          {showPercentage && `${Math.round(progress)}%`}
        </span>
      </div>
      
      <div className={`w-full bg-gray-200 rounded-full overflow-hidden ${getSizeClasses()}`}>
        <div
          className={`${getSizeClasses()} ${getProgressColor()} transition-all duration-500 ease-out rounded-full`}
          style={{ width: `${Math.min(progress, 100)}%` }}
        />
      </div>
      
      <div className="flex justify-between items-center mt-2">
        <span className="text-xs text-gray-500">
          {formatTimeRemaining(timeRemaining)}
        </span>
        {showAmount && (
          <span className="text-xs font-medium text-gray-700">
            ${investment.investedAmount.toLocaleString()} → ${investment.expectedReturn.toLocaleString()}
          </span>
        )}
      </div>
    </div>
  );
};

export default ROIProgressBar;
