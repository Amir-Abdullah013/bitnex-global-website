/**
 * GET /api/auth/me
 * Get current user information
 */

import { NextResponse } from 'next/server';
import { getServerSession } from '../../../../lib/session';

export async function GET(request) {
  try {
    const session = await getServerSession();
    
    if (!session?.id) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        id: session.id,
        email: session.email,
        name: session.name
      }
    });

  } catch (error) {
    console.error('Error getting user info:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
