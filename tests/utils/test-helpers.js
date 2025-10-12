/**
 * Test Helper Utilities
 * Common functions for testing across the application
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/**
 * Test API endpoint responses
 */
export const testApiEndpoint = async (url, expectedStatus = 200, expectedData = null) => {
  const response = await fetch(url);
  
  expect(response.status).toBe(expectedStatus);
  
  if (expectedData) {
    const data = await response.json();
    expect(data).toMatchObject(expectedData);
  }
  
  return response;
};

/**
 * Test loading states
 */
export const testLoadingState = (component, loadingText = 'Loading') => {
  expect(screen.getByText(loadingText)).toBeInTheDocument();
  expect(screen.getByRole('status', { hidden: true })).toBeInTheDocument();
};

/**
 * Test error states
 */
export const testErrorState = (component, errorText) => {
  expect(screen.getByText(errorText)).toBeInTheDocument();
};

/**
 * Test form validation
 */
export const testFormValidation = async (form, invalidInputs, validInputs) => {
  const user = userEvent.setup();
  
  // Test invalid inputs
  for (const [field, value] of Object.entries(invalidInputs)) {
    const input = screen.getByLabelText(new RegExp(field, 'i'));
    await user.clear(input);
    await user.type(input, value);
    
    // Submit form
    const submitButton = screen.getByRole('button', { name: /submit|save|create/i });
    await user.click(submitButton);
    
    // Check for error message
    await waitFor(() => {
      expect(screen.getByText(/invalid|error|required/i)).toBeInTheDocument();
    });
  }
  
  // Test valid inputs
  for (const [field, value] of Object.entries(validInputs)) {
    const input = screen.getByLabelText(new RegExp(field, 'i'));
    await user.clear(input);
    await user.type(input, value);
  }
  
  const submitButton = screen.getByRole('button', { name: /submit|save|create/i });
  await user.click(submitButton);
  
  // Should not show error for valid inputs
  await waitFor(() => {
    expect(screen.queryByText(/invalid|error|required/i)).not.toBeInTheDocument();
  });
};

/**
 * Test navigation between routes
 */
export const testNavigation = async (linkText, expectedPath) => {
  const user = userEvent.setup();
  const link = screen.getByText(linkText);
  
  await user.click(link);
  
  // Check if navigation occurred (this would need to be mocked in actual tests)
  expect(window.location.pathname).toBe(expectedPath);
};

/**
 * Test authentication flow
 */
export const testAuthFlow = async (isAuthenticated, expectedContent) => {
  if (isAuthenticated) {
    expect(screen.getByText(expectedContent)).toBeInTheDocument();
  } else {
    expect(screen.getByText(/sign in|login/i)).toBeInTheDocument();
  }
};

/**
 * Test loading spinner behavior
 */
export const testLoadingSpinner = async (component, shouldShow = true) => {
  if (shouldShow) {
    expect(screen.getByRole('status', { hidden: true })).toBeInTheDocument();
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  } else {
    expect(screen.queryByRole('status', { hidden: true })).not.toBeInTheDocument();
    expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
  }
};

/**
 * Test data fetching and display
 */
export const testDataFetching = async (mockData, expectedDisplay) => {
  // Mock the fetch response
  global.fetch.mockResolvedValueOnce({
    ok: true,
    json: async () => mockData,
  });
  
  // Wait for data to load
  await waitFor(() => {
    expect(screen.getByText(expectedDisplay)).toBeInTheDocument();
  });
};

/**
 * Test infinite loading prevention
 */
export const testInfiniteLoadingPrevention = async (component, maxWaitTime = 5000) => {
  const startTime = Date.now();
  
  // Wait for loading to complete or timeout
  await waitFor(() => {
    const loadingElements = screen.queryAllByText(/loading/i);
    expect(loadingElements).toHaveLength(0);
  }, { timeout: maxWaitTime });
  
  const endTime = Date.now();
  const loadingTime = endTime - startTime;
  
  // Loading should complete within reasonable time
  expect(loadingTime).toBeLessThan(maxWaitTime);
};

/**
 * Test responsive design
 */
export const testResponsiveDesign = (component, breakpoints = ['mobile', 'tablet', 'desktop']) => {
  breakpoints.forEach(breakpoint => {
    // Mock viewport size
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: breakpoint === 'mobile' ? 375 : breakpoint === 'tablet' ? 768 : 1024,
    });
    
    // Trigger resize event
    window.dispatchEvent(new Event('resize'));
    
    // Test that component renders without errors
    expect(component).toBeInTheDocument();
  });
};

/**
 * Test error boundaries
 */
export const testErrorBoundary = async (component, errorTrigger) => {
  // Trigger error
  await errorTrigger();
  
  // Check for error boundary fallback
  expect(screen.getByText(/something went wrong|error/i)).toBeInTheDocument();
};

/**
 * Test accessibility
 */
export const testAccessibility = (component) => {
  // Check for proper ARIA labels
  const interactiveElements = screen.getAllByRole('button', { hidden: true });
  interactiveElements.forEach(element => {
    expect(element).toHaveAttribute('aria-label');
  });
  
  // Check for proper heading hierarchy
  const headings = screen.getAllByRole('heading');
  headings.forEach((heading, index) => {
    if (index > 0) {
      const level = parseInt(heading.tagName.charAt(1));
      const prevLevel = parseInt(headings[index - 1].tagName.charAt(1));
      expect(level).toBeGreaterThanOrEqual(prevLevel);
    }
  });
};

/**
 * Test performance metrics
 */
export const testPerformance = async (component, maxRenderTime = 100) => {
  const startTime = performance.now();
  
  // Render component
  render(component);
  
  const endTime = performance.now();
  const renderTime = endTime - startTime;
  
  expect(renderTime).toBeLessThan(maxRenderTime);
};

/**
 * Test memory leaks
 */
export const testMemoryLeaks = async (component) => {
  const initialMemory = performance.memory?.usedJSHeapSize || 0;
  
  // Render and unmount component multiple times
  for (let i = 0; i < 10; i++) {
    const { unmount } = render(component);
    unmount();
  }
  
  // Force garbage collection if available
  if (global.gc) {
    global.gc();
  }
  
  const finalMemory = performance.memory?.usedJSHeapSize || 0;
  const memoryIncrease = finalMemory - initialMemory;
  
  // Memory increase should be minimal
  expect(memoryIncrease).toBeLessThan(1000000); // 1MB
};
