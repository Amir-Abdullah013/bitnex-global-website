import { NextResponse } from 'next/server';
import { databaseHelpers } from '../../../../lib/database';

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

    // Check if user exists first
    const user = await databaseHelpers.user.getUserById(userId);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Get user's wallet data
    const wallet = await databaseHelpers.wallet.getUserWallet(userId);
    
    if (!wallet) {
      // Create wallet if it doesn't exist
      const newWallet = await databaseHelpers.wallet.createWallet(userId);
      return NextResponse.json({
        success: true,
        usdBalance: newWallet.balance || 0,
        bnxBalance: newWallet.bnxBalance || 0,
        bnxPrice: 0.0035
      });
    }

    // Get current BNX price
    const bnxPrice = await databaseHelpers.tokenStats.getCurrentPrice();

    return NextResponse.json({
      success: true,
      usdBalance: wallet.balance || 0,
      bnxBalance: wallet.bnxBalance || 0,
      bnxPrice: bnxPrice
    });

  } catch (error) {
    console.error('Error fetching wallet balance:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch wallet balance' },
      { status: 500 }
    );
  }
}
