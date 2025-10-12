'use client';

import { useState, useEffect } from 'react';
import Card, { CardContent, CardHeader, CardTitle } from './Card';
import { useTrades } from '../hooks/useWebSocket';
import { useTradingPair } from '../lib/trading-pair-context';

const LiveTrades = ({ className = '', maxTrades = 20 }) => {
  const { selectedPair } = useTradingPair();
  const { recentTrades, newTrades, isConnected } = useTrades(selectedPair);
  const [displayTrades, setDisplayTrades] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isConnected) {
      setIsLoading(false);
    }
  }, [isConnected]);

  // Combine recent trades and new trades, removing duplicates
  useEffect(() => {
    const allTrades = [...newTrades, ...recentTrades];
    const uniqueTrades = allTrades.filter((trade, index, self) => 
      index === self.findIndex(t => t.id === trade.id)
    );
    
    // Sort by creation time (newest first)
    const sortedTrades = uniqueTrades.sort((a, b) => 
      new Date(b.createdAt) - new Date(a.createdAt)
    );
    
    setDisplayTrades(sortedTrades.slice(0, maxTrades));
  }, [recentTrades, newTrades, maxTrades]);

  // Format price for display
  const formatPrice = (price) => {
    return `$${price.toFixed(4)}`;
  };

  // Format amount for display
  const formatAmount = (amount) => {
    return amount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  // Format total value
  const formatTotal = (amount, price) => {
    const total = amount * price;
    return `$${total.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };

  // Format time
  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  // Get trade side color
  const getTradeSideColor = (side) => {
    return side === 'BUY' ? 'text-binance-green' : 'text-binance-red';
  };

  // Get trade side background
  const getTradeSideBg = (side) => {
    return side === 'BUY' ? 'bg-binance-green/10' : 'bg-binance-red/10';
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-binance-textPrimary">Live Trades</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex justify-between">
                <div className="h-4 bg-binance-surface rounded w-20"></div>
                <div className="h-4 bg-binance-surface rounded w-16"></div>
                <div className="h-4 bg-binance-surface rounded w-24"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-binance-textPrimary">Live Trades</CardTitle>
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${
              isConnected ? 'bg-binance-green' : 'bg-binance-red'
            }`}></div>
            <span className="text-xs text-binance-textSecondary">
              {isConnected ? 'Live' : 'Offline'}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {displayTrades.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-binance-textTertiary text-lg mb-2">No trades yet</div>
            <div className="text-binance-textSecondary text-sm">
              Trades will appear here in real-time
            </div>
          </div>
        ) : (
          <div className="space-y-1 max-h-96 overflow-y-auto">
            {displayTrades.map((trade, index) => (
              <div
                key={`${trade.id}-${index}`}
                className={`flex items-center justify-between py-2 px-3 rounded transition-colors hover:bg-binance-surfaceHover ${
                  newTrades.some(nt => nt.id === trade.id) ? 'animate-pulse' : ''
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-2 h-2 rounded-full ${
                    trade.side === 'BUY' ? 'bg-binance-green' : 'bg-binance-red'
                  }`}></div>
                  <div>
                    <div className="text-sm text-binance-textPrimary">
                      {formatAmount(trade.amount)} BNX
                    </div>
                    <div className="text-xs text-binance-textTertiary">
                      {formatTime(trade.createdAt)}
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className={`text-sm font-medium ${
                    trade.side === 'BUY' ? 'text-binance-green' : 'text-binance-red'
                  }`}>
                    {formatPrice(trade.price)}
                  </div>
                  <div className="text-xs text-binance-textSecondary">
                    {formatTotal(trade.amount, trade.price)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Trade Statistics */}
        {displayTrades.length > 0 && (
          <div className="mt-4 pt-4 border-t border-binance-border">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-binance-textSecondary">Total Volume:</div>
                <div className="text-binance-textPrimary font-medium">
                  {formatTotal(
                    displayTrades.reduce((sum, trade) => sum + trade.amount, 0),
                    displayTrades.reduce((sum, trade) => sum + trade.price, 0) / displayTrades.length
                  )}
                </div>
              </div>
              <div>
                <div className="text-binance-textSecondary">Avg Price:</div>
                <div className="text-binance-textPrimary font-medium">
                  {formatPrice(
                    displayTrades.reduce((sum, trade) => sum + trade.price, 0) / displayTrades.length
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default LiveTrades;
