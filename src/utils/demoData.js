// Demo data generator for showcasing the application
import { customersStorage, invoicesStorage, paymentsStorage } from './storage.js';
import { createCustomer, createInvoice, createPayment, createInvoiceItem } from '../types/index.js';
import { generateInvoiceNumber } from './storage.js';

// Realistic company names and data
const demoCompanies = [
  {
    name: "Sarah Johnson",
    company: "TechStart Solutions",
    email: "sarah@techstart.com",
    phone: "+1 (555) 123-4567",
    website: "https://techstart.com",
    address: {
      street: "123 Innovation Drive",
      city: "San Francisco",
      state: "CA",
      zipCode: "94105",
      country: "US"
    }
  },
  {
    name: "Michael Chen",
    company: "Digital Marketing Pro",
    email: "mike@digitalmarketingpro.com",
    phone: "+1 (555) 234-5678",
    website: "https://digitalmarketingpro.com",
    address: {
      street: "456 Market Street",
      city: "Austin",
      state: "TX",
      zipCode: "78701",
      country: "US"
    }
  },
  {
    name: "Emma Rodriguez",
    company: "Creative Design Studio",
    email: "emma@creativedesign.co",
    phone: "+1 (555) 345-6789",
    website: "https://creativedesign.co",
    address: {
      street: "789 Art District Blvd",
      city: "Portland",
      state: "OR",
      zipCode: "97205",
      country: "US"
    }
  },
  {
    name: "David Kim",
    company: "CloudOps Engineering",
    email: "david@cloudops.io",
    phone: "+1 (555) 456-7890",
    website: "https://cloudops.io",
    address: {
      street: "321 Tech Park Way",
      city: "Seattle",
      state: "WA",
      zipCode: "98101",
      country: "US"
    }
  },
  {
    name: "Lisa Wang",
    company: "E-commerce Boost",
    email: "lisa@ecommerceboost.com",
    phone: "+1 (555) 567-8901",
    website: "https://ecommerceboost.com",
    address: {
      street: "654 Commerce Ave",
      city: "New York",
      state: "NY",
      zipCode: "10001",
      country: "US"
    }
  },
  {
    name: "James Thompson",
    company: "Legal Consulting Group",
    email: "james@legalconsulting.com",
    phone: "+1 (555) 678-9012",
    address: {
      street: "987 Law Center Plaza",
      city: "Chicago",
      state: "IL",
      zipCode: "60601",
      country: "US"
    }
  },
  {
    name: "Maria Gonzalez",
    company: "Health & Wellness Co",
    email: "maria@healthwellness.com",
    phone: "+1 (555) 789-0123",
    website: "https://healthwellness.com",
    address: {
      street: "147 Wellness Blvd",
      city: "Miami",
      state: "FL",
      zipCode: "33101",
      country: "US"
    }
  },
  {
    name: "Alex Turner",
    company: "Financial Advisory Partners",
    email: "alex@finadvisory.com",
    phone: "+1 (555) 890-1234",
    address: {
      street: "258 Wall Street",
      city: "Boston",
      state: "MA",
      zipCode: "02101",
      country: "US"
    }
  }
];

// Realistic service/product descriptions
const serviceTemplates = [
  {
    description: "Website Development & Design",
    rateRange: [75, 150],
    quantityRange: [20, 80],
    taxRate: 8.5
  },
  {
    description: "Mobile App Development",
    rateRange: [100, 175],
    quantityRange: [30, 120],
    taxRate: 8.5
  },
  {
    description: "Digital Marketing Campaign",
    rateRange: [50, 125],
    quantityRange: [15, 40],
    taxRate: 8.5
  },
  {
    description: "SEO Optimization Services",
    rateRange: [60, 100],
    quantityRange: [10, 25],
    taxRate: 8.5
  },
  {
    description: "Brand Identity Package",
    rateRange: [80, 200],
    quantityRange: [1, 3],
    taxRate: 8.5
  },
  {
    description: "E-commerce Setup & Configuration",
    rateRange: [90, 160],
    quantityRange: [20, 60],
    taxRate: 8.5
  },
  {
    description: "Cloud Infrastructure Management",
    rateRange: [120, 200],
    quantityRange: [15, 45],
    taxRate: 8.5
  },
  {
    description: "Database Design & Optimization",
    rateRange: [95, 180],
    quantityRange: [10, 35],
    taxRate: 8.5
  },
  {
    description: "API Development & Integration",
    rateRange: [110, 190],
    quantityRange: [12, 40],
    taxRate: 8.5
  },
  {
    description: "Security Audit & Implementation",
    rateRange: [130, 220],
    quantityRange: [8, 25],
    taxRate: 8.5
  },
  {
    description: "Content Management System Setup",
    rateRange: [70, 140],
    quantityRange: [15, 50],
    taxRate: 8.5
  },
  {
    description: "Social Media Strategy Consultation",
    rateRange: [60, 120],
    quantityRange: [5, 20],
    taxRate: 8.5
  }
];

// Helper functions
const randomBetween = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomElement = (array) => array[Math.floor(Math.random() * array.length)];
const randomDate = (start, end) => new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));

// Generate random invoice items
const generateInvoiceItems = () => {
  const itemCount = randomBetween(1, 4);
  const items = [];
  
  for (let i = 0; i < itemCount; i++) {
    const service = randomElement(serviceTemplates);
    const quantity = randomBetween(service.quantityRange[0], service.quantityRange[1]);
    const rate = randomBetween(service.rateRange[0] * 100, service.rateRange[1] * 100) / 100;
    const amount = quantity * rate;
    const taxAmount = amount * (service.taxRate / 100);
    
    items.push(createInvoiceItem({
      description: service.description,
      quantity,
      rate,
      amount: Math.round(amount * 100) / 100,
      taxRate: service.taxRate,
      taxAmount: Math.round(taxAmount * 100) / 100
    }));
  }
  
  return items;
};

// Calculate realistic due dates
const getRandomDueDate = (issueDate, status) => {
  const issue = new Date(issueDate);
  let daysToAdd;
  
  if (status === 'paid') {
    daysToAdd = randomBetween(15, 45); // Paid invoices had reasonable due dates
  } else if (status === 'overdue') {
    daysToAdd = randomBetween(-15, -1); // Overdue invoices are past due
  } else {
    daysToAdd = randomBetween(15, 60); // Future due dates
  }
  
  const dueDate = new Date(issue);
  dueDate.setDate(issue.getDate() + daysToAdd);
  return dueDate.toISOString().split('T')[0];
};

// Generate demo data
export const generateDemoData = async (userId) => {
  console.log('🎭 Generating realistic demo data...');
  
  try {
    // Clear existing demo data (keep the main user)
    const existingCustomers = await customersStorage.findBy({ userId });
    const existingInvoices = await invoicesStorage.findBy({ userId });
    const existingPayments = await paymentsStorage.findBy({ userId });
    
    // Delete existing demo data
    for (const customer of existingCustomers) {
      await customersStorage.delete(customer.id);
    }
    for (const invoice of existingInvoices) {
      await invoicesStorage.delete(invoice.id);
    }
    for (const payment of existingPayments) {
      await paymentsStorage.delete(payment.id);
    }
    
    // Generate customers
    console.log('👥 Creating demo customers...');
    const customers = [];
    
    for (const companyData of demoCompanies) {
      const customer = createCustomer({
        ...companyData,
        billingAddress: companyData.address,
        userId
      });
      
      const savedCustomer = await customersStorage.create(customer);
      customers.push(savedCustomer);
    }
    
    // Generate invoices with realistic timeline
    console.log('📋 Creating demo invoices...');
    const invoices = [];
    const statuses = ['paid', 'paid', 'paid', 'sent', 'viewed', 'overdue', 'draft'];
    
    // Generate 15-20 invoices over the past 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const now = new Date();
    
    for (let i = 0; i < 18; i++) {
      const customer = randomElement(customers);
      const issueDate = randomDate(sixMonthsAgo, now);
      const status = randomElement(statuses);
      const items = generateInvoiceItems();
      
      // Calculate totals
      const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
      const taxTotal = items.reduce((sum, item) => sum + item.taxAmount, 0);
      const total = subtotal + taxTotal;
      
      const invoiceNumber = await generateInvoiceNumber('INV');
      const dueDate = getRandomDueDate(issueDate, status);
      
      let amountPaid = 0;
      let amountDue = total;
      
      if (status === 'paid') {
        amountPaid = total;
        amountDue = 0;
      } else if (status === 'viewed' && Math.random() > 0.7) {
        // Some viewed invoices might have partial payments
        amountPaid = Math.round(total * (randomBetween(20, 80) / 100) * 100) / 100;
        amountDue = total - amountPaid;
      }
      
      const invoice = createInvoice({
        invoiceNumber,
        customerId: customer.id,
        issueDate: issueDate.toISOString().split('T')[0],
        dueDate,
        status,
        items,
        subtotal: Math.round(subtotal * 100) / 100,
        taxTotal: Math.round(taxTotal * 100) / 100,
        total: Math.round(total * 100) / 100,
        amountPaid: Math.round(amountPaid * 100) / 100,
        amountDue: Math.round(amountDue * 100) / 100,
        notes: Math.random() > 0.7 ? 'Thank you for your business! Please contact us if you have any questions.' : '',
        terms: 'Payment is due within 30 days of invoice date. Late payments may incur additional fees.',
        userId
      });
      
      // Set appropriate timestamps based on status
      if (status === 'sent' || status === 'viewed' || status === 'paid' || status === 'overdue') {
        invoice.sentAt = new Date(issueDate.getTime() + randomBetween(1, 3) * 24 * 60 * 60 * 1000).toISOString();
      }
      
      if (status === 'viewed' || status === 'paid') {
        invoice.viewedAt = new Date(issueDate.getTime() + randomBetween(3, 7) * 24 * 60 * 60 * 1000).toISOString();
      }
      
      if (status === 'paid') {
        const paidDate = new Date(issueDate.getTime() + randomBetween(10, 25) * 24 * 60 * 60 * 1000);
        invoice.paidAt = paidDate.toISOString();
      }
      
      const savedInvoice = await invoicesStorage.create(invoice);
      invoices.push(savedInvoice);
    }
    
    // Generate payments for paid invoices
    console.log('💳 Creating demo payments...');
    const paymentMethods = ['bank_transfer', 'credit_card', 'check', 'cash'];
    
    for (const invoice of invoices) {
      if (invoice.amountPaid > 0) {
        const payment = createPayment({
          invoiceId: invoice.id,
          customerId: invoice.customerId,
          amount: invoice.amountPaid,
          method: randomElement(paymentMethods),
          status: 'completed',
          reference: `PAY-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          notes: Math.random() > 0.8 ? 'Received via online payment portal' : '',
          processedAt: invoice.paidAt || new Date().toISOString(),
          userId
        });
        
        await paymentsStorage.create(payment);
      }
    }
    
    console.log('✅ Demo data generated successfully!');
    console.log(`📊 Created: ${customers.length} customers, ${invoices.length} invoices, ${invoices.filter(i => i.amountPaid > 0).length} payments`);
    
    return {
      customers: customers.length,
      invoices: invoices.length,
      payments: invoices.filter(i => i.amountPaid > 0).length,
      totalRevenue: Math.round(invoices.reduce((sum, inv) => sum + inv.total, 0) * 100) / 100
    };
    
  } catch (error) {
    console.error('Error generating demo data:', error);
    throw error;
  }
};

// Quick stats for the generated data
export const getDemoDataStats = async (userId) => {
  const customers = await customersStorage.findBy({ userId });
  const invoices = await invoicesStorage.findBy({ userId });
  const payments = await paymentsStorage.findBy({ userId });
  
  const totalRevenue = invoices.reduce((sum, inv) => sum + inv.total, 0);
  const paidAmount = invoices.reduce((sum, inv) => sum + inv.amountPaid, 0);
  const outstandingAmount = invoices.reduce((sum, inv) => sum + inv.amountDue, 0);
  
  return {
    customers: customers.length,
    invoices: invoices.length,
    payments: payments.length,
    totalRevenue: Math.round(totalRevenue * 100) / 100,
    paidAmount: Math.round(paidAmount * 100) / 100,
    outstandingAmount: Math.round(outstandingAmount * 100) / 100,
    statusBreakdown: {
      paid: invoices.filter(i => i.status === 'paid').length,
      sent: invoices.filter(i => i.status === 'sent').length,
      viewed: invoices.filter(i => i.status === 'viewed').length,
      draft: invoices.filter(i => i.status === 'draft').length,
      overdue: invoices.filter(i => i.status === 'overdue').length
    }
  };
};