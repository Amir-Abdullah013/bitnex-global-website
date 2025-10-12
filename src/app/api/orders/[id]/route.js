import { NextResponse } from 'next/server';
import { orderMatchingEngine } from '../../../../lib/order-matching-engine';
import { authHelpers } from '@/lib/supabase';

// WebSocket server instance (will be initialized by the main server)
let wsServer = null;

// Function to set WebSocket server instance
export const setWebSocketServer = (server) => {
  wsServer = server;
};

/**
 * GET /api/orders/[id] - Get order details
 */
export async function GET(request, { params }) {
  let prisma;
  try {
    // Dynamic import to avoid build-time issues
    const { PrismaClient } = await import('@prisma/client');
    prisma = new PrismaClient();
    // Get current user
    const currentUser = await authHelpers.getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    // Get order with trades
    const order = await prisma.order.findFirst({
      where: {
        id: id,
        userId: currentUser.id
      },
      include: {
        trades: {
          include: {
            buyer: {
              select: { id: true, name: true, email: true }
            },
            seller: {
              select: { id: true, name: true, email: true }
            }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Calculate order statistics
    const totalFilledValue = order.trades.reduce((sum, trade) => sum + trade.totalValue, 0);
    const averagePrice = order.filledAmount > 0 ? totalFilledValue / order.filledAmount : 0;
    const remainingAmount = order.amount - order.filledAmount;

    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        type: order.type,
        side: order.side,
        amount: order.amount,
        price: order.price,
        filledAmount: order.filledAmount,
        remainingAmount: remainingAmount,
        status: order.status,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
        filledAt: order.filledAt,
        statistics: {
          totalFilledValue,
          averagePrice,
          fillPercentage: (order.filledAmount / order.amount) * 100
        },
        trades: order.trades.map(trade => ({
          id: trade.id,
          amount: trade.amount,
          price: trade.price,
          totalValue: trade.totalValue,
          createdAt: trade.createdAt,
          buyer: trade.buyer,
          seller: trade.seller
        }))
      }
    });

  } catch (error) {
    console.error('Error fetching order details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch order details', details: error.message },
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
 * DELETE /api/orders/[id] - Cancel an order
 */
export async function DELETE(request, { params }) {
  let prisma;
  try {
    // Dynamic import to avoid build-time issues
    const { PrismaClient } = await import('@prisma/client');
    prisma = new PrismaClient();
    // Get current user
    const currentUser = await authHelpers.getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    // Cancel the order using the matching engine
    const result = await orderMatchingEngine.cancelOrder(id, currentUser.id);

    // Broadcast WebSocket updates if server is available
    if (wsServer) {
      try {
        await wsServer.onOrderCancelled(result.order);
      } catch (wsError) {
        console.error('Error broadcasting WebSocket update:', wsError);
      }
    }

    // Create notification for order cancellation
    await prisma.notification.create({
      data: {
        userId: currentUser.id,
        title: 'Order Cancelled',
        message: `Your order has been cancelled successfully`,
        type: 'INFO',
        status: 'UNREAD'
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Order cancelled successfully',
      order: {
        id: result.order.id,
        status: result.order.status,
        updatedAt: result.order.updatedAt
      }
    });

  } catch (error) {
    console.error('Error cancelling order:', error);
    
    // Create error notification
    try {
      const currentUser = await authHelpers.getCurrentUser();
      if (currentUser) {
        await prisma.notification.create({
          data: {
            userId: currentUser.id,
            title: 'Order Cancellation Failed',
            message: `Failed to cancel order: ${error.message}`,
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
        error: 'Failed to cancel order', 
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
 * PATCH /api/orders/[id] - Update order (for partial cancellations or modifications)
 */
export async function PATCH(request, { params }) {
  let prisma;
  try {
    // Dynamic import to avoid build-time issues
    const { PrismaClient } = await import('@prisma/client');
    prisma = new PrismaClient();
    // Get current user
    const currentUser = await authHelpers.getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const body = await request.json();
    const { action, newAmount } = body;

    // Get the order
    const order = await prisma.order.findFirst({
      where: {
        id: id,
        userId: currentUser.id,
        status: { in: ['PENDING', 'PARTIALLY_FILLED'] }
      }
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found or cannot be modified' },
        { status: 404 }
      );
    }

    let updatedOrder;

    switch (action) {
      case 'PARTIAL_CANCEL':
        if (!newAmount || newAmount <= 0 || newAmount >= order.amount) {
          return NextResponse.json(
            { error: 'Invalid new amount for partial cancellation' },
            { status: 400 }
          );
        }

        // Update order amount
        updatedOrder = await prisma.order.update({
          where: { id: id },
          data: {
            amount: newAmount,
            status: newAmount <= order.filledAmount ? 'FILLED' : order.status
          }
        });

        // Create notification
        await prisma.notification.create({
          data: {
            userId: currentUser.id,
            title: 'Order Modified',
            message: `Your order has been partially cancelled. New amount: ${newAmount} BNX`,
            type: 'INFO',
            status: 'UNREAD'
          }
        });

        break;

      case 'UPDATE_PRICE':
        if (order.type !== 'LIMIT') {
          return NextResponse.json(
            { error: 'Only limit orders can have their price updated' },
            { status: 400 }
          );
        }

        const { newPrice } = body;
        if (!newPrice || newPrice <= 0) {
          return NextResponse.json(
            { error: 'Invalid new price' },
            { status: 400 }
          );
        }

        // Update order price
        updatedOrder = await prisma.order.update({
          where: { id: id },
          data: { price: newPrice }
        });

        // Create notification
        await prisma.notification.create({
          data: {
            userId: currentUser.id,
            title: 'Order Updated',
            message: `Your order price has been updated to $${newPrice}`,
            type: 'INFO',
            status: 'UNREAD'
          }
        });

        break;

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      message: 'Order updated successfully',
      order: {
        id: updatedOrder.id,
        amount: updatedOrder.amount,
        price: updatedOrder.price,
        status: updatedOrder.status,
        updatedAt: updatedOrder.updatedAt
      }
    });

  } catch (error) {
    console.error('Error updating order:', error);
    return NextResponse.json(
      { 
        error: 'Failed to update order', 
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
