import { NextResponse } from 'next/server';
import { getCurrentUser } from '../../../../utils/auth.js';
import { invoicesStorage, paymentsStorage, customersStorage } from '../../../../utils/storage.js';

// Helper function to get authenticated user
async function getAuthenticatedUser(request) {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Authorization token required');
  }

  const token = authHeader.substring(7);
  return await getCurrentUser(token);
}

// GET /api/dashboard/stats - Get dashboard statistics
export async function GET(request) {
  try {
    const user = await getAuthenticatedUser(request);
    
    // Get all data for user
    const [invoices, payments, customers] = await Promise.all([
      invoicesStorage.findBy({ userId: user.id }),
      paymentsStorage.findBy({ userId: user.id }),
      customersStorage.findBy({ userId: user.id })
    ]);

    // Calculate invoice statistics
    const totalInvoices = invoices.length;
    const totalRevenue = invoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
    const totalOutstanding = invoices
      .filter(inv => inv.status !== 'paid' && inv.status !== 'cancelled')
      .reduce((sum, inv) => sum + (inv.amountDue || 0), 0);

    // Invoice status breakdown
    const invoicesByStatus = invoices.reduce((acc, inv) => {
      acc[inv.status] = (acc[inv.status] || 0) + 1;
      return acc;
    }, {});

    // Payment statistics
    const completedPayments = payments.filter(p => p.status === 'completed');
    const totalPaid = completedPayments.reduce((sum, p) => sum + (p.amount || 0), 0);

    // Recent activity (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentInvoices = invoices.filter(inv => new Date(inv.createdAt) >= thirtyDaysAgo);
    const recentPayments = completedPayments.filter(p => new Date(p.createdAt) >= thirtyDaysAgo);

    // Monthly revenue (last 6 months)
    const monthlyRevenue = [];
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date();
      monthStart.setMonth(monthStart.getMonth() - i, 1);
      monthStart.setHours(0, 0, 0, 0);
      
      const monthEnd = new Date(monthStart);
      monthEnd.setMonth(monthEnd.getMonth() + 1);
      
      const monthInvoices = invoices.filter(inv => {
        const invoiceDate = new Date(inv.createdAt);
        return invoiceDate >= monthStart && invoiceDate < monthEnd;
      });
      
      const revenue = monthInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
      
      monthlyRevenue.push({
        month: monthStart.toLocaleString('default', { month: 'short', year: 'numeric' }),
        revenue: Math.round(revenue * 100) / 100
      });
    }

    // Top customers by revenue
    const customerRevenue = {};
    invoices.forEach(inv => {
      const customerId = inv.customerId;
      if (!customerRevenue[customerId]) {
        customerRevenue[customerId] = { total: 0, invoiceCount: 0 };
      }
      customerRevenue[customerId].total += inv.total || 0;
      customerRevenue[customerId].invoiceCount += 1;
    });

    const topCustomers = Object.entries(customerRevenue)
      .map(([customerId, data]) => {
        const customer = customers.find(c => c.id === customerId);
        return {
          id: customerId,
          name: customer?.name || 'Unknown Customer',
          revenue: Math.round(data.total * 100) / 100,
          invoiceCount: data.invoiceCount
        };
      })
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // Overdue invoices
    const overdueInvoices = invoices.filter(inv => {
      return inv.status === 'sent' && new Date(inv.dueDate) < new Date();
    });

    const stats = {
      overview: {
        totalInvoices,
        totalCustomers: customers.length,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        totalOutstanding: Math.round(totalOutstanding * 100) / 100,
        totalPaid: Math.round(totalPaid * 100) / 100
      },
      invoicesByStatus: {
        draft: invoicesByStatus.draft || 0,
        sent: invoicesByStatus.sent || 0,
        viewed: invoicesByStatus.viewed || 0,
        paid: invoicesByStatus.paid || 0,
        overdue: overdueInvoices.length,
        cancelled: invoicesByStatus.cancelled || 0
      },
      recentActivity: {
        invoicesThisMonth: recentInvoices.length,
        paymentsThisMonth: recentPayments.length,
        revenueThisMonth: Math.round(recentInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0) * 100) / 100
      },
      monthlyRevenue,
      topCustomers,
      overdueInvoices: overdueInvoices.map(inv => ({
        id: inv.id,
        invoiceNumber: inv.invoiceNumber,
        customerName: customers.find(c => c.id === inv.customerId)?.name || 'Unknown',
        total: inv.total,
        dueDate: inv.dueDate,
        daysPastDue: Math.floor((new Date() - new Date(inv.dueDate)) / (1000 * 60 * 60 * 24))
      })).slice(0, 10)
    };

    return NextResponse.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Get dashboard stats error:', error);
    
    return NextResponse.json(
      { error: error.message || 'Failed to fetch dashboard stats' },
      { status: error.message === 'Authorization token required' ? 401 : 500 }
    );
  }
}