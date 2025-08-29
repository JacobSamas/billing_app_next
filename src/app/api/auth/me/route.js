import { NextResponse } from 'next/server';
import { getCurrentUser } from '../../../../utils/auth.js';

export async function GET(request) {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization token required' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    const user = await getCurrentUser(token);

    return NextResponse.json({
      success: true,
      data: { user }
    });

  } catch (error) {
    console.error('Get current user error:', error);
    
    return NextResponse.json(
      { 
        error: error.message || 'Authentication failed' 
      },
      { status: 401 }
    );
  }
}