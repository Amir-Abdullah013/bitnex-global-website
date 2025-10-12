import { NextResponse } from 'next/server';

/**
 * GET /api/price - Get current price data
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol') || 'BNX';

    // For now, return mock data to prevent infinite loading
    // This will allow the frontend to load while database is being set up
    const mockPrice = 0.0035 + (Math.random() - 0.5) * 0.001; // Random price around 0.0035
    const mockChange = (Math.random() - 0.5) * 10; // Random change between -5% and +5%
    
    return NextResponse.json({
      success: true,
      price: mockPrice,
      change24h: mockChange,
      volume24h: Math.random() * 1000000,
      high24h: mockPrice * 1.05,
      low24h: mockPrice * 0.95,
      marketCap: mockPrice * 1000000000,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching price:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch price data'
    }, { status: 500 });
  }
}

