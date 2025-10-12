/**
 * Loading Spinner Component Tests
 * Tests for loading spinner behavior and infinite loop prevention
 */

import { render, screen, waitFor } from '@testing-library/react';
import { testLoadingSpinner, testInfiniteLoadingPrevention } from '../utils/test-helpers';

// Mock loading spinner component
const LoadingSpinner = ({ isLoading, text = 'Loading...', timeout = 5000 }) => {
  const [showSpinner, setShowSpinner] = useState(isLoading);

  useEffect(() => {
    if (isLoading) {
      setShowSpinner(true);
    } else {
      setShowSpinner(false);
    }
  }, [isLoading]);

  // Timeout to prevent infinite loading
  useEffect(() => {
    if (isLoading) {
      const timer = setTimeout(() => {
        setShowSpinner(false);
      }, timeout);

      return () => clearTimeout(timer);
    }
  }, [isLoading, timeout]);

  if (!showSpinner) return null;

  return (
    <div role="status" aria-label="Loading">
      <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-600 mx-auto mb-4"></div>
      <p>{text}</p>
    </div>
  );
};

describe('Loading Spinner Component', () => {
  test('should show spinner when loading is true', () => {
    render(<LoadingSpinner isLoading={true} />);
    
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  test('should hide spinner when loading is false', () => {
    render(<LoadingSpinner isLoading={false} />);
    
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
  });

  test('should show custom loading text', () => {
    render(<LoadingSpinner isLoading={true} text="Loading dashboard..." />);
    
    expect(screen.getByText('Loading dashboard...')).toBeInTheDocument();
  });

  test('should timeout after specified duration', async () => {
    render(<LoadingSpinner isLoading={true} timeout={100} />);
    
    // Should show spinner initially
    expect(screen.getByRole('status')).toBeInTheDocument();
    
    // Wait for timeout
    await waitFor(() => {
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    }, { timeout: 200 });
  });

  test('should not show spinner after timeout', async () => {
    const { rerender } = render(<LoadingSpinner isLoading={true} timeout={100} />);
    
    // Wait for timeout
    await waitFor(() => {
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });
    
    // Even if loading is still true, spinner should be hidden due to timeout
    rerender(<LoadingSpinner isLoading={true} timeout={100} />);
    
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  test('should prevent infinite loading', async () => {
    await testInfiniteLoadingPrevention(
      <LoadingSpinner isLoading={true} timeout={100} />,
      200
    );
  });

  test('should handle rapid loading state changes', async () => {
    const { rerender } = render(<LoadingSpinner isLoading={true} />);
    
    // Rapidly change loading state
    for (let i = 0; i < 10; i++) {
      rerender(<LoadingSpinner isLoading={i % 2 === 0} />);
      await new Promise(resolve => setTimeout(resolve, 10));
    }
    
    // Should not cause infinite loops
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  test('should clean up timeout on unmount', () => {
    const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');
    
    const { unmount } = render(<LoadingSpinner isLoading={true} />);
    unmount();
    
    expect(clearTimeoutSpy).toHaveBeenCalled();
    clearTimeoutSpy.mockRestore();
  });
});
