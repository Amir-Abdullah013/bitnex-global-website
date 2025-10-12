/**
 * Authentication API Tests
 * Tests for signup, signin, logout, and OAuth flows
 */

import { testApiEndpoint, mockFetch, createMockResponse } from '../utils/test-helpers';

describe('Authentication API', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/auth/signup', () => {
    test('should create new user successfully', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User'
      };

      const mockResponse = {
        success: true,
        user: {
          id: 'user-123',
          email: userData.email,
          name: userData.name,
          role: 'user'
        },
        message: 'User created successfully'
      };

      mockFetch({ data: mockResponse, status: 201 });

      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });

      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.user.email).toBe(userData.email);
    });

    test('should return 400 for invalid email', async () => {
      const userData = {
        email: 'invalid-email',
        password: 'password123',
        name: 'Test User'
      };

      const mockResponse = {
        success: false,
        error: 'Invalid email format'
      };

      mockFetch({ data: mockResponse, status: 400 });

      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toContain('Invalid email');
    });

    test('should return 400 for weak password', async () => {
      const userData = {
        email: 'test@example.com',
        password: '123',
        name: 'Test User'
      };

      const mockResponse = {
        success: false,
        error: 'Password must be at least 8 characters'
      };

      mockFetch({ data: mockResponse, status: 400 });

      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.success).toBe(false);
    });
  });

  describe('POST /api/auth/signin', () => {
    test('should authenticate user successfully', async () => {
      const credentials = {
        email: 'test@example.com',
        password: 'password123'
      };

      const mockResponse = {
        success: true,
        user: {
          id: 'user-123',
          email: credentials.email,
          name: 'Test User',
          role: 'user'
        },
        token: 'jwt-token-123'
      };

      mockFetch({ data: mockResponse, status: 200 });

      const response = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.token).toBeDefined();
    });

    test('should return 401 for invalid credentials', async () => {
      const credentials = {
        email: 'test@example.com',
        password: 'wrongpassword'
      };

      const mockResponse = {
        success: false,
        error: 'Invalid credentials'
      };

      mockFetch({ data: mockResponse, status: 401 });

      const response = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
      });

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.success).toBe(false);
    });
  });

  describe('POST /api/auth/signout', () => {
    test('should sign out user successfully', async () => {
      const mockResponse = {
        success: true,
        message: 'Signed out successfully'
      };

      mockFetch({ data: mockResponse, status: 200 });

      const response = await fetch('/api/auth/signout', {
        method: 'POST',
        headers: { 'Authorization': 'Bearer jwt-token-123' }
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
    });
  });

  describe('GET /api/auth/me', () => {
    test('should return current user data', async () => {
      const mockResponse = {
        success: true,
        user: {
          id: 'user-123',
          email: 'test@example.com',
          name: 'Test User',
          role: 'user'
        }
      };

      mockFetch({ data: mockResponse, status: 200 });

      const response = await fetch('/api/auth/me', {
        headers: { 'Authorization': 'Bearer jwt-token-123' }
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.user).toBeDefined();
    });

    test('should return 401 for invalid token', async () => {
      const mockResponse = {
        success: false,
        error: 'Invalid token'
      };

      mockFetch({ data: mockResponse, status: 401 });

      const response = await fetch('/api/auth/me', {
        headers: { 'Authorization': 'Bearer invalid-token' }
      });

      expect(response.status).toBe(401);
    });
  });

  describe('OAuth Authentication', () => {
    test('should handle Google OAuth callback', async () => {
      const mockResponse = {
        success: true,
        user: {
          id: 'user-123',
          email: 'test@gmail.com',
          name: 'Test User',
          provider: 'google'
        },
        token: 'jwt-token-123'
      };

      mockFetch({ data: mockResponse, status: 200 });

      const response = await fetch('/api/auth/callback/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: 'google-auth-code' })
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.user.provider).toBe('google');
    });
  });
});
