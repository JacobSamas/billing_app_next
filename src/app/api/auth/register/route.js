import { NextResponse } from 'next/server';
import { registerUser } from '../../../../utils/auth.js';
import { validateForm, userValidation } from '../../../../utils/validation.js';
import { sanitizeObject } from '../../../../utils/validation.js';

export async function POST(request) {
  try {
    const body = await request.json();
    const sanitizedBody = sanitizeObject(body);

    // Validate input
    const validation = validateForm(sanitizedBody, userValidation);

    if (!validation.isValid) {
      return NextResponse.json(
        { 
          error: 'Validation failed', 
          details: validation.errors 
        },
        { status: 400 }
      );
    }

    // Register user
    const result = await registerUser(sanitizedBody);

    return NextResponse.json({
      success: true,
      message: 'Registration successful',
      data: result
    }, { status: 201 });

  } catch (error) {
    console.error('Registration error:', error);
    
    let statusCode = 400;
    if (error.message === 'User already exists') {
      statusCode = 409;
    }
    
    return NextResponse.json(
      { 
        error: error.message || 'Registration failed' 
      },
      { status: statusCode }
    );
  }
}