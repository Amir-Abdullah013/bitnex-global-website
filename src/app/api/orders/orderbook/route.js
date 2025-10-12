import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * GET /api/orders/orderbook - Get order book for a specific trading pair
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const tradingPair = searchParams.get('tradingPair') || 'BNX/USDT';
    const limit = parseInt(searchParams.get('limit')) || 20;

    // Get trading pair
    const pair = await prisma.tradingPair.findUnique({
      where: { symbol: tradingPair }
    });

    let buyOrders = [];
    let sellOrders = [];

    if (pair) {
      // Get buy orders (highest price first)
      buyOrders = await prisma.order.findMany({
        where: {
          tradingPairId: pair.id,
          side: 'BUY',
          status: { in: ['PENDING', 'PARTIALLY_FILLED'] }
        },
        orderBy: [
          { price: 'desc' },
          { createdAt: 'asc' }
        ],
        take: limit,
        select: {
          id: true,
          price: true,
          amount: true,
          filledAmount: true,
          status: true,
          createdAt: true
        }
      });

      // Get sell orders (lowest price first)
      sellOrders = await prisma.order.findMany({
        where: {
          tradingPairId: pair.id,
          side: 'SELL',
          status: { in: ['PENDING', 'PARTIALLY_FILLED'] }
        },
        orderBy: [
          { price: 'asc' },
          { createdAt: 'asc' }
        ],
        take: limit,
        select: {
          id: true,
          price: true,
          amount: true,
          filledAmount: true,
          status: true,
          createdAt: true
        }
      });
    } else {
      // Return empty order book if pair doesn't exist
      console.log(`Trading pair ${tradingPair} not found, returning empty order book`);
    }

    // Format order book data
    const orderBook = {
      buyOrders: buyOrders.map(order => ({
        id: order.id,
        price: order.price,
        amount: order.amount,
        filledAmount: order.filledAmount,
        remainingAmount: order.amount - order.filledAmount,
        status: order.status,
        createdAt: order.createdAt
      })),
      sellOrders: sellOrders.map(order => ({
        id: order.id,
        price: order.price,
        amount: order.amount,
        filledAmount: order.filledAmount,
        remainingAmount: order.amount - order.filledAmount,
        status: order.status,
        createdAt: order.createdAt
      }))
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
