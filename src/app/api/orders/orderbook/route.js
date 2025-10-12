import { NextResponse } from 'next/server';

/**
 * GET /api/orders/orderbook - Get order book for a specific trading pair
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const tradingPair = searchParams.get('tradingPair') || 'BNX/USDT';
    const limit = parseInt(searchParams.get('limit')) || 20;

    // Return mock order book data to prevent infinite loading
    const mockBuyOrders = Array.from({ length: Math.min(limit, 10) }, (_, i) => ({
      id: `buy_${i + 1}`,
      price: 0.0035 - (i * 0.0001),
      amount: Math.random() * 1000,
      filledAmount: Math.random() * 100,
      remainingAmount: Math.random() * 900,
      status: 'PENDING',
      createdAt: new Date()
    }));

    const mockSellOrders = Array.from({ length: Math.min(limit, 10) }, (_, i) => ({
      id: `sell_${i + 1}`,
      price: 0.0035 + ((i + 1) * 0.0001),
      amount: Math.random() * 1000,
      filledAmount: Math.random() * 100,
      remainingAmount: Math.random() * 900,
      status: 'PENDING',
      createdAt: new Date()
    }));

    const orderBook = {
      buyOrders: mockBuyOrders,
      sellOrders: mockSellOrders
    };

    return NextResponse.json({
      success: true,
      orderBook,
      tradingPair,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching order book:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch order book'
    }, { status: 500 });
  }
}