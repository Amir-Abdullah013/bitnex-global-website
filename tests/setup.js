/**
 * Jest Test Setup
 * Global test configuration and utilities
 */

import '@testing-library/jest-dom';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    prefetch: jest.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

// Mock Next.js Image component
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...props} />;
  },
}));

// Mock fetch globally
global.fetch = jest.fn();

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

// Mock sessionStorage
const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.sessionStorage = sessionStorageMock;

// Mock WebSocket
global.WebSocket = jest.fn(() => ({
  close: jest.fn(),
  send: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
}));

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock ResizeObserver
global.ResizeObserver = jest.fn(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Console error suppression for tests
const originalError = console.error;
beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: ReactDOM.render is no longer supported')
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});

// Test utilities
export const mockUser = {
  id: 'test-user-123',
  email: 'test@example.com',
  name: 'Test User',
  role: 'user',
  isAdmin: false,
  isUser: true,
  createdAt: '2024-01-01T00:00:00.000Z',
};

export const mockAdmin = {
  id: 'test-admin-123',
  email: 'admin@example.com',
  name: 'Test Admin',
  role: 'admin',
  isAdmin: true,
  isUser: false,
  createdAt: '2024-01-01T00:00:00.000Z',
};

export const mockWalletData = {
  usdBalance: 1000.00,
  bnxBalance: 500.00,
  bnxPrice: 0.0035,
  totalValue: 1001.75,
};

export const mockInvestmentPlan = {
  id: 'plan-123',
  planName: 'Basic Plan',
  minimumInvestment: 100,
  maximumInvestment: 1000,
  profitPercentage: 5,
  duration: 30,
  description: 'Basic investment plan',
  isActive: true,
};

export const mockInvestment = {
  id: 'investment-123',
  userId: 'test-user-123',
  planId: 'plan-123',
  investedAmount: 500,
  startDate: new Date('2024-01-01'),
  endDate: new Date('2024-01-31'),
  expectedReturn: 525,
  status: 'ACTIVE',
};

// Helper function to create mock API responses
export const createMockResponse = (data, status = 200) => ({
  ok: status >= 200 && status < 300,
  status,
  json: async () => data,
  text: async () => JSON.stringify(data),
});

// Helper function to mock fetch responses
export const mockFetch = (responses) => {
  const responsesArray = Array.isArray(responses) ? responses : [responses];
  let callCount = 0;
  
  global.fetch.mockImplementation(() => {
    const response = responsesArray[callCount] || responsesArray[responsesArray.length - 1];
    callCount++;
    return Promise.resolve(createMockResponse(response.data, response.status));
  });
};

// Helper function to wait for async operations
export const waitFor = (ms = 100) => new Promise(resolve => setTimeout(resolve, ms));

// Helper function to simulate user interactions
export const simulateUserInteraction = async (element, action = 'click') => {
  const event = new Event(action, { bubbles: true });
  element.dispatchEvent(event);
  await waitFor();
};
