import { NextResponse } from 'next/server';
import { orderMatchingEngine } from '../../../lib/order-matching-engine';
import { getServerSession } from '../../../lib/session';
import referralRewardService from '../../../lib/referral-reward-service';

// WebSocket server instance (will be initialized by the main server)
let wsServer = null;

// Function to set WebSocket server instance
export const setWebSocketServer = (server) => {
  wsServer = server;
};

/**
 * GET /api/orders - List orders for the authenticated user
 */
export async function GET(request) {
  let prisma;
  try {
    // Dynamic import to avoid build-time issues
    const { PrismaClient } = await import('@prisma/client');
    prisma = new PrismaClient();
    
    // Get current user session
    const session = await getServerSession();
    if (!session?.id) {
      console.log('❌ No session found for orders API');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const currentUser = {
      id: session.id,
      email: session.email,
      name: session.name
    };

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const side = searchParams.get('side');
    const type = searchParams.get('type');
    const limit = parseInt(searchParams.get('limit')) || 50;
    const offset = parseInt(searchParams.get('offset')) || 0;

    // Build where clause
    const where = {
      userId: currentUser.id
    };

    if (status) {
      where.status = status;
    }

    if (side) {
      where.side = side;
    }

    if (type) {
      where.type = type;
    }

    // Get orders
    const orders = await prisma.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
      include: {
        trades: {
          include: {
            buyer: {
              select: { id: true, name: true, email: true }
            },
            seller: {
              select: { id: true, name: true, email: true }
            }
          }
        }
      }
    });

    // Get total count for pagination
    const totalCount = await prisma.order.count({ where });

    return NextResponse.json({
      success: true,
      orders: orders.map(order => ({
        id: order.id,
        type: order.type,
        side: order.side,
        amount: order.amount,
        price: order.price,
        filledAmount: order.filledAmount,
        remainingAmount: order.amount - order.filledAmount,
        status: order.status,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
        filledAt: order.filledAt,
        trades: order.trades.map(trade => ({
          id: trade.id,
          amount: trade.amount,
          price: trade.price,
          totalValue: trade.totalValue,
          createdAt: trade.createdAt,
          buyer: trade.buyer,
          seller: trade.seller
        }))
      })),
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount
      }
    });

  } catch (error) {
    console.error('Error fetching orders:', error);
    
    // Return fallback data if database is not available
    if (error.message.includes('database') || error.message.includes('connection')) {
      console.log('🔧 Database not available, returning fallback orders data');
      return NextResponse.json({
        success: true,
        orders: [
          {
            id: 'fallback-1',
            type: 'LIMIT',
            side: 'BUY',
            amount: 100,
            price: 0.0035,
            filledAmount: 0,
            remainingAmount: 100,
            status: 'PENDING',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            filledAt: null,
            trades: []
          }
        ],
        pagination: {
          total: 1,
          limit: 50,
          offset: 0,
          hasMore: false
        },
        dataSource: 'fallback'
      });
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch orders', details: error.message },
      { status: 500 }
    );
  } finally {
    // Clean up database connection
    if (typeof prisma !== 'undefined') {
      await prisma.$disconnect();
    }
  }
}

/**
 * POST /api/orders - Create a new order
 */
export async function POST(request) {
  let prisma;
  try {
    // Dynamic import to avoid build-time issues
    const { PrismaClient } = await import('@prisma/client');
    prisma = new PrismaClient();
    
    // Get current user session
    const session = await getServerSession();
    if (!session?.id) {
      console.log('❌ No session found for orders API POST');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const currentUser = {
      id: session.id,
      email: session.email,
      name: session.name
    };

    const body = await request.json();
    const { type, side, amount, price, tradingPair = 'BNX/USDT' } = body;

    // Validate required fields
    if (!type || !side || !amount) {
      return NextResponse.json(
        { error: 'Missing required fields: type, side, amount' },
        { status: 400 }
      );
    }

    // Validate order data
    if (!['MARKET', 'LIMIT'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid order type. Must be MARKET or LIMIT' },
        { status: 400 }
      );
    }

    if (!['BUY', 'SELL'].includes(side)) {
      return NextResponse.json(
        { error: 'Invalid order side. Must be BUY or SELL' },
        { status: 400 }
      );
    }

    if (amount <= 0) {
      return NextResponse.json(
        { error: 'Order amount must be greater than 0' },
        { status: 400 }
      );
    }

    if (type === 'LIMIT' && (!price || price <= 0)) {
      return NextResponse.json(
        { error: 'Limit orders must have a valid price' },
        { status: 400 }
      );
    }

    // Get trading pair
    const pair = await prisma.tradingPair.findUnique({
      where: { symbol: tradingPair }
    });

    if (!pair) {
      return NextResponse.json(
        { error: 'Invalid trading pair' },
        { status: 400 }
      );
    }

    // Create order object
    const orderData = {
      userId: currentUser.id,
      tradingPairId: pair.id,
      type,
      side,
      amount: parseFloat(amount),
      price: price ? parseFloat(price) : null
    };

      // Process the order through the matching engine
      const result = await orderMatchingEngine.processOrder(orderData);

      // Broadcast WebSocket updates if server is available
      if (wsServer) {
        try {
          await wsServer.onOrderPlaced(result.order, result.trades);
        } catch (wsError) {
          console.error('Error broadcasting WebSocket update:', wsError);
        }
      }

      // Create notification for successful order placement
      await prisma.notification.create({
        data: {
          userId: currentUser.id,
          title: 'Order Placed',
          message: `Your ${side} order for ${amount} BNX has been placed successfully`,
          type: 'SUCCESS',
          status: 'UNREAD'
        }
      });

      // Trigger referral rewards for completed trades
      if (result.trades && result.trades.length > 0) {
        const totalTradeValue = result.trades.reduce((sum, trade) => sum + trade.totalValue, 0);
        
        // Trigger referral rewards for each trade
        for (const trade of result.trades) {
          referralRewardService.triggerReferralRewards(
            trade.buyerId,
            trade.totalValue,
            'TRADE',
            trade.id
          ).catch(error => {
            console.error('❌ Error triggering referral rewards for trade:', error);
            // Don't fail the order if referral rewards fail
          });
        }
      }

    return NextResponse.json({
      success: true,
      message: 'Order placed successfully',
      order: {
        id: result.order.id,
        type: result.order.type,
        side: result.order.side,
        amount: result.order.amount,
        price: result.order.price,
        filledAmount: result.order.filledAmount,
        status: result.order.status,
        createdAt: result.order.createdAt
      },
      matches: result.matches,
      trades: result.trades,
      remainingAmount: result.remainingAmount
    });

  } catch (error) {
    console.error('Error creating order:', error);
    
    // Create error notification
    try {
      const session = await getServerSession();
      if (session?.id) {
        await prisma.notification.create({
          data: {
            userId: session.id,
            title: 'Order Failed',
            message: `Failed to place order: ${error.message}`,
            type: 'ALERT',
            status: 'UNREAD'
          }
        });
      }
    } catch (notifError) {
      console.error('Error creating error notification:', notifError);
    }

    return NextResponse.json(
      { 
        error: 'Failed to place order', 
        details: error.message 
      },
      { status: 500 }
    );
  } finally {
    // Clean up database connection
    if (typeof prisma !== 'undefined') {
      await prisma.$disconnect();
    }
  }
}

/**
 * GET /api/orders/orderbook - Get order book data
 */
export async function GET_ORDERBOOK(request) {
  let prisma;
  try {
    // Dynamic import to avoid build-time issues
    const { PrismaClient } = await import('@prisma/client');
    prisma = new PrismaClient();
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit')) || 20;

    const orderBook = await orderMatchingEngine.getOrderBook(limit);

    return NextResponse.json({
      success: true,
      orderBook
    });

  } catch (error) {
    console.error('Error fetching order book:', error);
    return NextResponse.json(
      { error: 'Failed to fetch order book', details: error.message },
      { status: 500 }
    );
  } finally {
    // Clean up database connection
    if (typeof prisma !== 'undefined') {
      await prisma.$disconnect();
    }
  }
}

/**
 * GET /api/orders/trades - Get recent trades
 */
export async function GET_TRADES(request) {
  let prisma;
  try {
    // Dynamic import to avoid build-time issues
    const { PrismaClient } = await import('@prisma/client');
    prisma = new PrismaClient();
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit')) || 50;

    const trades = await orderMatchingEngine.getRecentTrades(limit);

    return NextResponse.json({
      success: true,
      trades: trades.map(trade => ({
        id: trade.id,
        amount: trade.amount,
        price: trade.price,
        totalValue: trade.totalValue,
        createdAt: trade.createdAt,
        buyer: trade.buyer,
        seller: trade.seller
      }))
    });

  } catch (error) {
    console.error('Error fetching trades:', error);
    return NextResponse.json(
      { error: 'Failed to fetch trades', details: error.message },
      { status: 500 }
    );
  } finally {
    // Clean up database connection
    if (typeof prisma !== 'undefined') {
      await prisma.$disconnect();
    }
  }
}
