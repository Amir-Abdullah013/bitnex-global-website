/**
 * GET /api/admin/referrals/transactions
 * Get all referral transactions for admin
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

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit')) || 100;
    const offset = parseInt(searchParams.get('offset')) || 0;

    // Get all referral transactions
    const result = await databaseHelpers.pool.query(`
      SELECT 
        rt.id,
        rt."fromUserId",
        rt."toUserId",
        rt.amount,
        rt.level,
        rt."createdAt",
        from_user.name as "fromUserName",
        from_user.email as "fromUserEmail",
        to_user.name as "toUserName",
        to_user.email as "toUserEmail"
      FROM referral_transactions rt
      LEFT JOIN users from_user ON rt."fromUserId" = from_user.id
      LEFT JOIN users to_user ON rt."toUserId" = to_user.id
      ORDER BY rt."createdAt" DESC
      LIMIT $1 OFFSET $2
    `, [limit, offset]);

    // Get total count
    const countResult = await databaseHelpers.pool.query(`
      SELECT COUNT(*) as total
      FROM referral_transactions
    `);

    const transactions = result.rows.map(row => ({
      id: row.id,
      fromUserId: row.fromUserId,
      toUserId: row.toUserId,
      amount: parseFloat(row.amount),
      level: row.level,
      createdAt: row.createdAt,
      fromUserName: row.fromUserName,
      fromUserEmail: row.fromUserEmail,
      toUserName: row.toUserName,
      toUserEmail: row.toUserEmail
    }));

    return NextResponse.json({
      success: true,
      transactions,
      pagination: {
        total: parseInt(countResult.rows[0].total),
        limit,
        offset,
        hasMore: offset + limit < parseInt(countResult.rows[0].total)
      }
    });

  } catch (error) {
    console.error('Error getting referral transactions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
