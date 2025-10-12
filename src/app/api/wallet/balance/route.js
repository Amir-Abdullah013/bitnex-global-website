import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Return mock wallet data to prevent infinite loading
    const mockWallet = {
      success: true,
      usdBalance: 5000 + Math.random() * 2000,
      bnxBalance: 1000000 + Math.random() * 500000,
      bnxPrice: 0.0035 + (Math.random() - 0.5) * 0.001
    };

    return NextResponse.json(mockWallet);

  } catch (error) {
    console.error('Error fetching wallet balance:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch wallet balance' },
      { status: 500 }
    );
  }
}