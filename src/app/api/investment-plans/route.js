import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/investment-plans - Get all active investment plans
export async function GET() {
  try {
    const plans = await prisma.investmentPlan.findMany({
      where: {
        isActive: true
      },
      orderBy: {
        minimumInvestment: 'asc'
      }
    });

    return NextResponse.json({
      success: true,
      data: plans
    });
  } catch (error) {
    console.error('Error fetching investment plans:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch investment plans' },
      { status: 500 }
    );
  }
}

// POST /api/investment-plans - Create new investment plan (Admin only)
export async function POST(request) {
  try {
    const body = await request.json();
    const { planName, minimumInvestment, maximumInvestment, profitPercentage, duration, description } = body;

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

    const plan = await prisma.investmentPlan.create({
      data: {
        planName,
        minimumInvestment: parseFloat(minimumInvestment),
        maximumInvestment: parseFloat(maximumInvestment),
        profitPercentage: parseFloat(profitPercentage),
        duration: parseInt(duration),
        description: description || null
      }
    });

    return NextResponse.json({
      success: true,
      data: plan,
      message: 'Investment plan created successfully'
    });
  } catch (error) {
    console.error('Error creating investment plan:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create investment plan' },
      { status: 500 }
    );
  }
}
