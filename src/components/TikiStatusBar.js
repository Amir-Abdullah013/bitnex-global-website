'use client';

import { useUniversal } from '../lib/universal-context';

const BnxStatusBar = () => {
  const { usdBalance, bnxBalance, bnxPrice, formatCurrency, formatBnx, isLoading } = useUniversal();

  // Don't show status bar while loading
  if (isLoading) {
    return null;
  }

  return (
    <div className="bg-blue-600 text-white py-2 px-4 shadow-sm">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-wrap items-center justify-between text-sm">
          {/* Left side - Tiki Price */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <span className="font-semibold">BNX Price:</span>
              <span className="font-bold text-yellow-300">
                {formatCurrency(bnxPrice, 'USD')}
              </span>
            </div>
          </div>

          {/* Right side - Balances */}
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <span className="font-semibold">USD:</span>
              <span className="font-bold text-green-300">
                {formatCurrency(usdBalance, 'USD')}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="font-semibold">BNX:</span>
              <span className="font-bold text-yellow-300">
                {formatBnx(bnxBalance)} BNX
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BnxStatusBar;









