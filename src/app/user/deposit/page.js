'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../lib/auth-context';
import { useUniversal } from '../../../lib/universal-context';
// Removed complex session logic - using simple authentication
import Layout from '../../../components/Layout';
import Card, { CardContent, CardHeader, CardTitle } from '../../../components/Card';
import Button from '../../../components/Button';
import Input from '../../../components/Input';
import { useToast, ToastContainer } from '../../../components/Toast';

function DepositPageContent() {
  const { user, loading, isAuthenticated } = useAuth();
  const { usdBalance, bnxBalance, bnxPrice, formatCurrency, formatBnx } = useUniversal();
  const router = useRouter();
  const { success, error, toasts, removeToast } = useToast();
  const [mounted, setMounted] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    amount: '',
    currency: 'USD',
    screenshot: null
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [binanceAddress, setBinanceAddress] = useState('');
  const [exchangeRates, setExchangeRates] = useState({});
  const [convertedAmount, setConvertedAmount] = useState(0);

  // Validation rules
  const MIN_AMOUNT = 10;
  const MAX_AMOUNT = 10000;

  // Currency options
  const CURRENCIES = [
    { code: 'USD', name: 'US Dollar', symbol: '$' },
    { code: 'PKR', name: 'Pakistani Rupee', symbol: '₨' },
    { code: 'EUR', name: 'Euro', symbol: '€' },
    { code: 'GBP', name: 'British Pound', symbol: '£' },
    { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
    { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
    { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
    { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
    { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' },
    { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ' }
  ];

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !loading) {
      if (!isAuthenticated) {
        router.push('/auth/signin');
      } else {
        loadBinanceAddress();
        loadExchangeRates();
      }
    }
  }, [mounted, loading, isAuthenticated, router]);

  // Load exchange rates
  const loadExchangeRates = async () => {
    try {
      // For demo purposes, using static rates. In production, use a real API like exchangerate-api.com
      const rates = {
        USD: 1,
        PKR: 280,
        EUR: 0.85,
        GBP: 0.73,
        CAD: 1.35,
        AUD: 1.48,
        JPY: 110,
        INR: 83,
        CNY: 7.2,
        AED: 3.67
      };
      setExchangeRates(rates);
    } catch (err) {
      console.error('Error loading exchange rates:', err);
    }
  };

  const loadBinanceAddress = async () => {
    try {
      const response = await fetch('/api/system/binance-address');
      if (response.ok) {
        const data = await response.json();
        setBinanceAddress(data.address || 'TX7k8t9w2ZkDh8mA1pQw6yLbNvF3gHjK9mP2qR5sT8uV1wX4yZ7aBcEfGhJkLmNoPqRsTuVwXyZ');
      }
    } catch (err) {
      console.error('Error loading Binance address:', err);
      // Use fallback address
      setBinanceAddress('TX7k8t9w2ZkDh8mA1pQw6yLbNvF3gHjK9mP2qR5sT8uV1wX4yZ7aBcEfGhJkLmNoPqRsTuVwXyZ');
    }
  };

  // Copy Binance address to clipboard
  const copyBinanceAddress = async () => {
    try {
      await navigator.clipboard.writeText(binanceAddress);
      success('✅ Deposit address copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy address:', err);
      error('❌ Failed to copy address. Please copy manually.');
    }
  };

  // Convert amount to USD
  const convertToUSD = (amount, fromCurrency) => {
    if (!amount || !exchangeRates[fromCurrency]) return 0;
    return (parseFloat(amount) / exchangeRates[fromCurrency]).toFixed(2);
  };

  // Handle currency change
  const handleCurrencyChange = (e) => {
    const newCurrency = e.target.value;
    setFormData(prev => ({
      ...prev,
      currency: newCurrency
    }));
    
    // Recalculate USD amount if amount is entered
    if (formData.amount) {
      const usdAmount = convertToUSD(formData.amount, newCurrency);
      setConvertedAmount(parseFloat(usdAmount));
    }
  };

  // Handle amount change
  const handleAmountChange = (e) => {
    const amount = e.target.value;
    setFormData(prev => ({
      ...prev,
      amount
    }));
    
    // Convert to USD
    if (amount) {
      const usdAmount = convertToUSD(amount, formData.currency);
      setConvertedAmount(parseFloat(usdAmount));
    } else {
      setConvertedAmount(0);
    }
  };

  // Handle input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Handle amount field with currency conversion
    if (name === 'amount') {
      handleAmountChange(e);
      return;
    }
    
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

  // Handle file upload
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
      if (!allowedTypes.includes(file.type)) {
        setErrors(prev => ({
          ...prev,
          screenshot: 'Only JPG, JPEG, and PNG files are allowed'
        }));
        return;
      }

      // Validate file size (5MB max)
      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        setErrors(prev => ({
          ...prev,
          screenshot: 'File size must be less than 5MB'
        }));
        return;
      }

      setFormData(prev => ({
        ...prev,
        screenshot: file
      }));

      // Clear error
      if (errors.screenshot) {
        setErrors(prev => ({
          ...prev,
          screenshot: ''
        }));
      }
    }
  };

  // Validate form - SIMPLIFIED
  const validateForm = () => {
    const newErrors = {};
    
    // Amount validation
    if (!formData.amount || formData.amount.trim() === '') {
      newErrors.amount = 'Amount is required';
    } else {
      const usdAmount = convertedAmount || parseFloat(formData.amount);
      
      if (isNaN(usdAmount) || usdAmount <= 0) {
        newErrors.amount = 'Please enter a valid amount';
      } else if (usdAmount < MIN_AMOUNT) {
        newErrors.amount = `Minimum deposit amount is $${MIN_AMOUNT} USD`;
      } else if (usdAmount > MAX_AMOUNT) {
        newErrors.amount = `Maximum deposit amount is $${MAX_AMOUNT} USD`;
      }
    }

    // Screenshot validation
    if (!formData.screenshot) {
      newErrors.screenshot = 'Screenshot is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission - SIMPLIFIED APPROACH
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    console.log('🚀 Form submission started');
    console.log('👤 User:', user ? { email: user.email, id: user.id } : 'No user');
    
    // Validate form first
    if (!validateForm()) {
      console.log('❌ Form validation failed');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const formDataToSend = new FormData();
      const usdAmount = convertedAmount || parseFloat(formData.amount);
      formDataToSend.append('amount', usdAmount.toString());
      formDataToSend.append('screenshot', formData.screenshot);

      console.log('📤 Submitting deposit request...', {
        amount: usdAmount,
        user: user?.email,
        hasScreenshot: !!formData.screenshot
      });

      const response = await fetch('/api/deposit', {
        method: 'POST',
        body: formDataToSend
      });

      console.log('📥 Response received:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });

      let data;
      try {
        const responseText = await response.text();
        console.log('📄 Raw response:', responseText);
        
        if (responseText && responseText.trim() !== '') {
          data = JSON.parse(responseText);
        } else {
          console.warn('⚠️ Empty response from server');
          data = { success: false, error: 'Empty response from server' };
        }
      } catch (parseError) {
        console.error('❌ Failed to parse response:', parseError);
        data = { success: false, error: 'Invalid response format' };
      }

      console.log('📊 Parsed response data:', data);

      if (response.ok) {
        success('Deposit request submitted successfully. Waiting for admin confirmation.');
        
        // Reset form
        setFormData({ amount: '', currency: 'USD', screenshot: null });
        setConvertedAmount(0);
        const fileInput = document.getElementById('screenshot');
        if (fileInput) fileInput.value = '';
      } else {
        console.error('❌ Deposit request failed:', data);
        
        if (response.status === 401) {
          error('Authentication required. Please log in again.');
          setTimeout(() => {
            router.push('/auth/signin');
          }, 2000);
        } else {
          error(data.error || 'Failed to submit deposit request');
        }
      }
    } catch (err) {
      console.error('❌ Error submitting deposit request:', err);
      error('Failed to submit deposit request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!mounted || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <Layout showSidebar={true}>
      <div className="max-w-6xl mx-auto">
        {/* Binance-style Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={() => router.back()}
                className="text-binance-textSecondary hover:text-binance-textPrimary"
                style={{color: '#B7BDC6'}}
              >
                ← Back
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-binance-textPrimary" style={{color: '#EAECEF'}}>Deposit</h1>
                <p className="text-binance-textSecondary" style={{color: '#B7BDC6'}}>Add funds to your account</p>
              </div>
            </div>
            <div className="flex items-center space-x-4 text-sm">
              <div className="text-center">
                <div className="text-binance-textPrimary font-semibold" style={{color: '#EAECEF'}}>
                  {formatCurrency(usdBalance, 'USD')}
                </div>
                <div className="text-binance-textSecondary text-xs" style={{color: '#B7BDC6'}}>USD Balance</div>
              </div>
              <div className="text-center">
                <div className="text-binance-primary font-semibold" style={{color: '#F0B90B'}}>
                  {formatBnx(bnxBalance)} BNX
                </div>
                <div className="text-binance-textSecondary text-xs" style={{color: '#B7BDC6'}}>BNX Balance</div>
              </div>
            </div>
          </div>
        </div>

        {/* Binance-style Deposit Methods */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Bank Transfer Method */}
          <Card className="border-2 border-binance-primary/20" style={{borderColor: 'rgba(240, 185, 11, 0.2)'}}>
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-binance-primary rounded-lg flex items-center justify-center" style={{backgroundColor: '#F0B90B'}}>
                  <span className="text-binance-background font-bold" style={{color: '#1E2329'}}>🏦</span>
                </div>
                <div>
                  <CardTitle className="text-lg text-binance-textPrimary" style={{color: '#EAECEF'}}>Bank Transfer</CardTitle>
                  <p className="text-sm text-binance-textSecondary" style={{color: '#B7BDC6'}}>Via Binance</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-binance-background p-4 rounded-lg border border-binance-border" style={{backgroundColor: '#1E2329', borderColor: '#3C4043'}}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-binance-textSecondary" style={{color: '#B7BDC6'}}>Deposit Address:</span>
                    <Button
                      size="sm"
                      onClick={copyBinanceAddress}
                      className="bg-binance-primary text-binance-background hover:bg-binance-primary/90"
                      style={{backgroundColor: '#F0B90B', color: '#1E2329'}}
                    >
                      Copy
                    </Button>
                  </div>
                  <code className="text-xs text-binance-textPrimary break-all" style={{color: '#EAECEF'}}>
                    {binanceAddress}
                  </code>
                </div>
                <div className="text-xs text-binance-textTertiary" style={{color: '#848E9C'}}>
                  Send funds to this address and submit proof below
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg text-binance-textPrimary" style={{color: '#EAECEF'}}>Deposit Limits</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-binance-textSecondary" style={{color: '#B7BDC6'}}>Minimum:</span>
                  <span className="text-sm text-binance-textPrimary font-semibold" style={{color: '#EAECEF'}}>${MIN_AMOUNT} USD</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-binance-textSecondary" style={{color: '#B7BDC6'}}>Maximum:</span>
                  <span className="text-sm text-binance-textPrimary font-semibold" style={{color: '#EAECEF'}}>${MAX_AMOUNT} USD</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-binance-textSecondary" style={{color: '#B7BDC6'}}>Processing:</span>
                  <span className="text-sm text-binance-green font-semibold" style={{color: '#0ECB81'}}>24 hours</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Deposit Form */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg text-binance-textPrimary" style={{color: '#EAECEF'}}>Submit Deposit Request</CardTitle>
            <p className="text-sm text-binance-textSecondary" style={{color: '#B7BDC6'}}>
              Complete the form below to request a deposit
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Currency Selection */}
              <div>
                <label htmlFor="currency" className="block text-sm font-medium text-binance-textSecondary mb-2" style={{color: '#B7BDC6'}}>
                  Select Currency *
                </label>
                <select
                  id="currency"
                  name="currency"
                  value={formData.currency}
                  onChange={handleCurrencyChange}
                  className="w-full px-4 py-3 bg-binance-background border border-binance-border rounded-lg focus:outline-none focus:ring-2 focus:ring-binance-primary text-binance-textPrimary"
                  style={{backgroundColor: '#1E2329', borderColor: '#3C4043', color: '#EAECEF'}}
                  disabled={isSubmitting}
                >
                  {CURRENCIES.map(currency => (
                    <option key={currency.code} value={currency.code}>
                      {currency.symbol} {currency.name} ({currency.code})
                    </option>
                  ))}
                </select>
              </div>

              {/* Amount Input */}
              <div>
                <label htmlFor="amount" className="block text-sm font-medium text-binance-textSecondary mb-2" style={{color: '#B7BDC6'}}>
                  Amount in {formData.currency} *
                </label>
                <div className="relative">
                  <input
                    id="amount"
                    name="amount"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.amount}
                    onChange={handleInputChange}
                    placeholder={`Enter amount in ${formData.currency}`}
                    className={`w-full px-4 py-3 bg-binance-background border border-binance-border rounded-lg focus:outline-none focus:ring-2 focus:ring-binance-primary text-binance-textPrimary placeholder-binance-textTertiary pr-20 ${
                      errors.amount ? 'border-binance-red' : ''
                    }`}
                    style={{
                      backgroundColor: '#1E2329',
                      borderColor: errors.amount ? '#F6465D' : '#3C4043',
                      color: '#EAECEF'
                    }}
                    disabled={isSubmitting}
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                    <span className="text-binance-textSecondary text-sm" style={{color: '#B7BDC6'}}>{formData.currency}</span>
                  </div>
                </div>
                {errors.amount && (
                  <p className="mt-1 text-sm text-binance-red" style={{color: '#F6465D'}}>{errors.amount}</p>
                )}
                
                {/* USD Conversion Display */}
                {formData.amount && convertedAmount > 0 && (
                  <div className="mt-3 p-3 bg-binance-green/10 border border-binance-green/30 rounded-lg" style={{backgroundColor: 'rgba(14, 203, 129, 0.1)', borderColor: 'rgba(14, 203, 129, 0.3)'}}>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-binance-textPrimary font-semibold" style={{color: '#EAECEF'}}>
                        USD Equivalent: ${convertedAmount.toFixed(2)}
                      </span>
                      <span className="text-xs text-binance-textSecondary" style={{color: '#B7BDC6'}}>
                        Rate: 1 {formData.currency} = ${(1 / exchangeRates[formData.currency]).toFixed(4)} USD
                      </span>
                    </div>
                  </div>
                )}
                
                <p className="mt-2 text-sm text-binance-textTertiary" style={{color: '#848E9C'}}>
                  Minimum: ${MIN_AMOUNT} USD | Maximum: ${MAX_AMOUNT} USD
                </p>
              </div>

              {/* Screenshot Upload */}
              <div>
                <label htmlFor="screenshot" className="block text-sm font-medium text-binance-textSecondary mb-2" style={{color: '#B7BDC6'}}>
                  Transaction Screenshot *
                </label>
                <div className="border-2 border-dashed border-binance-border rounded-lg p-6 text-center hover:border-binance-primary transition-colors" style={{borderColor: '#3C4043'}}>
                  <input
                    id="screenshot"
                    name="screenshot"
                    type="file"
                    accept="image/jpeg,image/jpg,image/png"
                    onChange={handleFileChange}
                    className="hidden"
                    disabled={isSubmitting}
                  />
                  <label htmlFor="screenshot" className="cursor-pointer">
                    <div className="text-binance-textSecondary mb-2" style={{color: '#B7BDC6'}}>
                      📁 Click to upload or drag and drop
                    </div>
                    <div className="text-xs text-binance-textTertiary" style={{color: '#848E9C'}}>
                      JPG, PNG up to 5MB
                    </div>
                  </label>
                </div>
                {errors.screenshot && (
                  <p className="mt-1 text-sm text-binance-red" style={{color: '#F6465D'}}>{errors.screenshot}</p>
                )}
                {formData.screenshot && (
                  <div className="mt-2 text-sm text-binance-green" style={{color: '#0ECB81'}}>
                    ✓ {formData.screenshot.name} selected
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <div className="flex space-x-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  className="flex-1 border-binance-border text-binance-textSecondary hover:bg-binance-surfaceHover"
                  style={{borderColor: '#3C4043', color: '#B7BDC6'}}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-binance-green hover:bg-binance-green/90 text-white"
                  style={{backgroundColor: '#0ECB81'}}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Submitting...
                    </div>
                  ) : (
                    'Submit Deposit Request'
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Information Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg text-binance-textPrimary" style={{color: '#EAECEF'}}>Important Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-binance-primary/20 rounded-lg flex items-center justify-center" style={{backgroundColor: 'rgba(240, 185, 11, 0.2)'}}>
                    <span className="text-binance-primary text-lg" style={{color: '#F0B90B'}}>⏱️</span>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-binance-textPrimary mb-1" style={{color: '#EAECEF'}}>Processing Time</h3>
                  <p className="text-xs text-binance-textSecondary" style={{color: '#B7BDC6'}}>
                    Deposits are typically processed within 24 hours after admin review.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-binance-green/20 rounded-lg flex items-center justify-center" style={{backgroundColor: 'rgba(14, 203, 129, 0.2)'}}>
                    <span className="text-binance-green text-lg" style={{color: '#0ECB81'}}>🔒</span>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-binance-textPrimary mb-1" style={{color: '#EAECEF'}}>Security</h3>
                  <p className="text-xs text-binance-textSecondary" style={{color: '#B7BDC6'}}>
                    All transactions are verified by our admin team for security.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-binance-primary/20 rounded-lg flex items-center justify-center" style={{backgroundColor: 'rgba(240, 185, 11, 0.2)'}}>
                    <span className="text-binance-primary text-lg" style={{color: '#F0B90B'}}>📞</span>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-binance-textPrimary mb-1" style={{color: '#EAECEF'}}>Support</h3>
                  <p className="text-xs text-binance-textSecondary" style={{color: '#B7BDC6'}}>
                    Contact support if you have any questions about your deposit.
                  </p>
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

export default function DepositPage() {
  return <DepositPageContent />;
}
