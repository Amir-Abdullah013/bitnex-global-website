import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { orderMatchingEngine } from '../../../lib/order-matching-engine';
import { authHelpers } from '@/lib/supabase';

// WebSocket server instance (will be initialized by the main server)
let wsServer = null;

// Function to set WebSocket server instance
export const setWebSocketServer = (server) => {
  wsServer = server;
};

const prisma = new PrismaClient();

/**
 * GET /api/orders - List orders for the authenticated user
 */
export async function GET(request) {
  try {
    // Get current user
    const currentUser = await authHelpers.getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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
    return NextResponse.json(
      { error: 'Failed to fetch orders', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/orders - Create a new order
 */
export async function POST(request) {
  try {
    // Get current user
    const currentUser = await authHelpers.getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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
      const currentUser = await authHelpers.getCurrentUser();
      if (currentUser) {
        await prisma.notification.create({
          data: {
            userId: currentUser.id,
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
  }
}

/**
 * GET /api/orders/orderbook - Get order book data
 */
export async function GET_ORDERBOOK(request) {
  try {
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
  }
}

/**
 * GET /api/orders/trades - Get recent trades
 */
export async function GET_TRADES(request) {
  try {
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
  }
}
