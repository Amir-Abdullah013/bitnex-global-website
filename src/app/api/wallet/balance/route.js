import { NextResponse } from 'next/server';
import databaseHelpers from '../../../../lib/database';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    console.log('🔍 Fetching wallet balance for user:', userId);

    // Get user from database
    const user = await databaseHelpers.user.getUserById(userId);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Get current BNX price from database
    const bnxPrice = await databaseHelpers.market.getCurrentPrice('BNX');
    
    // Get user's wallet balances
    const usdBalance = user.usdBalance || 0;
    const bnxBalance = user.bnxBalance || 0;

    console.log('🔍 Wallet data:', { usdBalance, bnxBalance, bnxPrice });

    return NextResponse.json({
      success: true,
      usdBalance,
      bnxBalance,
      bnxPrice: bnxPrice || 0.0035
    });

  } catch (error) {
    console.error('❌ Error fetching wallet balance:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch wallet balance' },
      { status: 500 }
    );
  }
}