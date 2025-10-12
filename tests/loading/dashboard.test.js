/**
 * Dashboard Loading Tests
 * Tests for dashboard loading states and infinite loop prevention
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import UserDashboard from '../../src/app/user/dashboard/page';
import { mockUser, mockWalletData } from '../utils/test-helpers';

// Mock the auth context
jest.mock('../../src/lib/auth-context', () => ({
  useAuth: () => ({
    user: mockUser,
    isAuthenticated: true,
    loading: false
  })
}));

// Mock the universal context
jest.mock('../../src/lib/universal-context', () => ({
  useUniversal: () => ({
    usdBalance: 1000.00,
    bnxBalance: 500.00,
    bnxPrice: 0.0035,
    isLoading: false,
    formatCurrency: (amount) => `$${amount.toFixed(2)}`,
    formatBnx: (amount) => amount.toFixed(2),
    buyBnx: jest.fn(),
    sellBnx: jest.fn()
  })
}));

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn()
  })
}));

// Mock the Layout component
jest.mock('../../src/components/Layout', () => {
  return function MockLayout({ children, showSidebar }) {
    return (
      <div data-testid="layout" data-show-sidebar={showSidebar}>
        {children}
      </div>
    );
  };
});

describe('Dashboard Loading States', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
    jest.clearAllMocks();
  });

  test('should show loading spinner initially', () => {
    render(<UserDashboard />);
    
    // Should show loading spinner
    expect(screen.getByText(/loading dashboard/i)).toBeInTheDocument();
    expect(screen.getByRole('status', { hidden: true })).toBeInTheDocument();
  });

  test('should hide loading spinner after mount', async () => {
    render(<UserDashboard />);
    
    // Wait for component to mount
    await waitFor(() => {
      expect(screen.queryByText(/loading dashboard/i)).not.toBeInTheDocument();
    });
    
    // Should show dashboard content
    expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
  });

  test('should show authentication loading when checking auth', () => {
    // Mock loading auth state
    jest.doMock('../../src/lib/auth-context', () => ({
      useAuth: () => ({
        user: null,
        isAuthenticated: false,
        loading: true
      })
    }));

    render(<UserDashboard />);
    
    // Should show authentication loading
    expect(screen.getByText(/authenticating/i)).toBeInTheDocument();
  });

  test('should show dashboard data loading when fetching wallet data', () => {
    // Mock loading wallet data
    jest.doMock('../../src/lib/universal-context', () => ({
      useUniversal: () => ({
        usdBalance: 0,
        bnxBalance: 0,
        bnxPrice: 0,
        isLoading: true,
        formatCurrency: jest.fn(),
        formatBnx: jest.fn(),
        buyBnx: jest.fn(),
        sellBnx: jest.fn()
      })
    }));

    render(<UserDashboard />);
    
    // Should show dashboard data loading
    expect(screen.getByText(/loading dashboard data/i)).toBeInTheDocument();
  });

  test('should not show loading spinner after data loads', async () => {
    render(<UserDashboard />);
    
    // Wait for all loading to complete
    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    });
    
    // Should show dashboard content
    expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
    expect(screen.getByText(/\$1000\.00/)).toBeInTheDocument(); // USD balance
    expect(screen.getByText(/500\.00/)).toBeInTheDocument(); // BNX balance
  });

  test('should handle trading operations without infinite loading', async () => {
    const user = userEvent.setup();
    
    render(<UserDashboard />);
    
    // Wait for dashboard to load
    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    });
    
    // Find and interact with trading form
    const amountInput = screen.getByLabelText(/amount/i);
    const buyButton = screen.getByText(/buy/i);
    
    await user.type(amountInput, '100');
    await user.click(buyButton);
    
    // Should not show loading spinner after trade
    expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
  });

  test('should prevent infinite re-renders', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    
    render(<UserDashboard />);
    
    // Wait for initial render
    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    });
    
    // Simulate multiple re-renders
    for (let i = 0; i < 10; i++) {
      // Trigger re-render by updating state
      await waitFor(() => {
        expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
      });
    }
    
    // Should not have infinite loop errors
    expect(consoleSpy).not.toHaveBeenCalledWith(
      expect.stringContaining('Maximum update depth exceeded')
    );
    
    consoleSpy.mockRestore();
  });

  test('should handle component unmount gracefully', () => {
    const { unmount } = render(<UserDashboard />);
    
    // Should not throw errors on unmount
    expect(() => unmount()).not.toThrow();
  });

  test('should show redirect message for unauthenticated users', () => {
    // Mock unauthenticated state
    jest.doMock('../../src/lib/auth-context', () => ({
      useAuth: () => ({
        user: null,
        isAuthenticated: false,
        loading: false
      })
    }));

    render(<UserDashboard />);
    
    // Should show redirect message
    expect(screen.getByText(/redirecting to sign in/i)).toBeInTheDocument();
  });
});
