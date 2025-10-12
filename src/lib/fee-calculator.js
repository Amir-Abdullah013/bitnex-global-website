/**
 * Fee Calculator for Bitnex Global
 * Handles trading fees, withdrawal fees, and deposit fees
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class FeeCalculator {
  constructor() {
    this.defaultFeeStructure = {
      makerFee: 0.001, // 0.1%
      takerFee: 0.001, // 0.1%
      withdrawalFees: {
        'BTC': 0.0005,
        'ETH': 0.01,
        'USDT': 1.0,
        'BNX': 0.1
      },
      depositFees: {
        'BTC': 0.0,
        'ETH': 0.0,
        'USDT': 0.0,
        'BNX': 0.0
      },
      minTradingFee: 0.0001,
      minWithdrawalFee: 0.0001
    };
  }

  /**
   * Get fee structure for a trading pair
   * @param {string} tradingPairId - Trading pair ID
   * @returns {Promise<Object>} Fee structure
   */
  async getFeeStructure(tradingPairId) {
    try {
      const tradingPair = await prisma.tradingPair.findUnique({
        where: { id: tradingPairId },
        include: { feeStructure: true }
      });

      if (tradingPair?.feeStructure) {
        return {
          makerFee: tradingPair.feeStructure.makerFee,
          takerFee: tradingPair.feeStructure.takerFee,
          withdrawalFees: tradingPair.feeStructure.withdrawalFees,
          depositFees: tradingPair.feeStructure.depositFees,
          minTradingFee: tradingPair.feeStructure.minTradingFee,
          minWithdrawalFee: tradingPair.feeStructure.minWithdrawalFee,
          maxTradingFee: tradingPair.feeStructure.maxTradingFee,
          maxWithdrawalFee: tradingPair.feeStructure.maxWithdrawalFee
        };
      }

      // Fallback to trading pair's individual fees
      if (tradingPair) {
        return {
          makerFee: tradingPair.makerFee,
          takerFee: tradingPair.takerFee,
          withdrawalFees: this.defaultFeeStructure.withdrawalFees,
          depositFees: this.defaultFeeStructure.depositFees,
          minTradingFee: this.defaultFeeStructure.minTradingFee,
          minWithdrawalFee: this.defaultFeeStructure.minWithdrawalFee
        };
      }

      return this.defaultFeeStructure;
    } catch (error) {
      console.error('Error getting fee structure:', error);
      return this.defaultFeeStructure;
    }
  }

  /**
   * Calculate trading fee for an order
   * @param {Object} params - Calculation parameters
   * @param {string} params.tradingPairId - Trading pair ID
   * @param {number} params.amount - Order amount
   * @param {number} params.price - Order price
   * @param {string} params.side - Order side (BUY/SELL)
   * @param {boolean} params.isMaker - Whether this is a maker order
   * @returns {Promise<Object>} Fee calculation result
   */
  async calculateTradingFee({ tradingPairId, amount, price, side, isMaker = false }) {
    try {
      const feeStructure = await this.getFeeStructure(tradingPairId);
      const feeRate = isMaker ? feeStructure.makerFee : feeStructure.takerFee;
      
      // Calculate fee amount
      const totalValue = amount * price;
      let feeAmount = totalValue * feeRate;
      
      // Apply minimum fee
      feeAmount = Math.max(feeAmount, feeStructure.minTradingFee);
      
      // Apply maximum fee if set
      if (feeStructure.maxTradingFee) {
        feeAmount = Math.min(feeAmount, feeStructure.maxTradingFee);
      }

      // Determine fee asset (quote asset for buy orders, base asset for sell orders)
      const feeAsset = side === 'BUY' ? 'quote' : 'base';
      const feeAssetAmount = side === 'BUY' ? feeAmount : feeAmount / price;

      return {
        feeAmount,
        feeAssetAmount,
        feeAsset,
        feeRate,
        isMaker,
        totalValue,
        breakdown: {
          baseAmount: amount,
          price: price,
          totalValue: totalValue,
          feeRate: feeRate,
          feeAmount: feeAmount,
          feeAssetAmount: feeAssetAmount
        }
      };
    } catch (error) {
      console.error('Error calculating trading fee:', error);
      throw new Error('Failed to calculate trading fee');
    }
  }

  /**
   * Calculate withdrawal fee for an asset
   * @param {Object} params - Calculation parameters
   * @param {string} params.asset - Asset symbol
   * @param {number} params.amount - Withdrawal amount
   * @param {string} params.tradingPairId - Optional trading pair ID for specific fees
   * @returns {Promise<Object>} Withdrawal fee calculation
   */
  async calculateWithdrawalFee({ asset, amount, tradingPairId = null }) {
    try {
      let feeStructure;
      
      if (tradingPairId) {
        feeStructure = await this.getFeeStructure(tradingPairId);
      } else {
        feeStructure = this.defaultFeeStructure;
      }

      const withdrawalFees = feeStructure.withdrawalFees;
      const feeAmount = withdrawalFees[asset] || feeStructure.minWithdrawalFee;
      
      // Ensure minimum fee
      const finalFeeAmount = Math.max(feeAmount, feeStructure.minWithdrawalFee);

      return {
        feeAmount: finalFeeAmount,
        asset: asset,
        withdrawalAmount: amount,
        netAmount: amount - finalFeeAmount,
        breakdown: {
          withdrawalAmount: amount,
          feeAmount: finalFeeAmount,
          netAmount: amount - finalFeeAmount,
          feeRate: finalFeeAmount / amount
        }
      };
    } catch (error) {
      console.error('Error calculating withdrawal fee:', error);
      throw new Error('Failed to calculate withdrawal fee');
    }
  }

  /**
   * Calculate deposit fee (usually 0)
   * @param {Object} params - Calculation parameters
   * @param {string} params.asset - Asset symbol
   * @param {number} params.amount - Deposit amount
   * @param {string} params.tradingPairId - Optional trading pair ID
   * @returns {Promise<Object>} Deposit fee calculation
   */
  async calculateDepositFee({ asset, amount, tradingPairId = null }) {
    try {
      let feeStructure;
      
      if (tradingPairId) {
        feeStructure = await this.getFeeStructure(tradingPairId);
      } else {
        feeStructure = this.defaultFeeStructure;
      }

      const depositFees = feeStructure.depositFees;
      const feeAmount = depositFees[asset] || 0;

      return {
        feeAmount,
        asset: asset,
        depositAmount: amount,
        netAmount: amount - feeAmount,
        breakdown: {
          depositAmount: amount,
          feeAmount: feeAmount,
          netAmount: amount - feeAmount,
          feeRate: feeAmount / amount
        }
      };
    } catch (error) {
      console.error('Error calculating deposit fee:', error);
      throw new Error('Failed to calculate deposit fee');
    }
  }

  /**
   * Apply fees to a trade
   * @param {Object} params - Trade parameters
   * @param {string} params.tradingPairId - Trading pair ID
   * @param {number} params.amount - Trade amount
   * @param {number} params.price - Trade price
   * @param {string} params.buyerSide - Buyer side (BUY/SELL)
   * @param {string} params.sellerSide - Seller side (BUY/SELL)
   * @param {boolean} params.buyerIsMaker - Whether buyer is maker
   * @returns {Promise<Object>} Trade with fees applied
   */
  async applyTradeFees({ tradingPairId, amount, price, buyerSide, sellerSide, buyerIsMaker }) {
    try {
      const buyerFee = await this.calculateTradingFee({
        tradingPairId,
        amount,
        price,
        side: buyerSide,
        isMaker: buyerIsMaker
      });

      const sellerFee = await this.calculateTradingFee({
        tradingPairId,
        amount,
        price,
        side: sellerSide,
        isMaker: !buyerIsMaker
      });

      return {
        trade: {
          amount,
          price,
          totalValue: amount * price
        },
        buyerFee,
        sellerFee,
        totalFees: {
          buyer: buyerFee.feeAmount,
          seller: sellerFee.feeAmount,
          total: buyerFee.feeAmount + sellerFee.feeAmount
        }
      };
    } catch (error) {
      console.error('Error applying trade fees:', error);
      throw new Error('Failed to apply trade fees');
    }
  }

  /**
   * Get fee information for display
   * @param {string} tradingPairId - Trading pair ID
   * @returns {Promise<Object>} Fee information for UI
   */
  async getFeeInfo(tradingPairId) {
    try {
      const feeStructure = await this.getFeeStructure(tradingPairId);
      
      return {
        trading: {
          makerFee: feeStructure.makerFee,
          takerFee: feeStructure.takerFee,
          makerFeePercent: (feeStructure.makerFee * 100).toFixed(3),
          takerFeePercent: (feeStructure.takerFee * 100).toFixed(3)
        },
        withdrawal: feeStructure.withdrawalFees,
        deposit: feeStructure.depositFees,
        limits: {
          minTradingFee: feeStructure.minTradingFee,
          minWithdrawalFee: feeStructure.minWithdrawalFee,
          maxTradingFee: feeStructure.maxTradingFee,
          maxWithdrawalFee: feeStructure.maxWithdrawalFee
        }
      };
    } catch (error) {
      console.error('Error getting fee info:', error);
      return {
        trading: {
          makerFee: 0.001,
          takerFee: 0.001,
          makerFeePercent: '0.100',
          takerFeePercent: '0.100'
        },
        withdrawal: this.defaultFeeStructure.withdrawalFees,
        deposit: this.defaultFeeStructure.depositFees,
        limits: {
          minTradingFee: 0.0001,
          minWithdrawalFee: 0.0001
        }
      };
    }
  }
}

// Export singleton instance
export const feeCalculator = new FeeCalculator();

// Export utility functions
export const formatFee = (fee, decimals = 6) => {
  return parseFloat(fee).toFixed(decimals);
};

export const formatFeePercent = (feeRate, decimals = 3) => {
  return (feeRate * 100).toFixed(decimals) + '%';
};

export const calculateFeeFromAmount = (amount, feeRate) => {
  return amount * feeRate;
};

export const calculateNetAmount = (amount, fee) => {
  return amount - fee;
};

