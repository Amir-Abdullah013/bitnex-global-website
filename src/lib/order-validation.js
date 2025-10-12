/**
 * Order Validation for Bitnex Global
 * Comprehensive validation for trading orders to prevent abuse and ensure data integrity
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Validation error class
 */
class ValidationError extends Error {
  constructor(message, field = null, code = 'VALIDATION_ERROR') {
    super(message);
    this.name = 'ValidationError';
    this.field = field;
    this.code = code;
  }
}

/**
 * Order validation rules and constraints
 */
const VALIDATION_RULES = {
  // Order types
  ORDER_TYPES: ['MARKET', 'LIMIT', 'STOP', 'STOP_LIMIT'],
  
  // Order sides
  ORDER_SIDES: ['BUY', 'SELL'],
  
  // Order statuses
  ORDER_STATUSES: ['PENDING', 'FILLED', 'PARTIALLY_FILLED', 'CANCELLED', 'REJECTED'],
  
  // Minimum and maximum values
  MIN_ORDER_SIZE: 0.001,
  MAX_ORDER_SIZE: 1000000,
  MIN_PRICE: 0.000001,
  MAX_PRICE: 1000000,
  
  // Precision limits
  PRICE_PRECISION: 8,
  AMOUNT_PRECISION: 8,
  
  // Time limits
  MAX_ORDER_AGE: 24 * 60 * 60 * 1000, // 24 hours
  MIN_ORDER_AGE: 0,
  
  // Risk limits
  MAX_DAILY_VOLUME: 100000, // $100k daily volume per user
  MAX_OPEN_ORDERS: 50,
  MAX_ORDER_VALUE: 50000 // $50k per order
};

/**
 * Sanitize and validate order input
 * @param {Object} orderData - Raw order data
 * @returns {Object} - Sanitized order data
 */
export const sanitizeOrderInput = (orderData) => {
  const sanitized = {};
  
  // Sanitize string fields
  if (orderData.type) {
    sanitized.type = orderData.type.toString().toUpperCase().trim();
  }
  
  if (orderData.side) {
    sanitized.side = orderData.side.toString().toUpperCase().trim();
  }
  
  if (orderData.tradingPair) {
    sanitized.tradingPair = orderData.tradingPair.toString().toUpperCase().trim();
  }
  
  if (orderData.userId) {
    sanitized.userId = orderData.userId.toString().trim();
  }
  
  // Sanitize numeric fields
  if (orderData.amount !== undefined) {
    sanitized.amount = parseFloat(orderData.amount);
  }
  
  if (orderData.price !== undefined) {
    sanitized.price = parseFloat(orderData.price);
  }
  
  if (orderData.stopPrice !== undefined) {
    sanitized.stopPrice = parseFloat(orderData.stopPrice);
  }
  
  // Sanitize boolean fields
  if (orderData.isActive !== undefined) {
    sanitized.isActive = Boolean(orderData.isActive);
  }
  
  return sanitized;
};

/**
 * Validate order type
 * @param {string} type - Order type
 * @returns {boolean}
 */
export const validateOrderType = (type) => {
  if (!type || typeof type !== 'string') {
    throw new ValidationError('Order type is required', 'type');
  }
  
  if (!VALIDATION_RULES.ORDER_TYPES.includes(type)) {
    throw new ValidationError(
      `Invalid order type. Must be one of: ${VALIDATION_RULES.ORDER_TYPES.join(', ')}`,
      'type'
    );
  }
  
  return true;
};

/**
 * Validate order side
 * @param {string} side - Order side
 * @returns {boolean}
 */
export const validateOrderSide = (side) => {
  if (!side || typeof side !== 'string') {
    throw new ValidationError('Order side is required', 'side');
  }
  
  if (!VALIDATION_RULES.ORDER_SIDES.includes(side)) {
    throw new ValidationError(
      `Invalid order side. Must be one of: ${VALIDATION_RULES.ORDER_SIDES.join(', ')}`,
      'side'
    );
  }
  
  return true;
};

/**
 * Validate order amount
 * @param {number} amount - Order amount
 * @param {string} side - Order side
 * @returns {boolean}
 */
export const validateOrderAmount = (amount, side) => {
  if (amount === undefined || amount === null) {
    throw new ValidationError('Order amount is required', 'amount');
  }
  
  const numAmount = parseFloat(amount);
  
  if (isNaN(numAmount)) {
    throw new ValidationError('Order amount must be a valid number', 'amount');
  }
  
  if (numAmount <= 0) {
    throw new ValidationError('Order amount must be greater than 0', 'amount');
  }
  
  if (numAmount < VALIDATION_RULES.MIN_ORDER_SIZE) {
    throw new ValidationError(
      `Order amount must be at least ${VALIDATION_RULES.MIN_ORDER_SIZE}`,
      'amount'
    );
  }
  
  if (numAmount > VALIDATION_RULES.MAX_ORDER_SIZE) {
    throw new ValidationError(
      `Order amount cannot exceed ${VALIDATION_RULES.MAX_ORDER_SIZE}`,
      'amount'
    );
  }
  
  // Check precision
  const decimalPlaces = (numAmount.toString().split('.')[1] || '').length;
  if (decimalPlaces > VALIDATION_RULES.AMOUNT_PRECISION) {
    throw new ValidationError(
      `Order amount cannot have more than ${VALIDATION_RULES.AMOUNT_PRECISION} decimal places`,
      'amount'
    );
  }
  
  return true;
};

/**
 * Validate order price
 * @param {number} price - Order price
 * @param {string} type - Order type
 * @returns {boolean}
 */
export const validateOrderPrice = (price, type) => {
  // Market orders don't need price validation
  if (type === 'MARKET') {
    return true;
  }
  
  if (price === undefined || price === null) {
    throw new ValidationError('Order price is required for non-market orders', 'price');
  }
  
  const numPrice = parseFloat(price);
  
  if (isNaN(numPrice)) {
    throw new ValidationError('Order price must be a valid number', 'price');
  }
  
  if (numPrice <= 0) {
    throw new ValidationError('Order price must be greater than 0', 'price');
  }
  
  if (numPrice < VALIDATION_RULES.MIN_PRICE) {
    throw new ValidationError(
      `Order price must be at least ${VALIDATION_RULES.MIN_PRICE}`,
      'price'
    );
  }
  
  if (numPrice > VALIDATION_RULES.MAX_PRICE) {
    throw new ValidationError(
      `Order price cannot exceed ${VALIDATION_RULES.MAX_PRICE}`,
      'price'
    );
  }
  
  // Check precision
  const decimalPlaces = (numPrice.toString().split('.')[1] || '').length;
  if (decimalPlaces > VALIDATION_RULES.PRICE_PRECISION) {
    throw new ValidationError(
      `Order price cannot have more than ${VALIDATION_RULES.PRICE_PRECISION} decimal places`,
      'price'
    );
  }
  
  return true;
};

/**
 * Validate trading pair
 * @param {string} tradingPair - Trading pair
 * @returns {boolean}
 */
export const validateTradingPair = async (tradingPair) => {
  if (!tradingPair || typeof tradingPair !== 'string') {
    throw new ValidationError('Trading pair is required', 'tradingPair');
  }
  
  // Check if trading pair exists in database
  const pair = await prisma.tradingPair.findUnique({
    where: { symbol: tradingPair }
  });
  
  if (!pair) {
    throw new ValidationError('Invalid trading pair', 'tradingPair');
  }
  
  if (!pair.isActive) {
    throw new ValidationError('Trading pair is not active', 'tradingPair');
  }
  
  return true;
};

/**
 * Validate user exists and is active
 * @param {string} userId - User ID
 * @returns {boolean}
 */
export const validateUser = async (userId) => {
  if (!userId || typeof userId !== 'string') {
    throw new ValidationError('User ID is required', 'userId');
  }
  
  const user = await prisma.user.findUnique({
    where: { id: userId }
  });
  
  if (!user) {
    throw new ValidationError('User not found', 'userId');
  }
  
  if (!user.isActive) {
    throw new ValidationError('User account is not active', 'userId');
  }
  
  return true;
};

/**
 * Validate user balance for order
 * @param {string} userId - User ID
 * @param {string} side - Order side
 * @param {number} amount - Order amount
 * @param {number} price - Order price
 * @param {string} tradingPair - Trading pair
 * @returns {boolean}
 */
export const validateUserBalance = async (userId, side, amount, price, tradingPair) => {
  const user = await prisma.user.findUnique({
    where: { id: userId }
  });
  
  if (!user) {
    throw new ValidationError('User not found', 'userId');
  }
  
  // Get trading pair info
  const pair = await prisma.tradingPair.findUnique({
    where: { symbol: tradingPair }
  });
  
  if (!pair) {
    throw new ValidationError('Invalid trading pair', 'tradingPair');
  }
  
  const orderValue = amount * price;
  
  if (side === 'BUY') {
    // For buy orders, check if user has enough quote currency (e.g., USDT)
    const requiredBalance = orderValue;
    const availableBalance = user.usdBalance || 0;
    
    if (availableBalance < requiredBalance) {
      throw new ValidationError(
        `Insufficient balance. Required: ${requiredBalance}, Available: ${availableBalance}`,
        'amount'
      );
    }
  } else if (side === 'SELL') {
    // For sell orders, check if user has enough base currency (e.g., BNX)
    const requiredBalance = amount;
    const availableBalance = user.bnxBalance || 0;
    
    if (availableBalance < requiredBalance) {
      throw new ValidationError(
        `Insufficient balance. Required: ${requiredBalance}, Available: ${availableBalance}`,
        'amount'
      );
    }
  }
  
  return true;
};

/**
 * Validate order against risk limits
 * @param {string} userId - User ID
 * @param {number} amount - Order amount
 * @param {number} price - Order price
 * @returns {boolean}
 */
export const validateRiskLimits = async (userId, amount, price) => {
  const orderValue = amount * price;
  
  // Check maximum order value
  if (orderValue > VALIDATION_RULES.MAX_ORDER_VALUE) {
    throw new ValidationError(
      `Order value cannot exceed $${VALIDATION_RULES.MAX_ORDER_VALUE}`,
      'amount'
    );
  }
  
  // Check daily volume limit
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const dailyVolume = await prisma.trade.aggregate({
    where: {
      OR: [
        { buyerId: userId },
        { sellerId: userId }
      ],
      timestamp: {
        gte: today
      }
    },
    _sum: {
      value: true
    }
    // Note: This assumes a 'value' field exists in the Trade model
  });
  
  const totalDailyVolume = dailyVolume._sum.value || 0;
  
  if (totalDailyVolume + orderValue > VALIDATION_RULES.MAX_DAILY_VOLUME) {
    throw new ValidationError(
      `Daily trading volume limit exceeded. Current: $${totalDailyVolume}, Limit: $${VALIDATION_RULES.MAX_DAILY_VOLUME}`,
      'amount'
    );
  }
  
  // Check maximum open orders
  const openOrdersCount = await prisma.order.count({
    where: {
      userId,
      status: {
        in: ['PENDING', 'PARTIALLY_FILLED']
      }
    }
  });
  
  if (openOrdersCount >= VALIDATION_RULES.MAX_OPEN_ORDERS) {
    throw new ValidationError(
      `Maximum open orders limit reached. Current: ${openOrdersCount}, Limit: ${VALIDATION_RULES.MAX_OPEN_ORDERS}`,
      'amount'
    );
  }
  
  return true;
};

/**
 * Comprehensive order validation
 * @param {Object} orderData - Order data to validate
 * @returns {Object} - Validation result
 */
export const validateOrder = async (orderData) => {
  const errors = [];
  const warnings = [];
  
  try {
    // Sanitize input
    const sanitized = sanitizeOrderInput(orderData);
    
    // Validate required fields
    if (!sanitized.type) {
      errors.push(new ValidationError('Order type is required', 'type'));
    } else {
      validateOrderType(sanitized.type);
    }
    
    if (!sanitized.side) {
      errors.push(new ValidationError('Order side is required', 'side'));
    } else {
      validateOrderSide(sanitized.side);
    }
    
    if (!sanitized.amount) {
      errors.push(new ValidationError('Order amount is required', 'amount'));
    } else {
      validateOrderAmount(sanitized.amount, sanitized.side);
    }
    
    if (sanitized.type !== 'MARKET' && !sanitized.price) {
      errors.push(new ValidationError('Order price is required for non-market orders', 'price'));
    } else if (sanitized.price) {
      validateOrderPrice(sanitized.price, sanitized.type);
    }
    
    if (!sanitized.tradingPair) {
      errors.push(new ValidationError('Trading pair is required', 'tradingPair'));
    } else {
      await validateTradingPair(sanitized.tradingPair);
    }
    
    if (!sanitized.userId) {
      errors.push(new ValidationError('User ID is required', 'userId'));
    } else {
      await validateUser(sanitized.userId);
    }
    
    // If no basic validation errors, check advanced validations
    if (errors.length === 0) {
      try {
        await validateUserBalance(
          sanitized.userId,
          sanitized.side,
          sanitized.amount,
          sanitized.price || 0,
          sanitized.tradingPair
        );
      } catch (error) {
        errors.push(error);
      }
      
      try {
        await validateRiskLimits(
          sanitized.userId,
          sanitized.amount,
          sanitized.price || 0
        );
      } catch (error) {
        errors.push(error);
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      sanitizedData: sanitized
    };
    
  } catch (error) {
    return {
      isValid: false,
      errors: [error],
      warnings,
      sanitizedData: null
    };
  }
};

/**
 * Validate order update
 * @param {string} orderId - Order ID
 * @param {Object} updateData - Update data
 * @returns {Object} - Validation result
 */
export const validateOrderUpdate = async (orderId, updateData) => {
  const errors = [];
  
  try {
    // Check if order exists
    const order = await prisma.order.findUnique({
      where: { id: orderId }
    });
    
    if (!order) {
      errors.push(new ValidationError('Order not found', 'orderId'));
      return { isValid: false, errors };
    }
    
    // Check if order can be updated
    if (order.status === 'FILLED') {
      errors.push(new ValidationError('Cannot update filled order', 'status'));
    }
    
    if (order.status === 'CANCELLED') {
      errors.push(new ValidationError('Cannot update cancelled order', 'status'));
    }
    
    // Validate update fields
    if (updateData.amount !== undefined) {
      validateOrderAmount(updateData.amount, order.side);
    }
    
    if (updateData.price !== undefined && order.type !== 'MARKET') {
      validateOrderPrice(updateData.price, order.type);
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      order
    };
    
  } catch (error) {
    return {
      isValid: false,
      errors: [error]
    };
  }
};

/**
 * Validate order cancellation
 * @param {string} orderId - Order ID
 * @param {string} userId - User ID
 * @returns {Object} - Validation result
 */
export const validateOrderCancellation = async (orderId, userId) => {
  const errors = [];
  
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId }
    });
    
    if (!order) {
      errors.push(new ValidationError('Order not found', 'orderId'));
      return { isValid: false, errors };
    }
    
    if (order.userId !== userId) {
      errors.push(new ValidationError('Unauthorized to cancel this order', 'userId'));
    }
    
    if (order.status === 'FILLED') {
      errors.push(new ValidationError('Cannot cancel filled order', 'status'));
    }
    
    if (order.status === 'CANCELLED') {
      errors.push(new ValidationError('Order is already cancelled', 'status'));
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      order
    };
    
  } catch (error) {
    return {
      isValid: false,
      errors: [error]
    };
  }
};

export { ValidationError, VALIDATION_RULES };

