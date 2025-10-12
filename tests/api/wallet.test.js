/**
 * Wallet API Tests
 * Tests for balance, deposit, withdraw, and transfer operations
 */

import { testApiEndpoint, mockFetch } from '../utils/test-helpers';

describe('Wallet API', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/wallet/balance', () => {
    test('should return user wallet balance', async () => {
      const mockResponse = {
        success: true,
        usdBalance: 1000.00,
        bnxBalance: 500.00,
        bnxPrice: 0.0035,
        totalValue: 1001.75
      };

      mockFetch({ data: mockResponse, status: 200 });

      const response = await fetch('/api/wallet/balance?userId=user-123');

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.usdBalance).toBe(1000.00);
      expect(data.bnxBalance).toBe(500.00);
    });

    test('should return 401 for unauthorized access', async () => {
      const mockResponse = {
        success: false,
        error: 'Unauthorized'
      };

      mockFetch({ data: mockResponse, status: 401 });

      const response = await fetch('/api/wallet/balance');

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/deposit', () => {
    test('should process deposit successfully', async () => {
      const depositData = {
        userId: 'user-123',
        amount: 500.00,
        method: 'bank_transfer',
        currency: 'USD'
      };

      const mockResponse = {
        success: true,
        transactionId: 'tx-123',
        amount: 500.00,
        status: 'pending',
        message: 'Deposit initiated successfully'
      };

      mockFetch({ data: mockResponse, status: 201 });

      const response = await fetch('/api/deposit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(depositData)
      });

      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.transactionId).toBeDefined();
    });

    test('should return 400 for invalid amount', async () => {
      const depositData = {
        userId: 'user-123',
        amount: -100,
        method: 'bank_transfer',
        currency: 'USD'
      };

      const mockResponse = {
        success: false,
        error: 'Invalid amount'
      };

      mockFetch({ data: mockResponse, status: 400 });

      const response = await fetch('/api/deposit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(depositData)
      });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/withdraw', () => {
    test('should process withdrawal successfully', async () => {
      const withdrawData = {
        userId: 'user-123',
        amount: 200.00,
        method: 'bank_transfer',
        currency: 'USD'
      };

      const mockResponse = {
        success: true,
        transactionId: 'tx-456',
        amount: 200.00,
        status: 'pending',
        message: 'Withdrawal initiated successfully'
      };

      mockFetch({ data: mockResponse, status: 201 });

      const response = await fetch('/api/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(withdrawData)
      });

      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.success).toBe(true);
    });

    test('should return 400 for insufficient balance', async () => {
      const withdrawData = {
        userId: 'user-123',
        amount: 2000.00,
        method: 'bank_transfer',
        currency: 'USD'
      };

      const mockResponse = {
        success: false,
        error: 'Insufficient balance'
      };

      mockFetch({ data: mockResponse, status: 400 });

      const response = await fetch('/api/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(withdrawData)
      });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/transfer', () => {
    test('should process transfer successfully', async () => {
      const transferData = {
        fromUserId: 'user-123',
        toUserId: 'user-456',
        amount: 100.00,
        currency: 'USD'
      };

      const mockResponse = {
        success: true,
        transactionId: 'tx-789',
        amount: 100.00,
        status: 'completed',
        message: 'Transfer completed successfully'
      };

      mockFetch({ data: mockResponse, status: 200 });

      const response = await fetch('/api/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(transferData)
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
    });
  });

  describe('GET /api/transactions', () => {
    test('should return user transactions', async () => {
      const mockResponse = {
        success: true,
        transactions: [
          {
            id: 'tx-123',
            type: 'deposit',
            amount: 500.00,
            status: 'completed',
            createdAt: '2024-01-01T00:00:00.000Z'
          },
          {
            id: 'tx-456',
            type: 'withdrawal',
            amount: 200.00,
            status: 'pending',
            createdAt: '2024-01-02T00:00:00.000Z'
          }
        ]
      };

      mockFetch({ data: mockResponse, status: 200 });

      const response = await fetch('/api/transactions?userId=user-123');

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.transactions).toHaveLength(2);
    });
  });
});
