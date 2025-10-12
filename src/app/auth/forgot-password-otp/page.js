'use client';

import { useState } from 'react';
import Link from 'next/link';
import Button from '../../../components/Button';
import Input from '../../../components/Input';
import Card, { CardContent, CardHeader, CardTitle } from '../../../components/Card';
import { AlertModal } from '../../../components/Modal';

export default function ForgotPasswordOTPPage() {
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

  // Success step
  if (step === 4) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
              <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="mt-6 text-3xl font-bold text-gray-900">Password Reset Complete!</h2>
            <p className="mt-2 text-sm text-gray-600">
              Your password has been successfully reset. You can now sign in with your new password.
            </p>
          </div>

          <Card>
            <CardContent className="p-6 text-center">
              <div className="space-y-4">
                <Link href="/auth/signin">
                  <Button variant="primary" fullWidth>
                    Sign In Now
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            {step === 1 && 'Reset Password'}
            {step === 2 && 'Enter OTP'}
            {step === 3 && 'Set New Password'}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {step === 1 && 'Enter your email address to receive an OTP'}
            {step === 2 && `We've sent a 6-digit OTP to ${email}`}
            {step === 3 && 'Create a new password for your account'}
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-center">
              {step === 1 && 'Step 1: Enter Email'}
              {step === 2 && 'Step 2: Verify OTP'}
              {step === 3 && 'Step 3: New Password'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {step === 1 && (
              <form onSubmit={handleSendOTP} className="space-y-6">
                <div>
                  <Input
                    label="Email Address"
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (emailError) setEmailError('');
                    }}
                    error={emailError}
                    placeholder="Enter your email address"
                    required
                  />
                </div>
                <Button
                  type="submit"
                  variant="primary"
                  fullWidth
                  loading={loading}
                >
                  Send OTP
                </Button>
              </form>
            )}

            {step === 2 && (
              <form onSubmit={handleVerifyOTP} className="space-y-6">
                <div>
                  <Input
                    label="6-Digit OTP"
                    type="text"
                    value={otp}
                    onChange={(e) => {
                      setOtp(e.target.value.replace(/\D/g, '').slice(0, 6));
                      if (otpError) setOtpError('');
                    }}
                    error={otpError}
                    placeholder="Enter 6-digit OTP"
                    maxLength={6}
                    required
                  />
                  <p className="mt-2 text-sm text-gray-600">
                    Check your email for the OTP. It will expire in 10 minutes.
                  </p>
                </div>
                <Button
                  type="submit"
                  variant="primary"
                  fullWidth
                  loading={loading}
                >
                  Verify OTP
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  fullWidth
                  onClick={() => {
                    setStep(1);
                    setOtp('');
                    setOtpError('');
                  }}
                >
                  Back to Email
                </Button>
              </form>
            )}

            {step === 3 && (
              <form onSubmit={handleResetPassword} className="space-y-6">
                <div>
                  <Input
                    label="New Password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      if (passwordError) setPasswordError('');
                    }}
                    error={passwordError}
                    placeholder="Enter new password"
                    required
                  />
                </div>
                <div>
                  <Input
                    label="Confirm Password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (passwordError) setPasswordError('');
                    }}
                    error={passwordError}
                    placeholder="Confirm new password"
                    required
                  />
                </div>
                <Button
                  type="submit"
                  variant="primary"
                  fullWidth
                  loading={loading}
                >
                  Reset Password
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  fullWidth
                  onClick={() => {
                    setStep(2);
                    setNewPassword('');
                    setConfirmPassword('');
                    setPasswordError('');
                  }}
                >
                  Back to OTP
                </Button>
              </form>
            )}

            <div className="mt-6 text-center">
              <Link href="/auth/signin" className="text-sm text-blue-600 hover:text-blue-500">
                Back to Sign In
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      <AlertModal
        isOpen={showAlert}
        onClose={() => setShowAlert(false)}
        title={alertType === 'success' ? 'Success!' : 'Error'}
        message={alertMessage}
        type={alertType}
        buttonText="OK"
      />
    </div>
  );
}
