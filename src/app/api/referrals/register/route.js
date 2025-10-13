/**
 * POST /api/referrals/register
 * Registers a referral when a new user signs up using someone's code
 */

import { NextResponse } from 'next/server';
import databaseHelpers from '../../../../lib/database';

export async function POST(request) {
  try {
    const { userId, referralCode } = await request.json();

    // Validate required fields
    if (!userId || !referralCode) {
      return NextResponse.json(
        { error: 'User ID and referral code are required' },
        { status: 400 }
      );
    }

    // Validate referral code exists
    const referrer = await databaseHelpers.referral.validateReferralCode(referralCode);
    if (!referrer) {
      return NextResponse.json(
        { error: 'Invalid referral code' },
        { status: 400 }
      );
    }

    // Check if user already has a referrer
    const userResult = await databaseHelpers.user.getUserById(userId);
    if (!userResult) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    if (userResult.referredBy) {
      return NextResponse.json(
        { error: 'User already has a referrer' },
        { status: 400 }
      );
    }

    // Update user with referral information
    const updatedUser = await databaseHelpers.user.updateUser(userId, {
      referredBy: referralCode,
      referralLevel: (referrer.referralLevel || 0) + 1
    });

    // Create referral record
    const referralId = require('crypto').randomUUID();
    await databaseHelpers.pool.query(`
      INSERT INTO referrals (id, "referrerId", "referredId", "referralCode", level, status, "createdAt", "updatedAt")
      VALUES ($1, $2, $3, $4, $5, 'ACTIVE', NOW(), NOW())
    `, [referralId, referrer.id, userId, referralCode, updatedUser.referralLevel]);

    return NextResponse.json({
      success: true,
      message: 'Referral registered successfully',
      data: {
        referralId,
        referrer: {
          id: referrer.id,
          name: referrer.name,
          email: referrer.email,
          referralCode: referrer.referralCode
        },
        referredUser: {
          id: userId,
          referralLevel: updatedUser.referralLevel
        }
      }
    });

  } catch (error) {
    console.error('Error registering referral:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
