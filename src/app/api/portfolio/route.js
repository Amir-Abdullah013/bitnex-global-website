import { NextResponse } from 'next/server';
import { getServerSession, getUserRole } from '../../../lib/session';
import { PrismaClient } from '@prisma/client';
import { handleApiError, handleAuthError } from '../error-handler';

const prisma = new PrismaClient();

/**
 * GET /api/portfolio - Get user's portfolio data
 */
export async function GET(request) {
  try {
    console.log('🔍 Portfolio API called');
    
    const session = await getServerSession();
    console.log('🔍 Session:', session ? { id: session.id, email: session.email } : 'No session');
    
    if (!session?.id) {
      return handleAuthError('Authentication required');
    }

    const userRole = await getUserRole(session);
    console.log('🔍 User role:', userRole);
    
    if (userRole !== 'USER' && userRole !== 'ADMIN') {
      return handleAuthError('User access required');
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || session.id;
    const includeAnalytics = searchParams.get('includeAnalytics') === 'true';
    const days = parseInt(searchParams.get('days')) || 30;

    console.log('🔍 Getting portfolio for user:', userId);
    
    // Get or create portfolio
    let portfolio = await prisma.portfolio.findUnique({
      where: { userId },
      include: {
        holdings: true,
        analytics: includeAnalytics ? {
          where: {
            date: {
              gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000)
            }
          },
          orderBy: { date: 'asc' }
        } : false
      }
    });

    console.log('🔍 Portfolio found:', !!portfolio);

    // If portfolio doesn't exist, create it
    if (!portfolio) {
      console.log('🔍 Creating new portfolio for user:', userId);
      portfolio = await createPortfolio(userId);
    }

    // Get wallet data
    const wallet = await prisma.wallet.findUnique({
      where: { userId }
    });

    // Get recent trades for analytics
    const recentTrades = await prisma.trade.findMany({
      where: {
        OR: [
          { buyerId: userId },
          { sellerId: userId }
        ],
        createdAt: {
          gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000)
        }
      },
      include: {
        tradingPair: true
      },
      orderBy: { createdAt: 'desc' },
      take: 100
    });

    // Calculate additional metrics
    const portfolioMetrics = await calculatePortfolioMetrics(userId, recentTrades);

    return NextResponse.json({
      success: true,
      portfolio: {
        ...portfolio,
        wallet: wallet ? {
          balance: wallet.balance,
          bnxBalance: wallet.bnxBalance
        } : null,
        metrics: portfolioMetrics,
        recentTrades: recentTrades.slice(0, 10) // Last 10 trades
      }
    });

  } catch (error) {
    console.error('❌ Error in portfolio API:', error);
    console.error('Error stack:', error.stack);
    return handleApiError(error, 'Portfolio API');
  }
}

/**
 * POST /api/portfolio - Update portfolio data
 */
export async function POST(request) {
  try {
    const session = await getServerSession();
    if (!session?.id) {
      return handleAuthError('Authentication required');
    }

    const body = await request.json();
    const { action, data } = body;

    switch (action) {
      case 'update':
        const updatedPortfolio = await updatePortfolioData(session.id);
        return NextResponse.json({
          success: true,
          portfolio: updatedPortfolio
        });

      case 'refresh':
        const refreshedPortfolio = await refreshPortfolioData(session.id);
        return NextResponse.json({
          success: true,
          portfolio: refreshedPortfolio
        });

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action'
        }, { status: 400 });
    }

  } catch (error) {
    console.error('Error updating portfolio:', error);
    return handleApiError(error, 'Portfolio update');
  }
}

/**
 * Create a new portfolio for user
 */
async function createPortfolio(userId) {
  return await prisma.portfolio.create({
    data: {
      userId,
      totalValue: 0,
      totalPnl: 0,
      totalPnlPercent: 0,
      totalFees: 0,
      totalTrades: 0,
      winRate: 0,
      avgTradeSize: 0,
      bestTrade: 0,
      worstTrade: 0
    },
    include: {
      holdings: true,
      analytics: false
    }
  });
}

/**
 * Update portfolio data with latest information
 */
async function updatePortfolioData(userId, existingPortfolio = null) {
  try {
    console.log('🔍 updatePortfolioData: Getting wallet for user:', userId);
    
    // Get user's wallet
    const wallet = await prisma.wallet.findUnique({
      where: { userId }
    });

    console.log('🔍 updatePortfolioData: Wallet found:', !!wallet);

    // Get all user's trades
    console.log('🔍 updatePortfolioData: Getting trades for user:', userId);
    const trades = await prisma.trade.findMany({
      where: {
        OR: [
          { buyerId: userId },
          { sellerId: userId }
        ]
      },
      include: {
        tradingPair: true
      },
      orderBy: { createdAt: 'desc' }
    });

    console.log('🔍 updatePortfolioData: Found trades:', trades.length);

    // Get current prices for all assets
    const currentPrices = await getCurrentPrices();

    // Calculate holdings from trades
    const holdings = calculateHoldingsFromTrades(trades, currentPrices);

    // Calculate portfolio metrics
    const totalValue = Object.values(holdings).reduce((sum, holding) => sum + holding.value, 0);
    const totalPnl = Object.values(holdings).reduce((sum, holding) => sum + holding.pnl, 0);
    const totalPnlPercent = totalValue > 0 ? (totalPnl / (totalValue - totalPnl)) * 100 : 0;
    const totalFees = trades.reduce((sum, trade) => sum + (trade.buyerFee + trade.sellerFee), 0);
    const totalTrades = trades.length;

    // Calculate win rate
    const profitableTrades = trades.filter(trade => {
      const userPnl = trade.buyerId === userId ? 
        (trade.amount * trade.price) - (trade.amount * trade.avgPrice || 0) :
        (trade.amount * trade.avgPrice || 0) - (trade.amount * trade.price);
      return userPnl > 0;
    }).length;
    const winRate = totalTrades > 0 ? (profitableTrades / totalTrades) * 100 : 0;

    // Calculate average trade size
    const avgTradeSize = totalTrades > 0 ? 
      trades.reduce((sum, trade) => sum + (trade.amount * trade.price), 0) / totalTrades : 0;

    // Find best and worst trades
    const tradePnl = trades.map(trade => {
      const userPnl = trade.buyerId === userId ? 
        (trade.amount * trade.price) - (trade.amount * trade.avgPrice || 0) :
        (trade.amount * trade.avgPrice || 0) - (trade.amount * trade.price);
      return userPnl;
    });
    const bestTrade = tradePnl.length > 0 ? Math.max(...tradePnl) : 0;
    const worstTrade = tradePnl.length > 0 ? Math.min(...tradePnl) : 0;

    // Update or create portfolio
    const portfolioData = {
      totalValue,
      totalPnl,
      totalPnlPercent,
      totalFees,
      totalTrades,
      winRate,
      avgTradeSize,
      bestTrade,
      worstTrade,
      lastUpdated: new Date()
    };

    let portfolio;
    if (existingPortfolio) {
      portfolio = await prisma.portfolio.update({
        where: { id: existingPortfolio.id },
        data: portfolioData,
        include: {
          holdings: true,
          analytics: false
        }
      });
    } else {
      portfolio = await prisma.portfolio.create({
        data: {
          userId,
          ...portfolioData
        },
        include: {
          holdings: true,
          analytics: false
        }
      });
    }

    // Update holdings
    await updatePortfolioHoldings(portfolio.id, holdings);

    console.log('🔍 updatePortfolioData: Portfolio updated successfully');
    return portfolio;
    
  } catch (error) {
    console.error('❌ Error in updatePortfolioData:', error);
    throw error;
  }
}

/**
 * Calculate holdings from trades
 */
function calculateHoldingsFromTrades(trades, currentPrices) {
  const holdings = {};

  trades.forEach(trade => {
    const { baseAsset, quoteAsset } = trade.tradingPair;
    const currentPrice = currentPrices[baseAsset] || 0;

    // Initialize holdings if not exists
    if (!holdings[baseAsset]) {
      holdings[baseAsset] = {
        asset: baseAsset,
        amount: 0,
        totalCost: 0,
        avgPrice: 0,
        currentPrice,
        value: 0,
        pnl: 0,
        pnlPercent: 0
      };
    }

    if (!holdings[quoteAsset]) {
      holdings[quoteAsset] = {
        asset: quoteAsset,
        amount: 0,
        totalCost: 0,
        avgPrice: 0,
        currentPrice: currentPrices[quoteAsset] || 1,
        value: 0,
        pnl: 0,
        pnlPercent: 0
      };
    }

    // Update holdings based on trade
    const tradeValue = trade.amount * trade.price;
    
    if (trade.buyerId === trade.sellerId) {
      // This is a buy trade
      holdings[baseAsset].amount += trade.amount;
      holdings[baseAsset].totalCost += tradeValue;
      holdings[quoteAsset].amount -= tradeValue;
    } else {
      // This is a sell trade
      holdings[baseAsset].amount -= trade.amount;
      holdings[baseAsset].totalCost -= tradeValue;
      holdings[quoteAsset].amount += tradeValue;
    }
  });

  // Calculate final metrics
  Object.values(holdings).forEach(holding => {
    if (holding.amount > 0) {
      holding.avgPrice = holding.totalCost / holding.amount;
      holding.value = holding.amount * holding.currentPrice;
      holding.pnl = holding.value - holding.totalCost;
      holding.pnlPercent = holding.totalCost > 0 ? (holding.pnl / holding.totalCost) * 100 : 0;
    }
  });

  return holdings;
}

/**
 * Update portfolio holdings in database
 */
async function updatePortfolioHoldings(portfolioId, holdings) {
  // Delete existing holdings
  await prisma.portfolioHolding.deleteMany({
    where: { portfolioId }
  });

  // Create new holdings
  const holdingsData = Object.values(holdings)
    .filter(holding => holding.amount > 0)
    .map(holding => ({
      portfolioId,
      asset: holding.asset,
      amount: holding.amount,
      avgPrice: holding.avgPrice,
      currentPrice: holding.currentPrice,
      value: holding.value,
      pnl: holding.pnl,
      pnlPercent: holding.pnlPercent
    }));

  if (holdingsData.length > 0) {
    await prisma.portfolioHolding.createMany({
      data: holdingsData
    });
  }
}

/**
 * Get current prices for all assets
 */
async function getCurrentPrices() {
  const prices = await prisma.price.findMany({
    orderBy: { createdAt: 'desc' },
    distinct: ['symbol']
  });

  const priceMap = {};
  prices.forEach(price => {
    priceMap[price.symbol] = price.price;
  });

  return priceMap;
}

/**
 * Calculate additional portfolio metrics
 */
async function calculatePortfolioMetrics(userId, recentTrades) {
  const totalVolume = recentTrades.reduce((sum, trade) => sum + (trade.amount * trade.price), 0);
  const totalFees = recentTrades.reduce((sum, trade) => sum + (trade.buyerFee + trade.sellerFee), 0);
  
  return {
    totalVolume,
    totalFees,
    tradeCount: recentTrades.length,
    avgTradeSize: recentTrades.length > 0 ? totalVolume / recentTrades.length : 0
  };
}

/**
 * Refresh portfolio data (force recalculation)
 */
async function refreshPortfolioData(userId) {
  const portfolio = await prisma.portfolio.findUnique({
    where: { userId }
  });

  return await updatePortfolioData(userId, portfolio);
}