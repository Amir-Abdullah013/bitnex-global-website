'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SignIn() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const router = useRouter();

  // Pre-fill email if coming from signup
  useEffect(() => {
    const signupEmail = localStorage.getItem('signupEmail');
    if (signupEmail) {
      setFormData(prev => ({
        ...prev,
        email: signupEmail
      }));
      // Clear the stored email
      localStorage.removeItem('signupEmail');
    }
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      const response = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email.trim(),
          password: formData.password
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Store user session
        localStorage.setItem('userSession', JSON.stringify(data.user));
        
        // Clear any cached data
        localStorage.removeItem('signupEmail');
        
        // Role-based redirect
        if (data.user.role === 'admin') {
          router.push('/admin/dashboard');
        } else {
          router.push('/user/dashboard');
        }
      } else {
        // Handle specific error cases with detailed debugging
        console.error('Signin failed:', data);
        
        let errorMessage = data.error || 'Failed to sign in';
        
        // Add debug information if available
        if (data.debug) {
          errorMessage += `\n\nDebug Info:\n- Email: ${data.debug.email}\n- Database Used: ${data.debug.usedDatabase}\n- Timestamp: ${data.debug.timestamp}`;
        }
        
        if (data.errorCode === 'USER_NOT_FOUND') {
          setErrors({ 
            general: errorMessage,
            showSignupLink: true,
            suggestion: data.suggestion
          });
        } else if (data.errorCode === 'INVALID_PASSWORD') {
          setErrors({ 
            general: errorMessage,
            showForgotPassword: true
          });
        } else {
          setErrors({ general: errorMessage });
        }
      }
    } catch (error) {
      console.error('Sign in error:', error);
      setErrors({ general: 'Network error. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    setErrors({});

    try {
      // Direct redirect to Google OAuth endpoint
      window.location.href = '/api/auth/oauth/google';
    } catch (error) {
      console.error('Google sign in error:', error);
      setErrors({ general: 'Network error. Please try again.' });
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-binance-background flex flex-col justify-center py-12 sm:px-6 lg:px-8" style={{backgroundColor: '#1E2329'}}>
      {/* Header with Logo */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center mb-6">
          <Link href="/" className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-binance-primary rounded-xl flex items-center justify-center" style={{backgroundColor: '#F0B90B'}}>
              <span className="text-binance-background font-bold text-xl" style={{color: '#1E2329'}}>B</span>
            </div>
            <span className="text-2xl font-bold text-binance-textPrimary" style={{color: '#EAECEF'}}>Bitnex Global</span>
          </Link>
        </div>
        <h2 className="text-center text-3xl font-bold text-binance-textPrimary" style={{color: '#EAECEF'}}>
          Welcome Back
        </h2>
        <p className="mt-2 text-center text-sm text-binance-textSecondary" style={{color: '#B7BDC6'}}>
          Sign in to your account to continue trading
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-binance-surface py-8 px-6 shadow-xl rounded-2xl border border-binance-border" style={{backgroundColor: '#2B3139', borderColor: '#3C4043'}}>
          <form className="space-y-6" onSubmit={handleSubmit}>
            {errors.general && (
              <div className="bg-binance-red/10 border border-binance-red/30 text-binance-red px-4 py-3 rounded-lg" style={{backgroundColor: 'rgba(246, 70, 93, 0.1)', borderColor: 'rgba(246, 70, 93, 0.3)', color: '#F6465D'}}>
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-binance-red" viewBox="0 0 20 20" fill="currentColor" style={{color: '#F6465D'}}>
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3 flex-1">
                    <p className="text-sm font-medium">{errors.general}</p>
                    {errors.showSignupLink && (
                      <div className="mt-2">
                        <Link 
                          href="/auth/signup" 
                          className="text-sm font-medium text-binance-primary hover:text-binance-primary/80 underline"
                          style={{color: '#F0B90B'}}
                        >
                          Create Account Now →
                        </Link>
                      </div>
                    )}
                    {errors.showForgotPassword && (
                      <div className="mt-2">
                        <Link 
                          href="/auth/forgot-password" 
                          className="text-sm font-medium text-binance-primary hover:text-binance-primary/80 underline"
                          style={{color: '#F0B90B'}}
                        >
                          Forgot Password? →
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-binance-textSecondary mb-2" style={{color: '#B7BDC6'}}>
                Email address
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className={`appearance-none block w-full px-4 py-3 border rounded-lg shadow-sm placeholder-binance-textTertiary focus:outline-none focus:ring-2 focus:ring-binance-primary focus:border-binance-primary sm:text-sm bg-binance-background text-binance-textPrimary ${
                    errors.email ? 'border-binance-red' : 'border-binance-border'
                  }`}
                  style={{
                    backgroundColor: '#1E2329',
                    color: '#EAECEF',
                    borderColor: errors.email ? '#F6465D' : '#3C4043'
                  }}
                  placeholder="Enter your email"
                />
                {errors.email && (
                  <p className="mt-2 text-sm text-binance-red" style={{color: '#F6465D'}}>{errors.email}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-binance-textSecondary mb-2" style={{color: '#B7BDC6'}}>
                Password
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className={`appearance-none block w-full px-4 py-3 border rounded-lg shadow-sm placeholder-binance-textTertiary focus:outline-none focus:ring-2 focus:ring-binance-primary focus:border-binance-primary sm:text-sm bg-binance-background text-binance-textPrimary ${
                    errors.password ? 'border-binance-red' : 'border-binance-border'
                  }`}
                  style={{
                    backgroundColor: '#1E2329',
                    color: '#EAECEF',
                    borderColor: errors.password ? '#F6465D' : '#3C4043'
                  }}
                  placeholder="Enter your password"
                />
                {errors.password && (
                  <p className="mt-2 text-sm text-binance-red" style={{color: '#F6465D'}}>{errors.password}</p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-binance-primary focus:ring-binance-primary border-binance-border rounded"
                  style={{color: '#F0B90B', borderColor: '#3C4043'}}
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-binance-textSecondary" style={{color: '#B7BDC6'}}>
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <Link href="/auth/forgot-password" className="font-medium text-binance-primary hover:text-binance-primary/80" style={{color: '#F0B90B'}}>
                  Forgot your password?
                </Link>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-binance-background bg-binance-primary hover:bg-binance-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-binance-primary disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                style={{backgroundColor: '#F0B90B', color: '#1E2329'}}
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-binance-background mr-2" style={{borderColor: '#1E2329'}}></div>
                    Signing in...
                  </div>
                ) : 'Sign in'}
              </button>
            </div>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-binance-border" style={{borderColor: '#3C4043'}} />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-3 bg-binance-surface text-binance-textTertiary" style={{backgroundColor: '#2B3139', color: '#848E9C'}}>Or continue with</span>
                </div>
              </div>

              <div className="mt-6">
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={isGoogleLoading}
                  className="w-full inline-flex justify-center py-3 px-4 border border-binance-border rounded-lg shadow-sm bg-binance-background text-sm font-medium text-binance-textSecondary hover:bg-binance-surface disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                  style={{borderColor: '#3C4043', backgroundColor: '#1E2329', color: '#B7BDC6'}}
                >
                  {isGoogleLoading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-binance-textSecondary mr-2" style={{borderColor: '#B7BDC6'}}></div>
                      Connecting...
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                        <path
                          fill="#4285F4"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        />
                      </svg>
                      Sign in with Google
                    </div>
                  )}
                </button>
              </div>
            </div>
          </form>

          {/* Helpful message for new users */}
          <div className="mt-6 p-4 bg-binance-primary/10 border border-binance-primary/30 rounded-lg" style={{backgroundColor: 'rgba(240, 185, 11, 0.1)', borderColor: 'rgba(240, 185, 11, 0.3)'}}>
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-binance-primary" viewBox="0 0 20 20" fill="currentColor" style={{color: '#F0B90B'}}>
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-binance-textPrimary" style={{color: '#EAECEF'}}>
                  New to Bitnex Global?
                </h3>
                <div className="mt-2 text-sm text-binance-textSecondary" style={{color: '#B7BDC6'}}>
                  <p>
                    If you don't have an account yet, you can create one in just a few minutes.
                    <Link href="/auth/signup" className="font-medium underline hover:text-binance-primary" style={{color: '#F0B90B'}}>
                      {' '}Create your account now →
                    </Link>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 text-center">
        <p className="text-sm text-binance-textTertiary" style={{color: '#848E9C'}}>
          Don't have an account?{' '}
          <Link href="/auth/signup" className="font-medium text-binance-primary hover:text-binance-primary/80" style={{color: '#F0B90B'}}>
            Sign up for free
          </Link>
        </p>
      </div>
    </div>
  );
}