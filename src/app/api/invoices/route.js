import { NextResponse } from 'next/server';
import { getCurrentUser } from '../../../utils/auth.js';
import { invoicesStorage, customersStorage, generateInvoiceNumber, calculateInvoiceTotals } from '../../../utils/storage.js';
import { validateForm, invoiceValidation, sanitizeObject } from '../../../utils/validation.js';
import { createInvoice, createInvoiceItem } from '../../../types/index.js';

// Helper function to get authenticated user
async function getAuthenticatedUser(request) {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Authorization token required');
  }

  const token = authHeader.substring(7);
  return await getCurrentUser(token);
}

// GET /api/invoices - Get all invoices for authenticated user
export async function GET(request) {
  try {
    const user = await getAuthenticatedUser(request);
    
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 20;
    const status = searchParams.get('status');
    const customerId = searchParams.get('customerId');
    
    const offset = (page - 1) * limit;
    
    let invoices = await invoicesStorage.findBy({ userId: user.id });
    
    // Apply filters
    if (status) {
      invoices = invoices.filter(invoice => invoice.status === status);
    }
    
    if (customerId) {
      invoices = invoices.filter(invoice => invoice.customerId === customerId);
    }
    
    // Sort by creation date (newest first)
    invoices = invoices.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    // Get customer information for each invoice
    for (const invoice of invoices) {
      const customer = await customersStorage.findById(invoice.customerId);
      invoice.customer = customer;
    }
    
    // Apply pagination
    const total = invoices.length;
    const paginatedInvoices = invoices.slice(offset, offset + limit);
    
    return NextResponse.json({
      success: true,
      data: {
        invoices: paginatedInvoices,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Get invoices error:', error);
    
    return NextResponse.json(
      { error: error.message || 'Failed to fetch invoices' },
      { status: error.message === 'Authorization token required' ? 401 : 500 }
    );
  }
}

// POST /api/invoices - Create new invoice
export async function POST(request) {
  try {
    const user = await getAuthenticatedUser(request);
    
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

    // Verify customer belongs to user
    const customer = await customersStorage.findById(sanitizedBody.customerId);
    if (!customer || customer.userId !== user.id) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    // Process invoice items
    const processedItems = sanitizedBody.items.map(item => 
      createInvoiceItem({
        ...item,
        amount: (item.quantity || 1) * (item.rate || 0),
        taxAmount: ((item.quantity || 1) * (item.rate || 0)) * (item.taxRate || 0) / 100
      })
    );

    // Calculate totals
    const totals = calculateInvoiceTotals(processedItems);
    
    // Generate invoice number
    const invoiceNumber = await generateInvoiceNumber('INV');

    // Create invoice
    const invoiceData = createInvoice({
      ...sanitizedBody,
      invoiceNumber,
      items: processedItems,
      subtotal: totals.subtotal,
      taxTotal: totals.taxTotal,
      total: totals.total,
      amountDue: totals.total,
      userId: user.id
    });

    const invoice = await invoicesStorage.create(invoiceData);

    // Add customer info
    invoice.customer = customer;

    return NextResponse.json({
      success: true,
      message: 'Invoice created successfully',
      data: { invoice }
    }, { status: 201 });

  } catch (error) {
    console.error('Create invoice error:', error);
    
    return NextResponse.json(
      { error: error.message || 'Failed to create invoice' },
      { status: error.message === 'Authorization token required' ? 401 : 500 }
    );
  }
}