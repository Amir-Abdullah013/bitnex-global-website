import { NextResponse } from 'next/server';

/**
 * GET /api/trading-pairs - Get all active trading pairs
 */
export async function GET() {
  let prisma;
  try {
    // Dynamic import to avoid build-time issues
    const { PrismaClient } = await import('@prisma/client');
    prisma = new PrismaClient();
    const tradingPairs = await prisma.tradingPair.findMany({
      where: {
        isActive: true
      },
      include: {
        marketData: {
          orderBy: {
            lastUpdated: 'desc'
          },
          take: 1
        },
        _count: {
          select: {
            orders: true,
            trades: true
          }
        }
      },
      orderBy: {
        symbol: 'asc'
      }
    });

    // Format the response
    const formattedPairs = tradingPairs.map(pair => ({
      id: pair.id,
      symbol: pair.symbol,
      baseAsset: pair.baseAsset,
      quoteAsset: pair.quoteAsset,
      isActive: pair.isActive,
      minOrderSize: pair.minOrderSize,
      maxOrderSize: pair.maxOrderSize,
      pricePrecision: pair.pricePrecision,
      amountPrecision: pair.amountPrecision,
      makerFee: pair.makerFee,
      takerFee: pair.takerFee,
      marketData: pair.marketData[0] || null,
      orderCount: pair._count.orders,
      tradeCount: pair._count.trades,
      createdAt: pair.createdAt,
      updatedAt: pair.updatedAt
    }));

    return NextResponse.json({
      success: true,
      tradingPairs: formattedPairs
    });

  } catch (error) {
    console.error('Error fetching trading pairs:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch trading pairs'
    }, { status: 500 });
  }
}

/**
 * POST /api/trading-pairs - Create a new trading pair (Admin only)
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const {
      symbol,
      baseAsset,
      quoteAsset,
      minOrderSize = 0.001,
      maxOrderSize = 1000000,
      pricePrecision = 4,
      amountPrecision = 4,
      makerFee = 0.001,
      takerFee = 0.001
    } = body;

    // Validate required fields
    if (!symbol || !baseAsset || !quoteAsset) {
      return NextResponse.json({
        success: false,
        error: 'Symbol, baseAsset, and quoteAsset are required'
      }, { status: 400 });
    }

    // Check if trading pair already exists
    const existingPair = await prisma.tradingPair.findUnique({
      where: { symbol }
    });

    if (existingPair) {
      return NextResponse.json({
        success: false,
        error: 'Trading pair already exists'
      }, { status: 409 });
    }

    // Create the trading pair
    const tradingPair = await prisma.tradingPair.create({
      data: {
        symbol,
        baseAsset,
        quoteAsset,
        minOrderSize,
        maxOrderSize,
        pricePrecision,
        amountPrecision,
        makerFee,
        takerFee
      }
    });

    // Create initial market data
    await prisma.marketData.create({
      data: {
        tradingPairId: tradingPair.id,
        price: 0,
        volume24h: 0,
        change24h: 0,
        high24h: 0,
        low24h: 0
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Trading pair created successfully',
      tradingPair
    });

  } catch (error) {
    console.error('Error creating trading pair:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to create trading pair'
    }, { status: 500 });
  }
}

/**
 * PUT /api/trading-pairs - Update trading pair (Admin only)
 */
export async function PUT(request) {
  try {
    const body = await request.json();
    const {
      id,
      isActive,
      minOrderSize,
      maxOrderSize,
      pricePrecision,
      amountPrecision,
      makerFee,
      takerFee
    } = body;

    if (!id) {
      return NextResponse.json({
        success: false,
        error: 'Trading pair ID is required'
      }, { status: 400 });
    }

    const updateData = {};
    if (isActive !== undefined) updateData.isActive = isActive;
    if (minOrderSize !== undefined) updateData.minOrderSize = minOrderSize;
    if (maxOrderSize !== undefined) updateData.maxOrderSize = maxOrderSize;
    if (pricePrecision !== undefined) updateData.pricePrecision = pricePrecision;
    if (amountPrecision !== undefined) updateData.amountPrecision = amountPrecision;
    if (makerFee !== undefined) updateData.makerFee = makerFee;
    if (takerFee !== undefined) updateData.takerFee = takerFee;

    const tradingPair = await prisma.tradingPair.update({
      where: { id },
      data: updateData
    });

    return NextResponse.json({
      success: true,
      message: 'Trading pair updated successfully',
      tradingPair
    });

  } catch (error) {
    console.error('Error updating trading pair:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to update trading pair'
    }, { status: 500 });
  } finally {
    // Clean up database connection
    if (typeof prisma !== 'undefined') {
      await prisma.$disconnect();
    }
  }
}

