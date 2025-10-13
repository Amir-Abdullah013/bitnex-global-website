/**
 * POST /api/referrals/reward
 * Triggered when a referred user performs a profitable action
 * Distributes commission to referrers according to tier logic
 */

import { NextResponse } from 'next/server';
import databaseHelpers from '../../../../lib/database';

export async function POST(request) {
  try {
    const { userId, amount, sourceType, sourceId } = await request.json();

    // Validate required fields
    if (!userId || !amount || !sourceType) {
      return NextResponse.json(
        { error: 'User ID, amount, and source type are required' },
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

    // Check if user exists
    const user = await databaseHelpers.user.getUserById(userId);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if user has a referrer
    if (!user.referredBy) {
      return NextResponse.json(
        { error: 'User has no referrer' },
        { status: 400 }
      );
    }

    // Distribute referral rewards
    const rewards = await databaseHelpers.referral.distributeReferralRewards(
      userId, 
      amount, 
      sourceType, 
      sourceId
    );

    return NextResponse.json({
      success: true,
      message: 'Referral rewards distributed successfully',
      data: {
        userId,
        amount,
        sourceType,
        sourceId,
        rewardsDistributed: rewards.length,
        totalRewardsAmount: rewards.reduce((sum, reward) => sum + reward.amount, 0),
        rewards: rewards.map(reward => ({
          userId: reward.userId,
          amount: reward.amount,
          percentage: reward.percentage,
          level: reward.level
        }))
      }
    });

  } catch (error) {
    console.error('Error distributing referral rewards:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
