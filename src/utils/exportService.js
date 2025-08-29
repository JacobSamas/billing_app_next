'use client';

// Professional data export service for CSV, JSON, and PDF formats
class ExportService {
  
  // Export invoices to CSV
  exportInvoicesCSV(invoices, filename = 'invoices') {
    const headers = [
      'Invoice Number',
      'Customer Name',
      'Customer Email',
      'Issue Date',
      'Due Date',
      'Status',
      'Subtotal',
      'Tax',
      'Total',
      'Amount Paid',
      'Amount Due',
      'Notes',
      'Created At'
    ];

    const csvData = invoices.map(invoice => [
      invoice.invoiceNumber,
      invoice.customer?.name || '',
      invoice.customer?.email || '',
      this.formatDate(invoice.issueDate),
      this.formatDate(invoice.dueDate),
      invoice.status,
      invoice.subtotal || 0,
      invoice.taxTotal || invoice.tax || 0,
      invoice.total || 0,
      invoice.amountPaid || 0,
      invoice.amountDue || (invoice.total - (invoice.amountPaid || 0)),
      invoice.notes || '',
      this.formatDate(invoice.createdAt)
    ]);

    this.downloadCSV([headers, ...csvData], `${filename}_${this.getDateString()}.csv`);
  }

  // Export customers to CSV
  exportCustomersCSV(customers, filename = 'customers') {
    const headers = [
      'Name',
      'Email',
      'Phone',
      'Company',
      'Status',
      'Street Address',
      'City',
      'State',
      'ZIP Code',
      'Country',
      'Total Invoices',
      'Total Amount',
      'Created At'
    ];

    const csvData = customers.map(customer => [
      customer.name || '',
      customer.email || '',
      customer.phone || '',
      customer.company || '',
      customer.status || 'active',
      customer.billingAddress?.street || '',
      customer.billingAddress?.city || '',
      customer.billingAddress?.state || '',
      customer.billingAddress?.zipCode || '',
      customer.billingAddress?.country || '',
      customer.totalInvoices || 0,
      customer.totalAmount || 0,
      this.formatDate(customer.createdAt)
    ]);

    this.downloadCSV([headers, ...csvData], `${filename}_${this.getDateString()}.csv`);
  }

  // Export payments to CSV
  exportPaymentsCSV(payments, filename = 'payments') {
    const headers = [
      'Invoice Number',
      'Customer Name',
      'Amount',
      'Payment Method',
      'Payment Date',
      'Status',
      'Reference',
      'Notes',
      'Created At'
    ];

    const csvData = payments.map(payment => [
      payment.invoiceNumber || '',
      payment.customerName || '',
      payment.amount || 0,
      payment.method || '',
      this.formatDate(payment.paymentDate),
      payment.status || '',
      payment.reference || '',
      payment.notes || '',
      this.formatDate(payment.createdAt)
    ]);

    this.downloadCSV([headers, ...csvData], `${filename}_${this.getDateString()}.csv`);
  }

  // Generic CSV download function
  downloadCSV(data, filename) {
    const csvContent = data.map(row => 
      row.map(field => {
        // Escape quotes and wrap in quotes if contains comma, quote, or newline
        const escapedField = String(field).replace(/"/g, '""');
        return /[",\n\r]/.test(escapedField) ? `"${escapedField}"` : escapedField;
      }).join(',')
    ).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    this.downloadBlob(blob, filename);
  }

  // Export data as JSON
  exportJSON(data, filename, formatted = true) {
    const jsonContent = formatted 
      ? JSON.stringify(data, null, 2)
      : JSON.stringify(data);
    
    const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
    this.downloadBlob(blob, `${filename}_${this.getDateString()}.json`);
  }

  // Export detailed invoice data with line items
  exportDetailedInvoicesJSON(invoices, filename = 'invoices_detailed') {
    const detailedData = {
      exportDate: new Date().toISOString(),
      totalCount: invoices.length,
      summary: this.generateInvoicesSummary(invoices),
      invoices: invoices.map(invoice => ({
        ...invoice,
        formattedTotal: this.formatCurrency(invoice.total),
        formattedDueDate: this.formatDate(invoice.dueDate),
        formattedIssueDate: this.formatDate(invoice.issueDate),
        isOverdue: new Date(invoice.dueDate) < new Date() && invoice.status !== 'paid'
      }))
    };

    this.exportJSON(detailedData, filename);
  }

  // Export business report with analytics
  exportBusinessReport(data, filename = 'business_report') {
    const report = {
      generatedAt: new Date().toISOString(),
      reportPeriod: data.period || 'All Time',
      summary: {
        totalInvoices: data.invoices?.length || 0,
        totalRevenue: data.totalRevenue || 0,
        paidInvoices: data.paidInvoices || 0,
        pendingInvoices: data.pendingInvoices || 0,
        overdueInvoices: data.overdueInvoices || 0,
        totalCustomers: data.customers?.length || 0,
        totalPayments: data.payments?.length || 0
      },
      invoices: data.invoices || [],
      customers: data.customers || [],
      payments: data.payments || [],
      analytics: data.analytics || {}
    };

    this.exportJSON(report, filename);
  }

  // Generate invoice summary statistics
  generateInvoicesSummary(invoices) {
    const summary = {
      totalInvoices: invoices.length,
      totalAmount: invoices.reduce((sum, inv) => sum + (inv.total || 0), 0),
      paidAmount: invoices.reduce((sum, inv) => sum + (inv.amountPaid || 0), 0),
      pendingAmount: invoices.reduce((sum, inv) => sum + (inv.amountDue || 0), 0),
      statusBreakdown: {},
      monthlyBreakdown: {}
    };

    // Status breakdown
    invoices.forEach(invoice => {
      summary.statusBreakdown[invoice.status] = 
        (summary.statusBreakdown[invoice.status] || 0) + 1;
    });

    // Monthly breakdown
    invoices.forEach(invoice => {
      const month = new Date(invoice.createdAt).toISOString().substr(0, 7);
      if (!summary.monthlyBreakdown[month]) {
        summary.monthlyBreakdown[month] = { count: 0, amount: 0 };
      }
      summary.monthlyBreakdown[month].count++;
      summary.monthlyBreakdown[month].amount += invoice.total || 0;
    });

    return summary;
  }

  // Export invoice with line items as detailed CSV
  exportInvoiceDetailsCSV(invoice, filename = null) {
    const invoiceFileName = filename || `invoice_${invoice.invoiceNumber}_details`;
    
    // Invoice header info
    const headerData = [
      ['Invoice Details'],
      [''],
      ['Invoice Number', invoice.invoiceNumber],
      ['Customer Name', invoice.customer?.name || ''],
      ['Issue Date', this.formatDate(invoice.issueDate)],
      ['Due Date', this.formatDate(invoice.dueDate)],
      ['Status', invoice.status],
      [''],
      ['Line Items'],
      ['Description', 'Quantity', 'Rate', 'Tax Rate', 'Amount']
    ];

    // Line items
    const itemsData = invoice.items?.map(item => [
      item.description,
      item.quantity,
      item.rate,
      item.taxRate + '%',
      item.amount
    ]) || [];

    // Totals
    const totalsData = [
      [''],
      ['Subtotal', '', '', '', invoice.subtotal || 0],
      ['Tax', '', '', '', invoice.taxTotal || invoice.tax || 0],
      ['Total', '', '', '', invoice.total || 0],
      ['Amount Paid', '', '', '', invoice.amountPaid || 0],
      ['Amount Due', '', '', '', invoice.amountDue || 0]
    ];

    const allData = [...headerData, ...itemsData, ...totalsData];
    this.downloadCSV(allData, `${invoiceFileName}_${this.getDateString()}.csv`);
  }

  // Utility function to download blob
  downloadBlob(blob, filename) {
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up the URL object
    setTimeout(() => URL.revokeObjectURL(url), 100);
  }

  // Format date for export
  formatDate(dateString) {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US');
  }

  // Format currency for export
  formatCurrency(amount) {
    if (typeof amount !== 'number') return '$0.00';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  // Get current date string for filenames
  getDateString() {
    return new Date().toISOString().split('T')[0];
  }

  // Backup all data
  async exportFullBackup() {
    try {
      // Get all data from localStorage
      const invoices = JSON.parse(localStorage.getItem('invoices') || '[]');
      const customers = JSON.parse(localStorage.getItem('customers') || '[]');
      const payments = JSON.parse(localStorage.getItem('payments') || '[]');
      const user = JSON.parse(localStorage.getItem('user') || '{}');

      const backup = {
        exportedAt: new Date().toISOString(),
        version: '1.0',
        application: 'InvoiceFlow',
        data: {
          invoices,
          customers,
          payments,
          user: {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email
          }
        },
        statistics: {
          totalInvoices: invoices.length,
          totalCustomers: customers.length,
          totalPayments: payments.length,
          totalRevenue: invoices.reduce((sum, inv) => sum + (inv.total || 0), 0)
        }
      };

      this.exportJSON(backup, 'invoiceflow_backup', true);
      
      return {
        success: true,
        message: 'Backup exported successfully',
        stats: backup.statistics
      };

    } catch (error) {
      console.error('Backup export error:', error);
      return {
        success: false,
        message: 'Failed to export backup: ' + error.message
      };
    }
  }
}

export default new ExportService();