import { NextResponse } from 'next/server';
import { authenticateUser } from '../../../../utils/auth.js';
import { validateForm, userValidation } from '../../../../utils/validation.js';

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // Validate input
    const validation = validateForm(
      { email, password },
      {
        email: userValidation.email,
        password: userValidation.password
      }
    );

    if (!validation.isValid) {
      return NextResponse.json(
        { 
          error: 'Validation failed', 
          details: validation.errors 
        },
        { status: 400 }
      );
    }

    // Authenticate user
    const result = await authenticateUser(email, password);

    return NextResponse.json({
      success: true,
      message: 'Login successful',
      data: result
    });

  } catch (error) {
    console.error('Login error:', error);
    
    return NextResponse.json(
      { 
        error: error.message || 'Login failed' 
      },
      { status: 401 }
    );
  }
}