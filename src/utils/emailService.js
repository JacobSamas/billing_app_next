'use client';

// Email Service - Professional email functionality for invoices
// This would typically integrate with services like SendGrid, Mailgun, or AWS SES
// For demo purposes, we'll simulate the email sending process

class EmailService {
  constructor() {
    // In production, these would be environment variables
    this.apiEndpoint = process.env.EMAIL_API_ENDPOINT || 'https://api.demo-email-service.com';
    this.apiKey = process.env.EMAIL_API_KEY || 'demo-api-key';
  }

  // Simulate email sending - in production this would call actual email service
  async sendInvoiceEmail(invoice, recipientEmail, customMessage = '') {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Generate email content
    const emailData = this.generateInvoiceEmail(invoice, customMessage);

    // In production, this would make actual API call to email service
    const success = Math.random() > 0.1; // 90% success rate for demo

    if (success) {
      // Log to console for demo purposes
      console.log('📧 Invoice Email Sent Successfully:', {
        to: recipientEmail,
        invoiceNumber: invoice.invoiceNumber,
        amount: invoice.total,
        subject: emailData.subject
      });

      // Store email log for tracking
      this.logEmailSent(invoice, recipientEmail, emailData);

      return {
        success: true,
        messageId: 'demo-' + Date.now(),
        message: 'Invoice email sent successfully!'
      };
    } else {
      throw new Error('Failed to send email. Please try again later.');
    }
  }

  // Generate professional email content
  generateInvoiceEmail(invoice, customMessage) {
    const subject = `Invoice ${invoice.invoiceNumber} - ${new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(invoice.total)}`;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Invoice ${invoice.invoiceNumber}</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background: linear-gradient(135deg, #9333ea, #a855f7);
              color: white;
              padding: 30px 20px;
              border-radius: 8px;
              text-align: center;
              margin-bottom: 30px;
            }
            .invoice-details {
              background: #f8fafc;
              padding: 20px;
              border-radius: 8px;
              margin: 20px 0;
            }
            .amount {
              font-size: 24px;
              font-weight: bold;
              color: #9333ea;
            }
            .items-table {
              width: 100%;
              border-collapse: collapse;
              margin: 20px 0;
            }
            .items-table th, .items-table td {
              padding: 12px;
              text-align: left;
              border-bottom: 1px solid #e2e8f0;
            }
            .items-table th {
              background: #f1f5f9;
              font-weight: 600;
            }
            .footer {
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #e2e8f0;
              color: #64748b;
              font-size: 14px;
            }
            .cta-button {
              background: #9333ea;
              color: white;
              padding: 12px 24px;
              text-decoration: none;
              border-radius: 6px;
              display: inline-block;
              margin: 20px 0;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>InvoiceFlow</h1>
            <p>Professional Billing Management</p>
          </div>

          <h2>Hello ${invoice.customer.name},</h2>
          
          ${customMessage ? `<p><em>${customMessage}</em></p>` : ''}
          
          <p>Thank you for your business! Please find your invoice details below:</p>

          <div class="invoice-details">
            <h3>Invoice #${invoice.invoiceNumber}</h3>
            <p><strong>Issue Date:</strong> ${new Date(invoice.issueDate).toLocaleDateString()}</p>
            <p><strong>Due Date:</strong> ${new Date(invoice.dueDate).toLocaleDateString()}</p>
            <p><strong>Amount Due:</strong> <span class="amount">${new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: 'USD'
            }).format(invoice.total)}</span></p>
          </div>

          <table class="items-table">
            <thead>
              <tr>
                <th>Description</th>
                <th>Quantity</th>
                <th>Rate</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              ${invoice.items.map(item => `
                <tr>
                  <td>${item.description}</td>
                  <td>${item.quantity}</td>
                  <td>$${item.rate.toFixed(2)}</td>
                  <td>$${item.amount.toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div style="text-align: center;">
            <a href="#" class="cta-button">Pay Invoice Online</a>
          </div>

          <div class="footer">
            <p>Questions about this invoice? Contact us at billing@invoiceflow.com</p>
            <p>InvoiceFlow - Modern Billing Management System</p>
          </div>
        </body>
      </html>
    `;

    const textContent = `
Invoice #${invoice.invoiceNumber}

Dear ${invoice.customer.name},

${customMessage ? customMessage + '\n\n' : ''}

Thank you for your business! Here are your invoice details:

Invoice Number: ${invoice.invoiceNumber}
Issue Date: ${new Date(invoice.issueDate).toLocaleDateString()}
Due Date: ${new Date(invoice.dueDate).toLocaleDateString()}
Amount Due: ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(invoice.total)}

Items:
${invoice.items.map(item => 
  `- ${item.description}: ${item.quantity} x $${item.rate} = $${item.amount}`
).join('\n')}

Subtotal: $${invoice.subtotal.toFixed(2)}
Tax: $${invoice.tax.toFixed(2)}
Total: $${invoice.total.toFixed(2)}

Please remit payment by the due date. Contact us with any questions.

Best regards,
InvoiceFlow Team
    `;

    return {
      subject,
      html: htmlContent,
      text: textContent,
      attachments: [] // PDF could be attached here
    };
  }

  // Log email activity for tracking
  logEmailSent(invoice, recipient, emailData) {
    const emailLog = {
      id: 'email-' + Date.now(),
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      recipient,
      subject: emailData.subject,
      sentAt: new Date().toISOString(),
      status: 'sent'
    };

    // Store in localStorage for demo (in production, store in database)
    const existingLogs = JSON.parse(localStorage.getItem('emailLogs') || '[]');
    existingLogs.push(emailLog);
    localStorage.setItem('emailLogs', JSON.stringify(existingLogs));
  }

  // Get email logs for an invoice
  getEmailLogs(invoiceId) {
    const logs = JSON.parse(localStorage.getItem('emailLogs') || '[]');
    return logs.filter(log => log.invoiceId === invoiceId);
  }

  // Get all email logs
  getAllEmailLogs() {
    return JSON.parse(localStorage.getItem('emailLogs') || '[]');
  }

  // Send payment reminder
  async sendPaymentReminder(invoice) {
    const daysOverdue = Math.ceil((new Date() - new Date(invoice.dueDate)) / (1000 * 60 * 60 * 24));
    
    const reminderData = {
      subject: `Payment Reminder: Invoice ${invoice.invoiceNumber} - ${daysOverdue} days overdue`,
      message: `This is a friendly reminder that invoice ${invoice.invoiceNumber} is ${daysOverdue} days past due. Please submit payment at your earliest convenience.`
    };

    return this.sendInvoiceEmail(invoice, invoice.customer.email, reminderData.message);
  }
}

export default new EmailService();