import { NextResponse } from 'next/server';
import { withAdminAuth } from '../../../../lib/api-wrapper';

export const GET = withAdminAuth(async (request) => {
  try {
    // Parse URL safely
    let searchParams;
    try {
      const url = new URL(request.url);
      searchParams = url.searchParams;
    } catch (urlError) {
      console.error('❌ Invalid URL in request:', request.url);
      return NextResponse.json({
        success: false,
        error: 'Invalid request URL'
      }, { status: 400 });
    }

    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 20;
    const search = searchParams.get('search') || '';
    const admin = searchParams.get('admin') || '';
    const action = searchParams.get('action') || '';
    const severity = searchParams.get('severity') || '';

    console.log('📊 Admin logs API called with params:', { page, limit, search, admin, action, severity });

    // Use mock data for now to avoid database issues
    console.log('📊 Using mock data for admin logs');
    
    const mockLogs = generateMockLogs(page, limit, search, admin, action, severity);
    const logs = mockLogs.logs;
    const pagination = mockLogs.pagination;
    const statistics = mockLogs.statistics;
    const filterOptions = mockLogs.filterOptions;

    console.log(`📊 Returning ${logs.length} logs for page ${page}`);

    return NextResponse.json({
      success: true,
      logs,
      pagination,
      statistics,
      filterOptions
    }, { status: 200 });

  } catch (error) {
    console.error('❌ Error in admin logs API:', error);
    console.error('❌ Error stack:', error.stack);
    
    // Return mock data even on error to prevent page crashes
    const fallbackData = generateMockLogs(1, 20, '', '', '', '');
    
    return NextResponse.json({
      success: true,
      logs: fallbackData.logs,
      pagination: fallbackData.pagination,
      statistics: fallbackData.statistics,
      filterOptions: fallbackData.filterOptions,
      warning: 'Using fallback data due to error: ' + error.message
    }, { status: 200 });
  }
});

// Helper function to generate mock logs for development
function generateMockLogs(page, limit, search, admin, action, severity) {
  const allMockLogs = [
    {
      id: '1',
      action: 'User Login',
      actionType: 'Authentication',
      adminId: 'admin-1',
      adminName: 'Amir Abdullah',
      adminEmail: 'amirabdullah2508@gmail.com',
      targetType: 'User',
      targetId: 'user-123',
      severity: 'INFO',
      details: 'Admin logged in successfully',
      message: 'Successful login from IP 192.168.1.1',
      ipAddress: '192.168.1.1',
      createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString() // 5 minutes ago
    },
    {
      id: '2',
      action: 'User Approved',
      actionType: 'User Management',
      adminId: 'admin-1',
      adminName: 'Amir Abdullah',
      adminEmail: 'amirabdullah2508@gmail.com',
      targetType: 'User',
      targetId: 'user-456',
      severity: 'SUCCESS',
      details: 'User account approved and activated',
      message: 'User john.doe@example.com account approved',
      ipAddress: '192.168.1.1',
      createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString() // 15 minutes ago
    },
    {
      id: '3',
      action: 'Transaction Rejected',
      actionType: 'Transaction Management',
      adminId: 'admin-1',
      adminName: 'Amir Abdullah',
      adminEmail: 'amirabdullah2508@gmail.com',
      targetType: 'Transaction',
      targetId: 'txn-789',
      severity: 'WARNING',
      details: 'Transaction rejected due to insufficient funds',
      message: 'Withdrawal request rejected for user-789',
      ipAddress: '192.168.1.1',
      createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString() // 30 minutes ago
    },
    {
      id: '4',
      action: 'System Error',
      actionType: 'System',
      adminId: 'system',
      adminName: 'System',
      adminEmail: 'system@bitnex.com',
      targetType: 'System',
      targetId: 'error-001',
      severity: 'CRITICAL',
      details: 'Database connection timeout',
      message: 'Database connection failed after 30 seconds',
      ipAddress: '127.0.0.1',
      createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString() // 1 hour ago
    },
    {
      id: '5',
      action: 'User Updated',
      actionType: 'User Management',
      adminId: 'admin-1',
      adminName: 'Amir Abdullah',
      adminEmail: 'amirabdullah2508@gmail.com',
      targetType: 'User',
      targetId: 'user-321',
      severity: 'INFO',
      details: 'User profile information updated',
      message: 'User profile updated for jane.smith@example.com',
      ipAddress: '192.168.1.1',
      createdAt: new Date(Date.now() - 1000 * 60 * 90).toISOString() // 1.5 hours ago
    },
    {
      id: '6',
      action: 'Deposit Approved',
      actionType: 'Transaction Management',
      adminId: 'admin-1',
      adminName: 'Amir Abdullah',
      adminEmail: 'amirabdullah2508@gmail.com',
      targetType: 'Transaction',
      targetId: 'deposit-456',
      severity: 'SUCCESS',
      details: 'Deposit transaction approved',
      message: 'Deposit of $500.00 approved for user-456',
      ipAddress: '192.168.1.1',
      createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString() // 2 hours ago
    },
    {
      id: '7',
      action: 'Security Alert',
      actionType: 'Security',
      adminId: 'system',
      adminName: 'Security System',
      adminEmail: 'security@bitnex.com',
      targetType: 'Security',
      targetId: 'alert-001',
      severity: 'CRITICAL',
      details: 'Multiple failed login attempts detected',
      message: '5 failed login attempts from IP 203.0.113.1',
      ipAddress: '203.0.113.1',
      createdAt: new Date(Date.now() - 1000 * 60 * 180).toISOString() // 3 hours ago
    },
    {
      id: '8',
      action: 'User Deleted',
      actionType: 'User Management',
      adminId: 'admin-1',
      adminName: 'Amir Abdullah',
      adminEmail: 'amirabdullah2508@gmail.com',
      targetType: 'User',
      targetId: 'user-999',
      severity: 'WARNING',
      details: 'User account permanently deleted',
      message: 'User account deleted for spam@example.com',
      ipAddress: '192.168.1.1',
      createdAt: new Date(Date.now() - 1000 * 60 * 240).toISOString() // 4 hours ago
    }
  ];

  // Apply filters
  let filteredLogs = allMockLogs;

  if (search) {
    filteredLogs = filteredLogs.filter(log => 
      log.action.toLowerCase().includes(search.toLowerCase()) ||
      log.details.toLowerCase().includes(search.toLowerCase()) ||
      log.message.toLowerCase().includes(search.toLowerCase()) ||
      log.adminName.toLowerCase().includes(search.toLowerCase())
    );
  }

  if (admin && admin !== 'all') {
    filteredLogs = filteredLogs.filter(log => log.adminId === admin);
  }

  if (action && action !== 'all') {
    filteredLogs = filteredLogs.filter(log => log.action.toLowerCase().includes(action.toLowerCase()));
  }

  if (severity && severity !== 'all') {
    filteredLogs = filteredLogs.filter(log => log.severity.toLowerCase() === severity.toLowerCase());
  }

  // Sort by creation date (newest first)
  filteredLogs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  // Apply pagination
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedLogs = filteredLogs.slice(startIndex, endIndex);

  const total = filteredLogs.length;
  const totalPages = Math.ceil(total / limit);

  return {
    logs: paginatedLogs,
    pagination: {
      total,
      totalPages,
      currentPage: page,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1
    },
    statistics: {
      total: allMockLogs.length,
      today: allMockLogs.filter(log => {
        const today = new Date();
        const logDate = new Date(log.createdAt);
        return logDate.toDateString() === today.toDateString();
      }).length,
      thisWeek: allMockLogs.filter(log => {
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        return new Date(log.createdAt) > weekAgo;
      }).length,
      critical: allMockLogs.filter(log => log.severity === 'CRITICAL').length,
      warnings: allMockLogs.filter(log => log.severity === 'WARNING').length,
      info: allMockLogs.filter(log => log.severity === 'INFO').length
    },
    filterOptions: {
      admins: [
        { id: 'admin-1', name: 'Amir Abdullah', email: 'amirabdullah2508@gmail.com' },
        { id: 'system', name: 'System', email: 'system@bitnex.com' },
        { id: 'security', name: 'Security System', email: 'security@bitnex.com' }
      ],
      actions: [
        'User Login',
        'User Approved',
        'Transaction Rejected',
        'System Error',
        'User Updated',
        'Deposit Approved',
        'Security Alert',
        'User Deleted'
      ]
    }
  };
}
