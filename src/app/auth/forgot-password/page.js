'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../../../lib/auth-context';
import Button from '../../../components/Button';
import Input from '../../../components/Input';
import Card, { CardContent } from '../../../components/Card';
import { AlertModal } from '../../../components/Modal';

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

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-secondary-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-success-100">
              <svg className="h-6 w-6 text-success-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="mt-6 text-3xl font-bold text-secondary-900">Check your email</h2>
            <p className="mt-2 text-sm text-secondary-600">
              We've sent a password reset link to <strong>{email}</strong>
            </p>
          </div>

          <Card>
            <CardContent className="p-6 text-center">
              <div className="space-y-4">
                <p className="text-sm text-secondary-600">
                  If you don't see the email in your inbox, check your spam folder.
                </p>
                <p className="text-sm text-secondary-600">
                  The link will expire in 1 hour for security reasons.
                </p>
                
                <div className="flex flex-col space-y-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsSubmitted(false);
                      setEmail('');
                    }}
                    fullWidth
                  >
                    Try a different email
                  </Button>
                  
                  <Link href="/auth/signin">
                    <Button variant="primary" fullWidth>
                      Back to sign in
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-secondary-900">Forgot your password?</h2>
          <p className="mt-2 text-sm text-secondary-600">
            No worries, we'll send you reset instructions.
          </p>
        </div>

        <Card>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <Input
                label="Email address"
                type="email"
                value={email}
                onChange={handleEmailChange}
                error={emailError}
                placeholder="Enter your email"
                leftIcon={
                  <svg className="h-5 w-5 text-secondary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                  </svg>
                }
                helperText="We'll send a password reset link to this email address"
                required
              />

              <Button
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                loading={loading}
                disabled={loading}
              >
                Send OTP
              </Button>
            </form>

            <div className="mt-6 text-center">
              <Link href="/auth/signin" className="text-sm font-medium text-primary-600 hover:text-primary-500">
                Back to sign in
              </Link>
            </div>
          </CardContent>
        </Card>

        <div className="text-center">
          <p className="text-sm text-secondary-600">
            Remember your password?{' '}
            <Link href="/auth/signin" className="font-medium text-primary-600 hover:text-primary-500">
              Sign in here
            </Link>
          </p>
        </div>
      </div>

      <AlertModal
        isOpen={showAlert}
        onClose={() => setShowAlert(false)}
        title={alertType === 'success' ? 'Email Sent!' : 'Error'}
        message={alertMessage}
        type={alertType}
        buttonText="OK"
      />
    </div>
  );
}
