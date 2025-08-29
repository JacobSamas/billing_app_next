'use client';

import { useState } from 'react';

export default function RecordPaymentModal({ invoice, isOpen, onClose, onPaymentRecorded }) {
  const [formData, setFormData] = useState({
    amount: invoice?.amountDue?.toString() || '',
    method: 'bank_transfer',
    reference: '',
    notes: '',
    paymentDate: new Date().toISOString().split('T')[0]
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const paymentMethods = [
    { value: 'bank_transfer', label: 'Bank Transfer' },
    { value: 'credit_card', label: 'Credit Card' },
    { value: 'check', label: 'Check' },
    { value: 'cash', label: 'Cash' },
    { value: 'paypal', label: 'PayPal' },
    { value: 'stripe', label: 'Stripe' },
    { value: 'other', label: 'Other' }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          invoiceId: invoice.id,
          amount: parseFloat(formData.amount),
          method: formData.method,
          reference: formData.reference,
          notes: formData.notes,
          paymentDate: formData.paymentDate + 'T00:00:00.000Z',
          status: 'completed'
        })
      });

      const data = await response.json();

      if (response.ok) {
        onPaymentRecorded?.(data.data.payment);
        onClose();
        // Reset form
        setFormData({
          amount: '',
          method: 'bank_transfer',
          reference: '',
          notes: '',
          paymentDate: new Date().toISOString().split('T')[0]
        });
      } else {
        setError(data.error || 'Failed to record payment');
      }
    } catch (error) {
      console.error('Record payment error:', error);
      setError('Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (error) setError('');
  };

  if (!isOpen) return null;

  const remainingAmount = invoice?.amountDue || 0;
  const enteredAmount = parseFloat(formData.amount) || 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100">
              💰 Record Payment
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 text-xl"
              disabled={isSubmitting}
            >
              ×
            </button>
          </div>

          {/* Invoice Info */}
          <div className="bg-gray-50 dark:bg-slate-700 p-4 rounded-lg mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600 dark:text-slate-400">Invoice:</span>
              <span className="font-semibold text-gray-900 dark:text-slate-100">
                #{invoice?.invoiceNumber}
              </span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600 dark:text-slate-400">Customer:</span>
              <span className="font-medium text-gray-900 dark:text-slate-100">
                {invoice?.customer?.name}
              </span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600 dark:text-slate-400">Total Amount:</span>
              <span className="font-medium text-gray-900 dark:text-slate-100">
                ${invoice?.total?.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-slate-400">Amount Due:</span>
              <span className="font-bold text-red-600 dark:text-red-400">
                ${remainingAmount.toFixed(2)}
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Payment Amount */}
            <div>
              <label className="form-label">
                Payment Amount *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={remainingAmount}
                  value={formData.amount}
                  onChange={(e) => handleInputChange('amount', e.target.value)}
                  className="form-input pl-8"
                  placeholder="0.00"
                  required
                  disabled={isSubmitting}
                />
              </div>
              {enteredAmount > remainingAmount && (
                <p className="text-red-500 text-sm mt-1">
                  Amount cannot exceed ${remainingAmount.toFixed(2)}
                </p>
              )}
            </div>

            {/* Payment Method */}
            <div>
              <label className="form-label">
                Payment Method *
              </label>
              <select
                value={formData.method}
                onChange={(e) => handleInputChange('method', e.target.value)}
                className="form-input"
                required
                disabled={isSubmitting}
              >
                {paymentMethods.map(method => (
                  <option key={method.value} value={method.value}>
                    {method.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Payment Date */}
            <div>
              <label className="form-label">
                Payment Date *
              </label>
              <input
                type="date"
                value={formData.paymentDate}
                onChange={(e) => handleInputChange('paymentDate', e.target.value)}
                className="form-input"
                required
                disabled={isSubmitting}
              />
            </div>

            {/* Reference Number */}
            <div>
              <label className="form-label">
                Reference Number (Optional)
              </label>
              <input
                type="text"
                value={formData.reference}
                onChange={(e) => handleInputChange('reference', e.target.value)}
                className="form-input"
                placeholder="Transaction ID, Check #, etc."
                disabled={isSubmitting}
              />
            </div>

            {/* Notes */}
            <div>
              <label className="form-label">
                Notes (Optional)
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                className="form-input min-h-[80px]"
                placeholder="Additional payment details..."
                rows={3}
                disabled={isSubmitting}
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center text-red-800">
                  <span className="mr-2">❌</span>
                  {error}
                </div>
              </div>
            )}

            {/* Payment Summary */}
            {enteredAmount > 0 && enteredAmount <= remainingAmount && (
              <div className="bg-green-50 dark:bg-green-900 p-4 rounded-lg">
                <div className="text-green-800 dark:text-green-200">
                  <p className="font-medium">Payment Summary:</p>
                  <div className="text-sm mt-2 space-y-1">
                    <div className="flex justify-between">
                      <span>Payment Amount:</span>
                      <span>${enteredAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Remaining Balance:</span>
                      <span>${(remainingAmount - enteredAmount).toFixed(2)}</span>
                    </div>
                    {remainingAmount - enteredAmount <= 0 && (
                      <div className="text-green-700 dark:text-green-300 font-medium">
                        ✅ Invoice will be marked as paid
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary flex-1"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-success flex-1 flex items-center justify-center"
                disabled={isSubmitting || enteredAmount <= 0 || enteredAmount > remainingAmount}
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Recording...
                  </>
                ) : (
                  <>
                    💰 Record Payment
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}