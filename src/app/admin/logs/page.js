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
import { formatDistanceToNow } from 'date-fns';

export default function AdminLogsPage() {
  const { adminUser, isLoading, isAuthenticated } = useAdminAuth();
  const router = useRouter();
  const { success, error, toasts, removeToast } = useToast();
  const [mounted, setMounted] = useState(false);
  
  // State management
  const [logs, setLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAdmin, setSelectedAdmin] = useState('all');
  const [selectedAction, setSelectedAction] = useState('all');
  const [selectedSeverity, setSelectedSeverity] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalLogs, setTotalLogs] = useState(0);
  const [logsPerPage] = useState(20);
  
  // Statistics
  const [stats, setStats] = useState({
    total: 0,
    today: 0,
    thisWeek: 0,
    critical: 0,
    warnings: 0,
    info: 0
  });
  
  // Filter options
  const [uniqueAdmins, setUniqueAdmins] = useState([]);
  const [uniqueActions, setUniqueActions] = useState([]);

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
      loadLogs();
    }
  }, [mounted, isLoading, isAuthenticated]);

  // Reload logs when filters change
  useEffect(() => {
    if (mounted && isAuthenticated) {
      loadLogs();
    }
  }, [searchTerm, selectedAdmin, selectedAction, selectedSeverity, currentPage]);

  const loadLogs = async () => {
    try {
      setLoadingLogs(true);
      
      // Build query parameters
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: logsPerPage.toString()
      });
      
      if (searchTerm) params.append('search', searchTerm);
      if (selectedAdmin !== 'all') params.append('admin', selectedAdmin);
      if (selectedAction !== 'all') params.append('action', selectedAction);
      if (selectedSeverity !== 'all') params.append('severity', selectedSeverity);
      
      const apiUrl = `/api/admin/logs?${params.toString()}`;
      console.log('📊 Fetching from API:', apiUrl);
      
      const response = await authenticatedFetch(apiUrl);
      
      if (response.ok) {
        const data = await response.json();
        console.log('📊 Logs data from API:', data.logs?.length);
        console.log('📊 Full API response:', data);
        
        setLogs(data.logs || []);
        setFilteredLogs(data.logs || []);
        setTotalPages(data.pagination?.totalPages || 1);
        setTotalLogs(data.pagination?.total || 0);
        
        // Update statistics
        if (data.statistics) {
          setStats(data.statistics);
        }
        
        // Update filter options
        if (data.filterOptions) {
          setUniqueAdmins(data.filterOptions.admins || []);
          setUniqueActions(data.filterOptions.actions || []);
        }
        
        // Show warning if using fallback data
        if (data.warning) {
          console.warn('⚠️ API Warning:', data.warning);
        }
      } else {
        console.error('❌ API response not OK:', response.status, response.statusText);
        const errorData = await response.json().catch(() => ({ error: 'Failed to parse error response' }));
        console.error('❌ Error data:', errorData);
        error('Failed to load logs: ' + (errorData.error || 'Unknown error'));
        setLogs([]);
        setFilteredLogs([]);
        setTotalPages(1);
        setTotalLogs(0);
      }
    } catch (err) {
      console.error('❌ Error loading logs:', err);
      console.error('❌ Error details:', {
        message: err.message,
        stack: err.stack,
        name: err.name
      });
      
      // Show more specific error message
      if (err.message.includes('Invalid URL')) {
        error('Invalid URL error - please check the API endpoint');
      } else if (err.message.includes('Failed to fetch')) {
        error('Network error - please check your connection');
      } else {
        error('Failed to load logs: ' + err.message);
      }
      
      setLogs([]);
      setFilteredLogs([]);
      setTotalPages(1);
      setTotalLogs(0);
    } finally {
      setLoadingLogs(false);
    }
  };

  const getCurrentPageLogs = () => {
    return filteredLogs;
  };

  const getActionIcon = (action) => {
    if (action.toLowerCase().includes('approve')) return '✅';
    if (action.toLowerCase().includes('reject')) return '❌';
    if (action.toLowerCase().includes('create')) return '➕';
    if (action.toLowerCase().includes('update')) return '✏️';
    if (action.toLowerCase().includes('delete')) return '🗑️';
    if (action.toLowerCase().includes('login')) return '🔐';
    if (action.toLowerCase().includes('logout')) return '🚪';
    if (action.toLowerCase().includes('error')) return '⚠️';
    if (action.toLowerCase().includes('warning')) return '⚠️';
    if (action.toLowerCase().includes('critical')) return '🚨';
    return '📝';
  };

  const getActionColor = (action) => {
    if (action.toLowerCase().includes('approve')) return 'text-green-400';
    if (action.toLowerCase().includes('reject')) return 'text-red-400';
    if (action.toLowerCase().includes('create')) return 'text-blue-400';
    if (action.toLowerCase().includes('update')) return 'text-yellow-400';
    if (action.toLowerCase().includes('delete')) return 'text-red-400';
    if (action.toLowerCase().includes('login')) return 'text-green-400';
    if (action.toLowerCase().includes('logout')) return 'text-[#B7BDC6]';
    if (action.toLowerCase().includes('error')) return 'text-red-400';
    if (action.toLowerCase().includes('warning')) return 'text-yellow-400';
    if (action.toLowerCase().includes('critical')) return 'text-red-500';
    return 'text-[#B7BDC6]';
  };

  const getSeverityColor = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'critical':
        return 'bg-red-500/20 text-red-400 border border-red-500/30';
      case 'error':
        return 'bg-red-500/20 text-red-400 border border-red-500/30';
      case 'warning':
        return 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30';
      case 'info':
        return 'bg-blue-500/20 text-blue-400 border border-blue-500/30';
      case 'success':
        return 'bg-green-500/20 text-green-400 border border-green-500/30';
      default:
        return 'bg-[#2B3139] text-[#B7BDC6] border border-[#3A4049]';
    }
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

  if (!mounted || isLoading) {
    return (
      <AdminLayout showSidebar={true}>
        <div className="min-h-screen bg-[#181A20] flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F0B90B] mx-auto mb-4"></div>
            <p className="text-[#B7BDC6]">Loading logs...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (!isAuthenticated) {
    return (
      <AdminLayout showSidebar={true}>
        <div className="min-h-screen bg-[#181A20] flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F0B90B] mx-auto mb-4"></div>
            <p className="text-[#B7BDC6]">Redirecting to sign in...</p>
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
                <h1 className="text-3xl font-bold text-white">Admin Activity Logs</h1>
                <p className="text-[#B7BDC6] mt-1">Monitor and audit all admin activities for transparency</p>
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
                    <p className="text-sm font-medium text-[#B7BDC6]">Total Logs</p>
                    <p className="text-2xl font-bold text-white">{stats.total.toLocaleString()}</p>
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
                      <span className="text-green-500 text-xl">📅</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-[#B7BDC6]">Today</p>
                    <p className="text-2xl font-bold text-white">{stats.today.toLocaleString()}</p>
                    <p className="text-xs text-green-500 mt-1">+12.5% from yesterday</p>
                  </div>
              </div>
              </CardContent>
            </Card>
            
            <Card className="bg-[#1E2329] border-[#2B3139]">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-red-500/20 border border-red-500/30 rounded-lg flex items-center justify-center">
                      <span className="text-red-500 text-xl">🚨</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-[#B7BDC6]">Critical</p>
                    <p className="text-2xl font-bold text-white">{stats.critical.toLocaleString()}</p>
                    <p className="text-xs text-red-500 mt-1">Requires attention</p>
                  </div>
              </div>
              </CardContent>
            </Card>
            
            <Card className="bg-[#1E2329] border-[#2B3139]">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-blue-500/20 border border-blue-500/30 rounded-lg flex items-center justify-center">
                      <span className="text-blue-500 text-xl">👥</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-[#B7BDC6]">Active Admins</p>
                    <p className="text-2xl font-bold text-white">{uniqueAdmins.length}</p>
                    <p className="text-xs text-[#B7BDC6] mt-1">Currently active</p>
                  </div>
              </div>
              </CardContent>
            </Card>
          </div>

          {/* Search and Filters */}
          <Card className="mb-6 bg-[#1E2329] border-[#2B3139]">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                  <label className="block text-sm font-medium text-[#B7BDC6] mb-2">
                    Search Logs
                </label>
                  <Input
                    type="text"
                    placeholder="Search by action, admin, or details..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-[#2B3139] border-[#3A4049] text-white placeholder-[#B7BDC6] focus:border-[#F0B90B] focus:ring-[#F0B90B]/20"
                  />
                </div>
              <div>
                  <label className="block text-sm font-medium text-[#B7BDC6] mb-2">
                  Filter by Admin
                </label>
                <select
                  value={selectedAdmin}
                    onChange={(e) => setSelectedAdmin(e.target.value)}
                    className="w-full px-3 py-2 bg-[#2B3139] border border-[#3A4049] text-white rounded-md focus:outline-none focus:ring-2 focus:ring-[#F0B90B]/20 focus:border-[#F0B90B]"
                  >
                    <option value="all">All Admins</option>
                    {uniqueAdmins.map((admin) => (
                      <option key={admin.id} value={admin.id}>
                        {admin.name || admin.email}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#B7BDC6] mb-2">
                    Filter by Action
                  </label>
                  <select
                    value={selectedAction}
                    onChange={(e) => setSelectedAction(e.target.value)}
                    className="w-full px-3 py-2 bg-[#2B3139] border border-[#3A4049] text-white rounded-md focus:outline-none focus:ring-2 focus:ring-[#F0B90B]/20 focus:border-[#F0B90B]"
                  >
                    <option value="all">All Actions</option>
                    {uniqueActions.map((action) => (
                      <option key={action} value={action}>
                        {action}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-end">
                <Button
                    onClick={loadLogs}
                    disabled={loadingLogs}
                    className="w-full bg-[#F0B90B] hover:bg-[#F0B90B]/80 text-black font-semibold disabled:opacity-50"
                  >
                    {loadingLogs ? (
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

          {/* Logs Table */}
          <Card className="bg-[#1E2329] border-[#2B3139]">
            <CardHeader className="border-b border-[#2B3139]">
              <CardTitle className="text-white text-xl font-semibold">Activity Logs</CardTitle>
              <p className="text-[#B7BDC6] text-sm mt-1">Monitor and audit all admin activities ({totalLogs.toLocaleString()} total)</p>
            </CardHeader>
            <CardContent className="p-0">
              {loadingLogs ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F0B90B] mx-auto mb-4"></div>
                    <span className="text-[#B7BDC6]">Loading logs...</span>
                  </div>
                </div>
              ) : (
                <>
                  {getCurrentPageLogs().length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-[#2B3139] rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-[#B7BDC6] text-2xl">📋</span>
                      </div>
                      <p className="text-[#B7BDC6] text-lg">No logs found</p>
                      <p className="text-[#B7BDC6] text-sm mt-1">Try adjusting your search terms or filters</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full">
                        <thead className="bg-[#2B3139]">
                          <tr>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-[#B7BDC6] uppercase tracking-wider">Action</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-[#B7BDC6] uppercase tracking-wider">Admin</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-[#B7BDC6] uppercase tracking-wider">Target</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-[#B7BDC6] uppercase tracking-wider">Severity</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-[#B7BDC6] uppercase tracking-wider">Date & Time</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-[#B7BDC6] uppercase tracking-wider">Details</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#2B3139]">
                          {getCurrentPageLogs().map((log, index) => (
                            <tr key={log.id || log.$id} className={`hover:bg-[#2B3139]/50 transition-colors ${index % 2 === 0 ? 'bg-[#1E2329]' : 'bg-[#1A1F29]'}`}>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center space-x-3">
                    <div className="text-2xl">
                      {getActionIcon(log.action)}
                    </div>
                                  <div>
                                    <div className={`text-sm font-semibold ${getActionColor(log.action)}`}>
                          {log.action}
                      </div>
                                    <div className="text-xs text-[#B7BDC6]">
                                      {log.actionType || 'System Action'}
                        </div>
                        </div>
                          </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                                  <div className="text-sm font-medium text-white">
                                    {log.adminName || log.adminId || 'Unknown Admin'}
                          </div>
                                  <div className="text-sm text-[#B7BDC6]">
                                    {log.adminEmail || log.adminId}
                        </div>
                      </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div>
                                  <div className="text-sm text-white">
                                    {log.targetType || 'System'}
                                  </div>
                                  <div className="text-xs text-[#B7BDC6]">
                                    {log.targetId || 'N/A'}
                    </div>
                  </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getSeverityColor(log.severity)}`}>
                                  {log.severity || 'INFO'}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-white">
                                  {formatDate(log.createdAt)}
                                </div>
                                <div className="text-xs text-[#B7BDC6]">
                                  {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="text-sm text-[#B7BDC6] max-w-xs truncate" title={log.details || log.message}>
                                  {log.details || log.message || 'No details available'}
                </div>
                                {log.ipAddress && (
                                  <div className="text-xs text-[#B7BDC6] mt-1">
                                    IP: {log.ipAddress}
          </div>
        )}
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
                        Showing {((currentPage - 1) * logsPerPage) + 1} to {Math.min(currentPage * logsPerPage, totalLogs)} of {totalLogs.toLocaleString()} logs
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
        <ToastContainer toasts={toasts} removeToast={removeToast} />
      </div>
    </AdminLayout>
  );
}















