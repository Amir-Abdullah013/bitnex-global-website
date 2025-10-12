import { NextResponse } from 'next/server';

/**
 * GET /api/trading-pairs - Get all active trading pairs
 */
export async function GET() {
  try {
    // Return mock trading pairs to prevent infinite loading
    const mockTradingPairs = [
      {
        id: 1,
        symbol: 'BNX/USDT',
        baseAsset: 'BNX',
        quoteAsset: 'USDT',
        isActive: true,
        price: 0.0035 + (Math.random() - 0.5) * 0.001,
        change24h: (Math.random() - 0.5) * 10,
        volume24h: Math.random() * 1000000,
        high24h: 0.0038,
        low24h: 0.0032,
        lastUpdated: new Date()
      },
      {
        id: 2,
        symbol: 'BTC/USDT',
        baseAsset: 'BTC',
        quoteAsset: 'USDT',
        isActive: true,
        price: 45000 + (Math.random() - 0.5) * 1000,
        change24h: (Math.random() - 0.5) * 5,
        volume24h: Math.random() * 10000000,
        high24h: 46000,
        low24h: 44000,
        lastUpdated: new Date()
      }
    ];

    return NextResponse.json({
      success: true,
      tradingPairs: mockTradingPairs,
      count: mockTradingPairs.length
    });

  } catch (error) {
    console.error('Error fetching trading pairs:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch trading pairs'
    }, { status: 500 });
  }
}