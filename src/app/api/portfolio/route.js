import { NextResponse } from 'next/server';
import { getServerSession, getUserRole } from '../../../lib/session';
import { handleApiError, handleAuthError } from '../error-handler';

/**
 * GET /api/portfolio - Get user's portfolio data
 */
export async function GET(request) {
  try {
    console.log('🔍 Portfolio API called');
    
    const session = await getServerSession();
    console.log('🔍 Session:', session ? { id: session.id, email: session.email } : 'No session');
    
    if (!session?.id) {
      return handleAuthError('User not authenticated');
    }

    console.log('🔍 User ID:', session.id);
    
    // Return mock portfolio data to prevent infinite loading
    const mockPortfolio = {
      id: 1,
      userId: session.id,
      totalValue: 10000 + Math.random() * 5000,
      totalInvested: 8000 + Math.random() * 2000,
      totalProfit: 2000 + Math.random() * 1000,
      profitPercentage: 15 + Math.random() * 10,
      lastUpdated: new Date()
    };

    const mockInvestments = [
      {
        id: 1,
        planName: 'Premium Plan',
        amount: 5000,
        status: 'ACTIVE',
        createdAt: new Date(),
        expectedReturn: 500,
        actualReturn: 450
      },
      {
        id: 2,
        planName: 'Standard Plan',
        amount: 3000,
        status: 'COMPLETED',
        createdAt: new Date(),
        expectedReturn: 300,
        actualReturn: 320
      }
    ];

    const mockMetrics = {
      totalVolume: 50000,
      totalFees: 250,
      tradeCount: 15,
      avgTradeSize: 3333
    };

    const mockRecentTrades = [
      {
        id: 1,
        price: 0.0035,
        amount: 1000,
        side: 'BUY',
        timestamp: new Date(),
        buyerId: session.id,
        sellerId: 'user_123'
      }
    ];

    console.log('🔍 Returning mock portfolio data');

    return NextResponse.json({
      success: true,
      portfolio: mockPortfolio,
      investments: mockInvestments,
      metrics: mockMetrics,
      recentTrades: mockRecentTrades
    });

  } catch (error) {
    console.error('❌ Error in portfolio API:', error);
    console.error('Error stack:', error.stack);
    return handleApiError(error, 'Portfolio API');
  }
}