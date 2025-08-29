import { NextResponse } from 'next/server';
import { getCurrentUser } from '../../../utils/auth.js';
import { customersStorage } from '../../../utils/storage.js';
import { validateForm, customerValidation, sanitizeObject } from '../../../utils/validation.js';
import { createCustomer } from '../../../types/index.js';

// Helper function to get authenticated user
async function getAuthenticatedUser(request) {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Authorization token required');
  }

  const token = authHeader.substring(7);
  return await getCurrentUser(token);
}

// GET /api/customers - Get all customers for authenticated user
export async function GET(request) {
  try {
    const user = await getAuthenticatedUser(request);
    
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 50;
    const search = searchParams.get('search') || '';
    
    const offset = (page - 1) * limit;
    
    let customers = await customersStorage.findBy({ userId: user.id });
    
    // Apply search filter
    if (search) {
      customers = customers.filter(customer => 
        customer.name.toLowerCase().includes(search.toLowerCase()) ||
        customer.email.toLowerCase().includes(search.toLowerCase()) ||
        customer.company.toLowerCase().includes(search.toLowerCase())
      );
    }
    
    // Apply pagination
    const total = customers.length;
    const paginatedCustomers = customers.slice(offset, offset + limit);
    
    return NextResponse.json({
      success: true,
      data: {
        customers: paginatedCustomers,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Get customers error:', error);
    
    return NextResponse.json(
      { error: error.message || 'Failed to fetch customers' },
      { status: error.message === 'Authorization token required' ? 401 : 500 }
    );
  }
}

// POST /api/customers - Create new customer
export async function POST(request) {
  try {
    const user = await getAuthenticatedUser(request);
    
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

    // Create customer
    const customerData = createCustomer({
      ...sanitizedBody,
      userId: user.id
    });

    const customer = await customersStorage.create(customerData);

    return NextResponse.json({
      success: true,
      message: 'Customer created successfully',
      data: { customer }
    }, { status: 201 });

  } catch (error) {
    console.error('Create customer error:', error);
    
    return NextResponse.json(
      { error: error.message || 'Failed to create customer' },
      { status: error.message === 'Authorization token required' ? 401 : 500 }
    );
  }
}