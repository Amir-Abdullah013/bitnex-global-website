'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [otpError, setOtpError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState('error');
  const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: New Password
  const [loading, setLoading] = useState(false);
  const [resetToken, setResetToken] = useState('');

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    if (emailError) {
      setEmailError('');
    }
  };

  const validateEmail = () => {
    if (!email) {
      setEmailError('Email is required');
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setEmailError('Please enter a valid email address');
      return false;
    }
    return true;
  };

  const validatePasswords = () => {
    if (!newPassword) {
      setPasswordError('New password is required');
      return false;
    }
    if (newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters long');
      return false;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return false;
    }
    return true;
  };

  const handleSendOTP = async (e) => {
    e.preventDefault();
    
    if (!validateEmail()) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const result = await response.json();
      
      if (result.success) {
        setStep(2);
        setAlertMessage('OTP sent to your email. Please check your inbox.');
        setAlertType('success');
      } else {
        setAlertMessage(result.error);
        setAlertType('error');
      }
      
      setShowAlert(true);
    } catch (error) {
      setAlertMessage('Failed to send OTP. Please try again.');
      setAlertType('error');
      setShowAlert(true);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    
    if (!otp || otp.length !== 6) {
      setOtpError('Please enter a valid 6-digit OTP');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp })
      });

      const result = await response.json();
      
      if (result.success) {
        setResetToken(result.resetToken);
        setStep(3);
        setAlertMessage('OTP verified successfully. Please set your new password.');
        setAlertType('success');
      } else {
        setAlertMessage(result.error);
        setAlertType('error');
      }
      
      setShowAlert(true);
    } catch (error) {
      setAlertMessage('Failed to verify OTP. Please try again.');
      setAlertType('error');
      setShowAlert(true);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    
    if (!validatePasswords()) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email, 
          token: resetToken, 
          newPassword 
        })
      });

      const result = await response.json();
      
      if (result.success) {
        setAlertMessage('Password reset successfully! You can now sign in with your new password.');
        setAlertType('success');
        setStep(4); // Success step
      } else {
        setAlertMessage(result.error);
        setAlertType('error');
      }
      
      setShowAlert(true);
    } catch (error) {
      setAlertMessage('Failed to reset password. Please try again.');
      setAlertType('error');
      setShowAlert(true);
    } finally {
      setLoading(false);
    }
  };

  if (step === 2) {
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
            Enter OTP
          </h2>
          <p className="mt-2 text-center text-sm text-binance-textSecondary" style={{color: '#B7BDC6'}}>
            We've sent a 6-digit code to <strong>{email}</strong>
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-binance-surface py-8 px-6 shadow-xl rounded-2xl border border-binance-border" style={{backgroundColor: '#2B3139', borderColor: '#3C4043'}}>
            <form className="space-y-6" onSubmit={handleVerifyOTP}>
              <div>
                <label htmlFor="otp" className="block text-sm font-medium text-binance-textSecondary mb-2" style={{color: '#B7BDC6'}}>
                  Enter OTP
                </label>
                <div className="mt-1">
                  <input
                    id="otp"
                    name="otp"
                    type="text"
                    value={otp}
                    onChange={(e) => {
                      setOtp(e.target.value);
                      if (otpError) setOtpError('');
                    }}
                    maxLength={6}
                    required
                    className={`appearance-none block w-full px-4 py-3 border rounded-lg shadow-sm placeholder-binance-textTertiary focus:outline-none focus:ring-2 focus:ring-binance-primary focus:border-binance-primary sm:text-sm bg-binance-background text-binance-textPrimary ${
                      otpError ? 'border-binance-red' : 'border-binance-border'
                    }`}
                    style={{
                      backgroundColor: '#1E2329',
                      color: '#EAECEF',
                      borderColor: otpError ? '#F6465D' : '#3C4043'
                    }}
                    placeholder="Enter 6-digit code"
                  />
                  {otpError && (
                    <p className="mt-2 text-sm text-binance-red" style={{color: '#F6465D'}}>{otpError}</p>
                  )}
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-binance-background bg-binance-primary hover:bg-binance-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-binance-primary disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                  style={{backgroundColor: '#F0B90B', color: '#1E2329'}}
                >
                  {loading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-binance-background mr-2" style={{borderColor: '#1E2329'}}></div>
                      Verifying...
                    </div>
                  ) : 'Verify OTP'}
                </button>
              </div>
            </form>

            <div className="mt-6 text-center">
              <button
                onClick={() => setStep(1)}
                className="text-sm font-medium text-binance-primary hover:text-binance-primary/80"
                style={{color: '#F0B90B'}}
              >
                Back to email
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (step === 3) {
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
            Set New Password
          </h2>
          <p className="mt-2 text-center text-sm text-binance-textSecondary" style={{color: '#B7BDC6'}}>
            Enter your new password below
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-binance-surface py-8 px-6 shadow-xl rounded-2xl border border-binance-border" style={{backgroundColor: '#2B3139', borderColor: '#3C4043'}}>
            <form className="space-y-6" onSubmit={handleResetPassword}>
              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-binance-textSecondary mb-2" style={{color: '#B7BDC6'}}>
                  New Password
                </label>
                <div className="mt-1">
                  <input
                    id="newPassword"
                    name="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      if (passwordError) setPasswordError('');
                    }}
                    required
                    className={`appearance-none block w-full px-4 py-3 border rounded-lg shadow-sm placeholder-binance-textTertiary focus:outline-none focus:ring-2 focus:ring-binance-primary focus:border-binance-primary sm:text-sm bg-binance-background text-binance-textPrimary ${
                      passwordError ? 'border-binance-red' : 'border-binance-border'
                    }`}
                    style={{
                      backgroundColor: '#1E2329',
                      color: '#EAECEF',
                      borderColor: passwordError ? '#F6465D' : '#3C4043'
                    }}
                    placeholder="Enter new password"
                  />
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
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (passwordError) setPasswordError('');
                    }}
                    required
                    className={`appearance-none block w-full px-4 py-3 border rounded-lg shadow-sm placeholder-binance-textTertiary focus:outline-none focus:ring-2 focus:ring-binance-primary focus:border-binance-primary sm:text-sm bg-binance-background text-binance-textPrimary ${
                      passwordError ? 'border-binance-red' : 'border-binance-border'
                    }`}
                    style={{
                      backgroundColor: '#1E2329',
                      color: '#EAECEF',
                      borderColor: passwordError ? '#F6465D' : '#3C4043'
                    }}
                    placeholder="Confirm new password"
                  />
                  {passwordError && (
                    <p className="mt-2 text-sm text-binance-red" style={{color: '#F6465D'}}>{passwordError}</p>
                  )}
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-binance-background bg-binance-primary hover:bg-binance-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-binance-primary disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                  style={{backgroundColor: '#F0B90B', color: '#1E2329'}}
                >
                  {loading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-binance-background mr-2" style={{borderColor: '#1E2329'}}></div>
                      Resetting...
                    </div>
                  ) : 'Reset Password'}
                </button>
              </div>
            </form>

            <div className="mt-6 text-center">
              <button
                onClick={() => setStep(2)}
                className="text-sm font-medium text-binance-primary hover:text-binance-primary/80"
                style={{color: '#F0B90B'}}
              >
                Back to OTP
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (step === 4) {
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
            Password Reset Complete!
          </h2>
          <p className="mt-2 text-center text-sm text-binance-textSecondary" style={{color: '#B7BDC6'}}>
            Your password has been successfully reset.
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-binance-surface py-8 px-6 shadow-xl rounded-2xl border border-binance-border" style={{backgroundColor: '#2B3139', borderColor: '#3C4043'}}>
            <div className="text-center">
              {/* Success Icon */}
              <div className="flex justify-center mb-6">
                <div className="rounded-full bg-binance-green/20 p-4" style={{backgroundColor: 'rgba(14, 203, 129, 0.2)'}}>
                  <svg className="h-8 w-8 text-binance-green" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{color: '#0ECB81'}}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>

              <p className="text-sm text-binance-textSecondary mb-6" style={{color: '#B7BDC6'}}>
                You can now sign in with your new password.
              </p>
              
              <div className="flex flex-col space-y-3">
                <Link href="/auth/signin">
                  <button className="w-full bg-binance-primary text-binance-background px-4 py-3 rounded-lg text-center font-semibold hover:bg-binance-primary/90 transition-all duration-200" style={{backgroundColor: '#F0B90B', color: '#1E2329'}}>
                    Sign In Now
                  </button>
                </Link>
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
          Forgot your password?
        </h2>
        <p className="mt-2 text-center text-sm text-binance-textSecondary" style={{color: '#B7BDC6'}}>
          No worries, we'll send you reset instructions.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-binance-surface py-8 px-6 shadow-xl rounded-2xl border border-binance-border" style={{backgroundColor: '#2B3139', borderColor: '#3C4043'}}>
          <form className="space-y-6" onSubmit={handleSendOTP}>
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
                  value={email}
                  onChange={handleEmailChange}
                  className={`appearance-none block w-full px-4 py-3 border rounded-lg shadow-sm placeholder-binance-textTertiary focus:outline-none focus:ring-2 focus:ring-binance-primary focus:border-binance-primary sm:text-sm bg-binance-background text-binance-textPrimary ${
                    emailError ? 'border-binance-red' : 'border-binance-border'
                  }`}
                  style={{
                    backgroundColor: '#1E2329',
                    color: '#EAECEF',
                    borderColor: emailError ? '#F6465D' : '#3C4043'
                  }}
                  placeholder="Enter your email"
                />
                {emailError && (
                  <p className="mt-2 text-sm text-binance-red" style={{color: '#F6465D'}}>{emailError}</p>
                )}
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-binance-background bg-binance-primary hover:bg-binance-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-binance-primary disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                style={{backgroundColor: '#F0B90B', color: '#1E2329'}}
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-binance-background mr-2" style={{borderColor: '#1E2329'}}></div>
                    Sending OTP...
                  </div>
                ) : 'Send OTP'}
              </button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <Link href="/auth/signin" className="text-sm font-medium text-binance-primary hover:text-binance-primary/80" style={{color: '#F0B90B'}}>
              Back to sign in
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 text-center">
        <p className="text-sm text-binance-textTertiary" style={{color: '#848E9C'}}>
          Remember your password?{' '}
          <Link href="/auth/signin" className="font-medium text-binance-primary hover:text-binance-primary/80" style={{color: '#F0B90B'}}>
            Sign in here
          </Link>
        </p>
      </div>

      {/* Alert Modal */}
      {showAlert && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-binance-surface p-6 rounded-2xl border border-binance-border max-w-md w-full mx-4" style={{backgroundColor: '#2B3139', borderColor: '#3C4043'}}>
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0">
                {alertType === 'success' ? (
                  <svg className="h-6 w-6 text-binance-green" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{color: '#0ECB81'}}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="h-6 w-6 text-binance-red" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{color: '#F6465D'}}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-binance-textPrimary" style={{color: '#EAECEF'}}>
                  {alertType === 'success' ? 'Success!' : 'Error'}
                </h3>
              </div>
            </div>
            <p className="text-sm text-binance-textSecondary mb-4" style={{color: '#B7BDC6'}}>
              {alertMessage}
            </p>
            <button
              onClick={() => setShowAlert(false)}
              className="w-full bg-binance-primary text-binance-background px-4 py-2 rounded-lg font-medium hover:bg-binance-primary/90 transition-all duration-200"
              style={{backgroundColor: '#F0B90B', color: '#1E2329'}}
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}