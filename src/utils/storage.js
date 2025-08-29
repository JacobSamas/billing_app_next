// JSON-based Storage System for Development
// This can easily be replaced with a database in production

import { promises as fs } from 'fs';
import path from 'path';

// Storage directory
const STORAGE_DIR = path.join(process.cwd(), 'src/data');

// Ensure storage directory exists
const ensureStorageDir = async () => {
  try {
    await fs.access(STORAGE_DIR);
  } catch {
    await fs.mkdir(STORAGE_DIR, { recursive: true });
  }
};

// Generic storage operations
class Storage {
  constructor(fileName) {
    this.fileName = fileName;
    this.filePath = path.join(STORAGE_DIR, `${fileName}.json`);
  }

  // Read data from JSON file
  async read() {
    try {
      await ensureStorageDir();
      const data = await fs.readFile(this.filePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      // Return empty array if file doesn't exist
      if (error.code === 'ENOENT') {
        return [];
      }
      throw error;
    }
  }

  // Write data to JSON file
  async write(data) {
    try {
      await ensureStorageDir();
      await fs.writeFile(this.filePath, JSON.stringify(data, null, 2), 'utf8');
      return data;
    } catch (error) {
      throw error;
    }
  }

  // Find by ID
  async findById(id) {
    const data = await this.read();
    return data.find(item => item.id === id) || null;
  }

  // Find by criteria
  async findBy(criteria) {
    const data = await this.read();
    return data.filter(item => {
      return Object.keys(criteria).every(key => {
        if (key.includes('.')) {
          // Handle nested properties like 'address.city'
          const keys = key.split('.');
          let value = item;
          for (const k of keys) {
            value = value?.[k];
          }
          return value === criteria[key];
        }
        return item[key] === criteria[key];
      });
    });
  }

  // Find one by criteria
  async findOneBy(criteria) {
    const results = await this.findBy(criteria);
    return results[0] || null;
  }

  // Create new item
  async create(item) {
    const data = await this.read();
    const newItem = {
      ...item,
      id: item.id || this.generateId(),
      createdAt: item.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    data.push(newItem);
    await this.write(data);
    return newItem;
  }

  // Update existing item
  async update(id, updates) {
    const data = await this.read();
    const index = data.findIndex(item => item.id === id);
    
    if (index === -1) {
      throw new Error(`Item with id ${id} not found`);
    }

    data[index] = {
      ...data[index],
      ...updates,
      id, // Preserve original ID
      updatedAt: new Date().toISOString()
    };

    await this.write(data);
    return data[index];
  }

  // Delete item
  async delete(id) {
    const data = await this.read();
    const index = data.findIndex(item => item.id === id);
    
    if (index === -1) {
      throw new Error(`Item with id ${id} not found`);
    }

    const deletedItem = data.splice(index, 1)[0];
    await this.write(data);
    return deletedItem;
  }

  // Get all items with optional filtering and pagination
  async findAll(options = {}) {
    const data = await this.read();
    let result = data;

    // Apply filters
    if (options.where) {
      result = result.filter(item => {
        return Object.keys(options.where).every(key => {
          if (key.includes('.')) {
            // Handle nested properties
            const keys = key.split('.');
            let value = item;
            for (const k of keys) {
              value = value?.[k];
            }
            return value === options.where[key];
          }
          return item[key] === options.where[key];
        });
      });
    }

    // Apply sorting
    if (options.orderBy) {
      result = result.sort((a, b) => {
        const field = options.orderBy.field;
        const direction = options.orderBy.direction || 'asc';
        
        let aValue = a[field];
        let bValue = b[field];
        
        // Handle nested properties
        if (field.includes('.')) {
          const keys = field.split('.');
          aValue = a;
          bValue = b;
          for (const k of keys) {
            aValue = aValue?.[k];
            bValue = bValue?.[k];
          }
        }

        if (direction === 'desc') {
          return bValue > aValue ? 1 : -1;
        }
        return aValue > bValue ? 1 : -1;
      });
    }

    // Apply pagination
    if (options.limit) {
      const offset = options.offset || 0;
      result = result.slice(offset, offset + options.limit);
    }

    return result;
  }

  // Count items
  async count(where = {}) {
    const data = await this.read();
    
    if (Object.keys(where).length === 0) {
      return data.length;
    }

    return data.filter(item => {
      return Object.keys(where).every(key => item[key] === where[key]);
    }).length;
  }

  // Generate unique ID
  generateId() {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  }
}

// Storage instances for different data types
export const usersStorage = new Storage('users');
export const customersStorage = new Storage('customers');
export const invoicesStorage = new Storage('invoices');
export const paymentsStorage = new Storage('payments');
export const settingsStorage = new Storage('settings');

// Helper functions for common operations
export const generateInvoiceNumber = async (prefix = 'INV') => {
  const invoices = await invoicesStorage.read();
  const lastNumber = invoices
    .map(inv => inv.invoiceNumber)
    .filter(num => num.startsWith(prefix))
    .map(num => parseInt(num.replace(prefix + '-', '')) || 0)
    .sort((a, b) => b - a)[0] || 999;
  
  return `${prefix}-${String(lastNumber + 1).padStart(4, '0')}`;
};

export const calculateInvoiceTotals = (items = []) => {
  const subtotal = items.reduce((sum, item) => sum + (item.amount || 0), 0);
  const taxTotal = items.reduce((sum, item) => sum + (item.taxAmount || 0), 0);
  const total = subtotal + taxTotal;
  
  return {
    subtotal: Math.round(subtotal * 100) / 100,
    taxTotal: Math.round(taxTotal * 100) / 100,
    total: Math.round(total * 100) / 100
  };
};

export const updateInvoiceStatus = async (invoiceId) => {
  const invoice = await invoicesStorage.findById(invoiceId);
  if (!invoice) return null;

  const payments = await paymentsStorage.findBy({ invoiceId });
  const totalPaid = payments
    .filter(p => p.status === 'completed')
    .reduce((sum, p) => sum + p.amount, 0);

  let status = invoice.status;
  let amountPaid = totalPaid;
  let amountDue = invoice.total - totalPaid;

  if (totalPaid >= invoice.total) {
    status = 'paid';
    amountDue = 0;
  } else if (totalPaid > 0) {
    status = 'partial';
  } else if (new Date(invoice.dueDate) < new Date() && status !== 'paid') {
    status = 'overdue';
  }

  return await invoicesStorage.update(invoiceId, {
    status,
    amountPaid: Math.round(amountPaid * 100) / 100,
    amountDue: Math.round(amountDue * 100) / 100
  });
};

// Initialize default data
export const initializeDefaultData = async () => {
  try {
    // Check if company settings exist
    const settings = await settingsStorage.read();
    if (settings.length === 0) {
      const { createCompanySettings } = await import('../types/index.js');
      await settingsStorage.create(createCompanySettings());
    }

    // Create demo user if no users exist
    const users = await usersStorage.read();
    if (users.length === 0) {
      const { createUser } = await import('../types/index.js');
      const { hashPassword } = await import('./auth.js');
      await usersStorage.create(createUser({
        id: 'demo-user',
        email: 'demo@invoiceflow.com',
        password: hashPassword('demo123'),
        firstName: 'Demo',
        lastName: 'User',
        company: 'InvoiceFlow Demo',
        role: 'admin'
      }));
    }

  } catch (error) {
    console.error('Error initializing default data:', error);
  }
};