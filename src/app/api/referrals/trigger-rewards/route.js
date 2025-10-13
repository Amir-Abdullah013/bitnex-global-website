/**
 * POST /api/referrals/trigger-rewards
 * Manually trigger referral rewards for testing purposes
 */

import { NextResponse } from 'next/server';
import { getServerSession } from '../../../../lib/session';
import referralRewardService from '../../../../lib/referral-reward-service';

export async function POST(request) {
  try {
    const session = await getServerSession();
    if (!session?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { userId, amount, sourceType, sourceId } = await request.json();

    // Validate required fields
    if (!userId || !amount || !sourceType) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, amount, sourceType' },
        { status: 400 }
      );
    }

    // Validate amount
    if (isNaN(amount) || amount <= 0) {
      return NextResponse.json(
        { error: 'Invalid amount' },
        { status: 400 }
      );
    }

    // Validate source type
    const validSourceTypes = ['DEPOSIT', 'TRADE', 'INVESTMENT', 'STAKING'];
    if (!validSourceTypes.includes(sourceType)) {
      return NextResponse.json(
        { error: 'Invalid source type. Must be one of: ' + validSourceTypes.join(', ') },
        { status: 400 }
      );
    }

    // Trigger referral rewards
    const result = await referralRewardService.triggerReferralRewards(
      userId,
      amount,
      sourceType,
      sourceId || `manual-${Date.now()}`
    );

    return NextResponse.json({
      success: true,
      message: 'Referral rewards triggered successfully',
      data: result
    });

  } catch (error) {
    console.error('Error triggering referral rewards:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
