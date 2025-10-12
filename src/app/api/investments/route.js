import { NextResponse } from 'next/server';

// GET /api/investments - Get user's investments
export async function GET(request) {
  let prisma;
  try {
    // Dynamic import to avoid build-time issues
    const { PrismaClient } = await import('@prisma/client');
    prisma = new PrismaClient();

    // Check if we're in build mode or database not available
    if (process.env.NODE_ENV === 'production' && !process.env.DATABASE_URL) {
      return NextResponse.json({
        success: true,
        data: []
      });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    const investments = await prisma.investment.findMany({
      where: { userId },
      include: {
        plan: {
          select: {
            planName: true,
            profitPercentage: true,
            duration: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({
      success: true,
      data: investments
    });
  } catch (error) {
    console.error('Error fetching investments:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch investments' },
      { status: 500 }
    );
  } finally {
    // Clean up database connection
    if (typeof prisma !== 'undefined') {
      await prisma.$disconnect();
    }
  }
}

// POST /api/investments - Create new investment
export async function POST(request) {
  let prisma;
  try {
    // Dynamic import to avoid build-time issues
    const { PrismaClient } = await import('@prisma/client');
    prisma = new PrismaClient();

    // Check if we're in build mode or database not available
    if (process.env.NODE_ENV === 'production' && !process.env.DATABASE_URL) {
      return NextResponse.json({
        success: false,
        error: 'Database not configured'
      }, { status: 503 });
    }
    
    const body = await request.json();
    const { userId, planId, investedAmount } = body;

    // Validate required fields
    if (!userId || !planId || !investedAmount) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get the investment plan
    const plan = await prisma.investmentPlan.findUnique({
      where: { id: planId }
    });

    if (!plan) {
      return NextResponse.json(
        { success: false, error: 'Investment plan not found' },
        { status: 404 }
      );
    }

    if (!plan.isActive) {
      return NextResponse.json(
        { success: false, error: 'Investment plan is not active' },
        { status: 400 }
      );
    }

    // Validate investment amount
    if (investedAmount < plan.minimumInvestment || investedAmount > plan.maximumInvestment) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Investment amount must be between $${plan.minimumInvestment} and $${plan.maximumInvestment}` 
        },
        { status: 400 }
      );
    }

    // Check user's wallet balance
    const wallet = await prisma.wallet.findUnique({
      where: { userId }
    });

    if (!wallet || wallet.balance < investedAmount) {
      return NextResponse.json(
        { success: false, error: 'Insufficient balance' },
        { status: 400 }
      );
    }

    // Calculate expected return (total amount including profit)
    const expectedReturn = investedAmount + (investedAmount * (plan.profitPercentage / 100));
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + plan.duration);

    // Create investment
    const investment = await prisma.investment.create({
      data: {
        userId,
        planId,
        investedAmount: parseFloat(investedAmount),
        endDate,
        expectedReturn: parseFloat(expectedReturn)
      },
      include: {
        plan: {
          select: {
            planName: true,
            profitPercentage: true,
            duration: true
          }
        }
      }
    });

    // Deduct amount from user's wallet
    await prisma.wallet.update({
      where: { userId },
      data: {
        balance: {
          decrement: parseFloat(investedAmount)
        }
      }
    });

    // Create transaction record
    await prisma.transaction.create({
      data: {
        userId,
        type: 'INVESTMENT',
        amount: parseFloat(investedAmount),
        status: 'COMPLETED',
        description: `Investment in ${plan.planName} plan`
      }
    });

    return NextResponse.json({
      success: true,
      data: investment,
      message: 'Investment created successfully'
    });
  } catch (error) {
    console.error('Error creating investment:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create investment' },
      { status: 500 }
    );
  } finally {
    // Clean up database connection
    if (typeof prisma !== 'undefined') {
      await prisma.$disconnect();
    }
  }
}
