import { NextResponse } from 'next/server';

/**
 * GET /api/chart-data
 * Fetch historical chart data for a given symbol and timeframe
 * 
 * Query Parameters:
 * - symbol: Asset symbol (e.g., 'BNX', 'BTC', 'ETH')
 * - timeframe: Time interval ('1m', '5m', '15m', '1h', '4h', '1d', '1w')
 * - limit: Number of data points (default: 500)
 * - indicators: Comma-separated list of indicators to calculate
 * - stats: Include market statistics (true/false)
 */
export async function GET(request) {
  let chartDataService;
  try {
    // Dynamic import to avoid build-time issues
    const chartDataServiceModule = await import('../../../lib/chart-data-service');
    chartDataService = chartDataServiceModule.default;
    
    const { searchParams } = new URL(request.url);
    
    // Extract query parameters
    const symbol = searchParams.get('symbol') || 'BNX';
    const timeframe = searchParams.get('timeframe') || '1h';
    const limit = parseInt(searchParams.get('limit')) || 500;
    const indicators = searchParams.get('indicators')?.split(',') || [];
    const includeStats = searchParams.get('stats') === 'true';
    
    // Validate parameters
    const validTimeframes = ['1m', '5m', '15m', '1h', '4h', '1d', '1w'];
    if (!validTimeframes.includes(timeframe)) {
      return NextResponse.json({
        success: false,
        error: `Invalid timeframe. Must be one of: ${validTimeframes.join(', ')}`
      }, { status: 400 });
    }
    
    if (limit < 1 || limit > 1000) {
      return NextResponse.json({
        success: false,
        error: 'Limit must be between 1 and 1000'
      }, { status: 400 });
    }
    
    // Fetch historical data
    const historicalData = await chartDataService.fetchHistoricalData(
      symbol, 
      timeframe, 
      limit
    );
    
    if (!historicalData || historicalData.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No data available for the specified parameters'
      }, { status: 404 });
    }
    
    // Calculate indicators if requested
    let calculatedIndicators = {};
    if (indicators.length > 0) {
      calculatedIndicators = chartDataService.calculateIndicators(
        historicalData, 
        indicators
      );
    }
    
    // Get market statistics if requested
    let marketStats = {};
    if (includeStats) {
      marketStats = await chartDataService.getMarketStats(symbol);
    }
    
    // Get latest price data
    const latestPrice = await chartDataService.getLatestPrice(symbol);
    
    // Prepare response data
    const responseData = {
      symbol,
      timeframe,
      data: historicalData,
      indicators: calculatedIndicators,
      latestPrice,
      marketStats,
      metadata: {
        count: historicalData.length,
        startTime: historicalData[0]?.time,
        endTime: historicalData[historicalData.length - 1]?.time,
        generatedAt: new Date().toISOString()
      }
    };
    
    return NextResponse.json({
      success: true,
      ...responseData
    });
    
  } catch (error) {
    console.error('Error in chart-data API:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch chart data',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}

/**
 * POST /api/chart-data
 * Update or add new market data points
 * 
 * Body:
 * - symbol: Asset symbol
 * - timeframe: Time interval
 * - data: Array of OHLCV data points
 */
export async function POST(request) {
  let prisma;
  try {
    const body = await request.json();
    const { symbol, timeframe, data } = body;
    
    if (!symbol || !timeframe || !data || !Array.isArray(data)) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: symbol, timeframe, data'
      }, { status: 400 });
    }
    
    // Validate data format
    for (const item of data) {
      if (!item.time || !item.open || !item.high || !item.low || !item.close) {
        return NextResponse.json({
          success: false,
          error: 'Invalid data format. Each item must have: time, open, high, low, close'
        }, { status: 400 });
      }
    }
    
    // Store data in database
    const { PrismaClient } = await import('@prisma/client');
    prisma = new PrismaClient();
    
    try {
      // Convert data to database format
      const marketData = data.map(item => ({
        symbol,
        timeframe,
        timestamp: new Date(item.time * 1000),
        open: parseFloat(item.open),
        high: parseFloat(item.high),
        low: parseFloat(item.low),
        close: parseFloat(item.close),
        volume: parseFloat(item.volume || 0)
      }));
      
      // Upsert data (update if exists, create if not)
      const result = await prisma.marketData.createMany({
        data: marketData,
        skipDuplicates: true
      });
      
      return NextResponse.json({
        success: true,
        message: `Successfully stored ${result.count} data points`,
        count: result.count
      });
      
    } finally {
      if (prisma) {
        await prisma.$disconnect();
      }
    }
    
  } catch (error) {
    console.error('Error storing chart data:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to store chart data',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}

/**
 * DELETE /api/chart-data
 * Clear cached data for a symbol/timeframe
 */
export async function DELETE(request) {
  let chartDataService;
  try {
    // Dynamic import to avoid build-time issues
    const chartDataServiceModule = await import('../../../lib/chart-data-service');
    chartDataService = chartDataServiceModule.default;
    
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol');
    const timeframe = searchParams.get('timeframe');
    
    if (!symbol) {
      return NextResponse.json({
        success: false,
        error: 'Symbol parameter is required'
      }, { status: 400 });
    }
    
    // Clear cache for the symbol/timeframe
    const cacheKey = timeframe ? `${symbol}-${timeframe}` : symbol;
    chartDataService.cache.delete(cacheKey);
    
    return NextResponse.json({
      success: true,
      message: `Cache cleared for ${symbol}${timeframe ? ` (${timeframe})` : ''}`
    });
    
  } catch (error) {
    console.error('Error clearing chart data cache:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to clear cache'
    }, { status: 500 });
  }
}

