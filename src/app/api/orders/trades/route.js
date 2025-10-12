import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * GET /api/orders/trades - Get recent trades for a specific trading pair
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const tradingPair = searchParams.get('tradingPair') || 'BNX/USDT';
    const limit = parseInt(searchParams.get('limit')) || 20;

    // Get trading pair
    const pair = await prisma.tradingPair.findUnique({
      where: { symbol: tradingPair }
    });

    let trades = [];

    if (pair) {
      // Get recent trades if pair exists
      trades = await prisma.trade.findMany({
        where: {
          tradingPairId: pair.id
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: limit,
        include: {
          buyer: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          seller: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      });
    } else {
      // Return empty trades array if pair doesn't exist
      console.log(`Trading pair ${tradingPair} not found, returning empty trades`);
    }

    // Format trades data
    const formattedTrades = trades.map(trade => ({
      id: trade.id,
      amount: trade.amount,
      price: trade.price,
      totalValue: trade.totalValue,
      side: 'BUY', // This would need to be determined based on the user's perspective
      buyer: {
        id: trade.buyer.id,
        name: trade.buyer.name,
        email: trade.buyer.email
      },
      seller: {
        id: trade.seller.id,
        name: trade.seller.name,
        email: trade.seller.email
      },
      createdAt: trade.createdAt
    }));

    return NextResponse.json({
      success: true,
      trades: formattedTrades,
      tradingPair,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching trades:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch trades'
    }, { status: 500 });
  }
}
