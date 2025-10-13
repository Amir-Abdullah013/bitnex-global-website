import { NextResponse } from 'next/server';
import databaseHelpers from '../../../lib/database';

/**
 * GET /api/price - Get current price data
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol') || 'BNX';

    console.log('🔍 Fetching price data for symbol:', symbol);

    // Get current price from database
    const currentPrice = await databaseHelpers.market.getCurrentPrice(symbol);
    
    if (!currentPrice) {
      return NextResponse.json({
        success: false,
        error: 'Price data not found for symbol: ' + symbol
      }, { status: 404 });
    }

    // Get 24h price change
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    const yesterdayPrice = await databaseHelpers.market.getPriceAtTime(symbol, yesterday);
    const change24h = yesterdayPrice ? 
      ((currentPrice - yesterdayPrice) / yesterdayPrice) * 100 : 0;

    // Get 24h volume
    const volume24h = await databaseHelpers.market.get24hVolume(symbol);
    
    // Get 24h high and low
    const high24h = await databaseHelpers.market.get24hHigh(symbol);
    const low24h = await databaseHelpers.market.get24hLow(symbol);

    console.log('🔍 Price data:', { 
      price: currentPrice, 
      change24h, 
      volume24h, 
      high24h, 
      low24h 
    });

    return NextResponse.json({
      success: true,
      price: currentPrice,
      change24h,
      volume24h: volume24h || 0,
      high24h: high24h || currentPrice * 1.05,
      low24h: low24h || currentPrice * 0.95,
      marketCap: currentPrice * 1000000000, // Assuming 1B total supply
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error fetching price:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch price data'
    }, { status: 500 });
  }
}

