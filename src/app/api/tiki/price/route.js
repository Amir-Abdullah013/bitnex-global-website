import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * GET /api/tiki/price - Get current Tiki price data
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol') || 'TIKI';

    // Get the latest price from the database
    const latestPrice = await prisma.price.findFirst({
      where: { symbol },
      orderBy: { timestamp: 'desc' }
    });

    if (latestPrice) {
      // Calculate 24h change
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      const yesterdayPrice = await prisma.price.findFirst({
        where: {
          symbol,
          timestamp: { gte: yesterday }
        },
        orderBy: { timestamp: 'asc' }
      });

      const change24h = yesterdayPrice 
        ? ((latestPrice.price - yesterdayPrice.price) / yesterdayPrice.price) * 100
        : 0;

      return NextResponse.json({
        success: true,
        price: latestPrice.price,
        change24h,
        volume24h: latestPrice.volume || 0,
        high24h: latestPrice.price, // Simplified - in real implementation, calculate from 24h data
        low24h: latestPrice.price,
        marketCap: latestPrice.marketCap,
        timestamp: latestPrice.timestamp
      });
    }

    // Return default values if no price data found
    return NextResponse.json({
      success: true,
      price: 0.0035, // Default Tiki price
      change24h: 0,
      volume24h: 0,
      high24h: 0.0035,
      low24h: 0.0035,
      marketCap: null,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching Tiki price:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch Tiki price data'
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

