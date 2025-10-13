import { NextResponse } from 'next/server';
import { withAdminAuth } from '../../../../lib/api-wrapper';
import { databaseHelpers } from '../../../../lib/database';

export const GET = withAdminAuth(async (request) => {
  try {
    console.log('🔍 Admin withdrawals API called');

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;
    const status = searchParams.get('status') || '';

    // Get all withdrawal transactions with user details
    console.log('🔍 Fetching withdrawals from database...');
    let withdrawals;
    try {
      withdrawals = await databaseHelpers.transaction.getAllTransactions({
        type: 'WITHDRAW',
        page,
        limit,
        status
      });
      console.log('🔍 Withdrawals fetched:', { count: withdrawals.data?.length || 0 });
    } catch (withdrawalError) {
      console.error('❌ Error fetching withdrawals:', withdrawalError);
      withdrawals = { data: [], pagination: {} };
    }

    // Get statistics
    console.log('🔍 Fetching withdrawal statistics...');
    let stats;
    try {
      stats = await databaseHelpers.transaction.getTransactionStats('WITHDRAW');
      console.log('🔍 Statistics fetched:', stats);
    } catch (statsError) {
      console.error('❌ Error fetching statistics:', statsError);
      stats = {};
    }

    return NextResponse.json({
      success: true,
      withdrawals: withdrawals.data || [],
      pagination: withdrawals.pagination || {},
      statistics: stats || {}
    });

  } catch (error) {
    console.error('Error fetching admin withdrawals:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch withdrawal requests' },
      { status: 500 }
    );
  }
});

