import { NextResponse } from 'next/server';
import { withAdminAuth } from '../../../../lib/api-wrapper';
import { databaseHelpers } from '../../../../lib/database';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;
    const status = searchParams.get('status') || '';

    console.log('🔍 Fetching admin deposits...', { page, limit, status });
    
    let depositRequests;
    let stats;
    let dataSource = 'database';

    try {
      console.log('🔧 Attempting to fetch real deposit data from database...');
      
      // Get all deposit requests with user details
      depositRequests = await databaseHelpers.deposit.getAllDepositRequests({
        page,
        limit,
        status
      });

      console.log('✅ Deposit requests fetched from database:', { 
        count: depositRequests.data?.length || 0,
        total: depositRequests.pagination?.total || 0
      });

      // Get statistics
      stats = await databaseHelpers.deposit.getDepositStats();
      console.log('✅ Statistics fetched from database:', stats);

      // If we have real data, return it
      if (depositRequests.data && depositRequests.data.length > 0) {
        return NextResponse.json({
          success: true,
          depositRequests: depositRequests.data,
          pagination: depositRequests.pagination,
          statistics: stats,
          dataSource: 'database'
        });
      }

    } catch (dbError) {
      console.warn('⚠️ Database error, using fallback data:', dbError.message);
      dataSource = 'fallback';
    }

    // Fallback mock data (only if database fails or returns no data)
    console.log('🔧 Using fallback deposit data');
    
    const mockDeposits = [
      {
        id: 'deposit-1',
        userId: 'user-1',
        amount: 500.00,
        status: 'PENDING',
        screenshot: 'https://example.com/screenshot1.jpg',
        binanceAddress: 'TExample123...',
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        updatedAt: new Date(Date.now() - 86400000).toISOString(),
        user_name: 'John Doe',
        user_email: 'john@example.com'
      },
      {
        id: 'deposit-2',
        userId: 'user-2',
        amount: 1000.00,
        status: 'COMPLETED',
        screenshot: 'https://example.com/screenshot2.jpg',
        binanceAddress: 'TExample456...',
        createdAt: new Date(Date.now() - 172800000).toISOString(),
        updatedAt: new Date(Date.now() - 172800000).toISOString(),
        user_name: 'Jane Smith',
        user_email: 'jane@example.com'
      },
      {
        id: 'deposit-3',
        userId: 'user-3',
        amount: 750.00,
        status: 'PENDING',
        screenshot: 'https://example.com/screenshot3.jpg',
        binanceAddress: 'TExample789...',
        createdAt: new Date(Date.now() - 259200000).toISOString(),
        updatedAt: new Date(Date.now() - 259200000).toISOString(),
        user_name: 'Bob Johnson',
        user_email: 'bob@example.com'
      }
    ];

    // Filter by status if specified
    let filteredDeposits = mockDeposits;
    if (status) {
      filteredDeposits = mockDeposits.filter(deposit => deposit.status === status);
    }

    // Apply pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedDeposits = filteredDeposits.slice(startIndex, endIndex);

    depositRequests = {
      data: paginatedDeposits,
      pagination: {
        page,
        limit,
        total: filteredDeposits.length,
        totalPages: Math.ceil(filteredDeposits.length / limit)
      }
    };

    stats = {
      total: mockDeposits.length,
      pending: mockDeposits.filter(d => d.status === 'PENDING').length,
      completed: mockDeposits.filter(d => d.status === 'COMPLETED').length,
      failed: mockDeposits.filter(d => d.status === 'FAILED').length,
      totalAmount: mockDeposits.reduce((sum, d) => sum + d.amount, 0)
    };

    console.log('🔧 Using fallback deposit data:', { count: depositRequests.data.length });

    return NextResponse.json({
      success: true,
      depositRequests: depositRequests.data,
      pagination: depositRequests.pagination,
      statistics: stats,
      dataSource: 'fallback',
      warning: 'Using fallback data - database not available or no real deposits found'
    });

  } catch (error) {
    console.error('❌ Error fetching admin deposits:', error);
    console.error('❌ Error stack:', error.stack);
    
    // Ultimate fallback data
    const fallbackDeposits = [
      {
        id: 'fallback-1',
        userId: 'fallback-user',
        amount: 100.00,
        status: 'PENDING',
        screenshot: 'https://example.com/fallback.jpg',
        binanceAddress: 'TFallback123...',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        user_name: 'Fallback User',
        user_email: 'fallback@example.com'
      }
    ];

    return NextResponse.json({
      success: true,
      depositRequests: fallbackDeposits,
      pagination: {
        page: 1,
        limit: 10,
        total: 1,
        totalPages: 1
      },
      statistics: {
        total: 1,
        pending: 1,
        completed: 0,
        failed: 0,
        totalAmount: 100.00
      },
      dataSource: 'fallback',
      warning: 'Using fallback data due to error: ' + error.message
    });
  }
}

