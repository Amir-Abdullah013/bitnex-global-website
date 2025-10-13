/**
 * GET /api/referrals/stats
 * Get referral statistics for a user
 */

import { NextResponse } from 'next/server';
import { getServerSession } from '../../../../lib/session';
import referralRewardService from '../../../../lib/referral-reward-service';

export async function GET(request) {
  try {
    const session = await getServerSession();
    if (!session?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || session.id;

    // Get referral statistics
    const stats = await referralRewardService.getReferralStats(userId);

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
