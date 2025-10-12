import { NextResponse } from 'next/server';

/**
 * GET /api/orders/trades - Get recent trades for a specific trading pair
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const tradingPair = searchParams.get('tradingPair') || 'BNX/USDT';
    const limit = parseInt(searchParams.get('limit')) || 20;

    // Return mock trades data to prevent infinite loading
    const mockTrades = Array.from({ length: Math.min(limit, 20) }, (_, i) => ({
      id: `trade_${i + 1}`,
      price: 0.0035 + (Math.random() - 0.5) * 0.001,
      amount: Math.random() * 1000,
      side: Math.random() > 0.5 ? 'BUY' : 'SELL',
      timestamp: new Date(Date.now() - i * 60000), // Each trade 1 minute apart
      buyerId: `user_${Math.floor(Math.random() * 100)}`,
      sellerId: `user_${Math.floor(Math.random() * 100)}`
    }));

    const formattedTrades = mockTrades.map(trade => ({
      id: trade.id,
      price: trade.price,
      amount: trade.amount,
      side: trade.side,
      timestamp: trade.timestamp,
      buyerId: trade.buyerId,
      sellerId: trade.sellerId
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