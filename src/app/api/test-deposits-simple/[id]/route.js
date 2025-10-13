import { NextResponse } from 'next/server';

export async function PATCH(request, { params }) {
  try {
    console.log('🔧 Test deposits PATCH called');
    console.log('🔧 Params:', params);
    
    const depositId = params.id;
    const { action, adminNotes } = await request.json();
    
    console.log('🔧 Test PATCH data:', { depositId, action, adminNotes });

    if (!action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { success: false, error: 'Invalid action. Must be "approve" or "reject"' },
        { status: 400 }
      );
    }

    const newStatus = action === 'approve' ? 'COMPLETED' : 'FAILED';
    
    const fallbackDepositRequest = {
      id: depositId,
      userId: 'test-user',
      amount: 500.00,
      status: newStatus,
      adminNotes: adminNotes || '',
      transactionId: 'test-transaction-1',
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      updatedAt: new Date().toISOString()
    };

    console.log(`✅ Test deposit request ${action}d:`, {
      depositId,
      status: newStatus
    });

    return NextResponse.json({
      success: true,
      message: `Test deposit request ${action}d successfully`,
      depositRequest: fallbackDepositRequest,
      dataSource: 'test'
    });

  } catch (error) {
    console.error('❌ Test deposits PATCH error:', error);
    console.error('❌ Error stack:', error.stack);
    return NextResponse.json(
      { success: false, error: 'Test PATCH failed' },
      { status: 500 }
    );
  }
}

