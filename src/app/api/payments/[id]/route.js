import { NextResponse } from 'next/server';
import { getCurrentUser } from '../../../../utils/auth.js';
import { paymentsStorage, updateInvoiceStatus } from '../../../../utils/storage.js';
import { validateForm, paymentValidation, sanitizeObject } from '../../../../utils/validation.js';

// Helper function to get authenticated user
async function getAuthenticatedUser(request) {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Authorization token required');
  }

  const token = authHeader.substring(7);
  return await getCurrentUser(token);
}

// GET /api/payments/[id] - Get specific payment
export async function GET(request, { params }) {
  try {
    const user = await getAuthenticatedUser(request);
    const { id } = params;
    
    const payment = await paymentsStorage.findById(id);
    
    if (!payment) {
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      );
    }
    
    // Check if payment belongs to authenticated user
    if (payment.userId !== user.id) {
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { payment }
    });

  } catch (error) {
    console.error('Get payment error:', error);
    
    return NextResponse.json(
      { error: error.message || 'Failed to fetch payment' },
      { status: error.message === 'Authorization token required' ? 401 : 500 }
    );
  }
}

// PUT /api/payments/[id] - Update payment
export async function PUT(request, { params }) {
  try {
    const user = await getAuthenticatedUser(request);
    const { id } = params;
    
    const payment = await paymentsStorage.findById(id);
    
    if (!payment) {
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      );
    }
    
    // Check if payment belongs to authenticated user
    if (payment.userId !== user.id) {
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      );
    }

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

    // Update processed time if status changed to completed
    const updates = { ...sanitizedBody };
    if (sanitizedBody.status === 'completed' && payment.status !== 'completed') {
      updates.processedAt = new Date().toISOString();
    }

    // Update payment
    const updatedPayment = await paymentsStorage.update(id, updates);

    // Update invoice status
    await updateInvoiceStatus(payment.invoiceId);

    return NextResponse.json({
      success: true,
      message: 'Payment updated successfully',
      data: { payment: updatedPayment }
    });

  } catch (error) {
    console.error('Update payment error:', error);
    
    return NextResponse.json(
      { error: error.message || 'Failed to update payment' },
      { status: error.message === 'Authorization token required' ? 401 : 500 }
    );
  }
}

// DELETE /api/payments/[id] - Delete payment
export async function DELETE(request, { params }) {
  try {
    const user = await getAuthenticatedUser(request);
    const { id } = params;
    
    const payment = await paymentsStorage.findById(id);
    
    if (!payment) {
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      );
    }
    
    // Check if payment belongs to authenticated user
    if (payment.userId !== user.id) {
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      );
    }

    // Only allow deletion of pending payments
    if (payment.status === 'completed') {
      return NextResponse.json(
        { error: 'Completed payments cannot be deleted' },
        { status: 400 }
      );
    }

    // Delete payment
    await paymentsStorage.delete(id);

    // Update invoice status
    await updateInvoiceStatus(payment.invoiceId);

    return NextResponse.json({
      success: true,
      message: 'Payment deleted successfully'
    });

  } catch (error) {
    console.error('Delete payment error:', error);
    
    return NextResponse.json(
      { error: error.message || 'Failed to delete payment' },
      { status: error.message === 'Authorization token required' ? 401 : 500 }
    );
  }
}