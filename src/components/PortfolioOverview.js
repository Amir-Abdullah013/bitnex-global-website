'use client';

import { useState, useEffect } from 'react';
import Card, { CardContent, CardHeader, CardTitle } from './Card';
import { useUniversal } from '../lib/universal-context';

const PortfolioOverview = ({ className = '' }) => {
  const { formatCurrency, formatBnx } = useUniversal();
  const [portfolio, setPortfolio] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    fetchPortfolio();
    // Refresh every 30 seconds
    const interval = setInterval(fetchPortfolio, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchPortfolio = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/portfolio');
      const data = await response.json();
      
      if (data.success) {
        setPortfolio(data.portfolio);
        setLastUpdated(new Date());
        setError(null);
      } else {
        setError(data.error);
      }
    } catch (err) {
      console.error('Error fetching portfolio:', err);
      setError('Failed to load portfolio data');
    } finally {
      setIsLoading(false);
    }
  };

  const refreshPortfolio = async () => {
    try {
      const response = await fetch('/api/portfolio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'refresh' })
      });
      const data = await response.json();
      
      if (data.success) {
        setPortfolio(data.portfolio);
        setLastUpdated(new Date());
      }
    } catch (err) {
      console.error('Error refreshing portfolio:', err);
    }
  };

  if (isLoading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <Card>
          <CardHeader>
            <CardTitle className="text-binance-textPrimary">Portfolio Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="animate-pulse space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-20 bg-binance-surface rounded-lg"></div>
                ))}
              </div>
              <div className="h-32 bg-binance-surface rounded-lg"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`space-y-6 ${className}`}>
        <Card>
          <CardHeader>
            <CardTitle className="text-binance-textPrimary">Portfolio Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <div className="text-binance-red text-sm mb-4">{error}</div>
              <button
                onClick={fetchPortfolio}
                className="text-binance-primary hover:text-binance-primary/80 text-sm"
              >
                Retry
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!portfolio) {
    return null;
  }

  const { 
    totalValue = 0, 
    totalPnl = 0, 
    totalPnlPercent = 0, 
    holdings = [], 
    wallet = null, 
    metrics = null 
  } = portfolio || {};

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Portfolio Summary */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-binance-textPrimary">Portfolio Overview</CardTitle>
            <div className="flex items-center space-x-2">
              {lastUpdated && (
                <span className="text-binance-textSecondary text-sm">
                  Updated {lastUpdated.toLocaleTimeString()}
                </span>
              )}
              <button
                onClick={refreshPortfolio}
                className="text-binance-primary hover:text-binance-primary/80 text-sm"
              >
                Refresh
              </button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Total Value */}
            <div className="text-center">
              <div className="text-2xl font-bold text-binance-textPrimary">
                {formatCurrency(totalValue)}
              </div>
              <div className="text-binance-textSecondary text-sm">Total Value</div>
            </div>

            {/* P&L */}
            <div className="text-center">
              <div className={`text-2xl font-bold ${totalPnl >= 0 ? 'text-binance-green' : 'text-binance-red'}`}>
                {totalPnl >= 0 ? '+' : ''}{formatCurrency(totalPnl)}
              </div>
              <div className="text-binance-textSecondary text-sm">
                P&L ({totalPnlPercent >= 0 ? '+' : ''}{totalPnlPercent.toFixed(2)}%)
              </div>
            </div>

            {/* Total Trades */}
            <div className="text-center">
              <div className="text-2xl font-bold text-binance-textPrimary">
                {portfolio.totalTrades || 0}
              </div>
              <div className="text-binance-textSecondary text-sm">Total Trades</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Holdings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-binance-textPrimary">Holdings</CardTitle>
        </CardHeader>
        <CardContent>
          {holdings && holdings.length > 0 ? (
            <div className="space-y-3">
              {holdings.map((holding) => (
                <div key={holding.asset} className="flex justify-between items-center p-3 bg-binance-surface rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-binance-primary rounded-full flex items-center justify-center text-binance-background font-bold text-sm">
                      {holding.asset.charAt(0)}
                    </div>
                    <div>
                      <div className="font-medium text-binance-textPrimary">{holding.asset}</div>
                      <div className="text-sm text-binance-textSecondary">
                        {(holding.amount || 0).toFixed(6)} {holding.asset}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-binance-textPrimary">
                      {formatCurrency(holding.value)}
                    </div>
                    <div className={`text-sm ${(holding.pnl || 0) >= 0 ? 'text-binance-green' : 'text-binance-red'}`}>
                      {(holding.pnl || 0) >= 0 ? '+' : ''}{formatCurrency(holding.pnl || 0)} ({(holding.pnlPercent || 0) >= 0 ? '+' : ''}{(holding.pnlPercent || 0).toFixed(2)}%)
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-binance-textSecondary">
              No holdings found
            </div>
          )}
        </CardContent>
      </Card>

      {/* Wallet Balances */}
      {wallet && (
        <Card>
          <CardHeader>
            <CardTitle className="text-binance-textPrimary">Wallet Balances</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex justify-between items-center p-3 bg-binance-surface rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    $
                  </div>
                  <div>
                    <div className="font-medium text-binance-textPrimary">USD</div>
                    <div className="text-sm text-binance-textSecondary">US Dollar</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium text-binance-textPrimary">
                    {formatCurrency(wallet.balance)}
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center p-3 bg-binance-surface rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-binance-primary rounded-full flex items-center justify-center text-binance-background font-bold text-sm">
                    B
                  </div>
                  <div>
                    <div className="font-medium text-binance-textPrimary">BNX</div>
                    <div className="text-sm text-binance-textSecondary">Bitnex Token</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium text-binance-textPrimary">
                    {formatBnx(wallet.bnxBalance)}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Trading Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="text-binance-textPrimary">Trading Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-lg font-bold text-binance-textPrimary">
                {(portfolio.winRate || 0).toFixed(1)}%
              </div>
              <div className="text-binance-textSecondary text-sm">Win Rate</div>
            </div>

            <div className="text-center">
              <div className="text-lg font-bold text-binance-textPrimary">
                {formatCurrency(portfolio.avgTradeSize || 0)}
              </div>
              <div className="text-binance-textSecondary text-sm">Avg Trade Size</div>
            </div>

            <div className="text-center">
              <div className="text-lg font-bold text-binance-green">
                {formatCurrency(portfolio.bestTrade || 0)}
              </div>
              <div className="text-binance-textSecondary text-sm">Best Trade</div>
            </div>

            <div className="text-center">
              <div className="text-lg font-bold text-binance-red">
                {formatCurrency(portfolio.worstTrade || 0)}
              </div>
              <div className="text-binance-textSecondary text-sm">Worst Trade</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PortfolioOverview;
