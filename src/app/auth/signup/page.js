'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SignUp() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [successData, setSuccessData] = useState(null);
  const router = useRouter();

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

  const handleSignInClick = () => {
    // Store the email in localStorage so it can be pre-filled on signin page
    if (successData?.email) {
      localStorage.setItem('signupEmail', successData.email);
    }
    router.push('/auth/signin');
  };

  const validateForm = () => {
    const newErrors = {};

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one uppercase letter, one lowercase letter, and one number';
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
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
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim(),
          password: formData.password
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Show success state
        setSuccessData({
          name: formData.name.trim(),
          email: formData.email.trim()
        });
        setIsSuccess(true);
      } else {
        setErrors({ general: data.error || 'Failed to create account' });
      }
    } catch (error) {
      console.error('Sign up error:', error);
      setErrors({ general: 'Network error. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  // Show success page if signup was successful
  if (isSuccess) {
    return (
      <div className="min-h-screen bg-binance-background flex flex-col justify-center py-12 sm:px-6 lg:px-8" style={{backgroundColor: '#1E2329'}}>
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-binance-surface py-8 px-6 shadow-xl rounded-2xl border border-binance-border" style={{backgroundColor: '#2B3139', borderColor: '#3C4043'}}>
            {/* Header with Logo */}
            <div className="flex justify-center mb-6">
              <Link href="/" className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-binance-primary rounded-xl flex items-center justify-center" style={{backgroundColor: '#F0B90B'}}>
                  <span className="text-binance-background font-bold text-xl" style={{color: '#1E2329'}}>B</span>
                </div>
                <span className="text-2xl font-bold text-binance-textPrimary" style={{color: '#EAECEF'}}>Bitnex Global</span>
              </Link>
            </div>

            {/* Success Icon */}
            <div className="flex justify-center mb-6">
              <div className="rounded-full bg-binance-green/20 p-4" style={{backgroundColor: 'rgba(14, 203, 129, 0.2)'}}>
                <svg className="h-8 w-8 text-binance-green" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{color: '#0ECB81'}}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>

            {/* Success Message */}
            <div className="text-center">
              <h2 className="text-2xl font-bold text-binance-textPrimary mb-2" style={{color: '#EAECEF'}}>
                Welcome to Bitnex Global!
              </h2>
              <p className="text-binance-textSecondary mb-6" style={{color: '#B7BDC6'}}>
                Your account has been created successfully.
              </p>
              
              {/* User Details */}
              <div className="bg-binance-green/10 border border-binance-green/30 rounded-lg p-4 mb-6" style={{backgroundColor: 'rgba(14, 203, 129, 0.1)', borderColor: 'rgba(14, 203, 129, 0.3)'}}>
                <div className="flex items-center mb-2">
                  <svg className="h-5 w-5 text-binance-green mr-2" fill="currentColor" viewBox="0 0 20 20" style={{color: '#0ECB81'}}>
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                  <span className="font-medium text-binance-textPrimary" style={{color: '#EAECEF'}}>Account Details:</span>
                </div>
                <div className="ml-7 text-sm text-binance-textSecondary" style={{color: '#B7BDC6'}}>
                  <p><strong>Name:</strong> {successData.name}</p>
                  <p><strong>Email:</strong> {successData.email}</p>
                </div>
              </div>

              {/* Next Steps */}
              <div className="space-y-4">
                <p className="text-sm text-binance-textSecondary" style={{color: '#B7BDC6'}}>
                  You can now sign in to your account and start using all the features.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={handleSignInClick}
                    className="flex-1 bg-binance-primary text-binance-background px-4 py-3 rounded-lg text-center font-semibold hover:bg-binance-primary/90 transition-all duration-200"
                    style={{backgroundColor: '#F0B90B', color: '#1E2329'}}
                  >
                    Sign In Now
                  </button>
                  <Link
                    href="/"
                    className="flex-1 bg-binance-surface text-binance-textPrimary px-4 py-3 rounded-lg text-center font-semibold hover:bg-binance-surfaceHover transition-all duration-200 border border-binance-border"
                    style={{backgroundColor: '#2B3139', color: '#EAECEF', borderColor: '#3C4043'}}
                  >
                    Go to Home
                  </Link>
                </div>
              </div>

              {/* Additional Info */}
              <div className="mt-6 p-4 bg-binance-primary/10 border border-binance-primary/30 rounded-lg" style={{backgroundColor: 'rgba(240, 185, 11, 0.1)', borderColor: 'rgba(240, 185, 11, 0.3)'}}>
                <div className="flex items-start">
                  <svg className="h-5 w-5 text-binance-primary mt-0.5 mr-3" fill="currentColor" viewBox="0 0 20 20" style={{color: '#F0B90B'}}>
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <div className="text-sm text-binance-textSecondary" style={{color: '#B7BDC6'}}>
                    <p className="font-medium mb-1 text-binance-textPrimary" style={{color: '#EAECEF'}}>What's next?</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Sign in to access your dashboard</li>
                      <li>Explore our trading features</li>
                      <li>Set up your profile and preferences</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
          Create Account
        </h2>
        <p className="mt-2 text-center text-sm text-binance-textSecondary" style={{color: '#B7BDC6'}}>
          Join thousands of traders on our platform
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
                  </div>
                </div>
              </div>
            )}

            <div>
              <label htmlFor="name" className="block text-sm font-medium text-binance-textSecondary mb-2" style={{color: '#B7BDC6'}}>
                Full Name
              </label>
              <div className="mt-1">
                <input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className={`appearance-none block w-full px-4 py-3 border rounded-lg shadow-sm placeholder-binance-textTertiary focus:outline-none focus:ring-2 focus:ring-binance-primary focus:border-binance-primary sm:text-sm bg-binance-background text-binance-textPrimary ${
                    errors.name ? 'border-binance-red' : 'border-binance-border'
                  }`}
                  style={{
                    backgroundColor: '#1E2329',
                    color: '#EAECEF',
                    borderColor: errors.name ? '#F6465D' : '#3C4043'
                  }}
                  placeholder="Enter your full name"
                />
                {errors.name && (
                  <p className="mt-2 text-sm text-binance-red" style={{color: '#F6465D'}}>{errors.name}</p>
                )}
              </div>
            </div>

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
                  autoComplete="new-password"
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

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-binance-textSecondary mb-2" style={{color: '#B7BDC6'}}>
                Confirm Password
              </label>
              <div className="mt-1">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={`appearance-none block w-full px-4 py-3 border rounded-lg shadow-sm placeholder-binance-textTertiary focus:outline-none focus:ring-2 focus:ring-binance-primary focus:border-binance-primary sm:text-sm bg-binance-background text-binance-textPrimary ${
                    errors.confirmPassword ? 'border-binance-red' : 'border-binance-border'
                  }`}
                  style={{
                    backgroundColor: '#1E2329',
                    color: '#EAECEF',
                    borderColor: errors.confirmPassword ? '#F6465D' : '#3C4043'
                  }}
                  placeholder="Confirm your password"
                />
                {errors.confirmPassword && (
                  <p className="mt-2 text-sm text-binance-red" style={{color: '#F6465D'}}>{errors.confirmPassword}</p>
                )}
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
                    Creating Account...
                  </div>
                ) : 'Create Account'}
              </button>
            </div>
          </form>

          {/* Helpful message */}
          <div className="mt-6 p-4 bg-binance-primary/10 border border-binance-primary/30 rounded-lg" style={{backgroundColor: 'rgba(240, 185, 11, 0.1)', borderColor: 'rgba(240, 185, 11, 0.3)'}}>
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-binance-primary" viewBox="0 0 20 20" fill="currentColor" style={{color: '#F0B90B'}}>
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-binance-textPrimary" style={{color: '#EAECEF'}}>
                  Already have an account?
                </h3>
                <div className="mt-2 text-sm text-binance-textSecondary" style={{color: '#B7BDC6'}}>
                  <p>
                    If you already have an account, you can sign in instead.
                    <Link href="/auth/signin" className="font-medium underline hover:text-binance-primary" style={{color: '#F0B90B'}}>
                      {' '}Sign in now →
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
          Already have an account?{' '}
          <Link href="/auth/signin" className="font-medium text-binance-primary hover:text-binance-primary/80" style={{color: '#F0B90B'}}>
            Sign in here
          </Link>
        </p>
      </div>
    </div>
  );
}