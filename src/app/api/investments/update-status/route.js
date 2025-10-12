import { NextResponse } from 'next/server';

// POST /api/investments/update-status - Update investment statuses
export async function POST(request) {
  let prisma;
  try {
    // Dynamic import to avoid build-time issues
    const { PrismaClient } = await import('@prisma/client');
    prisma = new PrismaClient();
    const now = new Date();
    
    // Find investments that should be completed
    const investmentsToComplete = await prisma.investment.findMany({
      where: {
        status: 'ACTIVE',
        endDate: {
          lte: now
        }
      },
      include: {
        plan: true,
        user: true
      }
    });

    if (investmentsToComplete.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No investments to update',
        updated: 0
      });
    }

    // Update investments to completed status
    const updateResult = await prisma.investment.updateMany({
      where: {
        id: {
          in: investmentsToComplete.map(inv => inv.id)
        }
      },
      data: {
        status: 'COMPLETED',
        actualReturn: {
          // Calculate actual return based on the plan's profit percentage
          // This could be more complex in a real system
          set: investmentsToComplete.map(inv => 
            inv.investedAmount + (inv.investedAmount * inv.plan.profitPercentage / 100)
          )
        }
      }
    });

    // Add completed amount to user's wallet balance
    for (const investment of investmentsToComplete) {
      const returnAmount = investment.investedAmount + (investment.investedAmount * investment.plan.profitPercentage / 100);
      
      // Update user's wallet balance
      await prisma.wallet.update({
        where: { userId: investment.userId },
        data: {
          balance: {
            increment: returnAmount
          }
        }
      });

      // Create transaction record for the return
      await prisma.transaction.create({
        data: {
          userId: investment.userId,
          type: 'INVESTMENT_RETURN',
          amount: returnAmount,
          status: 'COMPLETED',
          description: `Investment return from ${investment.plan.planName} plan`
        }
      });
    }

    return NextResponse.json({
      success: true,
      message: `Updated ${updateResult.count} investments to completed status`,
      updated: updateResult.count,
      investments: investmentsToComplete.map(inv => ({
        id: inv.id,
        planName: inv.plan.planName,
        amount: inv.investedAmount,
        returnAmount: inv.investedAmount + (inv.investedAmount * inv.plan.profitPercentage / 100)
      }))
    });

  } catch (error) {
    console.error('Error updating investment statuses:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update investment statuses' },
      { status: 500 }
    );
  } finally {
    // Clean up database connection
    if (typeof prisma !== 'undefined') {
      await prisma.$disconnect();
    }
  }
}
