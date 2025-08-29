// Validation utilities for forms and data

// Email validation
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Phone validation
export const isValidPhone = (phone) => {
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
  return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
};

// Password validation
export const isValidPassword = (password) => {
  return password && password.length >= 6;
};

// Required field validation
export const isRequired = (value) => {
  return value !== undefined && value !== null && value !== '';
};

// Number validation
export const isValidNumber = (value, min = 0) => {
  const num = parseFloat(value);
  return !isNaN(num) && num >= min;
};

// Date validation
export const isValidDate = (dateString) => {
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime());
};

// URL validation
export const isValidUrl = (url) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

// Validation schemas
export const userValidation = {
  email: (value) => {
    if (!isRequired(value)) return 'Email is required';
    if (!isValidEmail(value)) return 'Invalid email format';
    return null;
  },
  
  password: (value) => {
    if (!isRequired(value)) return 'Password is required';
    if (!isValidPassword(value)) return 'Password must be at least 6 characters';
    return null;
  },
  
  firstName: (value) => {
    if (!isRequired(value)) return 'First name is required';
    return null;
  },
  
  lastName: (value) => {
    if (!isRequired(value)) return 'Last name is required';
    return null;
  },
  
  phone: (value) => {
    if (value && !isValidPhone(value)) return 'Invalid phone format';
    return null;
  }
};

export const customerValidation = {
  name: (value) => {
    if (!isRequired(value)) return 'Name is required';
    return null;
  },
  
  email: (value) => {
    if (value && !isValidEmail(value)) return 'Invalid email format';
    return null;
  },
  
  phone: (value) => {
    if (value && !isValidPhone(value)) return 'Invalid phone format';
    return null;
  },
  
  website: (value) => {
    if (value && !isValidUrl(value)) return 'Invalid website URL';
    return null;
  }
};

export const invoiceValidation = {
  customerId: (value) => {
    if (!isRequired(value)) return 'Customer is required';
    return null;
  },
  
  issueDate: (value) => {
    if (!isRequired(value)) return 'Issue date is required';
    if (!isValidDate(value)) return 'Invalid issue date';
    return null;
  },
  
  dueDate: (value) => {
    if (!isRequired(value)) return 'Due date is required';
    if (!isValidDate(value)) return 'Invalid due date';
    return null;
  },
  
  items: (value) => {
    if (!Array.isArray(value) || value.length === 0) {
      return 'At least one item is required';
    }
    return null;
  }
};

export const invoiceItemValidation = {
  description: (value) => {
    if (!isRequired(value)) return 'Description is required';
    return null;
  },
  
  quantity: (value) => {
    if (!isRequired(value)) return 'Quantity is required';
    if (!isValidNumber(value, 0.01)) return 'Quantity must be greater than 0';
    return null;
  },
  
  rate: (value) => {
    if (!isRequired(value)) return 'Rate is required';
    if (!isValidNumber(value, 0)) return 'Rate must be a valid number';
    return null;
  }
};

export const paymentValidation = {
  amount: (value) => {
    if (!isRequired(value)) return 'Amount is required';
    if (!isValidNumber(value, 0.01)) return 'Amount must be greater than 0';
    return null;
  },
  
  method: (value) => {
    if (!isRequired(value)) return 'Payment method is required';
    return null;
  }
};

// Generic form validation function
export const validateForm = (data, schema) => {
  const errors = {};
  let isValid = true;

  Object.keys(schema).forEach(field => {
    const error = schema[field](data[field]);
    if (error) {
      errors[field] = error;
      isValid = false;
    }
  });

  return { isValid, errors };
};

// Validate nested object (like address)
export const validateNestedObject = (data, schema, prefix = '') => {
  const errors = {};
  let isValid = true;

  Object.keys(schema).forEach(field => {
    const fieldKey = prefix ? `${prefix}.${field}` : field;
    const error = schema[field](data[field]);
    if (error) {
      errors[fieldKey] = error;
      isValid = false;
    }
  });

  return { isValid, errors };
};

// Sanitize input data
export const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .slice(0, 1000); // Limit length
};

// Sanitize object
export const sanitizeObject = (obj) => {
  const sanitized = {};
  
  Object.keys(obj).forEach(key => {
    const value = obj[key];
    
    if (typeof value === 'string') {
      sanitized[key] = sanitizeInput(value);
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value);
    } else {
      sanitized[key] = value;
    }
  });
  
  return sanitized;
};