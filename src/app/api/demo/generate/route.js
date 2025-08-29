import { NextResponse } from 'next/server';
import { getCurrentUser } from '../../../../utils/auth.js';
import { generateDemoData } from '../../../../utils/demoData.js';

export async function POST(request) {
  try {
    const user = await getAuthenticatedUser(request);
    
    console.log('🎭 Starting demo data generation for user:', user.id);
    const stats = await generateDemoData(user.id);
    
    return NextResponse.json({
      success: true,
      message: 'Demo data generated successfully! 🎉',
      data: stats
    });

  } catch (error) {
    console.error('Generate demo data error:', error);
    
    return NextResponse.json(
      { 
        error: error.message || 'Failed to generate demo data' 
      },
      { status: 500 }
    );
  }
}

// Helper function to get authenticated user
async function getAuthenticatedUser(request) {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Authorization token required');
  }

  const token = authHeader.substring(7);
  return await getCurrentUser(token);
}