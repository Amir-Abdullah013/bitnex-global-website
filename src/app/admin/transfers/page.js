'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAdminAuth } from '../../../lib/admin-auth';
import { authenticatedFetch, initializeAuth } from '../../../lib/auth-helper';
import { useTiki, TikiProvider } from '../../../lib/tiki-context';
import AdminLayout from '../../../components/AdminLayout';
import Card, { CardContent, CardHeader, CardTitle } from '../../../components/Card';
import Button from '../../../components/Button';
import Input from '../../../components/Input';
import { useToast, ToastContainer } from '../../../components/Toast';

const StatusBadge = ({ status }) => {
  const getStatusStyles = () => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-500/20 text-green-400 border border-green-500/30';
      case 'PENDING':
        return 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30';
      case 'FAILED':
        return 'bg-red-500/20 text-red-400 border border-red-500/30';
      case 'CANCELLED':
        return 'bg-[#2B3139] text-[#B7BDC6] border border-[#3A4049]';
      default:
        return 'bg-[#2B3139] text-[#B7BDC6] border border-[#3A4049]';
    }
  };

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${getStatusStyles()}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};

const TransferRow = ({ transfer, index }) => {
  const { formatTiki } = useTiki();
  
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

  return (
    <tr className={`hover:bg-[#2B3139]/50 transition-colors duration-150 ${index % 2 === 0 ? 'bg-[#1E2329]' : 'bg-[#1A1F29]'}`}>
      <td className="px-6 py-4 text-sm">
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-blue-500/20 border border-blue-500/30 rounded-full flex items-center justify-center">
              <span className="text-blue-400 text-sm font-semibold">
                {transfer.sender_name ? transfer.sender_name.charAt(0).toUpperCase() : 'U'}
              </span>
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-medium text-white truncate" title={transfer.sender_name || 'Unknown User'}>
              {transfer.sender_name || 'Unknown User'}
            </div>
            <div className="text-[#B7BDC6] text-xs truncate" title={transfer.sender_email || 'No email available'}>
              {transfer.sender_email || 'No email available'}
            </div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 text-sm">
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-green-500/20 border border-green-500/30 rounded-full flex items-center justify-center">
              <span className="text-green-400 text-sm font-semibold">
                {transfer.recipient_name ? transfer.recipient_name.charAt(0).toUpperCase() : 'U'}
              </span>
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-medium text-white truncate" title={transfer.recipient_name || 'Unknown User'}>
              {transfer.recipient_name || 'Unknown User'}
            </div>
            <div className="text-[#B7BDC6] text-xs truncate" title={transfer.recipient_email || 'No email available'}>
              {transfer.recipient_email || 'No email available'}
            </div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 text-sm">
        <div className="text-white font-semibold">
          {formatTiki(transfer.amount)} TIKI
        </div>
        <div className="text-[#B7BDC6] text-xs">
          Transfer Amount
        </div>
      </td>
      <td className="px-6 py-4 text-sm text-[#B7BDC6]">
        {transfer.note || '—'}
      </td>
      <td className="px-6 py-4 text-sm">
        <div className="text-white">
          {formatDate(transfer.createdAt)}
        </div>
        <div className="text-[#B7BDC6] text-xs">
          {new Date(transfer.createdAt).toLocaleTimeString()}
        </div>
      </td>
      <td className="px-6 py-4">
        <StatusBadge status={transfer.status} />
      </td>
    </tr>
  );
};

const LoadingSkeleton = () => (
  <>
    {[...Array(5)].map((_, i) => (
      <tr key={i} className={`border-b border-[#2B3139] animate-pulse ${i % 2 === 0 ? 'bg-[#1E2329]' : 'bg-[#1A1F29]'}`}>
        <td className="px-6 py-4"><div className="h-4 bg-[#2B3139] rounded w-24"></div></td>
        <td className="px-6 py-4"><div className="h-4 bg-[#2B3139] rounded w-24"></div></td>
        <td className="px-6 py-4"><div className="h-4 bg-[#2B3139] rounded w-20"></div></td>
        <td className="px-6 py-4"><div className="h-4 bg-[#2B3139] rounded w-16"></div></td>
        <td className="px-6 py-4"><div className="h-4 bg-[#2B3139] rounded w-20"></div></td>
        <td className="px-6 py-4"><div className="h-6 bg-[#2B3139] rounded-full w-20"></div></td>
      </tr>
    ))}
  </>
);

function AdminTransfersPageContent() {
  const { adminUser, isLoading, isAuthenticated } = useAdminAuth();
  const router = useRouter();
  const { success, error, toasts, removeToast } = useToast();
  const { formatTiki } = useTiki();

  const [mounted, setMounted] = useState(false);
  const [transfers, setTransfers] = useState([]);
  const [filteredTransfers, setFilteredTransfers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [errorState, setErrorState] = useState(null);
  const [statistics, setStatistics] = useState({
    total: 0,
    completed: 0,
    pending: 0,
    failed: 0,
    totalAmount: 0,
  });

  useEffect(() => {
    setMounted(true);
    // Initialize authentication
    initializeAuth();
  }, []);

  useEffect(() => {
    if (mounted && !isLoading) {
      if (!isAuthenticated) {
        router.push('/auth/signin');
      } else {
        fetchTransfers();
      }
    }
  }, [mounted, isLoading, isAuthenticated, router]);

  const fetchTransfers = async () => {
    setIsDataLoading(true);
    setErrorState(null);
    try {
      const response = await authenticatedFetch('/api/admin/transfers');
      if (!response.ok) {
        throw new Error(`Failed to fetch transfers: ${response.status}`);
      }
      const data = await response.json();
      if (data.success) {
        setTransfers(data.transfers || []);
        setFilteredTransfers(data.transfers || []);
        setStatistics(data.statistics || statistics);
      } else {
        throw new Error(data.error || 'Failed to load transfers');
      }
    } catch (err) {
      console.error('Error fetching transfers:', err);
      setErrorState(err.message || 'Failed to load transfers');
    } finally {
      setIsDataLoading(false);
    }
  };

  const handleSearch = (term) => {
    setSearchTerm(term);
    if (!term.trim()) {
      setFilteredTransfers(transfers);
      return;
    }

    const filtered = transfers.filter(transfer => {
      const senderName = transfer.sender_name?.toLowerCase() || '';
      const senderEmail = transfer.sender_email?.toLowerCase() || '';
      const recipientName = transfer.recipient_name?.toLowerCase() || '';
      const recipientEmail = transfer.recipient_email?.toLowerCase() || '';
      const searchLower = term.toLowerCase();

      return senderName.includes(searchLower) ||
             senderEmail.includes(searchLower) ||
             recipientName.includes(searchLower) ||
             recipientEmail.includes(searchLower);
    });

    setFilteredTransfers(filtered);
  };

  if (!mounted || isLoading) {
    return (
      <AdminLayout showSidebar={true}>
        <div className="min-h-screen bg-[#181A20] flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F0B90B] mx-auto mb-4"></div>
            <p className="text-[#B7BDC6]">Loading transfers...</p>
          </div>
        </div>
      </AdminLayout>
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
                <h1 className="text-3xl font-bold text-white">Transfer Management</h1>
                <p className="text-[#B7BDC6] mt-1">Monitor and manage all user transfers</p>
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
                      <span className="text-[#F0B90B] text-xl">📊</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-[#B7BDC6]">Total Transfers</p>
                    <p className="text-2xl font-bold text-white">{statistics.total.toLocaleString()}</p>
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
                    <p className="text-2xl font-bold text-white">{statistics.completed.toLocaleString()}</p>
                    <p className="text-xs text-green-500 mt-1">+8.2% from last month</p>
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
                    <p className="text-2xl font-bold text-white">{statistics.pending.toLocaleString()}</p>
                    <p className="text-xs text-yellow-500 mt-1">Awaiting processing</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#1E2329] border-[#2B3139]">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-blue-500/20 border border-blue-500/30 rounded-lg flex items-center justify-center">
                      <span className="text-blue-500 text-xl">💰</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-[#B7BDC6]">Total Volume</p>
                    <p className="text-2xl font-bold text-white">{formatTiki(statistics.totalAmount)} TIKI</p>
                    <p className="text-xs text-[#B7BDC6] mt-1">All transfers</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Search and Filters */}
          <Card className="mb-6 bg-[#1E2329] border-[#2B3139]">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-[#B7BDC6] mb-2">
                    Search Transfers
                  </label>
                  <Input
                    type="text"
                    placeholder="Search by sender, recipient, or email..."
                    value={searchTerm}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="w-full bg-[#2B3139] border-[#3A4049] text-white placeholder-[#B7BDC6] focus:border-[#F0B90B] focus:ring-[#F0B90B]/20"
                  />
                </div>
                <div className="flex items-end">
                  <Button
                    onClick={fetchTransfers}
                    disabled={isDataLoading}
                    className="bg-[#F0B90B] hover:bg-[#F0B90B]/80 text-black font-semibold disabled:opacity-50"
                  >
                    {isDataLoading ? (
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

          {/* Transfers Table */}
          <Card className="bg-[#1E2329] border-[#2B3139]">
            <CardHeader className="border-b border-[#2B3139]">
              <CardTitle className="text-white text-xl font-semibold">Transfer History</CardTitle>
              <p className="text-[#B7BDC6] text-sm mt-1">Monitor and manage all user transfers ({filteredTransfers.length} total)</p>
            </CardHeader>
            <CardContent className="p-0">
              {errorState ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-red-500 text-2xl">⚠️</span>
                  </div>
                  <p className="text-red-400 mb-4">{errorState}</p>
                  <Button 
                    onClick={fetchTransfers} 
                    className="bg-[#F0B90B] hover:bg-[#F0B90B]/80 text-black font-semibold"
                  >
                    Try Again
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead className="bg-[#2B3139]">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-[#B7BDC6] uppercase tracking-wider">Sender</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-[#B7BDC6] uppercase tracking-wider">Recipient</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-[#B7BDC6] uppercase tracking-wider">Amount</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-[#B7BDC6] uppercase tracking-wider">Note</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-[#B7BDC6] uppercase tracking-wider">Date & Time</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-[#B7BDC6] uppercase tracking-wider">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#2B3139]">
                      {isDataLoading ? (
                        <LoadingSkeleton />
                      ) : filteredTransfers.length === 0 ? (
                        <tr>
                          <td colSpan="6" className="px-6 py-12 text-center">
                            <div className="w-16 h-16 bg-[#2B3139] rounded-full flex items-center justify-center mx-auto mb-4">
                              <span className="text-[#B7BDC6] text-2xl">📊</span>
                            </div>
                            <p className="text-[#B7BDC6] text-lg">No transfers found</p>
                            <p className="text-[#B7BDC6] text-sm mt-1">Try adjusting your search terms</p>
                          </td>
                        </tr>
                      ) : (
                        filteredTransfers.map((transfer, index) => (
                          <TransferRow
                            key={transfer.id}
                            transfer={transfer}
                            index={index}
                          />
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </AdminLayout>
  );
}

export default function AdminTransfersPage() {
  return (
    <TikiProvider>
      <AdminTransfersPageContent />
    </TikiProvider>
  );
}
