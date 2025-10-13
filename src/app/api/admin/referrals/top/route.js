/**
 * GET /api/admin/referrals/top
 * Get top referrers by earnings
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
    const limit = parseInt(searchParams.get('limit')) || 20;

    // Get top referrers by earnings
    const result = await databaseHelpers.pool.query(`
      SELECT 
        u.id,
        u.name,
        u.email,
        u."referralCode",
        u."referralLevel",
        u."referralEarnings",
        COUNT(r.id) as "totalReferrals"
      FROM users u
      LEFT JOIN referrals r ON u.id = r."referrerId" AND r.status = 'ACTIVE'
      WHERE u."referralEarnings" > 0
      GROUP BY u.id, u.name, u.email, u."referralCode", u."referralLevel", u."referralEarnings"
      ORDER BY u."referralEarnings" DESC
      LIMIT $1
    `, [limit]);

    const referrers = result.rows.map(row => ({
      id: row.id,
      name: row.name,
      email: row.email,
      referralCode: row.referralCode,
      referralLevel: row.referralLevel,
      totalEarnings: parseFloat(row.referralEarnings),
      totalReferrals: parseInt(row.totalReferrals)
    }));

    return NextResponse.json({
      success: true,
      referrers
    });

  } catch (error) {
    console.error('Error getting top referrers:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
