import { NextResponse } from 'next/server';

export async function PATCH(request) {
  try {
    console.log('🔧 Test PATCH endpoint called');
    
    const body = await request.json();
    console.log('🔧 Test PATCH body:', body);
    
    return NextResponse.json({
      success: true,
      message: 'Test PATCH endpoint is working',
      receivedData: body,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Test PATCH error:', error);
    return NextResponse.json(
      { success: false, error: 'Test PATCH failed' },
      { status: 500 }
    );
  }
}

