import { NextResponse } from 'next/server';
import { getServerSession, getUserRole } from './session';

/**
 * API Route Wrapper with Authentication
 * Handles all authentication scenarios for API routes
 */

export function withAuth(handler, options = {}) {
  return async (request) => {
    try {
      // Get session
      const session = await getServerSession();
      
      if (!session) {
        console.log('❌ No session found');
        return NextResponse.json(
          { success: false, error: 'Authentication required' },
          { status: 401 }
        );
      }

      // Check if admin access is required
      if (options.requireAdmin) {
        const userRole = await getUserRole(session);
        console.log('🔍 User role check:', { email: session.email, role: userRole });
        
        if (userRole !== 'ADMIN') {
          // For development, allow admin access for specific email
          if (process.env.NODE_ENV === 'development' && session.email === 'amirabdullah2508@gmail.com') {
            console.log('✅ Development admin access granted');
          } else {
            return NextResponse.json(
              { success: false, error: 'Admin access required' },
              { status: 403 }
            );
          }
        }
      }

      // Add session to request context
      const requestWithAuth = {
        ...request,
        session,
        user: session
      };

      // Call the original handler
      return await handler(requestWithAuth);

    } catch (error) {
      console.error('❌ API wrapper error:', error);
      return NextResponse.json(
        { success: false, error: 'Internal server error' },
        { status: 500 }
      );
    }
  };
}

/**
 * Admin-only API wrapper
 */
export function withAdminAuth(handler) {
  return withAuth(handler, { requireAdmin: true });
}

/**
 * User-only API wrapper
 */
export function withUserAuth(handler) {
  return withAuth(handler, { requireAdmin: false });
}

/**
 * Public API wrapper (no authentication required)
 */
export function withPublicAuth(handler) {
  return async (request) => {
    try {
      return await handler(request);
    } catch (error) {
      console.error('❌ Public API error:', error);
      return NextResponse.json(
        { success: false, error: 'Internal server error' },
        { status: 500 }
      );
    }
  };
}

