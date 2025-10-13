/**
 * GET /api/admin/referrals/stats
 * Get referral program statistics for admin
 */

import { NextResponse } from 'next/server';
import { getServerSession, getUserRole } from '../../../../../lib/session';
import { databaseHelpers } from '../../../../../lib/database';

export async function GET(request) {
  try {
    const session = await getServerSession();
    if (!session?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check if user is admin
    const userRole = await getUserRole(session);
    if (userRole !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Get comprehensive referral statistics
    const [
      totalReferralsResult,
      totalEarningsResult,
      activeReferrersResult,
      totalTransactionsResult,
      earningsByLevelResult,
      recentActivityResult
    ] = await Promise.all([
      // Total referrals count
      databaseHelpers.pool.query(`
        SELECT COUNT(*) as total
        FROM referrals
        WHERE status = 'ACTIVE'
      `),
      
      // Total earnings distributed
      databaseHelpers.pool.query(`
        SELECT COALESCE(SUM(amount), 0) as total
        FROM referral_rewards
        WHERE status = 'PAID'
      `),
      
      // Active referrers (users who have referred others)
      databaseHelpers.pool.query(`
        SELECT COUNT(DISTINCT "referrerId") as total
        FROM referrals
        WHERE status = 'ACTIVE'
      `),
      
      // Total referral transactions
      databaseHelpers.pool.query(`
        SELECT COUNT(*) as total
        FROM referral_transactions
      `),
      
      // Earnings by level
      databaseHelpers.pool.query(`
        SELECT level, COALESCE(SUM(amount), 0) as earnings, COUNT(*) as count
        FROM referral_rewards
        WHERE status = 'PAID'
        GROUP BY level
        ORDER BY level
      `),
      
      // Recent activity (last 30 days)
      databaseHelpers.pool.query(`
        SELECT 
          DATE("createdAt") as date,
          COUNT(*) as transactions,
          COALESCE(SUM(amount), 0) as total_amount
        FROM referral_rewards
        WHERE "createdAt" >= NOW() - INTERVAL '30 days'
        AND status = 'PAID'
        GROUP BY DATE("createdAt")
        ORDER BY date DESC
        LIMIT 30
      `)
    ]);

    const stats = {
      totalReferrals: parseInt(totalReferralsResult.rows[0].total),
      totalEarnings: parseFloat(totalEarningsResult.rows[0].total),
      activeReferrers: parseInt(activeReferrersResult.rows[0].total),
      totalTransactions: parseInt(totalTransactionsResult.rows[0].total),
      earningsByLevel: earningsByLevelResult.rows.map(row => ({
        level: row.level,
        earnings: parseFloat(row.earnings),
        count: parseInt(row.count)
      })),
      recentActivity: recentActivityResult.rows.map(row => ({
        date: row.date,
        transactions: parseInt(row.transactions),
        totalAmount: parseFloat(row.total_amount)
      }))
    };

    return NextResponse.json({
      success: true,
      stats
    });

  } catch (error) {
    console.error('Error getting referral stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
