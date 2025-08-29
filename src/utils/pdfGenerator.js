// PDF Generation using browser's native print functionality
// This approach works without additional dependencies

export const downloadInvoicePDF = (invoice) => {
  // Create a new window for printing
  const printWindow = window.open('', '_blank');
  
  if (!printWindow) {
    alert('Please allow popups to download PDF');
    return;
  }

  // Create the invoice HTML
  const invoiceHTML = generateInvoiceHTML(invoice);
  
  // Write the HTML to the new window
  printWindow.document.write(invoiceHTML);
  printWindow.document.close();
  
  // Wait for the content to load, then print
  printWindow.onload = () => {
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);
  };
};

export const printInvoice = (invoice) => {
  const printHTML = generateInvoiceHTML(invoice);
  
  // Create a hidden iframe for printing
  const iframe = document.createElement('iframe');
  iframe.style.display = 'none';
  document.body.appendChild(iframe);
  
  const doc = iframe.contentWindow.document;
  doc.write(printHTML);
  doc.close();
  
  setTimeout(() => {
    iframe.contentWindow.print();
    document.body.removeChild(iframe);
  }, 500);
};

const generateInvoiceHTML = (invoice) => {
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

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Invoice ${invoice.invoiceNumber}</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          font-size: 14px;
          line-height: 1.6;
          color: #1f2937;
          background: white;
          padding: 40px;
        }
        
        .invoice-container {
          max-width: 800px;
          margin: 0 auto;
          background: white;
        }
        
        .invoice-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 40px;
          padding-bottom: 20px;
          border-bottom: 3px solid #9333ea;
        }
        
        .company-info h1 {
          font-size: 32px;
          font-weight: bold;
          color: #9333ea;
          margin-bottom: 5px;
        }
        
        .company-info p {
          color: #6b7280;
          font-size: 16px;
        }
        
        .invoice-title {
          text-align: right;
        }
        
        .invoice-title h2 {
          font-size: 24px;
          font-weight: bold;
          color: #1f2937;
          margin-bottom: 5px;
        }
        
        .invoice-number {
          color: #6b7280;
          font-size: 16px;
        }
        
        .invoice-details {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 40px;
          margin-bottom: 40px;
        }
        
        .bill-to h3,
        .invoice-info h3 {
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 10px;
          font-size: 16px;
        }
        
        .bill-to p,
        .invoice-info p {
          margin-bottom: 5px;
          color: #4b5563;
        }
        
        .customer-name {
          font-weight: 600;
          color: #1f2937;
        }
        
        .invoice-info {
          text-align: right;
        }
        
        .invoice-info .total-amount {
          font-size: 20px;
          font-weight: bold;
          color: #1f2937;
          margin-top: 10px;
        }
        
        .amount-due {
          color: #dc2626;
          font-weight: bold;
        }
        
        .items-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 30px;
        }
        
        .items-table th {
          background-color: #f9fafb;
          padding: 15px;
          text-align: left;
          font-weight: 600;
          color: #1f2937;
          border-bottom: 2px solid #e5e7eb;
        }
        
        .items-table th:last-child,
        .items-table td:last-child {
          text-align: right;
        }
        
        .items-table td {
          padding: 15px;
          border-bottom: 1px solid #f3f4f6;
          color: #4b5563;
        }
        
        .item-description {
          font-weight: 500;
          color: #1f2937;
        }
        
        .totals-section {
          display: flex;
          justify-content: flex-end;
          margin-bottom: 40px;
        }
        
        .totals {
          min-width: 300px;
        }
        
        .totals-row {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
        }
        
        .totals-row.subtotal,
        .totals-row.tax {
          color: #6b7280;
          border-bottom: 1px solid #f3f4f6;
        }
        
        .totals-row.total {
          font-size: 18px;
          font-weight: bold;
          color: #1f2937;
          border-top: 2px solid #e5e7eb;
          padding-top: 15px;
          margin-top: 10px;
        }
        
        .totals-row.paid {
          color: #059669;
          font-weight: 600;
        }
        
        .totals-row.due {
          color: #dc2626;
          font-weight: bold;
          font-size: 16px;
          border-top: 1px solid #f3f4f6;
          margin-top: 10px;
          padding-top: 10px;
        }
        
        .notes-section {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 40px;
          margin-bottom: 40px;
          padding-top: 30px;
          border-top: 1px solid #e5e7eb;
        }
        
        .notes h4,
        .terms h4 {
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 10px;
        }
        
        .notes p,
        .terms p {
          color: #4b5563;
          white-space: pre-wrap;
        }
        
        .invoice-footer {
          text-align: center;
          color: #9ca3af;
          font-size: 12px;
          padding-top: 30px;
          border-top: 1px solid #e5e7eb;
        }
        
        .status-badge {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
          margin-left: 15px;
        }
        
        .status-paid {
          background-color: #d1fae5;
          color: #065f46;
        }
        
        .status-sent {
          background-color: #dbeafe;
          color: #1e40af;
        }
        
        .status-draft {
          background-color: #f3f4f6;
          color: #6b7280;
        }
        
        .status-overdue {
          background-color: #fee2e2;
          color: #991b1b;
        }
        
        @media print {
          body {
            padding: 20px;
          }
          
          .invoice-container {
            max-width: none;
          }
        }
      </style>
    </head>
    <body>
      <div class="invoice-container">
        <!-- Header -->
        <div class="invoice-header">
          <div class="company-info">
            <h1>InvoiceFlow</h1>
            <p>Professional Billing Solution</p>
          </div>
          <div class="invoice-title">
            <h2>INVOICE</h2>
            <p class="invoice-number">#${invoice.invoiceNumber}</p>
            <span class="status-badge status-${invoice.status}">${invoice.status}</span>
          </div>
        </div>
        
        <!-- Invoice Details -->
        <div class="invoice-details">
          <div class="bill-to">
            <h3>Bill To:</h3>
            <p class="customer-name">${invoice.customer?.name || 'Unknown Customer'}</p>
            ${invoice.customer?.company ? `<p>${invoice.customer.company}</p>` : ''}
            ${invoice.customer?.email ? `<p>${invoice.customer.email}</p>` : ''}
            ${invoice.customer?.billingAddress?.street ? `
              <p style="margin-top: 10px;">
                ${invoice.customer.billingAddress.street}<br>
                ${invoice.customer.billingAddress.city}${invoice.customer.billingAddress.city && invoice.customer.billingAddress.state ? ', ' : ''}${invoice.customer.billingAddress.state} ${invoice.customer.billingAddress.zipCode}<br>
                ${invoice.customer.billingAddress.country !== 'US' ? invoice.customer.billingAddress.country : ''}
              </p>
            ` : ''}
          </div>
          
          <div class="invoice-info">
            <h3>Invoice Details:</h3>
            <p><strong>Issue Date:</strong> ${formatDate(invoice.issueDate)}</p>
            <p><strong>Due Date:</strong> ${formatDate(invoice.dueDate)}</p>
            <p class="total-amount"><strong>Total Amount:</strong> ${formatCurrency(invoice.total)}</p>
            ${invoice.amountDue > 0 ? `<p class="amount-due"><strong>Amount Due:</strong> ${formatCurrency(invoice.amountDue)}</p>` : ''}
          </div>
        </div>
        
        <!-- Line Items -->
        <table class="items-table">
          <thead>
            <tr>
              <th>Description</th>
              <th>Qty</th>
              <th>Rate</th>
              <th>Tax</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            ${invoice.items?.map(item => `
              <tr>
                <td class="item-description">${item.description}</td>
                <td>${item.quantity}</td>
                <td>${formatCurrency(item.rate)}</td>
                <td>${item.taxRate > 0 ? `${item.taxRate}%` : '-'}</td>
                <td>${formatCurrency(item.amount + (item.taxAmount || 0))}</td>
              </tr>
            `).join('') || ''}
          </tbody>
        </table>
        
        <!-- Totals -->
        <div class="totals-section">
          <div class="totals">
            <div class="totals-row subtotal">
              <span>Subtotal:</span>
              <span>${formatCurrency(invoice.subtotal)}</span>
            </div>
            ${invoice.taxTotal > 0 ? `
              <div class="totals-row tax">
                <span>Tax:</span>
                <span>${formatCurrency(invoice.taxTotal)}</span>
              </div>
            ` : ''}
            <div class="totals-row total">
              <span>Total:</span>
              <span>${formatCurrency(invoice.total)}</span>
            </div>
            ${invoice.amountPaid > 0 ? `
              <div class="totals-row paid">
                <span>Paid:</span>
                <span>-${formatCurrency(invoice.amountPaid)}</span>
              </div>
              <div class="totals-row due">
                <span>Amount Due:</span>
                <span>${formatCurrency(invoice.amountDue)}</span>
              </div>
            ` : ''}
          </div>
        </div>
        
        <!-- Notes and Terms -->
        ${(invoice.notes || invoice.terms) ? `
          <div class="notes-section">
            ${invoice.notes ? `
              <div class="notes">
                <h4>Notes:</h4>
                <p>${invoice.notes}</p>
              </div>
            ` : ''}
            ${invoice.terms ? `
              <div class="terms">
                <h4>Terms & Conditions:</h4>
                <p>${invoice.terms}</p>
              </div>
            ` : ''}
          </div>
        ` : ''}
        
        <!-- Footer -->
        <div class="invoice-footer">
          <p>Thank you for your business!</p>
          <p>Generated by InvoiceFlow - Modern Billing Solution</p>
        </div>
      </div>
    </body>
    </html>
  `;
};