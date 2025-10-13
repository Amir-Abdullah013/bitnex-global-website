/**
 * GET /api/referrals/:userId
 * Returns the user's referral summary including total referred users, earnings, and referral tree
 */

import { NextResponse } from 'next/server';
import databaseHelpers from '../../../../lib/database';

export async function GET(request, { params }) {
  try {
    const { userId } = params;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Try to get user's referral summary
    let summary;
    try {
      summary = await databaseHelpers.referral.getUserReferralSummary(userId);
    } catch (dbError) {
      console.warn('Database error, creating default referral data:', dbError);
      // Create default referral data if user doesn't exist
      summary = {
        referralCode: 'BNX' + Math.random().toString(36).substr(2, 6).toUpperCase(),
        totalReferrals: 0,
        totalEarnings: 0,
        referralLevel: 0,
        referralTree: [],
        earningsByLevel: {
          level1: 0,
          level2: 0,
          level3: 0,
          level4: 0
        }
      };
    }
    
    if (!summary) {
      // Create default referral data if user doesn't exist
      summary = {
        referralCode: 'BNX' + Math.random().toString(36).substr(2, 6).toUpperCase(),
        totalReferrals: 0,
        totalEarnings: 0,
        referralLevel: 0,
        referralTree: [],
        earningsByLevel: {
          level1: 0,
          level2: 0,
          level3: 0,
          level4: 0
        }
      };
    }

    // Get referral rewards history (with fallback)
    let rewards = [];
    try {
      rewards = await databaseHelpers.referral.getReferralRewards(userId, 10);
    } catch (error) {
      console.warn('Could not fetch referral rewards:', error);
      rewards = [];
    }

    return NextResponse.json({
      success: true,
      data: {
        ...summary,
        recentRewards: rewards,
        referralUrl: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/signup?ref=${summary.referralCode}`
      }
    });

  } catch (error) {
    console.error('Error getting referral summary:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
