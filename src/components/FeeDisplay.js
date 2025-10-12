'use client';

import { useState, useEffect } from 'react';
import Card, { CardContent, CardHeader, CardTitle } from './Card';
import { formatFee, formatFeePercent } from '../lib/fee-calculator';

const FeeDisplay = ({ 
  tradingPairId, 
  className = '', 
  showWithdrawalFees = true,
  showDepositFees = false,
  compact = false 
}) => {
  const [feeInfo, setFeeInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (tradingPairId) {
      fetchFeeInfo();
    }
  }, [tradingPairId]);

  const fetchFeeInfo = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/fees?type=info&tradingPairId=${tradingPairId}`);
      const data = await response.json();
      
      if (data.success) {
        setFeeInfo(data.feeInfo);
        setError(null);
      } else {
        setError(data.error);
      }
    } catch (err) {
      console.error('Error fetching fee info:', err);
      setError('Failed to load fee information');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className={`${className}`}>
        <Card>
          <CardHeader>
            <CardTitle className="text-binance-textPrimary">Fee Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="animate-pulse space-y-3">
              <div className="h-4 bg-binance-surface rounded w-3/4"></div>
              <div className="h-4 bg-binance-surface rounded w-1/2"></div>
              <div className="h-4 bg-binance-surface rounded w-2/3"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${className}`}>
        <Card>
          <CardHeader>
            <CardTitle className="text-binance-textPrimary">Fee Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-4">
              <div className="text-binance-red text-sm">{error}</div>
              <button
                onClick={fetchFeeInfo}
                className="mt-2 text-binance-primary hover:text-binance-primary/80 text-sm"
              >
                Retry
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!feeInfo) {
    return null;
  }

  if (compact) {
    return (
      <div className={`${className}`}>
        <div className="bg-binance-surface rounded-lg p-3">
          <div className="flex justify-between items-center text-sm">
            <span className="text-binance-textSecondary">Trading Fees:</span>
            <div className="flex space-x-4">
              <span className="text-binance-textPrimary">
                Maker: {formatFeePercent(feeInfo.trading.makerFee)}
              </span>
              <span className="text-binance-textPrimary">
                Taker: {formatFeePercent(feeInfo.trading.takerFee)}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Trading Fees */}
      <Card>
        <CardHeader>
          <CardTitle className="text-binance-textPrimary">Trading Fees</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-binance-textSecondary">Maker Fee:</span>
                <span className="text-binance-textPrimary font-medium">
                  {formatFeePercent(feeInfo.trading.makerFee)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-binance-textSecondary">Taker Fee:</span>
                <span className="text-binance-textPrimary font-medium">
                  {formatFeePercent(feeInfo.trading.takerFee)}
                </span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-binance-textSecondary">Min Trading Fee:</span>
                <span className="text-binance-textPrimary">
                  {formatFee(feeInfo.limits.minTradingFee)}
                </span>
              </div>
              {feeInfo.limits.maxTradingFee && (
                <div className="flex justify-between">
                  <span className="text-binance-textSecondary">Max Trading Fee:</span>
                  <span className="text-binance-textPrimary">
                    {formatFee(feeInfo.limits.maxTradingFee)}
                  </span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Withdrawal Fees */}
      {showWithdrawalFees && (
        <Card>
          <CardHeader>
            <CardTitle className="text-binance-textPrimary">Withdrawal Fees</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(feeInfo.withdrawal).map(([asset, fee]) => (
                <div key={asset} className="flex justify-between">
                  <span className="text-binance-textSecondary">{asset}:</span>
                  <span className="text-binance-textPrimary font-medium">
                    {formatFee(fee)} {asset}
                  </span>
                </div>
              ))}
              <div className="border-t border-binance-border pt-2 mt-2">
                <div className="flex justify-between">
                  <span className="text-binance-textSecondary">Min Withdrawal Fee:</span>
                  <span className="text-binance-textPrimary">
                    {formatFee(feeInfo.limits.minWithdrawalFee)}
                  </span>
                </div>
                {feeInfo.limits.maxWithdrawalFee && (
                  <div className="flex justify-between">
                    <span className="text-binance-textSecondary">Max Withdrawal Fee:</span>
                    <span className="text-binance-textPrimary">
                      {formatFee(feeInfo.limits.maxWithdrawalFee)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Deposit Fees */}
      {showDepositFees && (
        <Card>
          <CardHeader>
            <CardTitle className="text-binance-textPrimary">Deposit Fees</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(feeInfo.deposit).map(([asset, fee]) => (
                <div key={asset} className="flex justify-between">
                  <span className="text-binance-textSecondary">{asset}:</span>
                  <span className="text-binance-textPrimary font-medium">
                    {formatFee(fee)} {asset}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default FeeDisplay;

