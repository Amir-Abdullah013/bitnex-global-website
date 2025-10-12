'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../lib/auth-context';
import { useUniversal } from '../../../lib/universal-context';
import Layout from '../../../components/Layout';
import Card, { CardContent, CardHeader, CardTitle } from '../../../components/Card';
import Button from '../../../components/Button';
import Input from '../../../components/Input';
import { useToast, ToastContainer } from '../../../components/Toast';

function WithdrawPageContent() {
  const { user, loading, isAuthenticated } = useAuth();
  const { usdBalance, bnxBalance, bnxPrice, formatCurrency, formatBnx } = useUniversal();
  const router = useRouter();
  const { success, error, toasts, removeToast } = useToast();
  const [mounted, setMounted] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    amount: '',
    binanceAddress: ''
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Withdrawal history state
  const [withdrawals, setWithdrawals] = useState([]);
  const [loadingWithdrawals, setLoadingWithdrawals] = useState(false);

  // Validation rules
  const MIN_WITHDRAW_AMOUNT = 10;
  const MAX_WITHDRAW_AMOUNT = 10000;

  useEffect(() => {
    setMounted(true);
    // Load withdrawals immediately
    loadWithdrawals();
  }, []);

  // Authentication redirect disabled for development
  // Middleware will handle authentication in production

  const loadWithdrawals = async () => {
    try {
      setLoadingWithdrawals(true);
      const response = await fetch('/api/withdraw');
      if (response.ok) {
        const data = await response.json();
        setWithdrawals(data.withdrawals || []);
      }
    } catch (err) {
      console.error('Error loading withdrawals:', err);
    } finally {
      setLoadingWithdrawals(false);
    }
  };

  // Handle input change
  const handleInputChange = (e) => {
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

  // Validate form
  const validateForm = () => {
    const newErrors = {};
    
    // Amount validation
    if (!formData.amount) {
      newErrors.amount = 'Amount is required';
    } else {
      const amount = parseFloat(formData.amount);
      if (isNaN(amount) || amount <= 0) {
        newErrors.amount = 'Please enter a valid amount';
      } else if (amount < MIN_WITHDRAW_AMOUNT) {
        newErrors.amount = `Minimum withdrawal amount is $${MIN_WITHDRAW_AMOUNT}`;
      } else if (amount > MAX_WITHDRAW_AMOUNT) {
        newErrors.amount = `Maximum withdrawal amount is $${MAX_WITHDRAW_AMOUNT}`;
      } else if (amount > usdBalance) {
        newErrors.amount = 'Insufficient balance';
      }
    }

    // Binance address validation
    if (!formData.binanceAddress) {
      newErrors.binanceAddress = 'Binance address is required';
    } else if (formData.binanceAddress.length < 20) {
      newErrors.binanceAddress = 'Binance address must be at least 20 characters long';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/withdraw', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: parseFloat(formData.amount),
          binanceAddress: formData.binanceAddress
        })
      });

      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        console.error('Error parsing response JSON:', jsonError);
        error('Server returned invalid response. Please try again.');
        return;
      }

      if (response.ok) {
        success('Withdrawal request submitted successfully. Waiting for admin confirmation.');
        
        // Reset form
        setFormData({ amount: '', binanceAddress: '' });
        
        // Reload withdrawals to show the new request
        loadWithdrawals();
      } else {
        const errorMessage = data.details ? `${data.error}: ${data.details}` : data.error;
        error(errorMessage || 'Failed to submit withdrawal request');
      }
    } catch (err) {
      console.error('Error submitting withdrawal request:', err);
      error('Failed to submit withdrawal request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDING': return 'bg-binance-primary/20 text-binance-primary border border-binance-primary/30';
      case 'COMPLETED': return 'bg-binance-green/20 text-binance-green border border-binance-green/30';
      case 'FAILED': return 'bg-binance-red/20 text-binance-red border border-binance-red/30';
      default: return 'bg-binance-textTertiary/20 text-binance-textTertiary border border-binance-textTertiary/30';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'PENDING': return 'Pending';
      case 'COMPLETED': return 'Approved';
      case 'FAILED': return 'Rejected';
      default: return status;
    }
  };

  // Removed loading checks - render immediately for better UX
  
  return (
    <Layout showSidebar={true}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <Button
              variant="ghost"
              onClick={() => router.back()}
              className="mr-4 text-binance-textSecondary hover:text-binance-textPrimary"
            >
              ← Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-binance-textPrimary">Withdraw Funds</h1>
              <p className="text-binance-textSecondary mt-1">Withdraw money to your Binance account</p>
            </div>
          </div>
        </div>

        {/* Current Balances */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg text-binance-textPrimary">USD Balance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <h2 className="text-2xl font-bold text-binance-textPrimary">
                  {formatCurrency(usdBalance, 'USD')}
                </h2>
                <p className="text-sm text-binance-textSecondary">Available USD</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg text-binance-textPrimary">BNX Balance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <h2 className="text-2xl font-bold text-binance-textPrimary">
                  {formatBnx(bnxBalance)} BNX
                </h2>
                <p className="text-sm text-binance-textSecondary">Available Tokens</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Withdrawal Instructions */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg text-binance-textPrimary">📋 Withdrawal Instructions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-binance-primary/10 border border-binance-primary/30 p-4 rounded-lg">
                <h3 className="font-semibold text-binance-textPrimary mb-2">Step 1: Enter Withdrawal Details</h3>
                <p className="text-binance-textSecondary text-sm">
                  Enter the amount you want to withdraw and your Binance wallet address.
                </p>
              </div>
              
              <div className="bg-binance-green/10 border border-binance-green/30 p-4 rounded-lg">
                <h3 className="font-semibold text-binance-textPrimary mb-2">Step 2: Submit Request</h3>
                <p className="text-binance-textSecondary text-sm">
                  Submit your withdrawal request. The amount will be deducted from your balance immediately.
                </p>
              </div>
              
              <div className="bg-binance-primary/10 border border-binance-primary/30 p-4 rounded-lg">
                <h3 className="font-semibold text-binance-textPrimary mb-2">Step 3: Admin Processing</h3>
                <p className="text-binance-textSecondary text-sm">
                  Our admin team will manually send the funds to your Binance account within 24 hours.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Withdrawal Form */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-binance-textPrimary">Submit Withdrawal Request</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Amount Input */}
              <div>
                <label htmlFor="amount" className="block text-sm font-medium text-binance-textSecondary mb-2">
                  Withdrawal Amount (USD) *
                </label>
                <div className="relative">
                  <Input
                    id="amount"
                    name="amount"
                    type="number"
                    step="0.01"
                    min={MIN_WITHDRAW_AMOUNT}
                    max={MAX_WITHDRAW_AMOUNT}
                    value={formData.amount}
                    onChange={handleInputChange}
                    placeholder="Enter amount in USD"
                    className={`pr-20 ${errors.amount ? 'border-binance-red' : ''}`}
                    disabled={isSubmitting}
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                    <span className="text-binance-textTertiary text-sm">USD</span>
                  </div>
                </div>
                {errors.amount && (
                  <p className="mt-1 text-sm text-binance-red">{errors.amount}</p>
                )}
                <p className="mt-1 text-sm text-binance-textTertiary">
                  Minimum: ${MIN_WITHDRAW_AMOUNT} | Maximum: ${MAX_WITHDRAW_AMOUNT} | Available: {formatCurrency(usdBalance, 'USD')}
                </p>
              </div>

              {/* Binance Address Input */}
              <div>
                <label htmlFor="binanceAddress" className="block text-sm font-medium text-binance-textSecondary mb-2">
                  Binance Wallet Address *
                </label>
                <Input
                  id="binanceAddress"
                  name="binanceAddress"
                  type="text"
                  value={formData.binanceAddress}
                  onChange={handleInputChange}
                  placeholder="Enter your Binance wallet address"
                  className={errors.binanceAddress ? 'border-binance-red' : ''}
                  disabled={isSubmitting}
                />
                {errors.binanceAddress && (
                  <p className="mt-1 text-sm text-binance-red">{errors.binanceAddress}</p>
                )}
                <p className="mt-1 text-sm text-binance-textTertiary">
                  Enter your Binance wallet address where you want to receive the funds
                </p>
              </div>

              {/* Submit Button */}
              <div className="flex space-x-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  className="flex-1"
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-binance-red hover:bg-binance-red/80"
                  disabled={isSubmitting || !formData.amount || !formData.binanceAddress || !!errors.amount || !!errors.binanceAddress}
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Submitting...
                    </>
                  ) : (
                    'Submit Withdrawal Request'
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Withdrawal History */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg text-binance-textPrimary">Withdrawal History</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingWithdrawals ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-binance-primary mx-auto mb-2"></div>
                <p className="text-binance-textSecondary">Loading withdrawals...</p>
              </div>
            ) : withdrawals.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-binance-textTertiary">No withdrawal requests yet.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {withdrawals.map((withdrawal) => (
                  <div key={withdrawal.id} className="border border-binance-border rounded-lg p-4 bg-binance-surface/50">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-medium text-binance-textPrimary">
                          {formatCurrency(withdrawal.amount, 'USD')}
                        </p>
                        <p className="text-sm text-binance-textSecondary">
                          {new Date(withdrawal.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(withdrawal.status)}`}>
                        {getStatusText(withdrawal.status)}
                      </span>
                    </div>
                    <div className="text-sm text-binance-textSecondary">
                      <p><strong>Binance Address:</strong> {withdrawal.binanceAddress}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Information Card */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg text-binance-textPrimary">Important Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <span className="text-2xl">⏱️</span>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-binance-textPrimary">Processing Time</h3>
                  <p className="text-sm text-binance-textSecondary">Withdrawals are typically processed within 24 hours after admin review.</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <span className="text-2xl">💰</span>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-binance-textPrimary">Balance Deduction</h3>
                  <p className="text-sm text-binance-textSecondary">The withdrawal amount is deducted immediately when you submit the request.</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <span className="text-2xl">🔄</span>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-binance-textPrimary">Refunds</h3>
                  <p className="text-sm text-binance-textSecondary">If your withdrawal is rejected, the amount will be automatically refunded to your balance.</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Toast Container */}
        <ToastContainer toasts={toasts} removeToast={removeToast} />
      </div>
    </Layout>
  );
}

export default function WithdrawPage() {
  return <WithdrawPageContent />;
}