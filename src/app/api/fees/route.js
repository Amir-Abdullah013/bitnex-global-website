import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { feeCalculator } from '../../../lib/fee-calculator';

const prisma = new PrismaClient();

/**
 * GET /api/fees - Get all fee structures or specific fee info
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const tradingPairId = searchParams.get('tradingPairId');
    const type = searchParams.get('type'); // 'structures', 'info', 'calculate'

    // Get fee structures
    if (type === 'structures') {
      const feeStructures = await prisma.feeStructure.findMany({
        where: { isActive: true },
        orderBy: [
          { isDefault: 'desc' },
          { createdAt: 'desc' }
        ]
      });

      return NextResponse.json({
        success: true,
        feeStructures
      });
    }

    // Get fee info for a trading pair
    if (type === 'info' && tradingPairId) {
      const feeInfo = await feeCalculator.getFeeInfo(tradingPairId);
      return NextResponse.json({
        success: true,
        feeInfo
      });
    }

    // Calculate fees
    if (type === 'calculate') {
      const orderType = searchParams.get('orderType'); // 'trading', 'withdrawal', 'deposit'
      const asset = searchParams.get('asset');
      const amount = parseFloat(searchParams.get('amount'));
      const price = parseFloat(searchParams.get('price'));
      const side = searchParams.get('side');
      const isMaker = searchParams.get('isMaker') === 'true';

      if (!orderType || !amount) {
        return NextResponse.json({
          success: false,
          error: 'Missing required parameters'
        }, { status: 400 });
      }

      let calculation;

      switch (orderType) {
        case 'trading':
          if (!tradingPairId || !price || !side) {
            return NextResponse.json({
              success: false,
              error: 'Missing trading parameters'
            }, { status: 400 });
          }
          calculation = await feeCalculator.calculateTradingFee({
            tradingPairId,
            amount,
            price,
            side,
            isMaker
          });
          break;

        case 'withdrawal':
          if (!asset) {
            return NextResponse.json({
              success: false,
              error: 'Missing asset parameter'
            }, { status: 400 });
          }
          calculation = await feeCalculator.calculateWithdrawalFee({
            asset,
            amount,
            tradingPairId
          });
          break;

        case 'deposit':
          if (!asset) {
            return NextResponse.json({
              success: false,
              error: 'Missing asset parameter'
            }, { status: 400 });
          }
          calculation = await feeCalculator.calculateDepositFee({
            asset,
            amount,
            tradingPairId
          });
          break;

        default:
          return NextResponse.json({
            success: false,
            error: 'Invalid order type'
          }, { status: 400 });
      }

      return NextResponse.json({
        success: true,
        calculation
      });
    }

    // Default: return all fee structures
    const feeStructures = await prisma.feeStructure.findMany({
      orderBy: [
        { isDefault: 'desc' },
        { createdAt: 'desc' }
      ]
    });

    return NextResponse.json({
      success: true,
      feeStructures
    });

  } catch (error) {
    console.error('Error in fees API:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

/**
 * POST /api/fees - Create new fee structure
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const {
      name,
      description,
      makerFee,
      takerFee,
      withdrawalFees,
      depositFees,
      minTradingFee,
      minWithdrawalFee,
      maxTradingFee,
      maxWithdrawalFee,
      isDefault = false
    } = body;

    // Validate required fields
    if (!name || makerFee === undefined || takerFee === undefined) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields'
      }, { status: 400 });
    }

    // If setting as default, unset other defaults
    if (isDefault) {
      await prisma.feeStructure.updateMany({
        where: { isDefault: true },
        data: { isDefault: false }
      });
    }

    // Create fee structure
    const feeStructure = await prisma.feeStructure.create({
      data: {
        name,
        description,
        makerFee,
        takerFee,
        withdrawalFees: withdrawalFees || {},
        depositFees: depositFees || {},
        minTradingFee: minTradingFee || 0.0001,
        minWithdrawalFee: minWithdrawalFee || 0.0001,
        maxTradingFee,
        maxWithdrawalFee,
        isDefault
      }
    });

    return NextResponse.json({
      success: true,
      feeStructure
    });

  } catch (error) {
    console.error('Error creating fee structure:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to create fee structure'
    }, { status: 500 });
  }
}

/**
 * PUT /api/fees - Update fee structure
 */
export async function PUT(request) {
  try {
    const body = await request.json();
    const {
      id,
      name,
      description,
      makerFee,
      takerFee,
      withdrawalFees,
      depositFees,
      minTradingFee,
      minWithdrawalFee,
      maxTradingFee,
      maxWithdrawalFee,
      isActive,
      isDefault = false
    } = body;

    if (!id) {
      return NextResponse.json({
        success: false,
        error: 'Missing fee structure ID'
      }, { status: 400 });
    }

    // If setting as default, unset other defaults
    if (isDefault) {
      await prisma.feeStructure.updateMany({
        where: { isDefault: true },
        data: { isDefault: false }
      });
    }

    // Update fee structure
    const feeStructure = await prisma.feeStructure.update({
      where: { id },
      data: {
        name,
        description,
        makerFee,
        takerFee,
        withdrawalFees,
        depositFees,
        minTradingFee,
        minWithdrawalFee,
        maxTradingFee,
        maxWithdrawalFee,
        isActive,
        isDefault
      }
    });

    return NextResponse.json({
      success: true,
      feeStructure
    });

  } catch (error) {
    console.error('Error updating fee structure:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to update fee structure'
    }, { status: 500 });
  }
}

/**
 * DELETE /api/fees - Delete fee structure
 */
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({
        success: false,
        error: 'Missing fee structure ID'
      }, { status: 400 });
    }

    // Check if fee structure is default
    const feeStructure = await prisma.feeStructure.findUnique({
      where: { id }
    });

    if (feeStructure?.isDefault) {
      return NextResponse.json({
        success: false,
        error: 'Cannot delete default fee structure'
      }, { status: 400 });
    }

    // Check if fee structure is in use
    const tradingPairs = await prisma.tradingPair.findMany({
      where: { feeStructureId: id }
    });

    if (tradingPairs.length > 0) {
      return NextResponse.json({
        success: false,
        error: 'Cannot delete fee structure that is in use by trading pairs'
      }, { status: 400 });
    }

    // Delete fee structure
    await prisma.feeStructure.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      message: 'Fee structure deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting fee structure:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to delete fee structure'
    }, { status: 500 });
  }
}

