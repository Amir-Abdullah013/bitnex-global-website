import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request) {
  try {
    const { userId, usdAmount } = await request.json();
    
    if (!userId || !usdAmount || usdAmount <= 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid user ID or amount' },
        { status: 400 }
      );
    }

    // Get current Tiki price
    const latestPrice = await prisma.price.findFirst({
      where: { symbol: 'TIKI' },
      orderBy: { timestamp: 'desc' }
    });

    const currentPrice = latestPrice?.price || 0.0035; // Default Tiki price

    // Calculate tokens to buy
    const tokensToBuy = usdAmount / currentPrice;

    // Get user's current balance
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if user has sufficient USD balance
    if (user.usdBalance < usdAmount) {
      return NextResponse.json(
        { success: false, error: 'Insufficient USD balance' },
        { status: 400 }
      );
    }

    // Update user balances
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        usdBalance: user.usdBalance - usdAmount,
        tikiBalance: (user.tikiBalance || 0) + tokensToBuy
      }
    });

    // Create transaction record
    await prisma.transaction.create({
      data: {
        userId: userId,
        type: 'BUY',
        amount: usdAmount,
        tokenAmount: tokensToBuy,
        tokenType: 'TIKI',
        price: currentPrice,
        status: 'COMPLETED'
      }
    });

    return NextResponse.json({
      success: true,
      tokensBought: tokensToBuy,
      usdSpent: usdAmount,
      currentPrice: currentPrice,
      newUsdBalance: updatedUser.usdBalance,
      newTikiBalance: updatedUser.tikiBalance
    });

  } catch (error) {
    console.error('Error in Tiki buy API:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process buy order' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

