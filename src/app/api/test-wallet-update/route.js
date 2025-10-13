import { NextResponse } from 'next/server';
import { databaseHelpers } from '../../../lib/database';

export async function POST(request) {
  try {
    const { userId, amount } = await request.json();
    
    if (!userId || !amount) {
      return NextResponse.json(
        { success: false, error: 'userId and amount are required' },
        { status: 400 }
      );
    }

    console.log('🔧 Testing wallet balance update:', { userId, amount });

    // First, ensure user has a wallet
    let userWallet = await databaseHelpers.wallet.getWalletByUserId(userId);
    if (!userWallet) {
      console.log('🔧 Creating wallet for user:', userId);
      userWallet = await databaseHelpers.wallet.createWallet(userId);
    }

    // Get current balance
    const currentBalance = userWallet.balance;
    console.log('🔧 Current balance:', currentBalance);

    // Update the balance
    const updatedWallet = await databaseHelpers.wallet.updateBalance(userId, amount);
    console.log('✅ Wallet balance updated:', updatedWallet.balance);

    return NextResponse.json({
      success: true,
      message: 'Wallet balance updated successfully',
      previousBalance: currentBalance,
      newBalance: updatedWallet.balance,
      amountAdded: amount
    });

  } catch (error) {
    console.error('❌ Test wallet update error:', error);
    return NextResponse.json(
      { success: false, error: 'Test wallet update failed' },
      { status: 500 }
    );
  }
}
