import { NextResponse } from 'next/server';
import { getServerSession, getUserRole } from '../../../lib/session';
import { handleApiError, handleAuthError } from '../error-handler';
import databaseHelpers from '../../../lib/database';

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
    
    // Get real portfolio data from database
    const portfolio = await databaseHelpers.portfolio.getUserPortfolio(session.id);
    
    if (!portfolio) {
      return NextResponse.json({
        success: false,
        error: 'Portfolio not found'
      }, { status: 404 });
    }

    console.log('🔍 Portfolio data:', portfolio);

    // Get user's investments
    const investments = await databaseHelpers.investment.getUserInvestments(session.id);
    
    // Get portfolio metrics
    const metrics = await databaseHelpers.portfolio.getPortfolioMetrics(session.id);
    
    // Get recent trades
    const recentTrades = await databaseHelpers.trade.getUserRecentTrades(session.id, 5);

    console.log('🔍 Returning real portfolio data');

    return NextResponse.json({
      success: true,
      portfolio: portfolio,
      investments: investments || [],
      metrics: metrics || {},
      recentTrades: recentTrades || []
    });

  } catch (error) {
    console.error('❌ Error in portfolio API:', error);
    console.error('Error stack:', error.stack);
    return handleApiError(error, 'Portfolio API');
  }
}