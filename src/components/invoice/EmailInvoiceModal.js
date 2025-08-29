'use client';

import { useState } from 'react';
import emailService from '../../utils/emailService';

export default function EmailInvoiceModal({ invoice, isOpen, onClose }) {
  const [recipientEmail, setRecipientEmail] = useState(invoice?.customer?.email || '');
  const [customMessage, setCustomMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [emailStatus, setEmailStatus] = useState(null);

  const handleSendEmail = async (e) => {
    e.preventDefault();
    setIsSending(true);
    setEmailStatus(null);

    try {
      const result = await emailService.sendInvoiceEmail(invoice, recipientEmail, customMessage);
      setEmailStatus({ type: 'success', message: result.message });
      
      // Clear form after successful send
      setTimeout(() => {
        setCustomMessage('');
        setEmailStatus(null);
        onClose();
      }, 2000);

    } catch (error) {
      setEmailStatus({ type: 'error', message: error.message });
    } finally {
      setIsSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100">
              📧 Email Invoice
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 text-xl"
            >
              ×
            </button>
          </div>

          <form onSubmit={handleSendEmail} className="space-y-4">
            {/* Invoice Info */}
            <div className="bg-gray-50 dark:bg-slate-700 p-4 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-slate-400">Invoice:</p>
              <p className="font-semibold text-gray-900 dark:text-slate-100">
                #{invoice?.invoiceNumber}
              </p>
              <p className="text-sm text-gray-600 dark:text-slate-400">
                Amount: <span className="font-medium text-purple-600 dark:text-purple-400">
                  ${invoice?.total?.toFixed(2)}
                </span>
              </p>
            </div>

            {/* Recipient Email */}
            <div>
              <label className="form-label">
                Recipient Email *
              </label>
              <input
                type="email"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                className="form-input"
                placeholder="customer@email.com"
                required
              />
            </div>

            {/* Custom Message */}
            <div>
              <label className="form-label">
                Custom Message (Optional)
              </label>
              <textarea
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                className="form-input min-h-[100px]"
                placeholder="Add a personal message to your customer..."
                rows={4}
              />
              <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                This message will appear at the top of the email
              </p>
            </div>

            {/* Email Preview */}
            <div className="bg-gray-50 dark:bg-slate-700 p-4 rounded-lg">
              <p className="text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                Email Preview:
              </p>
              <div className="text-sm text-gray-600 dark:text-slate-400 space-y-1">
                <p><strong>Subject:</strong> Invoice {invoice?.invoiceNumber} - ${invoice?.total?.toFixed(2)}</p>
                <p><strong>To:</strong> {recipientEmail}</p>
                {customMessage && (
                  <p><strong>Custom Message:</strong> "{customMessage}"</p>
                )}
              </div>
            </div>

            {/* Status Messages */}
            {emailStatus && (
              <div className={`p-4 rounded-lg ${
                emailStatus.type === 'success' 
                  ? 'bg-green-50 text-green-800 border border-green-200' 
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}>
                <div className="flex items-center">
                  <span className="mr-2">
                    {emailStatus.type === 'success' ? '✅' : '❌'}
                  </span>
                  {emailStatus.message}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary flex-1"
                disabled={isSending}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary flex-1 flex items-center justify-center"
                disabled={isSending || !recipientEmail}
              >
                {isSending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Sending...
                  </>
                ) : (
                  <>
                    📧 Send Invoice
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Email History */}
          {invoice && (
            <EmailHistory invoiceId={invoice.id} />
          )}
        </div>
      </div>
    </div>
  );
}

function EmailHistory({ invoiceId }) {
  const [emailLogs, setEmailLogs] = useState([]);

  useState(() => {
    const logs = emailService.getEmailLogs(invoiceId);
    setEmailLogs(logs);
  }, [invoiceId]);

  if (emailLogs.length === 0) return null;

  return (
    <div className="mt-6 pt-4 border-t border-gray-200 dark:border-slate-600">
      <h3 className="text-sm font-medium text-gray-700 dark:text-slate-300 mb-3">
        📨 Email History
      </h3>
      <div className="space-y-2">
        {emailLogs.slice(-3).map((log) => (
          <div key={log.id} className="flex items-center justify-between text-xs text-gray-500 dark:text-slate-400">
            <span>Sent to {log.recipient}</span>
            <span>{new Date(log.sentAt).toLocaleDateString()}</span>
          </div>
        ))}
      </div>
    </div>
  );
}