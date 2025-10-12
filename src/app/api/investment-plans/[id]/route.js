import { NextResponse } from 'next/server';

// GET /api/investment-plans/[id] - Get specific investment plan
export async function GET(request, { params }) {
  let prisma;
  try {
    // Dynamic import to avoid build-time issues
    const { PrismaClient } = await import('@prisma/client');
    prisma = new PrismaClient();
    const { id } = params;

    const plan = await prisma.investmentPlan.findUnique({
      where: { id },
      include: {
        investments: {
          where: { status: 'ACTIVE' },
          select: {
            id: true,
            investedAmount: true,
            startDate: true,
            status: true
          }
        }
      }
    });

    if (!plan) {
      return NextResponse.json(
        { success: false, error: 'Investment plan not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: plan
    });
  } catch (error) {
    console.error('Error fetching investment plan:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch investment plan' },
      { status: 500 }
    );
  } finally {
    // Clean up database connection
    if (typeof prisma !== 'undefined') {
      await prisma.$disconnect();
    }
  }
}

// PUT /api/investment-plans/[id] - Update investment plan (Admin only)
export async function PUT(request, { params }) {
  let prisma;
  try {
    // Dynamic import to avoid build-time issues
    const { PrismaClient } = await import('@prisma/client');
    prisma = new PrismaClient();
    const { id } = params;
    const body = await request.json();
    const { planName, minimumInvestment, maximumInvestment, profitPercentage, duration, description, isActive } = body;

    // Validate required fields
    if (!planName || !minimumInvestment || !maximumInvestment || !profitPercentage || !duration) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate business logic
    if (minimumInvestment >= maximumInvestment) {
      return NextResponse.json(
        { success: false, error: 'Minimum investment must be less than maximum investment' },
        { status: 400 }
      );
    }

    if (profitPercentage <= 0) {
      return NextResponse.json(
        { success: false, error: 'Profit percentage must be greater than 0' },
        { status: 400 }
      );
    }

    const plan = await prisma.investmentPlan.update({
      where: { id },
      data: {
        planName,
        minimumInvestment: parseFloat(minimumInvestment),
        maximumInvestment: parseFloat(maximumInvestment),
        profitPercentage: parseFloat(profitPercentage),
        duration: parseInt(duration),
        description: description || null,
        isActive: isActive !== undefined ? isActive : true
      }
    });

    return NextResponse.json({
      success: true,
      data: plan,
      message: 'Investment plan updated successfully'
    });
  } catch (error) {
    console.error('Error updating investment plan:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update investment plan' },
      { status: 500 }
    );
  } finally {
    // Clean up database connection
    if (typeof prisma !== 'undefined') {
      await prisma.$disconnect();
    }
  }
}

// DELETE /api/investment-plans/[id] - Delete investment plan (Admin only)
export async function DELETE(request, { params }) {
  let prisma;
  try {
    // Dynamic import to avoid build-time issues
    const { PrismaClient } = await import('@prisma/client');
    prisma = new PrismaClient();
    const { id } = params;

    // Check if plan has active investments
    const activeInvestments = await prisma.investment.count({
      where: {
        planId: id,
        status: 'ACTIVE'
      }
    });

    if (activeInvestments > 0) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete plan with active investments' },
        { status: 400 }
      );
    }

    await prisma.investmentPlan.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      message: 'Investment plan deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting investment plan:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete investment plan' },
      { status: 500 }
    );
  } finally {
    // Clean up database connection
    if (typeof prisma !== 'undefined') {
      await prisma.$disconnect();
    }
  }
}
