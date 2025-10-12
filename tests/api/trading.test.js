/**
 * Trading API Tests
 * Tests for buy/sell operations, price data, and trading pairs
 */

import { testApiEndpoint, mockFetch } from '../utils/test-helpers';

describe('Trading API', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/price', () => {
    test('should return current price data', async () => {
      const mockResponse = {
        success: true,
        price: 0.0035,
        change24h: 0.05,
        volume24h: 1000000,
        high24h: 0.0038,
        low24h: 0.0032,
        symbol: 'BNXUSDT'
      };

      mockFetch({ data: mockResponse, status: 200 });

      const response = await fetch('/api/price?symbol=BNXUSDT');

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.price).toBe(0.0035);
      expect(data.symbol).toBe('BNXUSDT');
    });

    test('should return 400 for invalid symbol', async () => {
      const mockResponse = {
        success: false,
        error: 'Invalid trading pair'
      };

      mockFetch({ data: mockResponse, status: 400 });

      const response = await fetch('/api/price?symbol=INVALID');

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/trading/buy-bnx', () => {
    test('should execute buy order successfully', async () => {
      const buyData = {
        userId: 'user-123',
        usdAmount: 100.00
      };

      const mockResponse = {
        success: true,
        tokensBought: 28571.43,
        price: 0.0035,
        transactionId: 'tx-buy-123',
        message: 'Buy order executed successfully'
      };

      mockFetch({ data: mockResponse, status: 200 });

      const response = await fetch('/api/trading/buy-bnx', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buyData)
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.tokensBought).toBeGreaterThan(0);
    });

    test('should return 400 for insufficient balance', async () => {
      const buyData = {
        userId: 'user-123',
        usdAmount: 10000.00
      };

      const mockResponse = {
        success: false,
        error: 'Insufficient USD balance'
      };

      mockFetch({ data: mockResponse, status: 400 });

      const response = await fetch('/api/trading/buy-bnx', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buyData)
      });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/trading/sell-bnx', () => {
    test('should execute sell order successfully', async () => {
      const sellData = {
        userId: 'user-123',
        bnxAmount: 1000.00
      };

      const mockResponse = {
        success: true,
        usdReceived: 3.50,
        price: 0.0035,
        transactionId: 'tx-sell-123',
        message: 'Sell order executed successfully'
      };

      mockFetch({ data: mockResponse, status: 200 });

      const response = await fetch('/api/trading/sell-bnx', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sellData)
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.usdReceived).toBeGreaterThan(0);
    });

    test('should return 400 for insufficient BNX balance', async () => {
      const sellData = {
        userId: 'user-123',
        bnxAmount: 100000.00
      };

      const mockResponse = {
        success: false,
        error: 'Insufficient BNX balance'
      };

      mockFetch({ data: mockResponse, status: 400 });

      const response = await fetch('/api/trading/sell-bnx', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sellData)
      });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/trading-pairs', () => {
    test('should return available trading pairs', async () => {
      const mockResponse = {
        success: true,
        pairs: [
          {
            symbol: 'BNXUSDT',
            baseAsset: 'BNX',
            quoteAsset: 'USDT',
            price: 0.0035,
            change24h: 0.05,
            volume24h: 1000000
          },
          {
            symbol: 'BTCUSDT',
            baseAsset: 'BTC',
            quoteAsset: 'USDT',
            price: 45000.00,
            change24h: -0.02,
            volume24h: 5000000
          }
        ]
      };

      mockFetch({ data: mockResponse, status: 200 });

      const response = await fetch('/api/trading-pairs');

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.pairs).toHaveLength(2);
    });
  });

  describe('GET /api/orders', () => {
    test('should return user orders', async () => {
      const mockResponse = {
        success: true,
        orders: [
          {
            id: 'order-123',
            symbol: 'BNXUSDT',
            side: 'buy',
            amount: 100.00,
            price: 0.0035,
            status: 'completed',
            createdAt: '2024-01-01T00:00:00.000Z'
          }
        ]
      };

      mockFetch({ data: mockResponse, status: 200 });

      const response = await fetch('/api/orders?userId=user-123');

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.orders).toHaveLength(1);
    });
  });
});
