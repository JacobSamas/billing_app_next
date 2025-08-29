import { NextResponse } from 'next/server';
import { getCurrentUser } from '../../../../utils/auth.js';
import { invoicesStorage, customersStorage, calculateInvoiceTotals } from '../../../../utils/storage.js';
import { validateForm, invoiceValidation, sanitizeObject } from '../../../../utils/validation.js';
import { createInvoiceItem } from '../../../../types/index.js';

// Helper function to get authenticated user
async function getAuthenticatedUser(request) {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Authorization token required');
  }

  const token = authHeader.substring(7);
  return await getCurrentUser(token);
}

// GET /api/invoices/[id] - Get specific invoice
export async function GET(request, { params }) {
  try {
    const user = await getAuthenticatedUser(request);
    const { id } = params;
    
    const invoice = await invoicesStorage.findById(id);
    
    if (!invoice) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      );
    }
    
    // Check if invoice belongs to authenticated user
    if (invoice.userId !== user.id) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      );
    }

    // Get customer information
    const customer = await customersStorage.findById(invoice.customerId);
    invoice.customer = customer;

    return NextResponse.json({
      success: true,
      data: { invoice }
    });

  } catch (error) {
    console.error('Get invoice error:', error);
    
    return NextResponse.json(
      { error: error.message || 'Failed to fetch invoice' },
      { status: error.message === 'Authorization token required' ? 401 : 500 }
    );
  }
}

// PUT /api/invoices/[id] - Update invoice
export async function PUT(request, { params }) {
  try {
    const user = await getAuthenticatedUser(request);
    const { id } = params;
    
    const invoice = await invoicesStorage.findById(id);
    
    if (!invoice) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      );
    }
    
    // Check if invoice belongs to authenticated user
    if (invoice.userId !== user.id) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const sanitizedBody = sanitizeObject(body);

    // Validate input
    const validation = validateForm(sanitizedBody, invoiceValidation);

    if (!validation.isValid) {
      return NextResponse.json(
        { 
          error: 'Validation failed', 
          details: validation.errors 
        },
        { status: 400 }
      );
    }

    // If customerId changed, verify new customer belongs to user
    if (sanitizedBody.customerId && sanitizedBody.customerId !== invoice.customerId) {
      const customer = await customersStorage.findById(sanitizedBody.customerId);
      if (!customer || customer.userId !== user.id) {
        return NextResponse.json(
          { error: 'Customer not found' },
          { status: 404 }
        );
      }
    }

    // Process invoice items if provided
    let processedItems = invoice.items;
    let totals = { subtotal: invoice.subtotal, taxTotal: invoice.taxTotal, total: invoice.total };
    
    if (sanitizedBody.items) {
      processedItems = sanitizedBody.items.map(item => 
        createInvoiceItem({
          ...item,
          amount: (item.quantity || 1) * (item.rate || 0),
          taxAmount: ((item.quantity || 1) * (item.rate || 0)) * (item.taxRate || 0) / 100
        })
      );

      totals = calculateInvoiceTotals(processedItems);
    }

    // Calculate amount due
    const amountDue = totals.total - (invoice.amountPaid || 0);

    // Update invoice
    const updatedInvoice = await invoicesStorage.update(id, {
      ...sanitizedBody,
      items: processedItems,
      subtotal: totals.subtotal,
      taxTotal: totals.taxTotal,
      total: totals.total,
      amountDue: amountDue
    });

    // Get customer information
    const customer = await customersStorage.findById(updatedInvoice.customerId);
    updatedInvoice.customer = customer;

    return NextResponse.json({
      success: true,
      message: 'Invoice updated successfully',
      data: { invoice: updatedInvoice }
    });

  } catch (error) {
    console.error('Update invoice error:', error);
    
    return NextResponse.json(
      { error: error.message || 'Failed to update invoice' },
      { status: error.message === 'Authorization token required' ? 401 : 500 }
    );
  }
}

// DELETE /api/invoices/[id] - Delete invoice
export async function DELETE(request, { params }) {
  try {
    const user = await getAuthenticatedUser(request);
    const { id } = params;
    
    const invoice = await invoicesStorage.findById(id);
    
    if (!invoice) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      );
    }
    
    // Check if invoice belongs to authenticated user
    if (invoice.userId !== user.id) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      );
    }

    // Only allow deletion of draft invoices
    if (invoice.status !== 'draft') {
      return NextResponse.json(
        { error: 'Only draft invoices can be deleted' },
        { status: 400 }
      );
    }

    // Delete invoice
    await invoicesStorage.delete(id);

    return NextResponse.json({
      success: true,
      message: 'Invoice deleted successfully'
    });

  } catch (error) {
    console.error('Delete invoice error:', error);
    
    return NextResponse.json(
      { error: error.message || 'Failed to delete invoice' },
      { status: error.message === 'Authorization token required' ? 401 : 500 }
    );
  }
}