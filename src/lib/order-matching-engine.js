'use client';

// Dynamic Prisma import to avoid build-time issues
let prismaClient;

/**
 * Get Prisma client dynamically
 */
async function getPrisma() {
  if (!prismaClient) {
    const { PrismaClient } = await import('@prisma/client');
    prismaClient = new PrismaClient();
  }
  return prismaClient;
}

// Replace all prisma calls with getPrisma() calls
const prisma = {
  wallet: {
    findUnique: async (args) => {
      const client = await getPrisma();
      return client.wallet.findUnique(args);
    },
    findFirst: async (args) => {
      const client = await getPrisma();
      return client.wallet.findFirst(args);
    },
    create: async (args) => {
      const client = await getPrisma();
      return client.wallet.create(args);
    },
    update: async (args) => {
      const client = await getPrisma();
      return client.wallet.update(args);
    }
  },
  order: {
    create: async (args) => {
      const client = await getPrisma();
      return client.order.create(args);
    },
    findMany: async (args) => {
      const client = await getPrisma();
      return client.order.findMany(args);
    },
    findFirst: async (args) => {
      const client = await getPrisma();
      return client.order.findFirst(args);
    },
    update: async (args) => {
      const client = await getPrisma();
      return client.order.update(args);
    }
  },
  trade: {
    create: async (args) => {
      const client = await getPrisma();
      return client.trade.create(args);
    },
    findMany: async (args) => {
      const client = await getPrisma();
      return client.trade.findMany(args);
    }
  },
  price: {
    findFirst: async (args) => {
      const client = await getPrisma();
      return client.price.findFirst(args);
    }
  }
};

/**
 * Order Matching Engine for Bitnex Global
 * Handles buy/sell order matching, partial fills, and trade recording
 */
class OrderMatchingEngine {
  constructor() {
    this.isProcessing = false;
  }

  /**
   * Process a new order and attempt to match it with existing orders
   * @param {Object} order - The order to process
   * @returns {Object} - Result of the matching process
   */
  async processOrder(order) {
    if (this.isProcessing) {
      throw new Error('Order matching engine is currently processing another order');
    }

    this.isProcessing = true;

    try {
      // Validate order
      await this.validateOrder(order);

      // Get user wallet to check balances
      const wallet = await prisma.wallet.findUnique({
        where: { userId: order.userId }
      });

      if (!wallet) {
        throw new Error('User wallet not found');
      }

      // Check if user has sufficient balance
      await this.checkBalance(order, wallet);

      // Create the order in database
      const createdOrder = await prisma.order.create({
        data: {
          userId: order.userId,
          type: order.type,
          side: order.side,
          amount: order.amount,
          price: order.price,
          status: 'PENDING'
        }
      });

      // Attempt to match the order
      const matchingResult = await this.matchOrder(createdOrder);

      return {
        success: true,
        order: createdOrder,
        matches: matchingResult.matches,
        trades: matchingResult.trades,
        remainingAmount: matchingResult.remainingAmount
      };

    } catch (error) {
      console.error('Error processing order:', error);
      throw error;
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Validate order data
   * @param {Object} order - Order to validate
   */
  async validateOrder(order) {
    if (!order.userId || !order.side || !order.amount) {
      throw new Error('Missing required order fields');
    }

    if (order.amount <= 0) {
      throw new Error('Order amount must be greater than 0');
    }

    if (order.type === 'LIMIT' && (!order.price || order.price <= 0)) {
      throw new Error('Limit orders must have a valid price');
    }

    if (!['BUY', 'SELL'].includes(order.side)) {
      throw new Error('Invalid order side');
    }

    if (!['MARKET', 'LIMIT'].includes(order.type)) {
      throw new Error('Invalid order type');
    }
  }

  /**
   * Check if user has sufficient balance for the order
   * @param {Object} order - Order to check
   * @param {Object} wallet - User's wallet
   */
  async checkBalance(order, wallet) {
    if (order.side === 'BUY') {
      // For buy orders, check USD balance
      const requiredUSD = order.type === 'MARKET' 
        ? order.amount * await this.getCurrentMarketPrice()
        : order.amount * order.price;

      if (wallet.balance < requiredUSD) {
        throw new Error('Insufficient USD balance for buy order');
      }
    } else if (order.side === 'SELL') {
      // For sell orders, check BNX balance
      if (wallet.bnxBalance < order.amount) {
        throw new Error('Insufficient BNX balance for sell order');
      }
    }
  }

  /**
   * Get current market price (simplified - in real implementation, this would fetch from price feed)
   * @returns {number} Current market price
   */
  async getCurrentMarketPrice() {
    // In a real implementation, this would fetch from a price feed
    // For now, we'll use a simple price calculation
    const latestPrice = await prisma.price.findFirst({
      where: { symbol: 'BNX' },
      orderBy: { timestamp: 'desc' }
    });

    return latestPrice ? latestPrice.price : 0.0035; // Default price
  }

  /**
   * Match an order with existing orders
   * @param {Object} order - Order to match
   * @returns {Object} - Matching results
   */
  async matchOrder(order) {
    const matches = [];
    const trades = [];
    let remainingAmount = order.amount;

    if (order.side === 'BUY') {
      // Find matching sell orders
      const matchingSellOrders = await this.findMatchingSellOrders(order);
      
      for (const sellOrder of matchingSellOrders) {
        if (remainingAmount <= 0) break;

        const matchAmount = Math.min(remainingAmount, sellOrder.amount - sellOrder.filledAmount);
        const matchPrice = sellOrder.price;
        const matchValue = matchAmount * matchPrice;

        // Create trade record
        const trade = await this.createTrade(order, sellOrder, matchAmount, matchPrice);
        trades.push(trade);

        // Update wallet balances
        await this.updateWalletBalances(order, sellOrder, matchAmount, matchPrice);

        // Update order statuses
        await this.updateOrderStatuses(order, sellOrder, matchAmount);

        matches.push({
          matchedOrder: sellOrder,
          amount: matchAmount,
          price: matchPrice,
          value: matchValue
        });

        remainingAmount -= matchAmount;
      }
    } else if (order.side === 'SELL') {
      // Find matching buy orders
      const matchingBuyOrders = await this.findMatchingBuyOrders(order);
      
      for (const buyOrder of matchingBuyOrders) {
        if (remainingAmount <= 0) break;

        const matchAmount = Math.min(remainingAmount, buyOrder.amount - buyOrder.filledAmount);
        const matchPrice = order.price || buyOrder.price;
        const matchValue = matchAmount * matchPrice;

        // Create trade record
        const trade = await this.createTrade(buyOrder, order, matchAmount, matchPrice);
        trades.push(trade);

        // Update wallet balances
        await this.updateWalletBalances(buyOrder, order, matchAmount, matchPrice);

        // Update order statuses
        await this.updateOrderStatuses(buyOrder, order, matchAmount);

        matches.push({
          matchedOrder: buyOrder,
          amount: matchAmount,
          price: matchPrice,
          value: matchValue
        });

        remainingAmount -= matchAmount;
      }
    }

    return { matches, trades, remainingAmount };
  }

  /**
   * Find matching sell orders for a buy order
   * @param {Object} buyOrder - Buy order to match
   * @returns {Array} - Array of matching sell orders
   */
  async findMatchingSellOrders(buyOrder) {
    const whereClause = {
      side: 'SELL',
      status: { in: ['PENDING', 'PARTIALLY_FILLED'] }
    };

    if (buyOrder.type === 'LIMIT') {
      whereClause.price = { lte: buyOrder.price };
    }

    return await prisma.order.findMany({
      where: whereClause,
      orderBy: [
        { price: 'asc' }, // Best price first
        { createdAt: 'asc' } // FIFO for same price
      ]
    });
  }

  /**
   * Find matching buy orders for a sell order
   * @param {Object} sellOrder - Sell order to match
   * @returns {Array} - Array of matching buy orders
   */
  async findMatchingBuyOrders(sellOrder) {
    const whereClause = {
      side: 'BUY',
      status: { in: ['PENDING', 'PARTIALLY_FILLED'] }
    };

    if (sellOrder.type === 'LIMIT') {
      whereClause.price = { gte: sellOrder.price };
    }

    return await prisma.order.findMany({
      where: whereClause,
      orderBy: [
        { price: 'desc' }, // Best price first
        { createdAt: 'asc' } // FIFO for same price
      ]
    });
  }

  /**
   * Create a trade record with fee calculations
   * @param {Object} buyOrder - Buy order
   * @param {Object} sellOrder - Sell order
   * @param {number} amount - Trade amount
   * @param {number} price - Trade price
   * @returns {Object} - Created trade with fees
   */
  async createTrade(buyOrder, sellOrder, amount, price) {
    const totalValue = amount * price;

    // Calculate fees for both buyer and seller
    const feeCalculation = await feeCalculator.applyTradeFees({
      tradingPairId: buyOrder.tradingPairId,
      amount,
      price,
      buyerSide: buyOrder.side,
      sellerSide: sellOrder.side,
      buyerIsMaker: buyOrder.type === 'LIMIT' // Assuming limit orders are makers
    });

    // Create trade record
    const trade = await prisma.trade.create({
      data: {
        orderId: buyOrder.id,
        buyerId: buyOrder.userId,
        sellerId: sellOrder.userId,
        amount: amount,
        price: price,
        totalValue: totalValue,
        buyerFee: feeCalculation.buyerFee.feeAmount,
        sellerFee: feeCalculation.sellerFee.feeAmount,
        totalFees: feeCalculation.totalFees.total
      }
    });

    return {
      trade,
      fees: feeCalculation
    };
  }

  /**
   * Update wallet balances after a trade with fees
   * @param {Object} buyOrder - Buy order
   * @param {Object} sellOrder - Sell order
   * @param {number} amount - Trade amount
   * @param {number} price - Trade price
   * @param {Object} fees - Fee calculation result
   */
  async updateWalletBalances(buyOrder, sellOrder, amount, price, fees) {
    const totalValue = amount * price;
    const buyerFee = fees.buyerFee.feeAmount;
    const sellerFee = fees.sellerFee.feeAmount;

    // Update buyer's wallet (subtract USD + fees, add BNX)
    await prisma.wallet.update({
      where: { userId: buyOrder.userId },
      data: {
        balance: { decrement: totalValue + buyerFee },
        bnxBalance: { increment: amount }
      }
    });

    // Update seller's wallet (subtract BNX, add USD - fees)
    await prisma.wallet.update({
      where: { userId: sellOrder.userId },
      data: {
        balance: { increment: totalValue - sellerFee },
        bnxBalance: { decrement: amount }
      }
    });

    // Update exchange wallet with collected fees
    await this.updateExchangeFees(buyerFee + sellerFee);
  }

  /**
   * Update exchange wallet with collected fees
   * @param {number} totalFees - Total fees collected
   */
  async updateExchangeFees(totalFees) {
    // Get or create exchange wallet
    let exchangeWallet = await prisma.wallet.findFirst({
      where: { userId: 'exchange' } // Special user ID for exchange
    });

    if (!exchangeWallet) {
      exchangeWallet = await prisma.wallet.create({
        data: {
          userId: 'exchange',
          balance: 0,
          bnxBalance: 0
        }
      });
    }

    // Add fees to exchange balance
    await prisma.wallet.update({
      where: { id: exchangeWallet.id },
      data: {
        balance: { increment: totalFees }
      }
    });
  }

  /**
   * Update order statuses after matching
   * @param {Object} order1 - First order
   * @param {Object} order2 - Second order
   * @param {number} matchedAmount - Amount that was matched
   */
  async updateOrderStatuses(order1, order2, matchedAmount) {
    // Update order1
    const updatedOrder1 = await prisma.order.update({
      where: { id: order1.id },
      data: {
        filledAmount: { increment: matchedAmount },
        status: this.calculateOrderStatus(order1, matchedAmount)
      }
    });

    // Update order2
    const updatedOrder2 = await prisma.order.update({
      where: { id: order2.id },
      data: {
        filledAmount: { increment: matchedAmount },
        status: this.calculateOrderStatus(order2, matchedAmount)
      }
    });

    return { updatedOrder1, updatedOrder2 };
  }

  /**
   * Calculate new order status based on filled amount
   * @param {Object} order - Order to update
   * @param {number} matchedAmount - Amount that was matched
   * @returns {string} - New order status
   */
  calculateOrderStatus(order, matchedAmount) {
    const newFilledAmount = order.filledAmount + matchedAmount;
    
    if (newFilledAmount >= order.amount) {
      return 'FILLED';
    } else if (newFilledAmount > 0) {
      return 'PARTIALLY_FILLED';
    } else {
      return 'PENDING';
    }
  }

  /**
   * Cancel an order
   * @param {string} orderId - Order ID to cancel
   * @param {string} userId - User ID (for authorization)
   * @returns {Object} - Cancellation result
   */
  async cancelOrder(orderId, userId) {
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        userId: userId,
        status: { in: ['PENDING', 'PARTIALLY_FILLED'] }
      }
    });

    if (!order) {
      throw new Error('Order not found or cannot be cancelled');
    }

    const cancelledOrder = await prisma.order.update({
      where: { id: orderId },
      data: { status: 'CANCELLED' }
    });

    return {
      success: true,
      order: cancelledOrder
    };
  }

  /**
   * Get order book data (buy and sell orders)
   * @param {number} limit - Maximum number of orders to return
   * @returns {Object} - Order book data
   */
  async getOrderBook(limit = 20) {
    const buyOrders = await prisma.order.findMany({
      where: {
        side: 'BUY',
        status: { in: ['PENDING', 'PARTIALLY_FILLED'] }
      },
      orderBy: { price: 'desc' },
      take: limit,
      include: {
        user: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    const sellOrders = await prisma.order.findMany({
      where: {
        side: 'SELL',
        status: { in: ['PENDING', 'PARTIALLY_FILLED'] }
      },
      orderBy: { price: 'asc' },
      take: limit,
      include: {
        user: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    return {
      buyOrders: buyOrders.map(order => ({
        id: order.id,
        price: order.price,
        amount: order.amount - order.filledAmount,
        total: (order.amount - order.filledAmount) * (order.price || 0),
        type: order.type,
        createdAt: order.createdAt,
        user: order.user
      })),
      sellOrders: sellOrders.map(order => ({
        id: order.id,
        price: order.price,
        amount: order.amount - order.filledAmount,
        total: (order.amount - order.filledAmount) * (order.price || 0),
        type: order.type,
        createdAt: order.createdAt,
        user: order.user
      }))
    };
  }

  /**
   * Get recent trades
   * @param {number} limit - Maximum number of trades to return
   * @returns {Array} - Recent trades
   */
  async getRecentTrades(limit = 50) {
    return await prisma.trade.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        buyer: {
          select: { id: true, name: true, email: true }
        },
        seller: {
          select: { id: true, name: true, email: true }
        }
      }
    });
  }
}

// Export singleton instance
export const orderMatchingEngine = new OrderMatchingEngine();
export default orderMatchingEngine;
