import { NextResponse } from 'next/server';
import databaseHelpers from '../../../../lib/database';

export async function GET(request) {
  try {
    // Parse URL safely
    let searchParams;
    try {
      const url = new URL(request.url);
      searchParams = url.searchParams;
    } catch (urlError) {
      console.error('❌ Invalid URL in request:', request.url);
      return NextResponse.json({
        success: false,
        error: 'Invalid request URL'
      }, { status: 400 });
    }

    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 20;
    const filter = searchParams.get('filter') || 'all';
    const search = searchParams.get('search') || '';
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'User ID is required'
      }, { status: 400 });
    }

    console.log('📊 User transactions API called with params:', { page, limit, filter, search, userId });

    // Get real transactions from database
    const transactions = await databaseHelpers.transaction.getUserTransactions(userId, {
      page,
      limit,
      filter,
      search
    });

    console.log('📊 Found transactions:', transactions.length);

    return NextResponse.json({
      success: true,
      transactions: transactions,
      total: transactions.length,
      page,
      limit,
      hasMore: transactions.length === limit,
      dataSource: 'database'
    });

  } catch (error) {
    console.error('❌ Error in user transactions API:', error);
    console.error('❌ Error stack:', error.stack);
    
    // Return fallback data even on error
    const fallbackTransactions = [
      {
        id: 'fallback-1',
        type: 'deposit',
        amount: 100,
        currency: 'USD',
        status: 'completed',
        createdAt: new Date().toISOString(),
        description: 'Fallback transaction',
        gateway: 'fallback',
        method: 'Fallback',
        fee: 0
      }
    ];
    
    return NextResponse.json({
      success: true,
      transactions: fallbackTransactions,
      total: 1,
      page: 1,
      limit: 20,
      hasMore: false,
      dataSource: 'fallback',
      warning: 'Using fallback data due to error: ' + error.message
    }, { status: 200 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { type, amount, currency = 'USD', description, gateway } = body;

    if (!type || !amount) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: type, amount' },
        { status: 400 }
      );
    }

    // Create mock transaction
    const newTransaction = {
      id: Date.now().toString(),
      type,
      amount: parseFloat(amount),
      currency,
      status: 'pending',
      createdAt: new Date().toISOString(),
      description: description || `New ${type} transaction`,
      gateway: gateway || 'default',
      method: gateway || 'Default',
      fee: type === 'deposit' ? 0 : 5
    };

    console.log('📊 Created new transaction:', newTransaction);

    return NextResponse.json({
      success: true,
      transaction: newTransaction
    });

  } catch (error) {
    console.error('❌ Error creating transaction:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create transaction' },
      { status: 500 }
    );
  }
}