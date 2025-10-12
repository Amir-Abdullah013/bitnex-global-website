'use client';

import { useUniversal } from '../lib/universal-context';

const BnxStatusBar = () => {
  const { usdBalance, bnxBalance, bnxPrice, formatCurrency, formatBnx, isLoading } = useUniversal();

  // Don't show status bar while loading
  if (isLoading) {
    return null;
  }

  // Calculate 24h change (mock data for now)
  const priceChange = 0.0; // You can calculate this based on historical data
  const priceChangePercent = 0.0;

  return (
    <div className="bg-binance-surface border-b border-binance-border py-2 px-4">
      <div className="max-w-full mx-auto">
        <div className="flex flex-wrap items-center justify-between gap-4 text-xs">
          {/* Left side - BNX Price */}
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <span className="text-binance-textSecondary">BNX/USD</span>
              <span className="font-semibold text-binance-textPrimary text-sm">
                {formatCurrency(bnxPrice, 'USD')}
              </span>
              {priceChangePercent !== 0 && (
                <span className={`text-xs ${priceChangePercent >= 0 ? 'text-binance-green' : 'text-binance-red'}`}>
                  {priceChangePercent >= 0 ? '+' : ''}{priceChangePercent.toFixed(2)}%
                </span>
              )}
            </div>
          </div>

          {/* Right side - Balances */}
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <span className="text-binance-textSecondary">USD Balance:</span>
              <span className="font-medium text-binance-textPrimary">
                {formatCurrency(usdBalance, 'USD')}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-binance-textSecondary">BNX Balance:</span>
              <span className="font-medium text-binance-primary">
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
