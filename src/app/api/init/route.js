import { NextResponse } from 'next/server';
import { initializeDefaultData } from '../../../utils/storage.js';

export async function POST() {
  try {
    await initializeDefaultData();
    return NextResponse.json({
      success: true,
      message: 'Default data initialized successfully'
    });
  } catch (error) {
    console.error('Initialize error:', error);
    return NextResponse.json(
      { error: 'Failed to initialize data' },
      { status: 500 }
    );
  }
}