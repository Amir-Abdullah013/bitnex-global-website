'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../lib/auth-context';
import { useUniversal } from '../../lib/universal-context';
import { useInvestmentPlans } from '../../hooks/useInvestments';
import Layout from '../../components/Layout';
import Card, { CardContent, CardHeader, CardTitle } from '../../components/Card';
import Button from '../../components/Button';
import Input from '../../components/Input';
// LoadingSkeleton removed - using inline skeleton
import ErrorBoundary from '../../components/ErrorBoundary';
import { useToast, ToastContainer } from '../../components/Toast';

export default function InvestmentPlansPage() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const { usdBalance, formatCurrency } = useUniversal();
  const { plans, loading: loadingPlans, error: plansError } = useInvestmentPlans();
  const router = useRouter();
  const { success, error, toasts, removeToast } = useToast();
  const [mounted, setMounted] = useState(true);
  const [forceRender, setForceRender] = useState(true); // Force render regardless of auth state
  
  const [showInvestModal, setShowInvestModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [investAmount, setInvestAmount] = useState('');
  const [investing, setInvesting] = useState(false);

  useEffect(() => {
    console.log('Plans Page: Component mounted');
    console.log('Plans Page: authLoading=', authLoading, 'isAuthenticated=', isAuthenticated);
    setMounted(true);
    
    // IMMEDIATE force render - no waiting!
    console.log('Plans Page: Setting forceRender to true immediately');
    setForceRender(true);
  }, []);

  useEffect(() => {
    console.log('Plans Page: Auth state changed - authLoading=', authLoading, 'isAuthenticated=', isAuthenticated, 'user=', user);
    
    // Once auth completes (authLoading becomes false), update forceRender
    if (!authLoading) {
      setForceRender(true);
    }
  }, [authLoading, isAuthenticated, user]);

  // Authentication redirect disabled for development
  // Middleware will handle authentication in production
  // useEffect(() => {
  //   if (mounted && !authLoading) {
  //     if (!isAuthenticated) {
  //       router.push('/auth/signin?redirect=/plans');
  //     }
  //   }
  // }, [mounted, authLoading, isAuthenticated, router]);

  const handleInvest = (plan) => {
    setSelectedPlan(plan);
    setInvestAmount('');
    setShowInvestModal(true);
  };

  const handleInvestSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedPlan || !investAmount) return;
    
    const amount = parseFloat(investAmount);
    
    // Validate amount
    if (amount < selectedPlan.minimumInvestment || amount > selectedPlan.maximumInvestment) {
      error(`Investment amount must be between $${selectedPlan.minimumInvestment} and $${selectedPlan.maximumInvestment}`);
      return;
    }
    
    if (amount > usdBalance) {
      error('Insufficient balance');
      return;
    }
    
    try {
      setInvesting(true);
      const response = await fetch('/api/investments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          planId: selectedPlan.id,
          investedAmount: amount
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        success('Investment created successfully!');
        setShowInvestModal(false);
        setSelectedPlan(null);
        setInvestAmount('');
        // Refresh the page to update balance
        window.location.reload();
      } else {
        error(data.error || 'Failed to create investment');
      }
    } catch (err) {
      console.error('Error creating investment:', err);
      error('Failed to create investment');
    } finally {
      setInvesting(false);
    }
  };

  const getPlanColor = (index) => {
    const colors = [
      'from-blue-500 to-blue-600',
      'from-green-500 to-green-600', 
      'from-yellow-500 to-yellow-600',
      'from-purple-500 to-purple-600',
      'from-red-500 to-red-600',
      'from-indigo-500 to-indigo-600'
    ];
    return colors[index % colors.length];
  };

  // Removed loading checks - render immediately for better UX
  // Authentication handled by middleware

  return (
    <ErrorBoundary>
      <Layout showSidebar={true}>
        <div className="min-h-screen bg-binance-background p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-binance-textPrimary mb-2">Investment Plans</h1>
            <p className="text-binance-textSecondary text-lg">Choose an investment plan to grow your wealth</p>
          </div>

          {/* Balance Card */}
          <Card className="bg-binance-surface mb-8">
            <CardContent className="p-6">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-semibold text-binance-textPrimary">Available Balance</h3>
                  <p className="text-3xl font-bold text-binance-primary">{formatCurrency(usdBalance)}</p>
                </div>
                <div className="flex space-x-3">
                  <Button
                    onClick={() => router.push('/user/deposit')}
                    className="bg-binance-primary hover:bg-binance-primary/90"
                  >
                    Add Funds
                  </Button>
                  <Button
                    onClick={() => router.push('/user/dashboard')}
                    variant="outline"
                  >
                    View Dashboard
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Investment Plans */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-binance-textPrimary mb-6">Available Plans</h2>
            
            {loadingPlans ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse bg-gray-200 rounded-lg p-6 h-64"></div>
                ))}
              </div>
            ) : plansError ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">⚠️</div>
                <h3 className="text-xl font-semibold text-red-600 mb-2">Error Loading Plans</h3>
                <p className="text-binance-textSecondary mb-4">{plansError}</p>
                <Button
                  onClick={() => window.location.reload()}
                  className="bg-binance-primary hover:bg-binance-primary/90"
                >
                  Try Again
                </Button>
              </div>
            ) : plans.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📈</div>
                <h3 className="text-xl font-semibold text-binance-textPrimary mb-2">No Plans Available</h3>
                <p className="text-binance-textSecondary">Check back later for new investment opportunities</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {plans.map((plan, index) => (
                  <Card key={plan.id} className="bg-binance-surface hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                    <CardHeader className="relative">
                      <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${getPlanColor(index)} rounded-t-lg`}></div>
                      <CardTitle className="text-binance-textPrimary text-center text-xl">
                        {plan.planName}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        {/* Profit Rate */}
                        <div className="text-center">
                          <div className="text-4xl font-bold text-binance-green mb-2">
                            {plan.profitPercentage}%
                          </div>
                          <p className="text-binance-textSecondary">Profit Rate</p>
                        </div>
                        
                        {/* Investment Range */}
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-binance-textSecondary">Min Investment:</span>
                            <span className="text-binance-textPrimary font-semibold">
                              {formatCurrency(plan.minimumInvestment)}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-binance-textSecondary">Max Investment:</span>
                            <span className="text-binance-textPrimary font-semibold">
                              {formatCurrency(plan.maximumInvestment)}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-binance-textSecondary">Duration:</span>
                            <span className="text-binance-textPrimary font-semibold">
                              {plan.duration} days
                            </span>
                          </div>
                        </div>
                        
                        {/* Description */}
                        {plan.description && (
                          <div className="pt-3 border-t border-binance-border">
                            <p className="text-binance-textSecondary text-sm text-center">
                              {plan.description}
                            </p>
                          </div>
                        )}
                        
                        {/* Invest Button */}
                        <Button
                          onClick={() => handleInvest(plan)}
                          className={`w-full bg-gradient-to-r ${getPlanColor(index)} hover:opacity-90 text-white font-semibold py-3`}
                          disabled={usdBalance < plan.minimumInvestment}
                        >
                          {usdBalance < plan.minimumInvestment ? 'Insufficient Balance' : 'Invest Now'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Investment Modal */}
          {showInvestModal && selectedPlan && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-binance-surface p-6 rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
                <h2 className="text-2xl font-bold text-binance-textPrimary mb-4">
                  Invest in {selectedPlan.planName}
                </h2>
                
                <form onSubmit={handleInvestSubmit} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-binance-textPrimary mb-2">
                      Investment Amount
                    </label>
                    <Input
                      type="number"
                      value={investAmount}
                      onChange={(e) => setInvestAmount(e.target.value)}
                      placeholder={`Min: $${selectedPlan.minimumInvestment}, Max: $${selectedPlan.maximumInvestment}`}
                      min={selectedPlan.minimumInvestment}
                      max={selectedPlan.maximumInvestment}
                      step="0.01"
                      required
                    />
                    <p className="text-sm text-binance-textSecondary mt-1">
                      Available balance: {formatCurrency(usdBalance)}
                    </p>
                  </div>
                  
                  {/* Investment Summary */}
                  <div className="bg-binance-background p-4 rounded-lg">
                    <h3 className="font-semibold text-binance-textPrimary mb-3">Investment Summary</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-binance-textSecondary">Amount:</span>
                        <span className="text-binance-textPrimary">
                          {investAmount ? formatCurrency(parseFloat(investAmount)) : '$0.00'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-binance-textSecondary">Profit Rate:</span>
                        <span className="text-binance-green">{selectedPlan.profitPercentage}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-binance-textSecondary">Expected Return:</span>
                        <span className="text-binance-green font-semibold">
                          {investAmount ? formatCurrency(parseFloat(investAmount) * (selectedPlan.profitPercentage / 100)) : '$0.00'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-binance-textSecondary">Duration:</span>
                        <span className="text-binance-textPrimary">{selectedPlan.duration} days</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-binance-textSecondary">Total Return:</span>
                        <span className="text-binance-primary font-bold">
                          {investAmount ? formatCurrency(parseFloat(investAmount) + (parseFloat(investAmount) * (selectedPlan.profitPercentage / 100))) : '$0.00'}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex space-x-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowInvestModal(false)}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={investing}
                      className="flex-1 bg-binance-primary hover:bg-binance-primary/90"
                    >
                      {investing ? 'Processing...' : 'Confirm Investment'}
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
        
        <ToastContainer toasts={toasts} removeToast={removeToast} />
        </div>
      </Layout>
    </ErrorBoundary>
  );
}
