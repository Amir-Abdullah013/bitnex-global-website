import { NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('🔧 Test deposits API called');
    
    return NextResponse.json({
      success: true,
      message: 'Test deposits API is working',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Test deposits API error:', error);
    return NextResponse.json(
      { success: false, error: 'Test API failed' },
      { status: 500 }
    );
  }
}

export async function PATCH(request) {
  try {
    console.log('🔧 Test deposits PATCH called');
    
    const body = await request.json();
    console.log('🔧 Test PATCH body:', body);
    
    return NextResponse.json({
      success: true,
      message: 'Test deposits PATCH is working',
      receivedData: body,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Test deposits PATCH error:', error);
    return NextResponse.json(
      { success: false, error: 'Test PATCH failed' },
      { status: 500 }
    );
  }
}

