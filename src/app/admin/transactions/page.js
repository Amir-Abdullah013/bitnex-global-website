'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAdminAuth } from '../../../lib/admin-auth';
import { authenticatedFetch, initializeAuth } from '../../../lib/auth-helper';
import AdminLayout from '../../../components/AdminLayout';
import Card, { CardContent, CardHeader, CardTitle } from '../../../components/Card';
import Button from '../../../components/Button';
import Input from '../../../components/Input';
import { useToast, ToastContainer } from '../../../components/Toast';

export default function AdminTransactionsPage() {
  const { adminUser, isLoading, isAuthenticated } = useAdminAuth();
  const router = useRouter();
  const { success, error, toasts, removeToast } = useToast();
  const [mounted, setMounted] = useState(false);
  
  // State management
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [loadingTransactions, setLoadingTransactions] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalTransactions, setTotalTransactions] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);
  const [completedTransactions, setCompletedTransactions] = useState(0);
  const [pendingTransactions, setPendingTransactions] = useState(0);
  const [failedTransactions, setFailedTransactions] = useState(0);
  const [transactionsPerPage] = useState(10);

  // Deposit management state
  const [depositRequests, setDepositRequests] = useState([]);
  const [loadingDeposits, setLoadingDeposits] = useState(true);
  const [depositStats, setDepositStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    totalApprovedAmount: 0
  });

  // Withdrawal management state
  const [withdrawals, setWithdrawals] = useState([]);
  const [loadingWithdrawals, setLoadingWithdrawals] = useState(true);
  const [withdrawalStats, setWithdrawalStats] = useState({
    total: 0,
    pending: 0,
    completed: 0,
    failed: 0,
    totalCompletedAmount: 0
  });

  // Transaction management state
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Initialize authentication
    initializeAuth();
  }, []);

  useEffect(() => {
    if (mounted && !isLoading) {
      if (!isAuthenticated) {
        router.push('/auth/signin');
        return;
      }
      loadTransactions();
      loadDepositRequests();
      loadWithdrawals();
    }
  }, [mounted, isLoading, isAuthenticated]);

  // Reload transactions when filters change
  useEffect(() => {
    if (mounted && isAuthenticated) {
      loadTransactions();
    }
  }, [searchTerm, selectedType, selectedStatus, currentPage]);

  const loadTransactions = async () => {
    try {
      setLoadingTransactions(true);
      
      // Build query parameters
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: transactionsPerPage.toString()
      });
      
      if (searchTerm) params.append('search', searchTerm);
      if (selectedType !== 'all') params.append('type', selectedType);
      if (selectedStatus !== 'all') params.append('status', selectedStatus);
      
      const response = await authenticatedFetch(`/api/admin/transactions?${params.toString()}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('📊 Transactions data from API:', data.transactions?.map(t => ({ id: t.id, type: t.type, status: t.status, amount: t.amount })));
        setTransactions(data.transactions || []);
        setFilteredTransactions(data.transactions || []);
        setTotalPages(data.pagination?.totalPages || 1);
        setTotalTransactions(data.pagination?.total || 0);
        
        // Update statistics
        if (data.statistics) {
          setTotalAmount(data.statistics.totalAmount || 0);
          setCompletedTransactions(data.statistics.completedTransactions || 0);
          setPendingTransactions(data.statistics.pendingTransactions || 0);
          setFailedTransactions(data.statistics.failedTransactions || 0);
        }
      } else {
        const errorData = await response.json();
        console.error('Error loading transactions:', errorData.error);
        error('Failed to load transactions: ' + (errorData.error || 'Unknown error'));
        setTransactions([]);
        setFilteredTransactions([]);
        setTotalPages(1);
        setTotalTransactions(0);
        setTotalAmount(0);
        setCompletedTransactions(0);
        setPendingTransactions(0);
        setFailedTransactions(0);
      }
    } catch (err) {
      console.error('Error loading transactions:', err);
      error('Failed to load transactions');
      setTransactions([]);
      setFilteredTransactions([]);
      setTotalPages(1);
      setTotalTransactions(0);
      setTotalAmount(0);
      setCompletedTransactions(0);
      setPendingTransactions(0);
      setFailedTransactions(0);
    } finally {
      setLoadingTransactions(false);
    }
  };

  const loadDepositRequests = async () => {
    try {
      setLoadingDeposits(true);
      
      const response = await fetch('/api/admin/deposits');
      
      if (response.ok) {
        const data = await response.json();
        setDepositRequests(data.depositRequests || []);
        setDepositStats(data.statistics || {
          total: 0,
          pending: 0,
          approved: 0,
          rejected: 0,
          totalApprovedAmount: 0
        });
      } else {
        const errorData = await response.json();
        error('Failed to load deposit requests: ' + (errorData.error || 'Unknown error'));
        setDepositRequests([]);
      }
    } catch (err) {
      console.error('Error loading deposit requests:', err);
      error('Failed to load deposit requests');
      setDepositRequests([]);
    } finally {
      setLoadingDeposits(false);
    }
  };

  const loadWithdrawals = async () => {
    try {
      setLoadingWithdrawals(true);
      
      const response = await fetch('/api/admin/withdrawals');
      
      if (response.ok) {
        const data = await response.json();
        setWithdrawals(data.withdrawals || []);
        setWithdrawalStats(data.statistics || {
          total: 0,
          pending: 0,
          completed: 0,
          failed: 0,
          totalCompletedAmount: 0
        });
      } else {
        const errorData = await response.json();
        error('Failed to load withdrawals: ' + (errorData.error || 'Unknown error'));
        setWithdrawals([]);
      }
    } catch (err) {
      console.error('Error loading withdrawals:', err);
      error('Failed to load withdrawals');
      setWithdrawals([]);
    } finally {
      setLoadingWithdrawals(false);
    }
  };

  const handleViewTransaction = (transaction) => {
    setSelectedTransaction(transaction);
    setShowTransactionModal(true);
  };

  const handleUpdateStatus = (transaction) => {
    setSelectedTransaction(transaction);
    setShowStatusModal(true);
  };

  const handleStatusUpdate = async (newStatus) => {
    if (!selectedTransaction) return;
    
    try {
      setActionLoading(true);
      
      const response = await fetch(`/api/admin/transactions/${selectedTransaction.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Transaction status update successful:', data);
        success(`Transaction status updated to ${newStatus}`);
        
        // Update the transaction in local state immediately for better UX
        setTransactions(prevTransactions => 
          prevTransactions.map(t => 
            t.id === selectedTransaction.id 
              ? { ...t, status: newStatus, updatedAt: new Date().toISOString() }
              : t
          )
        );
        setFilteredTransactions(prevFiltered => 
          prevFiltered.map(t => 
            t.id === selectedTransaction.id 
              ? { ...t, status: newStatus, updatedAt: new Date().toISOString() }
              : t
          )
        );
        
        // Also reload from server to ensure consistency
        setTimeout(() => {
          console.log('🔄 Reloading transactions from server...');
          loadTransactions();
        }, 1000);
      } else {
        const errorData = await response.json();
        console.error('Status update error:', errorData);
        error(`Failed to update transaction status: ${errorData.error || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('Error updating transaction status:', err);
      error('Failed to update transaction status');
    } finally {
      setActionLoading(false);
      setShowStatusModal(false);
      setSelectedTransaction(null);
    }
  };

  const handleApproveDeposit = async (depositId) => {
    setActionLoading(true);
    try {
      const response = await fetch(`/api/admin/deposits/${depositId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve' }),
      });

      if (response.ok) {
        success('Deposit request approved successfully');
        loadDepositRequests(); // Reload data to reflect changes
      } else {
        const errorData = await response.json();
        error(`Failed to approve deposit: ${errorData.error || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('Error approving deposit:', err);
      error('Failed to approve deposit');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectDeposit = async (depositId) => {
    setActionLoading(true);
    try {
      const response = await fetch(`/api/admin/deposits/${depositId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reject' }),
      });

      if (response.ok) {
        success('Deposit request rejected successfully');
        loadDepositRequests(); // Reload data to reflect changes
      } else {
        const errorData = await response.json();
        error(`Failed to reject deposit: ${errorData.error || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('Error rejecting deposit:', err);
      error('Failed to reject deposit');
    } finally {
      setActionLoading(false);
    }
  };

  const handleApproveWithdrawal = async (withdrawalId) => {
    setActionLoading(true);
    try {
      const response = await fetch(`/api/admin/withdrawals/${withdrawalId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve' }),
      });

      if (response.ok) {
        success('Withdrawal request approved successfully');
        loadWithdrawals(); // Reload data to reflect changes
      } else {
        const errorData = await response.json();
        error(`Failed to approve withdrawal: ${errorData.error || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('Error approving withdrawal:', err);
      error('Failed to approve withdrawal');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectWithdrawal = async (withdrawalId) => {
    setActionLoading(true);
    try {
      const response = await fetch(`/api/admin/withdrawals/${withdrawalId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reject' }),
      });

      if (response.ok) {
        success('Withdrawal request rejected successfully');
        loadWithdrawals(); // Reload data to reflect changes
      } else {
        const errorData = await response.json();
        error(`Failed to reject withdrawal: ${errorData.error || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('Error rejecting withdrawal:', err);
      error('Failed to reject withdrawal');
    } finally {
      setActionLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      console.error("Error formatting date:", dateString, e);
      return 'Invalid Date';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-500/20 text-green-400 border border-green-500/30';
      case 'PENDING':
        return 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30';
      case 'FAILED':
        return 'bg-red-500/20 text-red-400 border border-red-500/30';
      default:
        return 'bg-[#2B3139] text-[#B7BDC6] border border-[#3A4049]';
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'DEPOSIT':
        return 'bg-blue-500/20 text-blue-400 border border-blue-500/30';
      case 'WITHDRAWAL':
        return 'bg-red-500/20 text-red-400 border border-red-500/30';
      case 'BUY':
        return 'bg-green-500/20 text-green-400 border border-green-500/30';
      case 'SELL':
        return 'bg-orange-500/20 text-orange-400 border border-orange-500/30';
      default:
        return 'bg-[#2B3139] text-[#B7BDC6] border border-[#3A4049]';
    }
  };

  const getCurrentPageTransactions = () => {
    return filteredTransactions;
  };

  if (!mounted || isLoading) {
    return (
      <div className="min-h-screen bg-[#181A20] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F0B90B] mx-auto mb-4"></div>
          <p className="text-[#B7BDC6]">Loading transactions...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#181A20] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F0B90B] mx-auto mb-4"></div>
          <p className="text-[#B7BDC6]">Redirecting to sign in...</p>
        </div>
      </div>
    );
  }

  return (
    <AdminLayout showSidebar={true}>
      <div className="min-h-screen bg-[#181A20]">
        {/* Header */}
        <div className="bg-[#1E2329] border-b border-[#2B3139]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div>
                <h1 className="text-3xl font-bold text-white">Transaction Management</h1>
                <p className="text-[#B7BDC6] mt-1">Monitor and manage all user transactions</p>
              </div>
              <div className="flex items-center space-x-4">
                <Button
                  onClick={() => router.push('/admin/dashboard')}
                  className="bg-[#2B3139] hover:bg-[#3A4049] text-white border border-[#3A4049]"
                >
                  ← Back to Dashboard
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="bg-[#1E2329] border-[#2B3139]">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-[#F0B90B]/20 border border-[#F0B90B]/30 rounded-lg flex items-center justify-center">
                      <span className="text-[#F0B90B] text-xl">💰</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-[#B7BDC6]">Total Transactions</p>
                    <p className="text-2xl font-bold text-white">{totalTransactions.toLocaleString()}</p>
                    <p className="text-xs text-[#B7BDC6] mt-1">All time</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#1E2329] border-[#2B3139]">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-green-500/20 border border-green-500/30 rounded-lg flex items-center justify-center">
                      <span className="text-green-500 text-xl">✅</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-[#B7BDC6]">Completed</p>
                    <p className="text-2xl font-bold text-white">{completedTransactions.toLocaleString()}</p>
                    <p className="text-xs text-green-500 mt-1">+12.5% from last month</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#1E2329] border-[#2B3139]">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-yellow-500/20 border border-yellow-500/30 rounded-lg flex items-center justify-center">
                      <span className="text-yellow-500 text-xl">⏳</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-[#B7BDC6]">Pending</p>
                    <p className="text-2xl font-bold text-white">{pendingTransactions.toLocaleString()}</p>
                    <p className="text-xs text-yellow-500 mt-1">Awaiting approval</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#1E2329] border-[#2B3139]">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-blue-500/20 border border-blue-500/30 rounded-lg flex items-center justify-center">
                      <span className="text-blue-500 text-xl">💵</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-[#B7BDC6]">Total Volume</p>
                    <p className="text-2xl font-bold text-white">{formatCurrency(totalAmount)}</p>
                    <p className="text-xs text-[#B7BDC6] mt-1">All transactions</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters and Search */}
          <Card className="mb-6 bg-[#1E2329] border-[#2B3139]">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#B7BDC6] mb-2">
                    Search Transactions
                  </label>
                  <Input
                    type="text"
                    placeholder="Search by ID, user, or amount..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-[#2B3139] border-[#3A4049] text-white placeholder-[#B7BDC6] focus:border-[#F0B90B] focus:ring-[#F0B90B]/20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#B7BDC6] mb-2">
                    Transaction Type
                  </label>
                  <select
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value)}
                    className="w-full px-3 py-2 bg-[#2B3139] border border-[#3A4049] text-white rounded-md focus:outline-none focus:ring-2 focus:ring-[#F0B90B]/20 focus:border-[#F0B90B]"
                  >
                    <option value="all">All Types</option>
                    <option value="DEPOSIT">Deposit</option>
                    <option value="WITHDRAWAL">Withdrawal</option>
                    <option value="BUY">Buy</option>
                    <option value="SELL">Sell</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#B7BDC6] mb-2">
                    Status Filter
                  </label>
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="w-full px-3 py-2 bg-[#2B3139] border border-[#3A4049] text-white rounded-md focus:outline-none focus:ring-2 focus:ring-[#F0B90B]/20 focus:border-[#F0B90B]"
                  >
                    <option value="all">All Status</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="PENDING">Pending</option>
                    <option value="FAILED">Failed</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <Button
                    onClick={loadTransactions}
                    disabled={loadingTransactions}
                    className="w-full bg-[#F0B90B] hover:bg-[#F0B90B]/80 text-black font-semibold disabled:opacity-50"
                  >
                    {loadingTransactions ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black mr-2"></div>
                        Loading...
                      </div>
                    ) : (
                      'Refresh Data'
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Transactions Table */}
          <Card className="bg-[#1E2329] border-[#2B3139]">
            <CardHeader className="border-b border-[#2B3139]">
              <CardTitle className="text-white text-xl font-semibold">Transaction History</CardTitle>
              <p className="text-[#B7BDC6] text-sm mt-1">Monitor and manage all user transactions</p>
            </CardHeader>
            <CardContent className="p-0">
              {loadingTransactions ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F0B90B] mx-auto mb-4"></div>
                    <span className="text-[#B7BDC6]">Loading transactions...</span>
                  </div>
                </div>
              ) : (
                <>
                  {getCurrentPageTransactions().length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-[#2B3139] rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-[#B7BDC6] text-2xl">📊</span>
                      </div>
                      <p className="text-[#B7BDC6] text-lg">No transactions found</p>
                      <p className="text-[#B7BDC6] text-sm mt-1">Try adjusting your filters or search terms</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full">
                        <thead className="bg-[#2B3139]">
                          <tr>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-[#B7BDC6] uppercase tracking-wider">
                              Transaction ID
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-[#B7BDC6] uppercase tracking-wider">
                              User Details
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-[#B7BDC6] uppercase tracking-wider">
                              Type
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-[#B7BDC6] uppercase tracking-wider">
                              Amount
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-[#B7BDC6] uppercase tracking-wider">
                              Status
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-[#B7BDC6] uppercase tracking-wider">
                              Date & Time
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-[#B7BDC6] uppercase tracking-wider">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#2B3139]">
                          {getCurrentPageTransactions().map((transaction, index) => (
                            <tr key={transaction.id} className={`hover:bg-[#2B3139]/50 transition-colors ${index % 2 === 0 ? 'bg-[#1E2329]' : 'bg-[#1A1F29]'}`}>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-mono text-white">
                                  {transaction.id.slice(0, 8)}...
                                </div>
                                <div className="text-xs text-[#B7BDC6]">
                                  {transaction.id.slice(-4)}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div>
                                  <div className="text-sm font-medium text-white">
                                    {transaction.user?.name || 'Unknown User'}
                                  </div>
                                  <div className="text-sm text-[#B7BDC6]">
                                    {transaction.user?.email || 'unknown@example.com'}
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getTypeColor(transaction.type)}`}>
                                  {transaction.type}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-semibold text-white">
                                  {formatCurrency(transaction.amount)}
                                </div>
                                <div className="text-xs text-[#B7BDC6]">
                                  {transaction.currency || 'USD'}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(transaction.status)}`}>
                                  {transaction.status}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-white">
                                  {formatDate(transaction.createdAt)}
                                </div>
                                <div className="text-xs text-[#B7BDC6]">
                                  {new Date(transaction.createdAt).toLocaleTimeString()}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <div className="flex space-x-2">
                                  <Button
                                    size="sm"
                                    onClick={() => handleViewTransaction(transaction)}
                                    className="bg-[#2B3139] hover:bg-[#3A4049] text-white border border-[#3A4049] text-xs"
                                  >
                                    View
                                  </Button>
                                  <Button
                                    size="sm"
                                    onClick={() => handleUpdateStatus(transaction)}
                                    disabled={actionLoading}
                                    className="bg-[#F0B90B] hover:bg-[#F0B90B]/80 text-black text-xs disabled:opacity-50"
                                  >
                                    Update
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between px-6 py-4 bg-[#2B3139] border-t border-[#3A4049]">
                      <div className="text-sm text-[#B7BDC6]">
                        Showing {((currentPage - 1) * transactionsPerPage) + 1} to {Math.min(currentPage * transactionsPerPage, totalTransactions)} of {totalTransactions.toLocaleString()} transactions
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                          disabled={currentPage === 1}
                          className="bg-[#1E2329] hover:bg-[#3A4049] text-white border border-[#3A4049] disabled:opacity-50"
                        >
                          ← Previous
                        </Button>
                        <span className="px-4 py-2 text-sm text-[#B7BDC6] bg-[#1E2329] rounded border border-[#3A4049]">
                          Page {currentPage} of {totalPages}
                        </span>
                        <Button
                          size="sm"
                          onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                          disabled={currentPage === totalPages}
                          className="bg-[#1E2329] hover:bg-[#3A4049] text-white border border-[#3A4049] disabled:opacity-50"
                        >
                          Next →
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Transaction Details Modal */}
        {showTransactionModal && selectedTransaction && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-[#1E2329] border border-[#2B3139] rounded-xl p-6 max-w-lg w-full">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-white">Transaction Details</h3>
                <button
                  onClick={() => setShowTransactionModal(false)}
                  className="text-[#B7BDC6] hover:text-white transition-colors"
                >
                  ✕
                </button>
              </div>
              <div className="space-y-4">
                <div className="bg-[#2B3139] rounded-lg p-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-[#B7BDC6] text-sm">Transaction ID</span>
                      <div className="text-white font-mono text-sm mt-1">{selectedTransaction.id}</div>
                    </div>
                    <div>
                      <span className="text-[#B7BDC6] text-sm">Status</span>
                      <div className="mt-1">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedTransaction.status)}`}>
                          {selectedTransaction.status}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-[#2B3139] rounded-lg p-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-[#B7BDC6] text-sm">User</span>
                      <div className="text-white text-sm mt-1">{selectedTransaction.user?.name || 'Unknown'}</div>
                      <div className="text-[#B7BDC6] text-xs">{selectedTransaction.user?.email || 'N/A'}</div>
                    </div>
                    <div>
                      <span className="text-[#B7BDC6] text-sm">Type</span>
                      <div className="mt-1">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(selectedTransaction.type)}`}>
                          {selectedTransaction.type}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-[#2B3139] rounded-lg p-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-[#B7BDC6] text-sm">Amount</span>
                      <div className="text-white font-semibold text-lg mt-1">{formatCurrency(selectedTransaction.amount)}</div>
                      <div className="text-[#B7BDC6] text-xs">{selectedTransaction.currency || 'USD'}</div>
                    </div>
                    <div>
                      <span className="text-[#B7BDC6] text-sm">Gateway</span>
                      <div className="text-white text-sm mt-1">{selectedTransaction.gateway || 'N/A'}</div>
                    </div>
                  </div>
                </div>

                <div className="bg-[#2B3139] rounded-lg p-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-[#B7BDC6] text-sm">Created</span>
                      <div className="text-white text-sm mt-1">{formatDate(selectedTransaction.createdAt)}</div>
                    </div>
                    <div>
                      <span className="text-[#B7BDC6] text-sm">Updated</span>
                      <div className="text-white text-sm mt-1">{formatDate(selectedTransaction.updatedAt)}</div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex justify-end mt-6">
                <Button
                  onClick={() => setShowTransactionModal(false)}
                  className="bg-[#2B3139] hover:bg-[#3A4049] text-white border border-[#3A4049]"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Status Update Modal */}
        {showStatusModal && selectedTransaction && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-[#1E2329] border border-[#2B3139] rounded-xl p-6 max-w-md w-full">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-white">Update Transaction Status</h3>
                <button
                  onClick={() => setShowStatusModal(false)}
                  className="text-[#B7BDC6] hover:text-white transition-colors"
                >
                  ✕
                </button>
              </div>
              <div className="space-y-4">
                <div className="bg-[#2B3139] rounded-lg p-4">
                  <div className="text-[#B7BDC6] text-sm">Transaction ID</div>
                  <div className="text-white font-mono text-sm mt-1">{selectedTransaction.id}</div>
                </div>
                
                <div className="bg-[#2B3139] rounded-lg p-4">
                  <div className="text-[#B7BDC6] text-sm mb-2">Current Status</div>
                  <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(selectedTransaction.status)}`}>
                    {selectedTransaction.status}
                  </span>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-[#B7BDC6] mb-2">
                    New Status
                  </label>
                  <select
                    className="w-full px-3 py-3 bg-[#2B3139] border border-[#3A4049] text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F0B90B]/20 focus:border-[#F0B90B]"
                    defaultValue={selectedTransaction.status}
                  >
                    <option value="PENDING">Pending</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="FAILED">Failed</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <Button
                  onClick={() => setShowStatusModal(false)}
                  className="bg-[#2B3139] hover:bg-[#3A4049] text-white border border-[#3A4049]"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    const select = document.querySelector('select');
                    handleStatusUpdate(select.value);
                  }}
                  disabled={actionLoading}
                  className="bg-[#F0B90B] hover:bg-[#F0B90B]/80 text-black font-semibold disabled:opacity-50"
                >
                  {actionLoading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black mr-2"></div>
                      Updating...
                    </div>
                  ) : (
                    'Update Status'
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Toast Container */}
        <ToastContainer toasts={toasts} removeToast={removeToast} />
        </div>
      </AdminLayout>
    );
  }
