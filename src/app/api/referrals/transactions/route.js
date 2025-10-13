/**
 * GET /api/referrals/transactions
 * Get referral transaction history for a user
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
    const limit = parseInt(searchParams.get('limit')) || 20;
    const userId = searchParams.get('userId') || session.id;

    // Get referral transactions
    const transactions = await referralRewardService.getReferralTransactions(userId, limit);

    return NextResponse.json({
      success: true,
      transactions
    });

  } catch (error) {
    console.error('Error getting referral transactions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
