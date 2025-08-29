// Authentication utilities
import { usersStorage } from './storage.js';

// Simple password hashing (use bcrypt in production)
export const hashPassword = (password) => {
  // In production, use bcrypt or similar
  return btoa(password + 'salt'); // Base64 encoding for demo
};

export const verifyPassword = (password, hashedPassword) => {
  return hashPassword(password) === hashedPassword;
};

// Generate JWT token (simplified - use proper JWT library in production)
export const generateToken = (user) => {
  const payload = {
    id: user.id,
    email: user.email,
    role: user.role,
    exp: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
  };
  return btoa(JSON.stringify(payload)); // Base64 encoding for demo
};

export const verifyToken = (token) => {
  try {
    const payload = JSON.parse(atob(token));
    if (payload.exp < Date.now()) {
      throw new Error('Token expired');
    }
    return payload;
  } catch (error) {
    throw new Error('Invalid token');
  }
};

// Authenticate user
export const authenticateUser = async (email, password) => {
  const user = await usersStorage.findOneBy({ email });
  
  if (!user || !user.isActive) {
    throw new Error('Invalid credentials');
  }

  if (!verifyPassword(password, user.password)) {
    throw new Error('Invalid credentials');
  }

  // Update last login
  await usersStorage.update(user.id, {
    lastLogin: new Date().toISOString()
  });

  // Return user without password
  const { password: _, ...userWithoutPassword } = user;
  return {
    user: userWithoutPassword,
    token: generateToken(user)
  };
};

// Register new user
export const registerUser = async (userData) => {
  // Check if user already exists
  const existingUser = await usersStorage.findOneBy({ email: userData.email });
  if (existingUser) {
    throw new Error('User already exists');
  }

  // Hash password
  const hashedPassword = hashPassword(userData.password);
  
  // Create user
  const { createUser } = await import('../types/index.js');
  const newUser = createUser({
    ...userData,
    password: hashedPassword
  });

  const user = await usersStorage.create(newUser);
  
  // Return user without password
  const { password: _, ...userWithoutPassword } = user;
  return {
    user: userWithoutPassword,
    token: generateToken(user)
  };
};

// Get current user from token
export const getCurrentUser = async (token) => {
  const payload = verifyToken(token);
  const user = await usersStorage.findById(payload.id);
  
  if (!user || !user.isActive) {
    throw new Error('User not found');
  }

  // Return user without password
  const { password: _, ...userWithoutPassword } = user;
  return userWithoutPassword;
};