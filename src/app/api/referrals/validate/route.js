/**
 * POST /api/referrals/validate
 * Validates a referral code
 */

import { NextResponse } from 'next/server';
import databaseHelpers from '../../../../lib/database';

export async function POST(request) {
  try {
    const { referralCode } = await request.json();

    if (!referralCode) {
      return NextResponse.json(
        { error: 'Referral code is required' },
        { status: 400 }
      );
    }

    // Validate referral code
    const referrer = await databaseHelpers.referral.validateReferralCode(referralCode);
    
    if (!referrer) {
      return NextResponse.json({
        success: false,
        valid: false,
        message: 'Invalid referral code'
      });
    }

    return NextResponse.json({
      success: true,
      valid: true,
      message: 'Valid referral code',
      data: {
        referrer: {
          id: referrer.id,
          name: referrer.name,
          email: referrer.email,
          referralCode: referrer.referralCode
        }
      }
    });

  } catch (error) {
    console.error('Error validating referral code:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
