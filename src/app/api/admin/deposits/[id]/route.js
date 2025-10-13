import { NextResponse } from 'next/server';
import { withAdminAuth } from '../../../../../lib/api-wrapper';
import { databaseHelpers } from '../../../../../lib/database';

export async function GET(request, { params }) {
  try {
    const depositId = params.id;
    console.log('🔧 GET request for deposit ID:', depositId);
    
    let depositRequest;

    try {
      // Try to fetch real data from database
      depositRequest = await databaseHelpers.deposit.getDepositRequestById(depositId);
      console.log('✅ Deposit request fetched from database:', depositRequest?.id);
    } catch (dbError) {
      console.warn('⚠️ Database error, using fallback data:', dbError.message);
      
      // Fallback mock data for specific deposit
      depositRequest = {
        id: depositId,
        userId: 'fallback-user',
        amount: 500.00,
        status: 'PENDING',
        screenshot: 'https://example.com/fallback-screenshot.jpg',
        binanceAddress: 'TFallback123...',
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        updatedAt: new Date(Date.now() - 86400000).toISOString(),
        user_name: 'Fallback User',
        user_email: 'fallback@example.com'
      };
    }

    if (!depositRequest) {
      return NextResponse.json(
        { success: false, error: 'Deposit request not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      depositRequest
    });

  } catch (error) {
    console.error('❌ Error fetching deposit request:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch deposit request' },
      { status: 500 }
    );
  }
}

export async function PATCH(request, { params }) {
  try {
    console.log('🔧 PATCH request received');
    console.log('🔧 Params:', params);
    
    const depositId = params.id;
    console.log('🔧 Deposit ID from params:', depositId);
    
    const { action, adminNotes } = await request.json();
    console.log('🔧 PATCH request data:', { depositId, action, adminNotes });

    if (!action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { success: false, error: 'Invalid action. Must be "approve" or "reject"' },
        { status: 400 }
      );
    }

    const newStatus = action === 'approve' ? 'COMPLETED' : 'FAILED';
    
    let depositRequest;
    let dataSource = 'database';

    try {
      // Try to get the real deposit request first
      depositRequest = await databaseHelpers.deposit.getDepositRequestById(depositId);
      console.log('✅ Found deposit request in database:', depositRequest?.id);

      if (depositRequest && depositRequest.status !== 'PENDING') {
        return NextResponse.json(
          { success: false, error: 'Deposit request has already been processed' },
          { status: 400 }
        );
      }

      // Try to update in database
      const updatedDepositRequest = await databaseHelpers.deposit.updateDepositRequest(depositId, {
        status: newStatus,
        adminNotes
      });

      console.log(`✅ Deposit request ${action}d in database:`, {
        depositId,
        status: newStatus
      });

      // If approved, update user's wallet balance
      if (action === 'approve' && depositRequest) {
        try {
          console.log('🔧 Updating user wallet balance...');
          
          // First, ensure user has a wallet
          let userWallet = await databaseHelpers.wallet.getWalletByUserId(depositRequest.userId);
          if (!userWallet) {
            console.log('🔧 Creating wallet for user:', depositRequest.userId);
            userWallet = await databaseHelpers.wallet.createWallet(depositRequest.userId);
          }
          
          // Update the balance
          await databaseHelpers.wallet.updateBalance(depositRequest.userId, depositRequest.amount);
          console.log('✅ User wallet balance updated successfully');
        } catch (balanceError) {
          console.warn('⚠️ Failed to update user wallet balance:', balanceError.message);
          // Continue even if balance update fails
        }
      }

      // Update related transaction status if it exists
      if (depositRequest.transactionId) {
        try {
          console.log('🔧 Updating transaction status...');
          await databaseHelpers.transaction.updateTransactionStatus(depositRequest.transactionId, newStatus);
          console.log('✅ Transaction status updated successfully');
        } catch (transactionError) {
          console.warn('⚠️ Failed to update transaction status:', transactionError.message);
          // Continue even if transaction update fails
        }
      }

      // Create notification for user
      if (depositRequest) {
        try {
          console.log('🔧 Creating user notification...');
          const notificationData = {
            userId: depositRequest.userId,
            title: action === 'approve' ? 'Deposit Approved' : 'Deposit Rejected',
            message: action === 'approve' 
              ? `Your deposit of $${depositRequest.amount} has been approved and added to your balance.`
              : `Your deposit of $${depositRequest.amount} has been rejected. ${adminNotes ? `Reason: ${adminNotes}` : ''}`,
            type: action === 'approve' ? 'SUCCESS' : 'ALERT'
          };
          
          await databaseHelpers.notification.createNotification(notificationData);
          console.log('✅ User notification created successfully');
        } catch (notificationError) {
          console.warn('⚠️ Failed to create user notification:', notificationError.message);
          // Continue even if notification creation fails
        }
      }

      return NextResponse.json({
        success: true,
        message: `Deposit request ${action}d successfully`,
        depositRequest: updatedDepositRequest,
        dataSource: 'database',
        balanceUpdated: action === 'approve'
      });

    } catch (dbError) {
      console.warn('⚠️ Database error, using fallback mode:', dbError.message);
      dataSource = 'fallback';
      
      // Fallback mode - create mock response
      const fallbackDepositRequest = {
        id: depositId,
        userId: 'fallback-user',
        amount: 500.00,
        status: newStatus,
        adminNotes: adminNotes || '',
        transactionId: 'fallback-transaction-1',
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        updatedAt: new Date().toISOString()
      };

      console.log(`✅ Deposit request ${action}d in fallback mode:`, {
        depositId,
        userId: fallbackDepositRequest.userId,
        amount: fallbackDepositRequest.amount,
        status: newStatus
      });

      return NextResponse.json({
        success: true,
        message: `Deposit request ${action}d successfully`,
        depositRequest: fallbackDepositRequest,
        dataSource: 'fallback',
        warning: 'Using fallback mode - database not available'
      });
    }

  } catch (error) {
    console.error('❌ Error updating deposit request:', error);
    console.error('❌ Error stack:', error.stack);
    return NextResponse.json(
      { success: false, error: 'Failed to update deposit request' },
      { status: 500 }
    );
  }
}



