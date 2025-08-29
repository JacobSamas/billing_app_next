'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import Button from '../../components/ui/Button';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import ExportModal from '../../components/export/ExportModal';

export default function ReportsPage() {
  const [analytics, setAnalytics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState('30'); // days
  const [showExportModal, setShowExportModal] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange]);

  const fetchAnalytics = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        router.push('/login');
        return;
      }

      // Get all data from APIs
      const [invoicesRes, customersRes, paymentsRes, statsRes] = await Promise.all([
        fetch('/api/invoices?limit=1000', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/customers?limit=1000', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/payments?limit=1000', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/dashboard/stats', { headers: { 'Authorization': `Bearer ${token}` } })
      ]);

      const invoices = invoicesRes.ok ? (await invoicesRes.json()).data.invoices : [];
      const customers = customersRes.ok ? (await customersRes.json()).data.customers : [];
      const payments = paymentsRes.ok ? (await paymentsRes.json()).data.payments : [];
      const stats = statsRes.ok ? (await statsRes.json()).data : {};

      // Calculate advanced analytics
      const analyticsData = calculateAnalytics(invoices, customers, payments, stats, parseInt(dateRange));
      setAnalytics(analyticsData);
      setError(null);

    } catch (error) {
      console.error('Fetch analytics error:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateAnalytics = (invoices, customers, payments, stats, days) => {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    // Filter data by date range
    const recentInvoices = invoices.filter(inv => new Date(inv.createdAt) >= cutoffDate);
    const recentPayments = payments.filter(payment => new Date(payment.createdAt) >= cutoffDate);

    // Basic metrics
    const totalRevenue = recentInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
    const totalPaid = recentInvoices.reduce((sum, inv) => sum + (inv.amountPaid || 0), 0);
    const totalDue = totalRevenue - totalPaid;

    // Status breakdown
    const statusBreakdown = recentInvoices.reduce((acc, inv) => {
      acc[inv.status] = (acc[inv.status] || 0) + 1;
      return acc;
    }, {});

    // Monthly trends (last 12 months)
    const monthlyData = [];
    for (let i = 11; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthKey = date.toISOString().substr(0, 7);
      const monthName = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      
      const monthInvoices = invoices.filter(inv => 
        inv.createdAt.substr(0, 7) === monthKey
      );
      
      const monthPayments = payments.filter(payment => 
        (payment.paymentDate || payment.createdAt).substr(0, 7) === monthKey
      );

      monthlyData.push({
        month: monthName,
        invoices: monthInvoices.length,
        revenue: monthInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0),
        payments: monthPayments.reduce((sum, payment) => sum + (payment.amount || 0), 0),
        customers: new Set(monthInvoices.map(inv => inv.customer?.email)).size
      });
    }

    // Customer analytics
    const customerAnalytics = customers.map(customer => {
      const customerInvoices = invoices.filter(inv => inv.customer?.email === customer.email);
      const customerPayments = payments.filter(payment => payment.customerName === customer.name);
      
      return {
        ...customer,
        totalInvoices: customerInvoices.length,
        totalRevenue: customerInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0),
        totalPaid: customerPayments.reduce((sum, payment) => sum + (payment.amount || 0), 0),
        avgInvoiceValue: customerInvoices.length > 0 
          ? customerInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0) / customerInvoices.length 
          : 0,
        lastInvoiceDate: customerInvoices.length > 0 
          ? Math.max(...customerInvoices.map(inv => new Date(inv.createdAt)))
          : null
      };
    }).sort((a, b) => b.totalRevenue - a.totalRevenue);

    // Payment method analysis
    const paymentMethods = recentPayments.reduce((acc, payment) => {
      const method = payment.method || 'unknown';
      acc[method] = {
        count: (acc[method]?.count || 0) + 1,
        amount: (acc[method]?.amount || 0) + (payment.amount || 0)
      };
      return acc;
    }, {});

    // Overdue analysis
    const today = new Date();
    const overdueInvoices = invoices.filter(inv => 
      inv.status !== 'paid' && 
      inv.status !== 'cancelled' &&
      new Date(inv.dueDate) < today
    );

    const overdueAmount = overdueInvoices.reduce((sum, inv) => sum + (inv.amountDue || inv.total || 0), 0);

    // Growth metrics (compare with previous period)
    const prevCutoffDate = new Date();
    prevCutoffDate.setDate(prevCutoffDate.getDate() - (days * 2));
    const prevPeriodInvoices = invoices.filter(inv => 
      new Date(inv.createdAt) >= prevCutoffDate && 
      new Date(inv.createdAt) < cutoffDate
    );

    const prevRevenue = prevPeriodInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
    const revenueGrowth = prevRevenue > 0 ? ((totalRevenue - prevRevenue) / prevRevenue * 100) : 0;

    return {
      period: `Last ${days} days`,
      dateRange: { start: cutoffDate, end: new Date() },
      
      // Summary metrics
      summary: {
        totalInvoices: recentInvoices.length,
        totalRevenue,
        totalPaid,
        totalDue,
        totalCustomers: new Set(recentInvoices.map(inv => inv.customer?.email)).size,
        avgInvoiceValue: recentInvoices.length > 0 ? totalRevenue / recentInvoices.length : 0,
        revenueGrowth,
        overdueAmount,
        overdueCount: overdueInvoices.length
      },

      // Breakdowns
      statusBreakdown,
      paymentMethods,
      monthlyData,
      customerAnalytics: customerAnalytics.slice(0, 10), // Top 10 customers
      overdueInvoices: overdueInvoices.slice(0, 10), // Top 10 overdue

      // Additional metrics
      metrics: {
        averageDaysToPay: calculateAverageDaysToPay(payments, invoices),
        conversionRate: invoices.length > 0 ? (statusBreakdown.paid || 0) / invoices.length * 100 : 0,
        repeatCustomerRate: calculateRepeatCustomerRate(customers, invoices)
      }
    };
  };

  const calculateAverageDaysToPay = (payments, invoices) => {
    const paidInvoices = payments.map(payment => {
      const invoice = invoices.find(inv => inv.id === payment.invoiceId);
      if (invoice) {
        const daysToPay = Math.ceil(
          (new Date(payment.paymentDate || payment.createdAt) - new Date(invoice.createdAt)) 
          / (1000 * 60 * 60 * 24)
        );
        return daysToPay;
      }
      return null;
    }).filter(days => days !== null);

    return paidInvoices.length > 0 
      ? paidInvoices.reduce((sum, days) => sum + days, 0) / paidInvoices.length 
      : 0;
  };

  const calculateRepeatCustomerRate = (customers, invoices) => {
    const customersWithMultipleInvoices = customers.filter(customer => {
      const customerInvoices = invoices.filter(inv => inv.customer?.email === customer.email);
      return customerInvoices.length > 1;
    });
    
    return customers.length > 0 ? (customersWithMultipleInvoices.length / customers.length) * 100 : 0;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  const formatPercent = (value) => {
    return `${(value || 0).toFixed(1)}%`;
  };

  if (error) {
    return (
      <DashboardLayout>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <h3 className="text-lg font-medium text-red-800">Error</h3>
          <p className="text-red-600 mt-1">{error}</p>
          <Button onClick={fetchAnalytics} variant="secondary" className="mt-4">
            Try Again
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-slate-100">
              📊 Reports & Analytics
            </h1>
            <p className="text-gray-600 dark:text-slate-400 mt-1">
              Comprehensive business insights and performance metrics
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="form-input w-auto"
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
              <option value="365">Last year</option>
            </select>
            <Button
              variant="primary"
              onClick={() => setShowExportModal(true)}
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
              </svg>
              Export Report
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <LoadingSpinner size="lg" />
          </div>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-slate-400">Total Revenue</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-slate-100">
                      {formatCurrency(analytics?.summary?.totalRevenue)}
                    </p>
                    {analytics?.summary?.revenueGrowth !== undefined && (
                      <p className={`text-sm ${analytics.summary.revenueGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {analytics.summary.revenueGrowth >= 0 ? '↗' : '↘'} {formatPercent(Math.abs(analytics.summary.revenueGrowth))}
                      </p>
                    )}
                  </div>
                  <div className="text-3xl">💰</div>
                </div>
              </div>

              <div className="card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-slate-400">Total Invoices</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-slate-100">
                      {analytics?.summary?.totalInvoices || 0}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-slate-400">
                      Avg: {formatCurrency(analytics?.summary?.avgInvoiceValue)}
                    </p>
                  </div>
                  <div className="text-3xl">📄</div>
                </div>
              </div>

              <div className="card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-slate-400">Amount Paid</p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {formatCurrency(analytics?.summary?.totalPaid)}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-slate-400">
                      {analytics?.summary?.totalRevenue > 0 ? 
                        formatPercent((analytics.summary.totalPaid / analytics.summary.totalRevenue) * 100) 
                        : '0%'} collected
                    </p>
                  </div>
                  <div className="text-3xl">✅</div>
                </div>
              </div>

              <div className="card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-slate-400">Outstanding</p>
                    <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                      {formatCurrency(analytics?.summary?.totalDue)}
                    </p>
                    <p className="text-sm text-red-500 dark:text-red-400">
                      {analytics?.summary?.overdueCount || 0} overdue
                    </p>
                  </div>
                  <div className="text-3xl">⏰</div>
                </div>
              </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Monthly Trends */}
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-4">
                  📈 Monthly Revenue Trend
                </h3>
                <div className="space-y-3">
                  {analytics?.monthlyData?.slice(-6).map((month, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm font-medium text-gray-700 dark:text-slate-300">
                            {month.month}
                          </span>
                          <span className="text-sm text-gray-600 dark:text-slate-400">
                            {formatCurrency(month.revenue)}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-slate-600 rounded-full h-2">
                          <div 
                            className="bg-purple-600 h-2 rounded-full"
                            style={{ 
                              width: `${Math.min(100, (month.revenue / Math.max(...(analytics?.monthlyData || []).map(m => m.revenue))) * 100)}%` 
                            }}
                          ></div>
                        </div>
                        <div className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                          {month.invoices} invoices • {month.customers} customers
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Invoice Status Breakdown */}
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-4">
                  📊 Invoice Status Distribution
                </h3>
                <div className="space-y-3">
                  {Object.entries(analytics?.statusBreakdown || {}).map(([status, count]) => {
                    const total = Object.values(analytics?.statusBreakdown || {}).reduce((sum, c) => sum + c, 0);
                    const percentage = total > 0 ? (count / total) * 100 : 0;
                    
                    const statusColors = {
                      draft: 'bg-gray-400',
                      sent: 'bg-blue-500',
                      viewed: 'bg-yellow-500',
                      paid: 'bg-green-500',
                      overdue: 'bg-red-500',
                      cancelled: 'bg-gray-500'
                    };

                    return (
                      <div key={status} className="flex items-center justify-between">
                        <div className="flex items-center flex-1">
                          <div className={`w-3 h-3 rounded-full ${statusColors[status]} mr-3`}></div>
                          <span className="text-sm font-medium text-gray-700 dark:text-slate-300 capitalize">
                            {status}
                          </span>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium text-gray-900 dark:text-slate-100">
                            {count}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-slate-400">
                            {percentage.toFixed(1)}%
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Top Customers */}
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-4">
                👥 Top Customers by Revenue
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-slate-700">
                      <th className="text-left py-3 font-medium text-gray-700 dark:text-slate-300">Customer</th>
                      <th className="text-left py-3 font-medium text-gray-700 dark:text-slate-300">Invoices</th>
                      <th className="text-left py-3 font-medium text-gray-700 dark:text-slate-300">Total Revenue</th>
                      <th className="text-left py-3 font-medium text-gray-700 dark:text-slate-300">Avg Invoice</th>
                      <th className="text-left py-3 font-medium text-gray-700 dark:text-slate-300">Paid</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics?.customerAnalytics?.slice(0, 5).map((customer, index) => (
                      <tr key={index} className="border-b border-gray-100 dark:border-slate-700">
                        <td className="py-3">
                          <div>
                            <div className="font-medium text-gray-900 dark:text-slate-100">
                              {customer.name}
                            </div>
                            {customer.company && (
                              <div className="text-sm text-gray-500 dark:text-slate-400">
                                {customer.company}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="py-3 text-gray-700 dark:text-slate-300">
                          {customer.totalInvoices}
                        </td>
                        <td className="py-3 font-semibold text-gray-900 dark:text-slate-100">
                          {formatCurrency(customer.totalRevenue)}
                        </td>
                        <td className="py-3 text-gray-700 dark:text-slate-300">
                          {formatCurrency(customer.avgInvoiceValue)}
                        </td>
                        <td className="py-3">
                          <span className="text-green-600 dark:text-green-400">
                            {formatCurrency(customer.totalPaid)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="card text-center">
                <div className="text-3xl mb-2">⚡</div>
                <p className="text-2xl font-bold text-gray-900 dark:text-slate-100">
                  {analytics?.metrics?.averageDaysToPay?.toFixed(1) || 0} days
                </p>
                <p className="text-sm text-gray-600 dark:text-slate-400">Average Days to Pay</p>
              </div>
              
              <div className="card text-center">
                <div className="text-3xl mb-2">🎯</div>
                <p className="text-2xl font-bold text-gray-900 dark:text-slate-100">
                  {formatPercent(analytics?.metrics?.conversionRate)}
                </p>
                <p className="text-sm text-gray-600 dark:text-slate-400">Invoice Conversion Rate</p>
              </div>
              
              <div className="card text-center">
                <div className="text-3xl mb-2">🔄</div>
                <p className="text-2xl font-bold text-gray-900 dark:text-slate-100">
                  {formatPercent(analytics?.metrics?.repeatCustomerRate)}
                </p>
                <p className="text-sm text-gray-600 dark:text-slate-400">Repeat Customer Rate</p>
              </div>
            </div>
          </>
        )}

        {/* Export Modal */}
        <ExportModal
          isOpen={showExportModal}
          onClose={() => setShowExportModal(false)}
          data={analytics ? [analytics] : []}
          dataType="analytics"
          title="Export Analytics Report"
        />
      </div>
    </DashboardLayout>
  );
}