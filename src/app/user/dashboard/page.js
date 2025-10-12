'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../lib/auth-context';
import { useUniversal } from '../../../lib/universal-context';
import { useInvestments } from '../../../hooks/useInvestments';
import Layout from '../../../components/Layout';
import Card, { CardContent, CardHeader, CardTitle } from '../../../components/Card';
import Button from '../../../components/Button';
import WalletOverview from '../../../components/WalletOverview';
import PriceChart from '../../../components/PriceChart';
import LoadingSkeleton from '../../../components/LoadingSkeleton';
import ErrorBoundary from '../../../components/ErrorBoundary';
import SafeLoader from '../../../components/SafeLoader';
import { useLoadingManager } from '../../../hooks/useLoadingManager';
import { ToastContainer, useToast } from '../../../components/Toast';

function UserDashboardContent() {
  const { user, loading, isAuthenticated } = useAuth();
  const { 
    usdBalance, 
    bnxBalance, 
    bnxPrice, 
    formatCurrency, 
    formatBnx, 
    buyBnx, 
    sellBnx,
    isLoading: dashboardLoading
  } = useUniversal();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [isOAuthCallback, setIsOAuthCallback] = useState(false);
  const [showStakeConfirm, setShowStakeConfirm] = useState(false);
  const [pendingStake, setPendingStake] = useState(null);
  const { investments: userInvestments, loading: loadingInvestments, error: investmentsError } = useInvestments();
  
  // Safe loading management
  const { isLoading: safeLoading, forceStop } = useLoadingManager(loading || dashboardLoading, 5000);
  const { success, error, toasts, removeToast } = useToast();

  // BNX trading state - only for BNX tokens
  const [tradeType, setTradeType] = useState('buy');
  const [tradeAmount, setTradeAmount] = useState('');
  const [isTrading, setIsTrading] = useState(false);

  // Calculate total value using BNX price
  const totalValue = parseFloat(tradeAmount) * bnxPrice || 0;


  // Handle BNX trade execution with API-based price calculation
  const handleTrade = async () => {
    if (!tradeAmount || parseFloat(tradeAmount) <= 0) return;

    setIsTrading(true);
    try {
      const amountValue = parseFloat(tradeAmount);
      
      if (tradeType === 'buy') {
        // BUYING BNX TOKENS LOGIC
        // Check if user has sufficient USD balance
        if (amountValue > usdBalance) {
          alert(`Insufficient USD balance. Available: ${formatCurrency(usdBalance, 'USD')}`);
          return;
        }
        
        // Use the new API-based buy function
        const result = await buyBnx(amountValue);
        
        if (result.success) {
          success(`Successfully bought ${formatBnx(result.tokensBought)} BNX tokens!`);
        } else {
          error(`Buy failed: ${result.error}`);
        }
        
      } else {
        // SELLING BNX TOKENS LOGIC
        // Check if user has sufficient BNX balance
        if (amountValue > bnxBalance) {
          alert(`Insufficient BNX balance. Available: ${formatBnx(bnxBalance)} BNX`);
          return;
        }
        
        // Use the new API-based sell function
        const result = await sellBnx(amountValue);
        
        if (result.success) {
          success(`Successfully sold ${formatBnx(amountValue)} BNX tokens for ${formatCurrency(result.usdReceived, 'USD')}!`);
        } else {
          error(`Sell failed: ${result.error}`);
        }
      }
      
      // Reset form after successful trade
      setTradeAmount('');
    } catch (error) {
      console.error('Trade error:', error);
      alert('Trade failed. Please try again.');
    } finally {
      setIsTrading(false);
    }
  };

  // Handle quick stake functionality
  const handleQuickStake = async (amount, durationDays) => {
    // Validate balance
    if (bnxBalance < amount) {
      error(`Insufficient BNX balance. Available: ${formatBnx(bnxBalance)}`);
      return;
    }

    // Calculate reward details
    const rewardPercentages = { 7: 2, 30: 10, 90: 25 };
    const rewardPercent = rewardPercentages[durationDays];
    const rewardAmount = (amount * rewardPercent) / 100;
    
    // Set pending stake and show confirmation modal
    setPendingStake({
      amount,
      durationDays,
      rewardPercent,
      rewardAmount,
      totalReturn: amount + rewardAmount
    });
    setShowStakeConfirm(true);
  };

  // Confirm staking
  const confirmStaking = async () => {
    if (!pendingStake) return;

    try {
      const { amount, durationDays } = pendingStake;

      // Create staking
      const response = await fetch('/api/stake', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: amount,
          durationDays: durationDays
        })
      });

      const data = await response.json();

      if (response.ok) {
        success(`🎉 Staking started successfully! You staked ${formatBnx(amount)} BNX for ${durationDays} days. Earn ${formatBnx(pendingStake.rewardAmount)} BNX reward!`);
        // Refresh dashboard stats
        fetchDashboardStats();
      } else {
        console.error('Staking API error:', data);
        error(`Staking failed: ${data.error}${data.details ? ` (${data.details})` : ''}`);
      }
    } catch (error) {
      console.error('Error starting quick stake:', error);
      error('Failed to start staking. Please try again.');
    } finally {
      setShowStakeConfirm(false);
      setPendingStake(null);
    }
  };

  // Cancel staking
  const cancelStaking = () => {
    setShowStakeConfirm(false);
    setPendingStake(null);
  };


  // Price updates are handled by the context when trades occur

  // ✅ Prevent hydration mismatches by only running client-side code after mount
  useEffect(() => {
    setMounted(true);
    console.log('Dashboard: Component mounted');
    
    // CRITICAL: Add timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      console.warn('Dashboard: Loading timeout reached - forcing render');
      setLoadingTimeout(true);
    }, 5000); // 5 second timeout
    
    // Use requestAnimationFrame to ensure DOM is ready
    const initializeDashboard = () => {
      // Check for OAuth success parameters in URL
      const urlParams = new URLSearchParams(window.location.search);
      const oauthSuccess = urlParams.get('oauth_success');
      const provider = urlParams.get('provider');
      const session = urlParams.get('session');
      const userEmail = urlParams.get('userEmail');
      const userName = urlParams.get('userName');
      const userId = urlParams.get('userId');
      const userPicture = urlParams.get('userPicture');

      if (oauthSuccess === 'true' && provider && userEmail) {
        console.log('Dashboard: OAuth success detected, storing session data');
        
        // Store OAuth session data
        const oauthData = {
          provider,
          session,
          timestamp: Date.now()
        };

        // Store user session data (role will be determined by server-side session handling)
        const userSessionData = {
          $id: userId,
          id: userId,
          email: userEmail,
          name: userName,
          picture: userPicture,
          provider: provider,
          emailVerified: true
        };

        // Store in localStorage (for client-side access)
        localStorage.setItem('oauthSession', JSON.stringify(oauthData));
        localStorage.setItem('userSession', JSON.stringify(userSessionData));
        
        // Also store in cookies for server-side access
        document.cookie = `userSession=${JSON.stringify(userSessionData)}; path=/; max-age=86400; SameSite=Lax`;
        document.cookie = `oauthSession=${JSON.stringify(oauthData)}; path=/; max-age=86400; SameSite=Lax`;

        console.log('Dashboard: OAuth session data stored', userSessionData);
        setIsOAuthCallback(true);

        // Clean up URL parameters
        window.history.replaceState({}, '', '/user/dashboard');
      } else {
        // Check if we have existing OAuth session data in localStorage
        const oauthSession = localStorage.getItem('oauthSession');
        const userSession = localStorage.getItem('userSession');
        
        if (oauthSession && userSession) {
          console.log('Dashboard: Found existing OAuth session data in localStorage');
          setIsOAuthCallback(true);
        }
      }

      // REMOVED: The problematic reload logic that was causing infinite loops
      // The auth context will handle user session loading properly
    };

    // Use requestAnimationFrame to ensure DOM is ready
    requestAnimationFrame(initializeDashboard);
  }, []);


  // ✅ Redirect to signin if not authenticated (only after component mounts)
  useEffect(() => {
    if (mounted && !loading && !isAuthenticated && !user) {
      console.log('Dashboard: User not authenticated, redirecting to signin');
      // Add a small delay to prevent race conditions on Vercel
      setTimeout(() => {
        router.push('/auth/signin?redirect=/user/dashboard');
      }, 100);
    }
  }, [mounted, loading, isAuthenticated, user, router]);

  // CRITICAL: Add timeout cleanup
  useEffect(() => {
    return () => {
      // Cleanup timeout on unmount
      const timeoutId = setTimeout(() => {}, 0);
      clearTimeout(timeoutId);
    };
  }, []);

  // ✅ SIMPLIFIED LOADING LOGIC - No more infinite loading!
  if (!mounted) {
    return (
      <Layout showSidebar={true}>
        <SafeLoader isLoading={true} text="Loading dashboard..." timeout={3000}>
          <div>Dashboard content will load here...</div>
        </SafeLoader>
      </Layout>
    );
  }

  // Show loading with timeout protection
  if (safeLoading) {
    return (
      <Layout showSidebar={true}>
        <SafeLoader 
          isLoading={true} 
          text={loading ? "Authenticating..." : "Loading dashboard data..."} 
          timeout={5000}
        >
          <div>Dashboard content will load here...</div>
        </SafeLoader>
      </Layout>
    );
  }

  // Redirect if not authenticated
  if (!isAuthenticated && !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Redirecting to sign in...</p>
        </div>
      </div>
    );
  }

  // ✅ Show dashboard content if authenticated
  return (
    <Layout showSidebar={true}>
      <div className="min-h-screen bg-gray-50">
        {/* Mobile Header */}
        <div className="bg-white shadow-sm border-b lg:hidden">
          <div className="px-4 py-3">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-lg font-bold text-gray-900">Dashboard</h1>
                <p className="text-xs text-gray-600">Welcome back, {user?.name || user?.email || 'User'}!</p>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-blue-600">
                    {user?.name?.charAt(0) || 'U'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Desktop Header */}
        <div className="bg-white shadow-sm border-b hidden lg:block">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
                <p className="text-gray-600">Welcome back, {user?.name || user?.email || 'User'}!</p>
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                 
                 
                </div>
                
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Main Content - No Scroll Layout */}
        <div className="lg:hidden min-h-screen bg-gray-50 flex flex-col">
          {/* Mobile Quick Actions */}
          <div className="bg-white border-b">
            <div className="px-4 py-4">
              <div className="grid grid-cols-2 gap-3">
                <Button 
                  className="w-full bg-green-600 hover:bg-green-700 text-white py-4 px-4 rounded-lg font-medium flex items-center justify-center space-x-2"
                  onClick={() => router.push('/user/deposit')}
                >
                  <span className="text-xl">💰</span>
                  <span>Deposit</span>
                </Button>
                <Button 
                  className="w-full bg-red-600 hover:bg-red-700 text-white py-4 px-4 rounded-lg font-medium flex items-center justify-center space-x-2"
                  onClick={() => router.push('/user/withdraw')}
                >
                  <span className="text-xl">💸</span>
                  <span>Withdraw</span>
                </Button>
              </div>
            </div>
          </div>

          {/* Mobile Stats Overview */}
          <div className="bg-white border-b">
            <div className="px-4 py-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-blue-50 p-3 rounded-lg text-center">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                  </div>
                  <p className="text-xs font-medium text-gray-600 mb-1">Total Balance</p>
                  <p className="text-sm font-bold text-gray-900">{formatCurrency(usdBalance, 'USD')}</p>
                </div>

                <div className="bg-yellow-50 p-3 rounded-lg text-center">
                  <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                  </div>
                  <p className="text-xs font-medium text-gray-600 mb-1">Total Coins</p>
                  <p className="text-sm font-bold text-gray-900">{formatBnx(bnxBalance)} BNX</p>
                </div>

                {/* Mobile Quick Stake Widget */}
                <div className="bg-purple-50 p-3 rounded-lg text-center col-span-2">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="text-lg">🏦</span>
                  </div>
                  <p className="text-xs font-medium text-gray-600 mb-2">Quick Stake</p>
                  <div className="grid grid-cols-3 gap-1">
                    <button
                      onClick={() => handleQuickStake(100, 7)}
                      className="p-1 text-xs bg-blue-50 hover:bg-blue-100 rounded text-blue-700 font-medium"
                      disabled={bnxBalance < 100}
                    >
                      7d (2%)
                    </button>
                    <button
                      onClick={() => handleQuickStake(500, 30)}
                      className="p-1 text-xs bg-green-50 hover:bg-green-100 rounded text-green-700 font-medium"
                      disabled={bnxBalance < 500}
                    >
                      30d (10%)
                    </button>
                    <button
                      onClick={() => handleQuickStake(1000, 90)}
                      className="p-1 text-xs bg-purple-50 hover:bg-purple-100 rounded text-purple-700 font-medium"
                      disabled={bnxBalance < 1000}
                    >
                      90d (25%)
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile Quick Trade */}
          <div className="bg-white border-b flex-1">
            <div className="px-4 py-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">BNX Quick Trade</h3>
              <div className="space-y-4">
                {/* Buy/Sell Toggle */}
                <div className="flex bg-gray-100 rounded-lg p-1">
                  <button 
                    className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-all duration-200 ${
                      tradeType === 'buy' 
                        ? 'bg-white text-gray-900 shadow-sm' 
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                    onClick={() => setTradeType('buy')}
                  >
                    Buy
                  </button>
                  <button 
                    className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-all duration-200 ${
                      tradeType === 'sell' 
                        ? 'bg-white text-gray-900 shadow-sm' 
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                    onClick={() => setTradeType('sell')}
                  >
                    Sell
                  </button>
                </div>

                {/* BNX Token Display */}
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600 mb-2">BNX</div>
                  <div className="text-sm text-gray-600">BNX Token</div>
                </div>

                {/* Amount Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {tradeType === 'buy' ? 'USD Amount to Spend' : 'BNX Tokens to Sell'}
                  </label>
                  <input
                    type="number"
                    placeholder={tradeType === 'buy' ? 'Enter USD amount' : 'Enter Tiki amount'}
                    value={tradeAmount}
                    onChange={(e) => setTradeAmount(e.target.value)}
                    step="0.0001"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {tradeType === 'buy' && tradeAmount && (
                    <p className="text-xs text-gray-500 mt-1">
                      You will receive: {formatBnx(parseFloat(tradeAmount) / bnxPrice)} BNX
                    </p>
                  )}
                  {tradeType === 'sell' && tradeAmount && (
                    <p className="text-xs text-gray-500 mt-1">
                      You will receive: {formatCurrency(parseFloat(tradeAmount) * bnxPrice, 'USD')}
                    </p>
                  )}
                </div>

                {/* Trade Button */}
                <Button 
                  className={`w-full ${
                    tradeType === 'buy' 
                      ? 'bg-green-600 hover:bg-green-700' 
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                  onClick={handleTrade}
                  disabled={!tradeAmount || parseFloat(tradeAmount) <= 0 || isTrading}
                >
                  {isTrading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Processing...
                    </div>
                  ) : (
                    `${tradeType === 'buy' ? 'Buy' : 'Sell'} BNX Tokens`
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Desktop Layout */}
        <div className="hidden lg:block">
          {/* Desktop Main Content */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Stats Overview */}
            <div className="grid grid-cols-2 lg:grid-cols-2 gap-3 lg:gap-6 mb-6 lg:mb-8">
            <Card className="hover:shadow-lg transition-shadow duration-200 cursor-pointer">
                <CardContent className="p-3 lg:p-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 lg:space-x-4">
                      <div className="w-8 h-8 lg:w-12 lg:h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                        <svg className="w-4 h-4 lg:w-6 lg:h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                      </svg>
                    </div>
                    <div>
                        <p className="text-xs lg:text-sm font-medium text-gray-500 mb-1">Balance</p>
                        <p className="text-lg lg:text-2xl font-bold text-gray-900">{formatCurrency(usdBalance, 'USD')}</p>
                    </div>
                </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow duration-200 cursor-pointer">
                <CardContent className="p-3 lg:p-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 lg:space-x-4">
                      <div className="w-8 h-8 lg:w-12 lg:h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                        <svg className="w-4 h-4 lg:w-6 lg:h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                      </svg>
                    </div>
                    <div>
                        <p className="text-xs lg:text-sm font-medium text-gray-500 mb-1">Total Coins</p>
                        <p className="text-lg lg:text-2xl font-bold text-gray-900">{formatBnx(bnxBalance)} BNX</p>
                    </div>
                </div>
                </div>
              </CardContent>
            </Card>

            {/* BNX Quick Stake Widget */}
            <Card className="hover:shadow-lg transition-shadow duration-200">
              <CardContent className="p-3 lg:p-6">
                <div className="space-y-4">
                  <div className="flex items-center space-x-2 lg:space-x-4">
                    <div className="w-8 h-8 lg:w-12 lg:h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                      <span className="text-lg lg:text-2xl">🏦</span>
                    </div>
                    <div>
                      <p className="text-xs lg:text-sm font-medium text-gray-500 mb-1">Quick Stake</p>
                      <p className="text-lg lg:text-2xl font-bold text-gray-900">Earn Rewards</p>
                    </div>
                  </div>
                  
                  {/* Quick Stake Options */}
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => handleQuickStake(100, 7)}
                      className="p-2 text-xs bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors text-blue-700 font-medium"
                      disabled={bnxBalance < 100}
                    >
                      7d (2%)
                    </button>
                    <button
                      onClick={() => handleQuickStake(500, 30)}
                      className="p-2 text-xs bg-green-50 hover:bg-green-100 rounded-lg transition-colors text-green-700 font-medium"
                      disabled={bnxBalance < 500}
                    >
                      30d (10%)
                    </button>
                    <button
                      onClick={() => handleQuickStake(1000, 90)}
                      className="p-2 text-xs bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors text-purple-700 font-medium"
                      disabled={bnxBalance < 1000}
                    >
                      90d (25%)
                    </button>
                  </div>
                  
                  <div className="text-xs text-gray-500 text-center">
                    Stake BNX tokens to earn rewards
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-8">
            {/* Wallet Overview - Left Column */}
            <div className="lg:col-span-2 space-y-4 lg:space-y-8">
              {/* Wallet Overview */}
              <Card className="cursor-pointer">
                <CardHeader className="p-4 lg:p-6">
                  <CardTitle className="text-lg lg:text-xl">Wallet Overview</CardTitle>
                </CardHeader>
                <CardContent className="p-4 lg:p-6">
                  <WalletOverview />
                </CardContent>
              </Card>

              {/* Price Chart */}
              <Card className="cursor-pointer">
                <CardHeader className="p-4 lg:p-6">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg lg:text-xl">Price Chart</CardTitle>
                   
                  </div>
                </CardHeader>
                <CardContent className="p-4 lg:p-6">
                  <PriceChart />
                </CardContent>
              </Card>

              {/* Recent Transactions */}
              <Card className="cursor-pointer">
                <CardHeader className="p-4 lg:p-6">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg lg:text-xl">Recent BNX Transactions</CardTitle>
                    <Button variant="outline" size="sm" className="hidden sm:flex">
                      View All
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-4 lg:p-6">
                  <div className="space-y-3 lg:space-y-4">
                    {[
                      { type: 'buy', asset: 'BNX', amount: '1000', price: formatCurrency(bnxPrice, 'USD'), time: '2 min ago', status: 'completed' },
                      { type: 'sell', asset: 'BNX', amount: '500', price: formatCurrency(bnxPrice, 'USD'), time: '1 hour ago', status: 'completed' },
                      { type: 'buy', asset: 'BNX', amount: '2000', price: formatCurrency(bnxPrice, 'USD'), time: '3 hours ago', status: 'pending' },
                      { type: 'sell', asset: 'BNX', amount: '750', price: formatCurrency(bnxPrice, 'USD'), time: '1 day ago', status: 'completed' },
                    ].map((transaction, index) => (
                      <div key={index} className="flex items-center justify-between p-3 lg:p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                        <div className="flex items-center space-x-2 lg:space-x-3">
                          <div className={`w-6 h-6 lg:w-8 lg:h-8 rounded-full flex items-center justify-center ${
                            transaction.type === 'buy' ? 'bg-green-100' : 'bg-red-100'
                          }`}>
                            <span className={`text-xs lg:text-sm font-bold ${
                              transaction.type === 'buy' ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {transaction.type === 'buy' ? '+' : '-'}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm lg:text-base font-medium text-gray-900">{transaction.asset}</p>
                            <p className="text-xs lg:text-sm text-gray-500">{transaction.time}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm lg:text-base font-medium text-gray-900">{formatBnx(parseFloat(transaction.amount))} {transaction.asset}</p>
                          <p className="text-xs lg:text-sm text-gray-500">{transaction.price}</p>
                        </div>
                        <div className="ml-2 lg:ml-4">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            transaction.status === 'completed' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {transaction.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column */}
            <div className="space-y-4 lg:space-y-8">
                     {/* Buy/Sell Panel */}
                     <Card className="hover:shadow-lg transition-all duration-300 cursor-pointer">
                       <CardHeader className="p-4 sm:p-6">
                         <div className="flex items-center justify-between">
                           <CardTitle className="text-lg sm:text-xl">BNX Quick Trade</CardTitle>
                           <Button variant="ghost" size="sm" className="text-gray-500 hover:text-gray-700">
                             <span className="mr-2">⚡</span>
                             Live Tiki Price
                           </Button>
                         </div>
                       </CardHeader>
                       <CardContent className="p-4 sm:p-6">
                         <div className="space-y-4 sm:space-y-6">
                           {/* Buy/Sell Toggle */}
                           <div className="flex bg-gray-100 rounded-lg p-1">
                             <button 
                               className={`flex-1 py-2 cursor-pointer px-4 text-sm font-medium rounded-md transition-all duration-200 ${
                                 tradeType === 'buy' 
                                   ? 'bg-white text-gray-900 shadow-sm cursor-pointer' 
                                   : 'text-gray-500 hover:text-gray-700 cursor-pointer'
                               }`}
                               onClick={() => setTradeType('buy')}
                             >
                               Buy BNX
                             </button>
                             <button 
                               className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-all duration-200 ${
                                 tradeType === 'sell' 
                                   ? 'bg-white text-gray-900 shadow-sm cursor-pointer' 
                                   : 'text-gray-500 hover:text-gray-700 cursor-pointer'
                               }`}
                               onClick={() => setTradeType('sell')}
                             >
                               Sell Tiki
                             </button>
                           </div>

                           {/* BNX Token Display */}
                           <div className="text-center p-4 bg-blue-50 rounded-lg">
                             <div className="text-2xl font-bold text-blue-600 mb-2">BNX</div>
                             <div className="text-sm text-gray-600">BNX Token</div>
                           </div>

                           {/* Amount Input */}
                           <div>
                             <label className="block text-sm font-medium text-gray-700 mb-2">
                               {tradeType === 'buy' ? 'USD Amount to Spend' : 'BNX Tokens to Sell'}
                             </label>
                             <input
                               type="number"
                               placeholder={tradeType === 'buy' ? 'Enter USD amount' : 'Enter Tiki amount'}
                               value={tradeAmount}
                               onChange={(e) => setTradeAmount(e.target.value)}
                               step="0.0001"
                               className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                             />
                             {tradeType === 'buy' && tradeAmount && (
                               <p className="text-xs text-gray-500 mt-1">
                                 You will receive: {formatBnx(parseFloat(tradeAmount) / bnxPrice)} BNX
                               </p>
                             )}
                             {tradeType === 'sell' && tradeAmount && (
                               <p className="text-xs text-gray-500 mt-1">
                                 You will receive: {formatCurrency(parseFloat(tradeAmount) * bnxPrice, 'USD')}
                               </p>
                             )}
                           </div>

                           {/* Price Display */}
                           <div className="p-4 bg-gray-50 rounded-lg">
                             <div className="flex justify-between text-sm mb-2">
                               <span className="text-gray-500">Current Tiki Price:</span>
                               <span className="font-medium">{formatCurrency(bnxPrice, 'USD')}</span>
                             </div>
                             <div className="flex justify-between text-sm mb-2">
                               <span className="text-gray-500">Amount:</span>
                               <span className="font-medium">{tradeAmount || '0'} {tradeType === 'buy' ? 'USD' : 'BNX'}</span>
                             </div>
                             <div className="flex justify-between text-sm font-semibold">
                               <span className="text-gray-700">Total:</span>
                               <span className={`${tradeType === 'buy' ? 'text-green-600' : 'text-red-600'}`}>
                                 {formatCurrency(totalValue, 'USD')}
                               </span>
                             </div>
                           </div>

                           {/* Balance Check */}
                           {tradeType === 'sell' && parseFloat(tradeAmount) > 0 && (
                             <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                               <div className="flex items-center">
                                 <span className="text-yellow-600 mr-2">⚠️</span>
                                 <span className="text-sm text-yellow-800">
                                   Available: {formatBnx(bnxBalance)} BNX
                                 </span>
                               </div>
                             </div>
                           )}

                           {/* Trade Button */}
                           <Button 
                             className={`w-full ${
                               tradeType === 'buy' 
                                 ? 'bg-green-600 hover:bg-green-700' 
                                 : 'bg-red-600 hover:bg-red-700'
                             }`}
                             onClick={handleTrade}
                             disabled={!tradeAmount || parseFloat(tradeAmount) <= 0 || isTrading}
                           >
                             {isTrading ? (
                               <div className="flex items-center">
                                 <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                 Processing...
                               </div>
                             ) : (
                               `${tradeType === 'buy' ? 'Buy' : 'Sell'} BNX Tokens`
                             )}
                           </Button>

                           {/* Quick Amount Buttons */}
                           <div className="grid grid-cols-3 gap-2">
                             <Button 
                               variant="outline" 
                               size="sm"
                               onClick={() => setTradeAmount('0.1')}
                               className="text-xs"
                             >
                               0.1
                             </Button>
                             <Button 
                               variant="outline" 
                               size="sm"
                               onClick={() => setTradeAmount('0.5')}
                               className="text-xs"
                             >
                               0.5
                             </Button>
                             <Button 
                               variant="outline" 
                               size="sm"
                               onClick={() => setTradeAmount('1.0')}
                               className="text-xs"
                             >
                               1.0
                             </Button>
                           </div>
                         </div>
                       </CardContent>
                     </Card>

              {/* BNX Market Overview */}
              <Card className="cursor-pointer">
                <CardHeader>
                  <CardTitle>BNX Market Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[
                      { name: 'BNX Token', symbol: 'BNX', price: formatCurrency(bnxPrice, 'USD'), change: '+2.34%', changeType: 'positive' },
                    ].map((asset, index) => (
                      <div key={index} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg cursor-pointer">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-xs font-bold text-blue-600">{asset.symbol[0]}</span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{asset.name}</p>
                            <p className="text-sm text-gray-500">{asset.symbol}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-gray-900">{asset.price}</p>
                          <p className={`text-sm ${
                            asset.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {asset.change}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

             
            </div>
          </div>

          {/* Additional Sections */}
          <div className="mt-12 space-y-8">
            {/* Performance Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              
            </div>

            

            {/* Investment Plans Section */}
            <Card className="hover:shadow-lg transition-all duration-300">
              <CardHeader className="p-4 lg:p-6">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg lg:text-xl">Investment Plans</CardTitle>
                  <Button 
                    onClick={() => router.push('/user/investment-plans')}
                    className="bg-binance-primary hover:bg-binance-primary/90 text-white"
                  >
                    View All Plans
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-4 lg:p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg border border-blue-200">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-blue-800">Basic Plan</h3>
                      <span className="text-xs bg-blue-200 text-blue-800 px-2 py-1 rounded">5%</span>
                    </div>
                    <p className="text-sm text-blue-600 mb-2">$100 - $1,000</p>
                    <p className="text-xs text-blue-500">30 days duration</p>
                  </div>
                  
                  <div className="p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-lg border border-green-200">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-green-800">Silver Plan</h3>
                      <span className="text-xs bg-green-200 text-green-800 px-2 py-1 rounded">8%</span>
                    </div>
                    <p className="text-sm text-green-600 mb-2">$1,000 - $5,000</p>
                    <p className="text-xs text-green-500">60 days duration</p>
                  </div>
                  
                  <div className="p-4 bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-lg border border-yellow-200">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-yellow-800">Gold Plan</h3>
                      <span className="text-xs bg-yellow-200 text-yellow-800 px-2 py-1 rounded">12%</span>
                    </div>
                    <p className="text-sm text-yellow-600 mb-2">$5,000 - $25,000</p>
                    <p className="text-xs text-yellow-500">90 days duration</p>
                  </div>
                </div>
                <div className="mt-4 text-center">
                  <p className="text-sm text-gray-600">
                    Start investing and grow your wealth with our secure investment plans
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card className="hover:shadow-lg transition-all duration-300">
              <CardHeader className="p-4 lg:p-6">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg lg:text-xl">Quick Stats</CardTitle>
                  <Button variant="ghost" size="sm" className="text-gray-500 hover:text-gray-700 hidden sm:flex">
                    <span className="mr-2">📈</span>
                    View Analytics
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-4 lg:p-6">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6">
                  <div className="text-center p-3 lg:p-4 bg-blue-50 rounded-lg hover:shadow-md transition-shadow">
                    <div className="text-xl lg:text-2xl xl:text-3xl font-bold text-blue-600 mb-1 lg:mb-2">{quickStats.totalTrades}</div>
                    <div className="text-xs lg:text-sm text-gray-600">Total Trades</div>
                  </div>
                  <div className="text-center p-3 lg:p-4 bg-green-50 rounded-lg hover:shadow-md transition-shadow">
                    <div className="text-xl lg:text-2xl xl:text-3xl font-bold text-green-600 mb-1 lg:mb-2">{formatCurrency(quickStats.totalProfit, 'USD')}</div>
                    <div className="text-xs lg:text-sm text-gray-600">Total Profit</div>
                  </div>
                  <div className="text-center p-3 lg:p-4 bg-purple-50 rounded-lg hover:shadow-md transition-shadow">
                    <div className="text-xl lg:text-2xl xl:text-3xl font-bold text-purple-600 mb-1 lg:mb-2">{quickStats.activeOrders}</div>
                    <div className="text-xs lg:text-sm text-gray-600">Active Orders</div>
                  </div>
                  <div className="text-center p-3 lg:p-4 bg-orange-50 rounded-lg hover:shadow-md transition-shadow">
                    <div className="text-xl lg:text-2xl xl:text-3xl font-bold text-orange-600 mb-1 lg:mb-2">{quickStats.successRate}%</div>
                    <div className="text-xs lg:text-sm text-gray-600">Success Rate</div>
                </div>
              </div>
            </CardContent>
          </Card>

            {/* User Investments Section */}
            <Card className="hover:shadow-lg transition-all duration-300">
              <CardHeader className="p-4 lg:p-6">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg lg:text-xl">My Investments</CardTitle>
                  <Button 
                    onClick={() => router.push('/plans')}
                    className="bg-binance-primary hover:bg-binance-primary/90 text-white"
                  >
                    View All Plans
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-4 lg:p-6">
                {loadingInvestments ? (
                  <LoadingSkeleton type="list" count={2} />
                ) : investmentsError ? (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-4">⚠️</div>
                    <h3 className="text-lg font-semibold text-red-600 mb-2">Error Loading Investments</h3>
                    <p className="text-binance-textSecondary mb-4">{investmentsError}</p>
                    <Button
                      onClick={() => window.location.reload()}
                      className="bg-binance-primary hover:bg-binance-primary/90"
                    >
                      Try Again
                    </Button>
                  </div>
                ) : userInvestments.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-4">📈</div>
                    <h3 className="text-lg font-semibold text-binance-textPrimary mb-2">No Investments Yet</h3>
                    <p className="text-binance-textSecondary mb-4">Start investing to grow your wealth</p>
                    <Button
                      onClick={() => router.push('/plans')}
                      className="bg-binance-primary hover:bg-binance-primary/90"
                    >
                      Browse Investment Plans
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {userInvestments.slice(0, 3).map((investment) => (
                      <div key={investment.id} className="p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg border border-blue-200">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-semibold text-blue-800">{investment.plan.planName}</h4>
                          <span className={`text-xs px-2 py-1 rounded ${
                            investment.status === 'ACTIVE' 
                              ? 'bg-green-100 text-green-800' 
                              : investment.status === 'COMPLETED'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {investment.status}
                          </span>
                        </div>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span className="text-blue-600">Amount:</span>
                            <span className="font-semibold">{formatCurrency(investment.investedAmount)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-blue-600">Expected Return:</span>
                            <span className="font-semibold text-green-600">{formatCurrency(investment.expectedReturn)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-blue-600">Start Date:</span>
                            <span className="text-xs">{new Date(investment.startDate).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                    {userInvestments.length > 3 && (
                      <div className="p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border border-gray-200 flex items-center justify-center">
                        <div className="text-center">
                          <div className="text-2xl mb-2">+{userInvestments.length - 3}</div>
                          <p className="text-sm text-gray-600">More investments</p>
                          <Button
                            onClick={() => router.push('/plans')}
                            variant="outline"
                            size="sm"
                            className="mt-2"
                          >
                            View All
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      </div>


      {/* Staking Confirmation Modal */}
      {showStakeConfirm && pendingStake && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-center w-12 h-12 mx-auto bg-purple-100 rounded-full mb-4">
                <span className="text-2xl">🏦</span>
              </div>
              
              <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">
                Confirm Staking
              </h3>
              
              <p className="text-gray-600 text-center mb-6">
                You are about to stake your BNX tokens for rewards.
              </p>
              
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Amount to Stake:</span>
                    <span className="font-semibold text-gray-900">{formatBnx(pendingStake.amount)} BNX</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Duration:</span>
                    <span className="font-semibold text-gray-900">{pendingStake.durationDays} days</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Reward Rate:</span>
                    <span className="font-semibold text-green-600">{pendingStake.rewardPercent}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Reward Amount:</span>
                    <span className="font-semibold text-green-600">{formatBnx(pendingStake.rewardAmount)} BNX</span>
                  </div>
                  <div className="border-t pt-3">
                    <div className="flex justify-between">
                      <span className="text-gray-900 font-semibold">Total Return:</span>
                      <span className="font-bold text-purple-600">{formatBnx(pendingStake.totalReturn)} BNX</span>
                    </div>
                  </div>
                </div>
        </div>
              
              <div className="flex space-x-3">
                <Button
                  onClick={cancelStaking}
                  variant="outline"
                  className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </Button>
                <Button
                  onClick={confirmStaking}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
                >
                  Confirm Stake
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

        {/* Toast Container */}
        <ToastContainer toasts={toasts} removeToast={removeToast} />
      </Layout>
  );
}

export default function UserDashboard() {
  return (
    <ErrorBoundary>
        <UserDashboardContent />
    </ErrorBoundary>
  );
}
