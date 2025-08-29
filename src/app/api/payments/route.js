import { NextResponse } from 'next/server';
import { getCurrentUser } from '../../../utils/auth.js';
import { paymentsStorage, invoicesStorage, updateInvoiceStatus } from '../../../utils/storage.js';
import { validateForm, paymentValidation, sanitizeObject } from '../../../utils/validation.js';
import { createPayment } from '../../../types/index.js';

// Helper function to get authenticated user
async function getAuthenticatedUser(request) {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Authorization token required');
  }

  const token = authHeader.substring(7);
  return await getCurrentUser(token);
}

// GET /api/payments - Get all payments for authenticated user
export async function GET(request) {
  try {
    const user = await getAuthenticatedUser(request);
    
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 20;
    const status = searchParams.get('status');
    const invoiceId = searchParams.get('invoiceId');
    const customerId = searchParams.get('customerId');
    
    const offset = (page - 1) * limit;
    
    let payments = await paymentsStorage.findBy({ userId: user.id });
    
    // Apply filters
    if (status) {
      payments = payments.filter(payment => payment.status === status);
    }
    
    if (invoiceId) {
      payments = payments.filter(payment => payment.invoiceId === invoiceId);
    }
    
    if (customerId) {
      payments = payments.filter(payment => payment.customerId === customerId);
    }
    
    // Sort by creation date (newest first)
    payments = payments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    // Apply pagination
    const total = payments.length;
    const paginatedPayments = payments.slice(offset, offset + limit);
    
    return NextResponse.json({
      success: true,
      data: {
        payments: paginatedPayments,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Get payments error:', error);
    
    return NextResponse.json(
      { error: error.message || 'Failed to fetch payments' },
      { status: error.message === 'Authorization token required' ? 401 : 500 }
    );
  }
}

// POST /api/payments - Create new payment
export async function POST(request) {
  try {
    const user = await getAuthenticatedUser(request);
    
    const body = await request.json();
    const sanitizedBody = sanitizeObject(body);

    // Validate input
    const validation = validateForm(sanitizedBody, paymentValidation);

    if (!validation.isValid) {
      return NextResponse.json(
        { 
          error: 'Validation failed', 
          details: validation.errors 
        },
        { status: 400 }
      );
    }

    // Verify invoice exists and belongs to user
    const invoice = await invoicesStorage.findById(sanitizedBody.invoiceId);
    if (!invoice || invoice.userId !== user.id) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      );
    }

    // Check if payment amount doesn't exceed amount due
    if (sanitizedBody.amount > invoice.amountDue) {
      return NextResponse.json(
        { error: 'Payment amount cannot exceed amount due' },
        { status: 400 }
      );
    }

    // Create payment
    const paymentData = createPayment({
      ...sanitizedBody,
      customerId: invoice.customerId,
      userId: user.id,
      processedAt: sanitizedBody.status === 'completed' ? new Date().toISOString() : null
    });

    const payment = await paymentsStorage.create(paymentData);

    // Update invoice status if payment is completed
    if (payment.status === 'completed') {
      await updateInvoiceStatus(payment.invoiceId);
    }

    return NextResponse.json({
      success: true,
      message: 'Payment created successfully',
      data: { payment }
    }, { status: 201 });

  } catch (error) {
    console.error('Create payment error:', error);
    
    return NextResponse.json(
      { error: error.message || 'Failed to create payment' },
      { status: error.message === 'Authorization token required' ? 401 : 500 }
    );
  }
}