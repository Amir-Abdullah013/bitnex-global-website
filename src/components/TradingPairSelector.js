'use client';

import { useState, useEffect } from 'react';
import Card, { CardContent, CardHeader, CardTitle } from './Card';
import Button from './Button';

const TradingPairSelector = ({ 
  selectedPair, 
  onPairChange, 
  className = '' 
}) => {
  const [tradingPairs, setTradingPairs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isOpen, setIsOpen] = useState(false);

  // Fetch trading pairs
  useEffect(() => {
    const fetchTradingPairs = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/trading-pairs');
        const data = await response.json();

        if (data.success) {
          setTradingPairs(data.tradingPairs);
        } else {
          setError(data.error || 'Failed to fetch trading pairs');
        }
      } catch (err) {
        console.error('Error fetching trading pairs:', err);
        setError('Failed to fetch trading pairs');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTradingPairs();
  }, []);

  // Format price for display
  const formatPrice = (price) => {
    if (!price || price === 0) return 'N/A';
    return `$${price.toFixed(4)}`;
  };

  // Format change percentage
  const formatChange = (change) => {
    if (change === 0) return '0.00%';
    const sign = change >= 0 ? '+' : '';
    return `${sign}${change.toFixed(2)}%`;
  };

  // Get change color
  const getChangeColor = (change) => {
    if (change > 0) return 'text-binance-green';
    if (change < 0) return 'text-binance-red';
    return 'text-binance-textSecondary';
  };

  // Get selected pair data
  const selectedPairData = tradingPairs.find(pair => pair.symbol === selectedPair);

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent>
          <div className="animate-pulse">
            <div className="h-8 bg-binance-surface rounded mb-2"></div>
            <div className="h-4 bg-binance-surface rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent>
          <div className="text-center py-4">
            <div className="text-binance-red text-sm">{error}</div>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => window.location.reload()}
              className="mt-2"
            >
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-binance-textPrimary">Trading Pairs</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Selected Pair Display */}
        <div className="mb-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-lg font-semibold text-binance-textPrimary">
                {selectedPairData?.symbol || selectedPair}
              </div>
              <div className="text-sm text-binance-textSecondary">
                {selectedPairData?.baseAsset}/{selectedPairData?.quoteAsset}
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsOpen(!isOpen)}
              className="text-binance-textSecondary"
            >
              {isOpen ? 'Hide' : 'Change'}
            </Button>
          </div>
          
          {/* Current Price Display */}
          {selectedPairData?.marketData && (
            <div className="mt-2 flex items-center space-x-4">
              <div>
                <div className="text-sm text-binance-textSecondary">Price</div>
                <div className="text-lg font-semibold text-binance-textPrimary">
                  {formatPrice(selectedPairData.marketData.price)}
                </div>
              </div>
              <div>
                <div className="text-sm text-binance-textSecondary">24h Change</div>
                <div className={`text-sm font-semibold ${getChangeColor(selectedPairData.marketData.change24h)}`}>
                  {formatChange(selectedPairData.marketData.change24h)}
                </div>
              </div>
              <div>
                <div className="text-sm text-binance-textSecondary">24h Volume</div>
                <div className="text-sm text-binance-textPrimary">
                  ${selectedPairData.marketData.volume24h.toLocaleString()}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Trading Pairs List */}
        {isOpen && (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {tradingPairs.map((pair) => (
              <div
                key={pair.id}
                onClick={() => {
                  onPairChange(pair.symbol);
                  setIsOpen(false);
                }}
                className={`p-3 rounded-lg border cursor-pointer transition-all duration-200 ${
                  pair.symbol === selectedPair
                    ? 'bg-binance-primary/10 border-binance-primary'
                    : 'bg-binance-surface hover:bg-binance-surfaceHover border-binance-border'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-binance-textPrimary">
                      {pair.symbol}
                    </div>
                    <div className="text-sm text-binance-textSecondary">
                      {pair.baseAsset}/{pair.quoteAsset}
                    </div>
                  </div>
                  
                  <div className="text-right">
                    {pair.marketData ? (
                      <>
                        <div className="text-sm font-semibold text-binance-textPrimary">
                          {formatPrice(pair.marketData.price)}
                        </div>
                        <div className={`text-xs ${getChangeColor(pair.marketData.change24h)}`}>
                          {formatChange(pair.marketData.change24h)}
                        </div>
                      </>
                    ) : (
                      <div className="text-sm text-binance-textTertiary">
                        No data
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Trading Pair Stats */}
        {selectedPairData && (
          <div className="mt-4 pt-4 border-t border-binance-border">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-binance-textSecondary">Orders</div>
                <div className="text-binance-textPrimary font-medium">
                  {selectedPairData.orderCount.toLocaleString()}
                </div>
              </div>
              <div>
                <div className="text-binance-textSecondary">Trades</div>
                <div className="text-binance-textPrimary font-medium">
                  {selectedPairData.tradeCount.toLocaleString()}
                </div>
              </div>
              <div>
                <div className="text-binance-textSecondary">Min Order</div>
                <div className="text-binance-textPrimary font-medium">
                  {selectedPairData.minOrderSize}
                </div>
              </div>
              <div>
                <div className="text-binance-textSecondary">Max Order</div>
                <div className="text-binance-textPrimary font-medium">
                  {selectedPairData.maxOrderSize.toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TradingPairSelector;



