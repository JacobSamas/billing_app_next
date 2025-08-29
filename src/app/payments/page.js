'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import Button from '../../components/ui/Button';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

export default function PaymentsPage() {
  const [payments, setPayments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    status: '',
    method: '',
    search: ''
  });
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const router = useRouter();

  useEffect(() => {
    fetchPayments();
  }, [filters, pagination.page]);

  const fetchPayments = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        router.push('/login');
        return;
      }

      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(filters.status && { status: filters.status }),
        ...(filters.method && { method: filters.method }),
        ...(filters.search && { search: filters.search })
      });

      const response = await fetch(`/api/payments?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setPayments(data.data.payments);
        setPagination(data.data.pagination);
        setError(null);
      } else {
        throw new Error('Failed to fetch payments');
      }
    } catch (error) {
      console.error('Fetch payments error:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status) => {
    const statusStyles = {
      completed: 'badge-success',
      pending: 'badge-warning',
      failed: 'badge-error',
      refunded: 'badge-info'
    };

    return (
      <span className={statusStyles[status] || statusStyles.pending}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getMethodBadge = (method) => {
    const methodLabels = {
      bank_transfer: 'Bank Transfer',
      credit_card: 'Credit Card',
      check: 'Check',
      cash: 'Cash',
      paypal: 'PayPal',
      stripe: 'Stripe',
      other: 'Other'
    };

    return methodLabels[method] || method;
  };

  if (error) {
    return (
      <DashboardLayout>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <h3 className="text-lg font-medium text-red-800">Error</h3>
          <p className="text-red-600 mt-1">{error}</p>
          <Button onClick={fetchPayments} variant="secondary" className="mt-4">
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
            <h1 className="text-3xl font-bold text-gray-900 dark:text-slate-100">Payments</h1>
            <p className="text-gray-600 dark:text-slate-400 mt-1">
              Track and manage all payment records
            </p>
          </div>
          <Button
            variant="primary"
            onClick={() => router.push('/invoices')}
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Record Payment
          </Button>
        </div>

        {/* Filters */}
        <div className="card">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <input
                type="text"
                placeholder="Search payments..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="form-input"
              />
            </div>
            <div>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="form-input"
              >
                <option value="">All Statuses</option>
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
                <option value="refunded">Refunded</option>
              </select>
            </div>
            <div>
              <select
                value={filters.method}
                onChange={(e) => handleFilterChange('method', e.target.value)}
                className="form-input"
              >
                <option value="">All Methods</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="credit_card">Credit Card</option>
                <option value="check">Check</option>
                <option value="cash">Cash</option>
                <option value="paypal">PayPal</option>
                <option value="stripe">Stripe</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <Button
                variant="secondary"
                onClick={() => {
                  setFilters({ status: '', method: '', search: '' });
                  setPagination(prev => ({ ...prev, page: 1 }));
                }}
                className="w-full"
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </div>

        {/* Payments Table */}
        <div className="card">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <LoadingSpinner size="lg" />
            </div>
          ) : payments.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">💰</div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-slate-100 mb-2">
                No payments found
              </h3>
              <p className="text-gray-600 dark:text-slate-400 mb-6">
                {filters.search || filters.status || filters.method
                  ? 'No payments match your current filters.'
                  : 'Record your first payment from an invoice.'}
              </p>
              <Button
                variant="primary"
                onClick={() => router.push('/invoices')}
              >
                View Invoices
              </Button>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-slate-700">
                      <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-slate-100">
                        Date
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-slate-100">
                        Invoice
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-slate-100">
                        Customer
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-slate-100">
                        Amount
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-slate-100">
                        Method
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-slate-100">
                        Status
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-slate-100">
                        Reference
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((payment) => (
                      <tr
                        key={payment.id}
                        className="border-b border-gray-100 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                      >
                        <td className="py-4 px-4 text-gray-900 dark:text-slate-100">
                          {formatDate(payment.paymentDate || payment.createdAt)}
                        </td>
                        <td className="py-4 px-4">
                          <button
                            onClick={() => router.push(`/invoices/${payment.invoiceId}`)}
                            className="text-purple-600 dark:text-purple-400 hover:underline font-medium"
                          >
                            #{payment.invoiceNumber}
                          </button>
                        </td>
                        <td className="py-4 px-4 text-gray-900 dark:text-slate-100">
                          {payment.customerName}
                        </td>
                        <td className="py-4 px-4 font-semibold text-green-600 dark:text-green-400">
                          {formatCurrency(payment.amount)}
                        </td>
                        <td className="py-4 px-4 text-gray-700 dark:text-slate-300">
                          {getMethodBadge(payment.method)}
                        </td>
                        <td className="py-4 px-4">
                          {getStatusBadge(payment.status)}
                        </td>
                        <td className="py-4 px-4 text-gray-600 dark:text-slate-400 text-sm">
                          {payment.reference || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between pt-6 border-t border-gray-200 dark:border-slate-700">
                  <div className="text-sm text-gray-600 dark:text-slate-400">
                    Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} payments
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={pagination.page === 1}
                    >
                      Previous
                    </Button>
                    <span className="px-3 py-2 text-sm text-gray-600 dark:text-slate-400">
                      Page {pagination.page} of {pagination.totalPages}
                    </span>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={pagination.page === pagination.totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}