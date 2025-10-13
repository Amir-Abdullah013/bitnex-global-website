'use client';

/**
 * Comprehensive Authentication Helper
 * Handles all authentication scenarios for the website
 */

// Development admin user for testing
const DEV_ADMIN_USER = {
  id: '1f1fffe0-3e3b-40cb-a8e1-3be943a186fd',
  name: 'Amir Abdullah',
  email: 'amirabdullah2508@gmail.com',
  role: 'ADMIN',
  status: 'active',
  emailVerified: true,
  createdAt: new Date().toISOString(),
  lastLogin: new Date().toISOString()
};

/**
 * Get user session from multiple sources
 */
export function getUserSession() {
  try {
    // 1. Check localStorage first (most reliable for client-side)
    const userSession = localStorage.getItem('userSession');
    if (userSession) {
      const user = JSON.parse(userSession);
      console.log('✅ Found user session in localStorage:', user.email);
      return user;
    }

    // 2. Check session cookie
    const sessionCookie = document.cookie
      .split('; ')
      .find(row => row.startsWith('session='))
      ?.split('=')[1];
    
    if (sessionCookie) {
      try {
        const session = JSON.parse(decodeURIComponent(sessionCookie));
        console.log('✅ Found session cookie:', session.email);
        return session;
      } catch (e) {
        console.log('❌ Failed to parse session cookie:', e);
      }
    }

    // 3. Check OAuth session cookie
    const oauthSession = document.cookie
      .split('; ')
      .find(row => row.startsWith('oauthSession='))
      ?.split('=')[1];
    
    if (oauthSession) {
      try {
        const oauth = JSON.parse(decodeURIComponent(oauthSession));
        console.log('✅ Found OAuth session:', oauth.email);
        return oauth;
      } catch (e) {
        console.log('❌ Failed to parse OAuth session:', e);
      }
    }

    // 4. For development, return admin user
    if (process.env.NODE_ENV === 'development') {
      console.log('🔧 Development mode: using admin user');
      return DEV_ADMIN_USER;
    }

    return null;
  } catch (error) {
    console.error('❌ Error getting user session:', error);
    return null;
  }
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated() {
  const user = getUserSession();
  return !!user;
}

/**
 * Check if user is admin
 */
export function isAdmin() {
  const user = getUserSession();
  if (!user) return false;
  
  return user.role === 'ADMIN' || 
         user.role === 'admin' || 
         user.user_metadata?.role === 'admin';
}

/**
 * Get user role
 */
export function getUserRole() {
  const user = getUserSession();
  if (!user) return 'USER';
  
  return user.role || user.user_metadata?.role || 'USER';
}

/**
 * Set user session
 */
export function setUserSession(user) {
  try {
    localStorage.setItem('userSession', JSON.stringify(user));
    console.log('✅ User session set:', user.email);
    return true;
  } catch (error) {
    console.error('❌ Error setting user session:', error);
    return false;
  }
}

/**
 * Clear user session
 */
export function clearUserSession() {
  try {
    localStorage.removeItem('userSession');
    // Also clear cookies
    document.cookie = 'session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    document.cookie = 'userSession=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    document.cookie = 'oauthSession=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    console.log('✅ User session cleared');
    return true;
  } catch (error) {
    console.error('❌ Error clearing user session:', error);
    return false;
  }
}

/**
 * Create a mock admin session for development
 */
export function createMockAdminSession() {
  if (process.env.NODE_ENV === 'development') {
    setUserSession(DEV_ADMIN_USER);
    return DEV_ADMIN_USER;
  }
  return null;
}

/**
 * API request helper with authentication
 */
export async function authenticatedFetch(url, options = {}) {
  const user = getUserSession();
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };

  // Add user info to headers for server-side authentication
  if (user) {
    headers['X-User-Email'] = user.email;
    headers['X-User-Role'] = user.role || 'USER';
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers
    });

    // Handle 403 errors gracefully
    if (response.status === 403) {
      console.warn('⚠️ 403 Forbidden - checking authentication');
      
      // If we're in development, create a mock session
      if (process.env.NODE_ENV === 'development') {
        console.log('🔧 Development mode: creating mock admin session');
        createMockAdminSession();
        
        // Retry the request with admin session
        const retryResponse = await fetch(url, {
          ...options,
          headers: {
            ...headers,
            'X-User-Email': DEV_ADMIN_USER.email,
            'X-User-Role': DEV_ADMIN_USER.role
          }
        });
        
        return retryResponse;
      }
    }

    return response;
  } catch (error) {
    console.error('❌ API request failed:', error);
    throw error;
  }
}

/**
 * Initialize authentication for the app
 */
export function initializeAuth() {
  // In development, automatically set up admin session
  if (process.env.NODE_ENV === 'development') {
    console.log('🔧 Initializing development authentication');
    createMockAdminSession();
  }
  
  // Listen for storage changes (when login sets localStorage)
  const handleStorageChange = (e) => {
    if (e.key === 'userSession') {
      console.log('🔄 User session changed');
      // Trigger re-authentication check
      window.dispatchEvent(new CustomEvent('authChanged'));
    }
  };
  
  window.addEventListener('storage', handleStorageChange);
  
  return () => {
    window.removeEventListener('storage', handleStorageChange);
  };
}

