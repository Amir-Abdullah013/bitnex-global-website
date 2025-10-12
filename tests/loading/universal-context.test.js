/**
 * Universal Context Loading Tests
 * Tests for loading states and infinite loop prevention
 */

import { renderHook, act } from '@testing-library/react';
import { UniversalProvider, useUniversal } from '../../src/lib/universal-context';
import { mockUser, mockWalletData } from '../utils/test-helpers';

// Mock the auth context
jest.mock('../../src/lib/auth-context', () => ({
  useAuth: () => ({
    user: mockUser,
    isAuthenticated: true
  })
}));

describe('Universal Context Loading States', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
    jest.clearAllMocks();
  });

  test('should load data only once when authenticated', async () => {
    const mockResponse = {
      usdBalance: 1000.00,
      bnxBalance: 500.00,
      bnxPrice: 0.0035
    };

    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse
    });

    const wrapper = ({ children }) => (
      <UniversalProvider>{children}</UniversalProvider>
    );

    const { result } = renderHook(() => useUniversal(), { wrapper });

    // Initially should be loading
    expect(result.current.isLoading).toBe(true);

    // Wait for data to load
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    // Should have loaded data
    expect(result.current.usdBalance).toBe(1000.00);
    expect(result.current.bnxBalance).toBe(500.00);
    expect(result.current.bnxPrice).toBe(0.0035);
    expect(result.current.isLoading).toBe(false);

    // Should only call fetch once
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  test('should not reload data on subsequent renders', async () => {
    const mockResponse = {
      usdBalance: 1000.00,
      bnxBalance: 500.00,
      bnxPrice: 0.0035
    };

    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => mockResponse
    });

    const wrapper = ({ children }) => (
      <UniversalProvider>{children}</UniversalProvider>
    );

    const { result, rerender } = renderHook(() => useUniversal(), { wrapper });

    // Wait for initial load
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    // Rerender the hook
    rerender();

    // Should still only call fetch once
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(result.current.isLoading).toBe(false);
  });

  test('should handle fetch errors gracefully', async () => {
    global.fetch.mockRejectedValueOnce(new Error('Network error'));

    const wrapper = ({ children }) => (
      <UniversalProvider>{children}</UniversalProvider>
    );

    const { result } = renderHook(() => useUniversal(), { wrapper });

    // Wait for error to be handled
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    // Should not be loading after error
    expect(result.current.isLoading).toBe(false);
    expect(result.current.usdBalance).toBe(0);
    expect(result.current.bnxBalance).toBe(0);
  });

  test('should not load data when not authenticated', () => {
    // Mock unauthenticated state
    jest.doMock('../../src/lib/auth-context', () => ({
      useAuth: () => ({
        user: null,
        isAuthenticated: false
      })
    }));

    const wrapper = ({ children }) => (
      <UniversalProvider>{children}</UniversalProvider>
    );

    const { result } = renderHook(() => useUniversal(), { wrapper });

    // Should not call fetch when not authenticated
    expect(global.fetch).not.toHaveBeenCalled();
    expect(result.current.isLoading).toBe(false);
  });

  test('should prevent infinite loading loops', async () => {
    const mockResponse = {
      usdBalance: 1000.00,
      bnxBalance: 500.00,
      bnxPrice: 0.0035
    };

    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => mockResponse
    });

    const wrapper = ({ children }) => (
      <UniversalProvider>{children}</UniversalProvider>
    );

    const { result } = renderHook(() => useUniversal(), { wrapper });

    // Wait for initial load
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    // Simulate multiple re-renders
    for (let i = 0; i < 5; i++) {
      await act(async () => {
        // Trigger re-render
        result.current.buyBnx(100);
      });
    }

    // Should still only call fetch once
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(result.current.isLoading).toBe(false);
  });

  test('should handle loading timeout', async () => {
    // Mock a slow response
    global.fetch.mockImplementation(() => 
      new Promise(resolve => 
        setTimeout(() => resolve({
          ok: true,
          json: async () => ({ usdBalance: 1000.00, bnxBalance: 500.00, bnxPrice: 0.0035 })
        }), 2000)
      )
    );

    const wrapper = ({ children }) => (
      <UniversalProvider>{children}</UniversalProvider>
    );

    const { result } = renderHook(() => useUniversal(), { wrapper });

    // Should be loading initially
    expect(result.current.isLoading).toBe(true);

    // Wait for timeout (if implemented)
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    // Should eventually stop loading
    expect(result.current.isLoading).toBe(false);
  });
});
