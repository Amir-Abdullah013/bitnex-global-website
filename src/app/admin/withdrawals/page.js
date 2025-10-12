'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAdminAuth } from '../../../lib/admin-auth';
import AdminLayout from '../../../components/AdminLayout';
import Card, { CardContent, CardHeader, CardTitle } from '../../../components/Card';
import Button from '../../../components/Button';
import { useToast, ToastContainer } from '../../../components/Toast';

// Status badge component
const StatusBadge = ({ status }) => {
  const getStatusStyles = () => {
    switch (status?.toLowerCase()) {
      case 'approved':
      case 'completed':
        return 'bg-binance-green/20 text-binance-green border border-binance-green/30';
      case 'pending':
        return 'bg-binance-primary/20 text-binance-primary border border-binance-primary/30';
      case 'rejected':
      case 'failed':
        return 'bg-binance-red/20 text-binance-red border border-binance-red/30';
      default:
        return 'bg-binance-textTertiary/20 text-binance-textTertiary border border-binance-textTertiary/30';
    }
  };

  const getStatusIcon = () => {
    switch (status?.toLowerCase()) {
      case 'approved':
      case 'completed':
        return '✅';
      case 'pending':
        return '⏳';
      case 'rejected':
      case 'failed':
        return '❌';
      default:
        return '❓';
    }
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusStyles()}`}>
      <span className="mr-1">{getStatusIcon()}</span>
      {status?.charAt(0).toUpperCase() + status?.slice(1)}
    </span>
  );
};

// User details component
const UserDetails = ({ user, userId }) => {
  if (!user || !user.name) {
    return (
      <div className="text-binance-textTertiary text-sm">
        <div className="font-medium">Unknown User</div>
        <div className="text-xs">ID: {userId}</div>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <div className="font-medium text-binance-textPrimary">{user.name}</div>
      <div className="text-binance-textSecondary text-xs">{user.email}</div>
      <div className="text-binance-textTertiary text-xs">ID: {userId}</div>
    </div>
  );
};

// Transaction row component
const TransactionRow = ({ transaction, onApprove, onReject, isProcessing }) => {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatAmount = (amount, currency = 'USD') => {
    const symbol = currency === 'USD' ? '$' : currency;
    return `${symbol}${parseFloat(amount).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };

  return (
    <tr className="hover:bg-binance-surfaceHover transition-colors duration-150">
      <td className="px-4 py-3 text-sm text-binance-textPrimary">
        {formatDate(transaction.createdAt)}
      </td>
      <td className="px-4 py-3 text-sm text-binance-textPrimary">
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-binance-primary/20 border border-binance-primary/30 rounded-full flex items-center justify-center">
              <span className="text-binance-primary text-sm font-medium">
                {transaction.user?.name ? transaction.user.name.charAt(0).toUpperCase() : 'U'}
              </span>
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-medium text-binance-textPrimary truncate" title={transaction.user?.name || 'Unknown User'}>
              {transaction.user?.name || 'Unknown User'}
            </div>
            <div className="text-binance-textSecondary text-xs truncate" title={transaction.user?.email || 'No email available'}>
              {transaction.user?.email || 'No email available'}
            </div>
            <div className="text-binance-textTertiary text-xs">
              ID: {transaction.userId}
            </div>
          </div>
        </div>
      </td>
      <td className="px-4 py-3 text-sm font-medium text-binance-textPrimary">
        {formatAmount(transaction.amount, transaction.currency)}
      </td>
      <td className="px-4 py-3 text-sm text-binance-textSecondary">
        {transaction.binanceAddress ? (
          <div className="max-w-xs truncate" title={transaction.binanceAddress}>
            {transaction.binanceAddress}
          </div>
        ) : (
          'N/A'
        )}
      </td>
      <td className="px-4 py-3">
        <StatusBadge status={transaction.status} />
      </td>
      <td className="px-4 py-3">
        {transaction.status === 'PENDING' ? (
          <div className="flex space-x-2">
            <Button
              size="sm"
              onClick={() => onApprove(transaction.id)}
              disabled={isProcessing}
              className="bg-binance-green hover:bg-binance-green/80"
            >
              Approve
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onReject(transaction.id)}
              disabled={isProcessing}
              className="border-binance-red text-binance-red hover:bg-binance-red/10"
            >
              Reject
            </Button>
          </div>
        ) : (
          <span className="text-sm text-binance-textTertiary">No actions</span>
        )}
      </td>
    </tr>
  );
};

// Loading skeleton component
const LoadingSkeleton = () => (
  <>
    {[...Array(5)].map((_, i) => (
      <tr key={i} className="border-b border-binance-border animate-pulse">
        <td className="px-4 py-3">
          <div className="h-4 bg-binance-surface rounded w-32"></div>
        </td>
        <td className="px-4 py-3">
          <div className="h-4 bg-binance-surface rounded w-24"></div>
        </td>
        <td className="px-4 py-3">
          <div className="h-4 bg-binance-surface rounded w-20"></div>
        </td>
        <td className="px-4 py-3">
          <div className="h-4 bg-binance-surface rounded w-16"></div>
        </td>
        <td className="px-4 py-3">
          <div className="h-6 bg-binance-surface rounded-full w-20"></div>
        </td>
        <td className="px-4 py-3">
          <div className="h-8 bg-binance-surface rounded w-24"></div>
        </td>
      </tr>
    ))}
  </>
);

export default function AdminWithdrawalsPage() {
  const { adminUser, isLoading, isAuthenticated } = useAdminAuth();
  const router = useRouter();
  const { success, error, toasts, removeToast } = useToast();
  const [mounted, setMounted] = useState(false);
  
  // State
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [errorState, setErrorState] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    console.log('Admin Withdrawals Page: Component mounted');
    setMounted(true);
  }, []);

  // Fetch pending withdrawals
  const fetchWithdrawals = async () => {
    try {
      setIsDataLoading(true);
      setErrorState(null);
      
      const response = await fetch('/api/admin/withdrawals');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch withdrawals: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        const withdrawals = data.withdrawals || [];
        setTransactions(withdrawals);
        setFilteredTransactions(withdrawals);
      } else {
        throw new Error(data.error || 'Failed to load withdrawals');
      }
    } catch (err) {
      console.error('Error fetching withdrawals:', err);
      setErrorState(err.message || 'Failed to load withdrawals');
    } finally {
      setIsDataLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    if (mounted && adminUser?.id) {
      console.log('Admin Withdrawals Page: Starting to fetch withdrawals for user:', adminUser.id);
      fetchWithdrawals();
    }
  }, [mounted, adminUser?.id]);

  // Handle approve
  const handleApprove = async (transactionId) => {
    if (!adminUser?.id) return;
    
    setIsProcessing(true);
    try {
      const response = await fetch(`/api/admin/withdrawals/${transactionId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'approve' }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to approve withdrawal');
      }

      // Update local state
      setTransactions(prev => 
        prev.map(t => 
          t.id === transactionId 
            ? { ...t, status: 'APPROVED' }
            : t
        )
      );
      
      success(`Withdrawal approved successfully!`);
    } catch (err) {
      console.error('Error approving withdrawal:', err);
      error(`Failed to approve withdrawal: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle reject
  const handleReject = async (transactionId) => {
    if (!adminUser?.id) return;
    
    const reason = prompt('Please enter reason for rejection (optional):');
    if (reason === null) return; // User cancelled
    
    setIsProcessing(true);
    try {
      const response = await fetch(`/api/admin/withdrawals/${transactionId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'reject', reason }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to reject withdrawal');
      }

      // Update local state
      setTransactions(prev => 
        prev.map(t => 
          t.id === transactionId 
            ? { ...t, status: 'REJECTED' }
            : t
        )
      );
      
      success(`Withdrawal rejected successfully.`);
    } catch (err) {
      console.error('Error rejecting withdrawal:', err);
      error(`Failed to reject withdrawal: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle refresh
  const handleRefresh = () => {
    fetchWithdrawals();
  };

  // Handle search
  const handleSearch = (term) => {
    setSearchTerm(term);
    if (!term.trim()) {
      setFilteredTransactions(transactions);
      return;
    }

    const filtered = transactions.filter(transaction => {
      const userName = transaction.user?.name?.toLowerCase() || '';
      const userEmail = transaction.user?.email?.toLowerCase() || '';
      const userId = transaction.userId?.toLowerCase() || '';
      const searchLower = term.toLowerCase();

      return userName.includes(searchLower) || 
             userEmail.includes(searchLower) || 
             userId.includes(searchLower);
    });

    setFilteredTransactions(filtered);
  };

  if (!mounted || isLoading) {
    return (
      <div className="min-h-screen bg-binance-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-binance-primary mx-auto mb-4"></div>
          <p className="text-binance-textSecondary">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-binance-background flex items-center justify-center">
        <div className="text-center">
          <div className="text-binance-red text-6xl mb-4">🚫</div>
          <h1 className="text-2xl font-bold text-binance-textPrimary mb-2">Access Denied</h1>
          <p className="text-binance-textSecondary mb-4">Please sign in to access this page.</p>
          <button
            onClick={() => router.push('/auth/signin')}
            className="px-4 py-2 bg-binance-primary text-binance-background rounded-md hover:bg-binance-primary/80"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <AdminLayout showSidebar={true}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-binance-textPrimary">Withdrawal Requests</h1>
              <p className="text-binance-textSecondary mt-1">Manage user withdrawal requests</p>
              <p className="text-sm text-binance-green mt-1">✅ Page loaded successfully</p>
            </div>
            <div className="flex space-x-4">
              <Button
                onClick={handleRefresh}
                variant="outline"
                disabled={isLoading}
              >
                <span className="mr-2">🔄</span>
                Refresh
              </Button>
              <Button
                onClick={() => router.push('/admin/transactions')}
                variant="outline"
              >
                View All Transactions
              </Button>
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-binance-primary/20 border border-binance-primary/30 rounded-lg">
                  <span className="text-2xl">⏳</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-binance-textSecondary">Pending</p>
                  <p className="text-2xl font-bold text-binance-textPrimary">
                    {transactions.filter(t => t.status === 'PENDING').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-binance-red/20 border border-binance-red/30 rounded-lg">
                  <span className="text-2xl">💸</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-binance-textSecondary">Total Amount</p>
                  <p className="text-2xl font-bold text-binance-textPrimary">
                    ${transactions.reduce((sum, t) => sum + t.amount, 0).toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-binance-primary/20 border border-binance-primary/30 rounded-lg">
                  <span className="text-2xl">📊</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-binance-textSecondary">Total Requests</p>
                  <p className="text-2xl font-bold text-binance-textPrimary">{transactions.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-binance-green/20 border border-binance-green/30 rounded-lg">
                  <span className="text-2xl">👥</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-binance-textSecondary">Unique Users</p>
                  <p className="text-2xl font-bold text-binance-textPrimary">
                    {new Set(transactions.map(t => t.userId)).size}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search Bar */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Search by user name, email, or ID..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full px-3 py-2 border border-binance-border rounded-md focus:outline-none focus:ring-2 focus:ring-binance-primary bg-binance-surface text-binance-textPrimary placeholder-binance-textTertiary"
                />
              </div>
              <div className="text-sm text-binance-textSecondary">
                {filteredTransactions.length} of {transactions.length} requests
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Transactions Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-binance-textPrimary">
              Withdrawal Requests ({filteredTransactions.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {errorState ? (
              <div className="text-center py-8">
                <div className="text-binance-red text-4xl mb-4">⚠️</div>
                <p className="text-binance-red mb-4">{errorState}</p>
                <Button onClick={handleRefresh} variant="outline">
                  Try Again
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-binance-border">
                  <thead className="bg-binance-surface">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-binance-textSecondary uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-binance-textSecondary uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-binance-textSecondary uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-binance-textSecondary uppercase tracking-wider">
                        Binance Address
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-binance-textSecondary uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-binance-textSecondary uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-binance-background divide-y divide-binance-border">
                    {isLoading ? (
                      <LoadingSkeleton />
                    ) : filteredTransactions.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="px-4 py-8 text-center text-binance-textTertiary">
                          {searchTerm ? 'No withdrawal requests match your search' : 'No withdrawal requests found'}
                        </td>
                      </tr>
                    ) : (
                      filteredTransactions.map((transaction) => (
                        <TransactionRow
                          key={transaction.id}
                          transaction={transaction}
                          onApprove={handleApprove}
                          onReject={handleReject}
                          isProcessing={isProcessing}
                        />
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Toast Container */}
        <ToastContainer toasts={toasts} removeToast={removeToast} />
        </div>
      </AdminLayout>
    );
  }