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

export default function InvestmentPlansPage() {
  const { user, loading, isAuthenticated } = useAuth();
  const { usdBalance, formatCurrency } = useUniversal();
  const router = useRouter();
  const { success, error, toasts, removeToast } = useToast();
  const [mounted, setMounted] = useState(false);
  
  const [plans, setPlans] = useState([]);
  const [userInvestments, setUserInvestments] = useState([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [showInvestModal, setShowInvestModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [investAmount, setInvestAmount] = useState('');
  const [investing, setInvesting] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !loading) {
      if (!isAuthenticated) {
        router.push('/auth/signin?redirect=/user/investment-plans');
      } else {
        loadPlans();
        loadUserInvestments();
      }
    }
  }, [mounted, loading, isAuthenticated, router]);

  const loadPlans = async () => {
    try {
      setLoadingPlans(true);
      const response = await fetch('/api/investment-plans');
      const data = await response.json();
      
      if (data.success) {
        setPlans(data.data);
      } else {
        error('Failed to load investment plans');
      }
    } catch (err) {
      console.error('Error loading plans:', err);
      error('Failed to load investment plans');
    } finally {
      setLoadingPlans(false);
    }
  };

  const loadUserInvestments = async () => {
    try {
      const response = await fetch(`/api/investments?userId=${user?.id}`);
      const data = await response.json();
      
      if (data.success) {
        setUserInvestments(data.data);
      }
    } catch (err) {
      console.error('Error loading investments:', err);
    }
  };

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
        loadUserInvestments();
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

  const getStatusColor = (status) => {
    switch (status) {
      case 'ACTIVE':
        return 'text-binance-green';
      case 'COMPLETED':
        return 'text-binance-primary';
      case 'CANCELLED':
        return 'text-binance-red';
      default:
        return 'text-binance-textSecondary';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (!mounted || loading) {
    return (
      <Layout showSidebar={true}>
        <div className="min-h-screen bg-binance-background flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-binance-primary mx-auto mb-4"></div>
            <p className="text-binance-textSecondary">Loading...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <Layout showSidebar={true}>
      <div className="min-h-screen bg-binance-background p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-binance-textPrimary">Investment Plans</h1>
            <p className="text-binance-textSecondary mt-1">Choose an investment plan to grow your wealth</p>
          </div>

          {/* Balance Card */}
          <Card className="bg-binance-surface mb-8">
            <CardContent className="p-6">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-semibold text-binance-textPrimary">Available Balance</h3>
                  <p className="text-2xl font-bold text-binance-primary">{formatCurrency(usdBalance)}</p>
                </div>
                <Button
                  onClick={() => router.push('/user/deposit')}
                  className="bg-binance-primary hover:bg-binance-primary/90"
                >
                  Add Funds
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Investment Plans */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-binance-textPrimary mb-6">Available Plans</h2>
            
            {loadingPlans ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-binance-primary mx-auto mb-4"></div>
                <p className="text-binance-textSecondary">Loading plans...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {plans.map((plan) => (
                  <Card key={plan.id} className="bg-binance-surface hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <CardTitle className="text-binance-textPrimary text-center">
                        {plan.planName}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="text-center">
                          <div className="text-3xl font-bold text-binance-green mb-2">
                            {plan.profitPercentage}%
                          </div>
                          <p className="text-binance-textSecondary">Profit Rate</p>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-binance-textSecondary">Min Investment:</span>
                            <span className="text-binance-textPrimary font-semibold">
                              {formatCurrency(plan.minimumInvestment)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-binance-textSecondary">Max Investment:</span>
                            <span className="text-binance-textPrimary font-semibold">
                              {formatCurrency(plan.maximumInvestment)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-binance-textSecondary">Duration:</span>
                            <span className="text-binance-textPrimary font-semibold">
                              {plan.duration} days
                            </span>
                          </div>
                        </div>
                        
                        {plan.description && (
                          <div className="pt-2 border-t border-binance-border">
                            <p className="text-binance-textSecondary text-sm">
                              {plan.description}
                            </p>
                          </div>
                        )}
                        
                        <Button
                          onClick={() => handleInvest(plan)}
                          className="w-full bg-binance-primary hover:bg-binance-primary/90"
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

          {/* User Investments */}
          <div>
            <h2 className="text-2xl font-bold text-binance-textPrimary mb-6">My Investments</h2>
            
            {userInvestments.length === 0 ? (
              <Card className="bg-binance-surface">
                <CardContent className="p-8 text-center">
                  <p className="text-binance-textSecondary">No investments yet</p>
                  <p className="text-binance-textSecondary text-sm mt-2">
                    Choose a plan above to start investing
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {userInvestments.map((investment) => (
                  <Card key={investment.id} className="bg-binance-surface">
                    <CardHeader>
                      <CardTitle className="text-binance-textPrimary">
                        {investment.plan.planName}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-binance-textSecondary">Amount:</span>
                          <span className="text-binance-textPrimary font-semibold">
                            {formatCurrency(investment.investedAmount)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-binance-textSecondary">Expected Return:</span>
                          <span className="text-binance-green font-semibold">
                            {formatCurrency(investment.expectedReturn)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-binance-textSecondary">Start Date:</span>
                          <span className="text-binance-textPrimary">
                            {formatDate(investment.startDate)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-binance-textSecondary">End Date:</span>
                          <span className="text-binance-textPrimary">
                            {formatDate(investment.endDate)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-binance-textSecondary">Status:</span>
                          <span className={`font-semibold ${getStatusColor(investment.status)}`}>
                            {investment.status}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Investment Modal */}
        {showInvestModal && selectedPlan && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-binance-surface p-6 rounded-lg w-full max-w-md">
              <h2 className="text-xl font-bold text-binance-textPrimary mb-4">
                Invest in {selectedPlan.planName}
              </h2>
              
              <form onSubmit={handleInvestSubmit} className="space-y-4">
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
                
                <div className="bg-binance-background p-4 rounded-lg">
                  <h3 className="font-semibold text-binance-textPrimary mb-2">Investment Summary</h3>
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
        
        <ToastContainer toasts={toasts} removeToast={removeToast} />
      </div>
    </Layout>
  );
}
