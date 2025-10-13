/**
 * GET /api/admin/referrals/settings
 * Get referral program settings
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

    // Get settings from database
    const settings = await databaseHelpers.system.getSetting('REFERRAL_SETTINGS');
    
    const defaultSettings = {
      isEnabled: true,
      commissionRates: {
        level1: 10,
        level2: 5,
        level3: 2,
        level4: 1
      }
    };

    const referralSettings = settings ? JSON.parse(settings.value) : defaultSettings;

    return NextResponse.json({
      success: true,
      settings: referralSettings
    });

  } catch (error) {
    console.error('Error getting referral settings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/referrals/settings
 * Update referral program settings
 */

export async function POST(request) {
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

    const { isEnabled, commissionRates } = await request.json();

    // Validate settings
    if (typeof isEnabled !== 'boolean') {
      return NextResponse.json(
        { error: 'isEnabled must be a boolean' },
        { status: 400 }
      );
    }

    if (!commissionRates || typeof commissionRates !== 'object') {
      return NextResponse.json(
        { error: 'commissionRates must be an object' },
        { status: 400 }
      );
    }

    // Validate commission rates
    const requiredLevels = ['level1', 'level2', 'level3', 'level4'];
    for (const level of requiredLevels) {
      if (!(level in commissionRates) || typeof commissionRates[level] !== 'number') {
        return NextResponse.json(
          { error: `Invalid commission rate for ${level}` },
          { status: 400 }
        );
      }
      
      if (commissionRates[level] < 0 || commissionRates[level] > 100) {
        return NextResponse.json(
          { error: `Commission rate for ${level} must be between 0 and 100` },
          { status: 400 }
        );
      }
    }

    // Save settings to database
    const settingsData = {
      isEnabled,
      commissionRates
    };

    await databaseHelpers.system.setSetting(
      'REFERRAL_SETTINGS',
      JSON.stringify(settingsData),
      'Referral program settings including commission rates and program status'
    );

    return NextResponse.json({
      success: true,
      message: 'Settings updated successfully',
      settings: settingsData
    });

  } catch (error) {
    console.error('Error updating referral settings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
