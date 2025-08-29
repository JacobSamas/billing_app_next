'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import DashboardLayout from '../../../components/dashboard/DashboardLayout';
import Button from '../../../components/ui/Button';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';
import EmailInvoiceModal from '../../../components/invoice/EmailInvoiceModal';
import RecordPaymentModal from '../../../components/payment/RecordPaymentModal';
import { downloadInvoicePDF, printInvoice } from '../../../utils/pdfGenerator';
import emailService from '../../../utils/emailService';

export default function InvoiceDetailPage() {
  const [invoice, setInvoice] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const router = useRouter();
  const params = useParams();
  const invoiceId = params.id;

  useEffect(() => {
    if (invoiceId) {
      fetchInvoice();
    }
  }, [invoiceId]);

  const fetchInvoice = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await fetch(`/api/invoices/${invoiceId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setInvoice(data.data.invoice);
      } else if (response.status === 404) {
        setError('Invoice not found');
      } else {
        throw new Error('Failed to fetch invoice');
      }
    } catch (error) {
      console.error('Fetch invoice error:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateStatus = async (newStatus) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`/api/invoices/${invoiceId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        const data = await response.json();
        setInvoice(data.data.invoice);
      } else {
        throw new Error('Failed to update invoice status');
      }
    } catch (error) {
      console.error('Update status error:', error);
      alert('Failed to update status: ' + error.message);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this invoice?')) {
      return;
    }

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`/api/invoices/${invoiceId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        router.push('/invoices');
      } else {
        const data = await response.json();
        alert('Failed to delete invoice: ' + data.error);
      }
    } catch (error) {
      console.error('Delete invoice error:', error);
      alert('Failed to delete invoice: ' + error.message);
    }
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
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status) => {
    const statusStyles = {
      draft: 'bg-gray-100 text-gray-800',
      sent: 'bg-blue-100 text-blue-800',
      viewed: 'bg-yellow-100 text-yellow-800',
      paid: 'bg-green-100 text-green-800',
      overdue: 'bg-red-100 text-red-800',
      cancelled: 'bg-gray-100 text-gray-800'
    };

    return (
      <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${statusStyles[status] || statusStyles.draft}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getStatusActions = (currentStatus) => {
    const actions = [];
    
    if (currentStatus === 'draft') {
      actions.push({ label: 'Mark as Sent', status: 'sent', variant: 'primary' });
      actions.push({ label: 'Cancel', status: 'cancelled', variant: 'secondary' });
    } else if (currentStatus === 'sent') {
      actions.push({ label: 'Mark as Viewed', status: 'viewed', variant: 'secondary' });
      actions.push({ label: 'Mark as Paid', status: 'paid', variant: 'success' });
      actions.push({ label: 'Cancel', status: 'cancelled', variant: 'secondary' });
    } else if (currentStatus === 'viewed') {
      actions.push({ label: 'Mark as Paid', status: 'paid', variant: 'success' });
      actions.push({ label: 'Cancel', status: 'cancelled', variant: 'secondary' });
    } else if (currentStatus === 'overdue') {
      actions.push({ label: 'Mark as Paid', status: 'paid', variant: 'success' });
    }

    return actions;
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <h3 className="text-lg font-medium text-red-800">Error</h3>
          <p className="text-red-600 mt-1">{error}</p>
          <Button 
            onClick={() => router.push('/invoices')} 
            variant="secondary" 
            className="mt-4"
          >
            Back to Invoices
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const statusActions = getStatusActions(invoice.status);

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              onClick={() => router.push('/invoices')}
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Invoices
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Invoice {invoice.invoiceNumber}</h1>
              <div className="flex items-center space-x-3 mt-2">
                {getStatusBadge(invoice.status)}
                <span className="text-sm text-gray-500">
                  Created {formatDate(invoice.createdAt)}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            {/* PDF Actions */}
            <Button
              variant="secondary"
              size="sm"
              onClick={() => downloadInvoicePDF(invoice)}
              title="Download PDF"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              PDF
            </Button>
            
            <Button
              variant="secondary"
              size="sm"
              onClick={() => printInvoice(invoice)}
              title="Print Invoice"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Print
            </Button>
            
            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowEmailModal(true)}
              title="Email Invoice"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Email
            </Button>
            
            {invoice.status !== 'paid' && invoice.amountDue > 0 && (
              <Button
                variant="success"
                size="sm"
                onClick={() => setShowPaymentModal(true)}
                title="Record Payment"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
                Record Payment
              </Button>
            )}

            {/* Status Actions */}
            {statusActions.map((action) => (
              <Button
                key={action.status}
                variant={action.variant}
                size="sm"
                onClick={() => handleUpdateStatus(action.status)}
              >
                {action.label}
              </Button>
            ))}
            
            {invoice.status === 'draft' && (
              <Button
                variant="danger"
                size="sm"
                onClick={handleDelete}
              >
                Delete
              </Button>
            )}
          </div>
        </div>

        {/* Invoice Content */}
        <div className="bg-white shadow-lg rounded-lg border border-gray-200">
          {/* Invoice Header */}
          <div className="p-8 border-b border-gray-200">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-bold text-purple-600">InvoiceFlow</h2>
                <p className="text-gray-600 mt-1">Professional Billing Solution</p>
              </div>
              <div className="text-right">
                <h3 className="text-xl font-bold text-gray-900">INVOICE</h3>
                <p className="text-gray-600">#{invoice.invoiceNumber}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
              {/* Bill To */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Bill To:</h4>
                <div className="text-gray-700">
                  <p className="font-medium">{invoice.customer?.name}</p>
                  {invoice.customer?.company && <p>{invoice.customer.company}</p>}
                  {invoice.customer?.email && <p>{invoice.customer.email}</p>}
                  {invoice.customer?.billingAddress && (
                    <div className="mt-2">
                      {invoice.customer.billingAddress.street && <p>{invoice.customer.billingAddress.street}</p>}
                      {(invoice.customer.billingAddress.city || invoice.customer.billingAddress.state || invoice.customer.billingAddress.zipCode) && (
                        <p>
                          {invoice.customer.billingAddress.city}{invoice.customer.billingAddress.city && invoice.customer.billingAddress.state && ', '}{invoice.customer.billingAddress.state} {invoice.customer.billingAddress.zipCode}
                        </p>
                      )}
                      {invoice.customer.billingAddress.country && invoice.customer.billingAddress.country !== 'US' && <p>{invoice.customer.billingAddress.country}</p>}
                    </div>
                  )}
                </div>
              </div>

              {/* Invoice Details */}
              <div className="text-right">
                <div className="space-y-2">
                  <div>
                    <span className="text-gray-600">Issue Date: </span>
                    <span className="font-medium">{formatDate(invoice.issueDate)}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Due Date: </span>
                    <span className="font-medium">{formatDate(invoice.dueDate)}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Total Amount: </span>
                    <span className="font-bold text-lg">{formatCurrency(invoice.total)}</span>
                  </div>
                  {invoice.amountDue > 0 && (
                    <div>
                      <span className="text-gray-600">Amount Due: </span>
                      <span className="font-bold text-red-600">{formatCurrency(invoice.amountDue)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Line Items */}
          <div className="p-8">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 font-semibold text-gray-900">Description</th>
                    <th className="text-right py-3 font-semibold text-gray-900">Qty</th>
                    <th className="text-right py-3 font-semibold text-gray-900">Rate</th>
                    <th className="text-right py-3 font-semibold text-gray-900">Tax</th>
                    <th className="text-right py-3 font-semibold text-gray-900">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.items?.map((item, index) => (
                    <tr key={index} className="border-b border-gray-100">
                      <td className="py-4 text-gray-900">{item.description}</td>
                      <td className="py-4 text-right text-gray-700">{item.quantity}</td>
                      <td className="py-4 text-right text-gray-700">{formatCurrency(item.rate)}</td>
                      <td className="py-4 text-right text-gray-700">
                        {item.taxRate > 0 ? `${item.taxRate}%` : '-'}
                      </td>
                      <td className="py-4 text-right font-medium text-gray-900">
                        {formatCurrency(item.amount + (item.taxAmount || 0))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="flex justify-end mt-6">
              <div className="w-64 space-y-2">
                <div className="flex justify-between text-gray-700">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(invoice.subtotal)}</span>
                </div>
                {invoice.taxTotal > 0 && (
                  <div className="flex justify-between text-gray-700">
                    <span>Tax:</span>
                    <span>{formatCurrency(invoice.taxTotal)}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold text-gray-900 border-t pt-2">
                  <span>Total:</span>
                  <span>{formatCurrency(invoice.total)}</span>
                </div>
                {invoice.amountPaid > 0 && (
                  <>
                    <div className="flex justify-between text-green-600">
                      <span>Paid:</span>
                      <span>-{formatCurrency(invoice.amountPaid)}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold text-red-600 border-t pt-2">
                      <span>Amount Due:</span>
                      <span>{formatCurrency(invoice.amountDue)}</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Notes and Terms */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8 pt-8 border-t border-gray-200">
              {invoice.notes && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Notes:</h4>
                  <p className="text-gray-700 whitespace-pre-wrap">{invoice.notes}</p>
                </div>
              )}
              {invoice.terms && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Terms & Conditions:</h4>
                  <p className="text-gray-700 whitespace-pre-wrap">{invoice.terms}</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="text-center text-gray-500 text-sm mt-8 pt-8 border-t border-gray-200">
              <p>Thank you for your business!</p>
              <p className="mt-1">Generated by InvoiceFlow - Modern Billing Solution</p>
            </div>
          </div>
        </div>
        
        {/* Email Modal */}
        <EmailInvoiceModal 
          invoice={invoice}
          isOpen={showEmailModal}
          onClose={() => setShowEmailModal(false)}
        />
        
        {/* Payment Modal */}
        <RecordPaymentModal 
          invoice={invoice}
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          onPaymentRecorded={() => {
            setShowPaymentModal(false);
            fetchInvoice();
          }}
        />
      </div>
    </DashboardLayout>
  );
}