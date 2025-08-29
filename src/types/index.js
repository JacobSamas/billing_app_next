// Data Models for Billing Application

// User/Authentication Types
export const UserRole = {
  ADMIN: 'admin',
  USER: 'user',
  VIEWER: 'viewer'
};

// Invoice Status Types  
export const InvoiceStatus = {
  DRAFT: 'draft',
  SENT: 'sent',
  VIEWED: 'viewed',
  PAID: 'paid',
  OVERDUE: 'overdue',
  CANCELLED: 'cancelled'
};

// Payment Status Types
export const PaymentStatus = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
  REFUNDED: 'refunded'
};

// Payment Method Types
export const PaymentMethod = {
  CASH: 'cash',
  CHECK: 'check',
  BANK_TRANSFER: 'bank_transfer',
  CREDIT_CARD: 'credit_card',
  PAYPAL: 'paypal',
  CRYPTO: 'crypto'
};

// User Model Template
export const createUser = (data = {}) => ({
  id: data.id || '',
  email: data.email || '',
  password: data.password || '',
  firstName: data.firstName || '',
  lastName: data.lastName || '',
  role: data.role || UserRole.USER,
  company: data.company || '',
  phone: data.phone || '',
  avatar: data.avatar || '',
  createdAt: data.createdAt || new Date().toISOString(),
  updatedAt: data.updatedAt || new Date().toISOString(),
  lastLogin: data.lastLogin || null,
  isActive: data.isActive !== undefined ? data.isActive : true,
  settings: {
    theme: 'light',
    currency: 'USD',
    language: 'en',
    notifications: true,
    ...data.settings
  }
});

// Customer Model Template
export const createCustomer = (data = {}) => ({
  id: data.id || '',
  name: data.name || '',
  email: data.email || '',
  phone: data.phone || '',
  company: data.company || '',
  website: data.website || '',
  taxNumber: data.taxNumber || '',
  address: {
    street: data.address?.street || '',
    city: data.address?.city || '',
    state: data.address?.state || '',
    zipCode: data.address?.zipCode || '',
    country: data.address?.country || 'US'
  },
  billingAddress: {
    street: data.billingAddress?.street || data.address?.street || '',
    city: data.billingAddress?.city || data.address?.city || '',
    state: data.billingAddress?.state || data.address?.state || '',
    zipCode: data.billingAddress?.zipCode || data.address?.zipCode || '',
    country: data.billingAddress?.country || data.address?.country || 'US'
  },
  notes: data.notes || '',
  tags: data.tags || [],
  isActive: data.isActive !== undefined ? data.isActive : true,
  createdAt: data.createdAt || new Date().toISOString(),
  updatedAt: data.updatedAt || new Date().toISOString(),
  userId: data.userId || ''
});

// Invoice Item Model Template
export const createInvoiceItem = (data = {}) => ({
  id: data.id || '',
  description: data.description || '',
  quantity: data.quantity || 1,
  rate: data.rate || 0,
  amount: data.amount || (data.quantity || 1) * (data.rate || 0),
  taxRate: data.taxRate || 0,
  taxAmount: data.taxAmount || ((data.quantity || 1) * (data.rate || 0)) * (data.taxRate || 0) / 100
});

// Invoice Model Template
export const createInvoice = (data = {}) => ({
  id: data.id || '',
  invoiceNumber: data.invoiceNumber || '',
  customerId: data.customerId || '',
  customer: data.customer || null,
  issueDate: data.issueDate || new Date().toISOString().split('T')[0],
  dueDate: data.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  status: data.status || InvoiceStatus.DRAFT,
  items: data.items || [],
  subtotal: data.subtotal || 0,
  taxTotal: data.taxTotal || 0,
  discountAmount: data.discountAmount || 0,
  discountPercent: data.discountPercent || 0,
  total: data.total || 0,
  amountPaid: data.amountPaid || 0,
  amountDue: data.amountDue || 0,
  currency: data.currency || 'USD',
  notes: data.notes || '',
  terms: data.terms || '',
  footer: data.footer || '',
  attachments: data.attachments || [],
  sentAt: data.sentAt || null,
  viewedAt: data.viewedAt || null,
  paidAt: data.paidAt || null,
  createdAt: data.createdAt || new Date().toISOString(),
  updatedAt: data.updatedAt || new Date().toISOString(),
  userId: data.userId || ''
});

// Payment Model Template
export const createPayment = (data = {}) => ({
  id: data.id || '',
  invoiceId: data.invoiceId || '',
  customerId: data.customerId || '',
  amount: data.amount || 0,
  method: data.method || PaymentMethod.CASH,
  status: data.status || PaymentStatus.PENDING,
  reference: data.reference || '',
  notes: data.notes || '',
  transactionId: data.transactionId || '',
  processedAt: data.processedAt || null,
  createdAt: data.createdAt || new Date().toISOString(),
  updatedAt: data.updatedAt || new Date().toISOString(),
  userId: data.userId || ''
});

// Company Settings Model Template
export const createCompanySettings = (data = {}) => ({
  id: data.id || 'company-settings',
  name: data.name || 'Your Company Name',
  email: data.email || 'hello@yourcompany.com',
  phone: data.phone || '',
  website: data.website || '',
  taxNumber: data.taxNumber || '',
  address: {
    street: data.address?.street || '',
    city: data.address?.city || '',
    state: data.address?.state || '',
    zipCode: data.address?.zipCode || '',
    country: data.address?.country || 'US'
  },
  logo: data.logo || '',
  currency: data.currency || 'USD',
  taxRate: data.taxRate || 0,
  invoicePrefix: data.invoicePrefix || 'INV',
  invoiceNumberStart: data.invoiceNumberStart || 1000,
  paymentTerms: data.paymentTerms || 'Net 30',
  notes: data.notes || 'Thank you for your business!',
  footer: data.footer || '',
  theme: {
    primaryColor: data.theme?.primaryColor || '#9333ea',
    accentColor: data.theme?.accentColor || '#a855f7',
    ...data.theme
  },
  createdAt: data.createdAt || new Date().toISOString(),
  updatedAt: data.updatedAt || new Date().toISOString()
});