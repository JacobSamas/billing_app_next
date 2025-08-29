import { NextResponse } from 'next/server';
import { getCurrentUser } from '../../../../utils/auth.js';
import { customersStorage } from '../../../../utils/storage.js';
import { validateForm, customerValidation, sanitizeObject } from '../../../../utils/validation.js';

// Helper function to get authenticated user
async function getAuthenticatedUser(request) {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Authorization token required');
  }

  const token = authHeader.substring(7);
  return await getCurrentUser(token);
}

// GET /api/customers/[id] - Get specific customer
export async function GET(request, { params }) {
  try {
    const user = await getAuthenticatedUser(request);
    const { id } = params;
    
    const customer = await customersStorage.findById(id);
    
    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }
    
    // Check if customer belongs to authenticated user
    if (customer.userId !== user.id) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { customer }
    });

  } catch (error) {
    console.error('Get customer error:', error);
    
    return NextResponse.json(
      { error: error.message || 'Failed to fetch customer' },
      { status: error.message === 'Authorization token required' ? 401 : 500 }
    );
  }
}

// PUT /api/customers/[id] - Update customer
export async function PUT(request, { params }) {
  try {
    const user = await getAuthenticatedUser(request);
    const { id } = params;
    
    const customer = await customersStorage.findById(id);
    
    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }
    
    // Check if customer belongs to authenticated user
    if (customer.userId !== user.id) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const sanitizedBody = sanitizeObject(body);

    // Validate input
    const validation = validateForm(sanitizedBody, customerValidation);

    if (!validation.isValid) {
      return NextResponse.json(
        { 
          error: 'Validation failed', 
          details: validation.errors 
        },
        { status: 400 }
      );
    }

    // Update customer
    const updatedCustomer = await customersStorage.update(id, sanitizedBody);

    return NextResponse.json({
      success: true,
      message: 'Customer updated successfully',
      data: { customer: updatedCustomer }
    });

  } catch (error) {
    console.error('Update customer error:', error);
    
    return NextResponse.json(
      { error: error.message || 'Failed to update customer' },
      { status: error.message === 'Authorization token required' ? 401 : 500 }
    );
  }
}

// DELETE /api/customers/[id] - Delete customer
export async function DELETE(request, { params }) {
  try {
    const user = await getAuthenticatedUser(request);
    const { id } = params;
    
    const customer = await customersStorage.findById(id);
    
    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }
    
    // Check if customer belongs to authenticated user
    if (customer.userId !== user.id) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    // Delete customer
    await customersStorage.delete(id);

    return NextResponse.json({
      success: true,
      message: 'Customer deleted successfully'
    });

  } catch (error) {
    console.error('Delete customer error:', error);
    
    return NextResponse.json(
      { error: error.message || 'Failed to delete customer' },
      { status: error.message === 'Authorization token required' ? 401 : 500 }
    );
  }
}