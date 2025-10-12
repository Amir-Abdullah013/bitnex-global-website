import { NextResponse } from 'next/server';

export async function POST(request) {
  let prisma;
  try {
    // Dynamic import to avoid build-time issues
    const { PrismaClient } = await import('@prisma/client');
    prisma = new PrismaClient();
    const { userId, tokenAmount } = await request.json();
    
    if (!userId || !tokenAmount || tokenAmount <= 0) {
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

    // Calculate USD to receive
    const usdToReceive = tokenAmount * currentPrice;

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

    // Check if user has sufficient Tiki balance
    if ((user.tikiBalance || 0) < tokenAmount) {
      return NextResponse.json(
        { success: false, error: 'Insufficient Tiki balance' },
        { status: 400 }
      );
    }

    // Update user balances
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        usdBalance: (user.usdBalance || 0) + usdToReceive,
        tikiBalance: (user.tikiBalance || 0) - tokenAmount
      }
    });

    // Create transaction record
    await prisma.transaction.create({
      data: {
        userId: userId,
        type: 'SELL',
        amount: usdToReceive,
        tokenAmount: tokenAmount,
        tokenType: 'TIKI',
        price: currentPrice,
        status: 'COMPLETED'
      }
    });

    return NextResponse.json({
      success: true,
      tokensSold: tokenAmount,
      usdReceived: usdToReceive,
      currentPrice: currentPrice,
      newUsdBalance: updatedUser.usdBalance,
      newTikiBalance: updatedUser.tikiBalance
    });

  } catch (error) {
    console.error('Error in Tiki sell API:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process sell order' },
      { status: 500 }
    );
  } finally {
    // Clean up database connection
    if (typeof prisma !== 'undefined') {
      await prisma.$disconnect();
    }
  }
}

