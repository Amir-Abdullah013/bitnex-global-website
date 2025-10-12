'use client';

import { useState, useEffect } from 'react';
import Card, { CardContent, CardHeader, CardTitle } from './Card';
import { useBitnex } from '../lib/bitnex-context';

const TradingAnalytics = ({ className = '' }) => {
  const { formatCurrency, formatBnx } = useBitnex();
  const [analytics, setAnalytics] = useState(null);
  const [recentTrades, setRecentTrades] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState('7d');

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    try {
      setIsLoading(true);
      const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
      const response = await fetch(`/api/portfolio?includeAnalytics=true&days=${days}`);
      const data = await response.json();
      
      if (data.success) {
        setAnalytics(data.portfolio.analytics || []);
        setRecentTrades(data.portfolio.recentTrades || []);
        setError(null);
      } else {
        setError(data.error);
      }
    } catch (err) {
      console.error('Error fetching analytics:', err);
      setError('Failed to load analytics data');
    } finally {
      setIsLoading(false);
    }
  };

  const getTimeRangeLabel = () => {
    switch (timeRange) {
      case '7d': return 'Last 7 Days';
      case '30d': return 'Last 30 Days';
      case '90d': return 'Last 90 Days';
      default: return 'Last 7 Days';
    }
  };

  const calculateTradeStats = () => {
    if (!recentTrades.length) return null;

    const totalVolume = recentTrades.reduce((sum, trade) => sum + (trade.amount * trade.price), 0);
    const totalFees = recentTrades.reduce((sum, trade) => sum + (trade.buyerFee + trade.sellerFee), 0);
    const profitableTrades = recentTrades.filter(trade => {
      // Simple P&L calculation - in real implementation, this would be more complex
      return trade.buyerFee < trade.sellerFee; // Simplified logic
    }).length;

    return {
      totalVolume,
      totalFees,
      tradeCount: recentTrades.length,
      winRate: recentTrades.length > 0 ? (profitableTrades / recentTrades.length) * 100 : 0,
      avgTradeSize: recentTrades.length > 0 ? totalVolume / recentTrades.length : 0
    };
  };

  const formatTradeSide = (trade) => {
    // This would need to be determined based on user's role in the trade
    return 'BUY'; // Simplified for now
  };

  const formatTradePnl = (trade) => {
    // This would need proper P&L calculation based on user's position
    return 0; // Simplified for now
  };

  if (isLoading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <Card>
          <CardHeader>
            <CardTitle className="text-binance-textPrimary">Trading Analytics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="animate-pulse space-y-4">
              <div className="h-32 bg-binance-surface rounded-lg"></div>
              <div className="h-64 bg-binance-surface rounded-lg"></div>
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
            <CardTitle className="text-binance-textPrimary">Trading Analytics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <div className="text-binance-red text-sm mb-4">{error}</div>
              <button
                onClick={fetchAnalytics}
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

  const tradeStats = calculateTradeStats();

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Analytics Header */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-binance-textPrimary">Trading Analytics</CardTitle>
            <div className="flex space-x-2">
              {['7d', '30d', '90d'].map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-3 py-1 rounded text-sm ${
                    timeRange === range
                      ? 'bg-binance-primary text-binance-background'
                      : 'bg-binance-surface text-binance-textSecondary hover:bg-binance-surfaceHover'
                  }`}
                >
                  {range.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-binance-textSecondary text-sm mb-4">
            {getTimeRangeLabel()}
          </div>
          
          {tradeStats && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-binance-textPrimary">
                  {formatCurrency(tradeStats.totalVolume)}
                </div>
                <div className="text-binance-textSecondary text-sm">Total Volume</div>
              </div>

              <div className="text-center">
                <div className="text-2xl font-bold text-binance-textPrimary">
                  {tradeStats.tradeCount}
                </div>
                <div className="text-binance-textSecondary text-sm">Trades</div>
              </div>

              <div className="text-center">
                <div className="text-2xl font-bold text-binance-textPrimary">
                  {tradeStats.winRate.toFixed(1)}%
                </div>
                <div className="text-binance-textSecondary text-sm">Win Rate</div>
              </div>

              <div className="text-center">
                <div className="text-2xl font-bold text-binance-textPrimary">
                  {formatCurrency(tradeStats.avgTradeSize)}
                </div>
                <div className="text-binance-textSecondary text-sm">Avg Trade Size</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Portfolio Value Chart */}
      {analytics && analytics.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-binance-textPrimary">Portfolio Value Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-end space-x-1">
              {analytics.map((point, index) => {
                const maxValue = Math.max(...analytics.map(p => p.totalValue));
                const height = (point.totalValue / maxValue) * 100;
                const isPositive = point.totalPnl >= 0;
                
                return (
                  <div key={index} className="flex-1 flex flex-col items-center">
                    <div
                      className={`w-full rounded-t ${
                        isPositive ? 'bg-binance-green' : 'bg-binance-red'
                      }`}
                      style={{ height: `${height}%` }}
                      title={`${new Date(point.date).toLocaleDateString()}: ${formatCurrency(point.totalValue)}`}
                    ></div>
                    {index % Math.ceil(analytics.length / 7) === 0 && (
                      <div className="text-xs text-binance-textSecondary mt-1">
                        {new Date(point.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Trades */}
      <Card>
        <CardHeader>
          <CardTitle className="text-binance-textPrimary">Recent Trades</CardTitle>
        </CardHeader>
        <CardContent>
          {recentTrades.length > 0 ? (
            <div className="space-y-2">
              {recentTrades.slice(0, 10).map((trade, index) => (
                <div key={index} className="flex justify-between items-center p-3 bg-binance-surface rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`w-2 h-2 rounded-full ${
                      formatTradeSide(trade) === 'BUY' ? 'bg-binance-green' : 'bg-binance-red'
                    }`}></div>
                    <div>
                      <div className="font-medium text-binance-textPrimary">
                        {trade.tradingPair.symbol}
                      </div>
                      <div className="text-sm text-binance-textSecondary">
                        {new Date(trade.createdAt).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-binance-textPrimary">
                      {trade.amount.toFixed(6)} @ {formatCurrency(trade.price)}
                    </div>
                    <div className={`text-sm ${
                      formatTradePnl(trade) >= 0 ? 'text-binance-green' : 'text-binance-red'
                    }`}>
                      {formatTradePnl(trade) >= 0 ? '+' : ''}{formatCurrency(formatTradePnl(trade))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-binance-textSecondary">
              No recent trades found
            </div>
          )}
        </CardContent>
      </Card>

      {/* Trading Performance Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="text-binance-textPrimary">Performance Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-binance-textPrimary font-medium mb-3">Trading Activity</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-binance-textSecondary">Total Trades:</span>
                  <span className="text-binance-textPrimary">{tradeStats?.tradeCount || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-binance-textSecondary">Total Volume:</span>
                  <span className="text-binance-textPrimary">{formatCurrency(tradeStats?.totalVolume || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-binance-textSecondary">Total Fees:</span>
                  <span className="text-binance-textPrimary">{formatCurrency(tradeStats?.totalFees || 0)}</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-binance-textPrimary font-medium mb-3">Performance</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-binance-textSecondary">Win Rate:</span>
                  <span className="text-binance-textPrimary">{tradeStats?.winRate.toFixed(1) || 0}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-binance-textSecondary">Avg Trade Size:</span>
                  <span className="text-binance-textPrimary">{formatCurrency(tradeStats?.avgTradeSize || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-binance-textSecondary">Best Trade:</span>
                  <span className="text-binance-green">{formatCurrency(0)}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TradingAnalytics;

