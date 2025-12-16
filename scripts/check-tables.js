#!/usr/bin/env node

import pool from '../lib/db.js';

const requiredTables = [
  'users',
  'vendors',
  'customers',
  'hotels',
  'rooms',
  'bookings',
  'payments',
  'modules',
  'subscription_plans',
  'plan_features',
  'staff',
  'super_admins'
];

async function checkTables() {
  try {
    console.log('Checking database tables...');
    
    // Get all tables from the database
    const [rows] = await pool.query('SHOW TABLES');
    const existingTables = rows.map(row => Object.values(row)[0]);
    
    console.log('Existing tables:', existingTables);
    
    // Check which required tables are missing
    const missingTables = requiredTables.filter(table => !existingTables.includes(table));
    
    if (missingTables.length === 0) {
      console.log('✅ All required tables exist');
    } else {
      console.error('❌ Missing tables:', missingTables);
      
      // Suggest SQL to create missing tables based on simplified schemas
      console.log('\nSuggested SQL to create missing tables:');
      
      for (const table of missingTables) {
        console.log(`\n-- Create ${table} table`);
        console.log(getCreateTableSQL(table));
      }
    }
    
    // Now check some key tables for records
    for (const table of ['users', 'vendors', 'hotels', 'modules'].filter(t => existingTables.includes(t))) {
      const [countResult] = await pool.query(`SELECT COUNT(*) as count FROM ${table}`);
      const count = countResult[0].count;
      console.log(`Table ${table} has ${count} records`);
    }
    
  } catch (error) {
    console.error('Error checking tables:', error);
  } finally {
    await pool.end();
  }
}

function getCreateTableSQL(tableName) {
  const schemas = {
    users: `
CREATE TABLE users (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL,
  isActive BOOLEAN DEFAULT TRUE,
  emailVerified DATETIME NULL,
  lastLoginAt DATETIME NULL,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);`,
    
    vendors: `
CREATE TABLE vendors (
  id VARCHAR(36) PRIMARY KEY,
  userId VARCHAR(36) UNIQUE NOT NULL,
  companyName VARCHAR(255),
  businessAddress TEXT,
  businessPhone VARCHAR(50),
  taxId VARCHAR(50),
  subscriptionPlanId VARCHAR(36),
  subscriptionStatus VARCHAR(20),
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);`,
    
    customers: `
CREATE TABLE customers (
  id VARCHAR(36) PRIMARY KEY,
  userId VARCHAR(36) UNIQUE NOT NULL,
  phone VARCHAR(50),
  address TEXT,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);`,
    
    hotels: `
CREATE TABLE hotels (
  id VARCHAR(36) PRIMARY KEY,
  vendorId VARCHAR(36) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  address TEXT NOT NULL,
  city VARCHAR(100) NOT NULL,
  state VARCHAR(100) NOT NULL,
  country VARCHAR(100) NOT NULL,
  zipCode VARCHAR(20),
  phone VARCHAR(50) NOT NULL,
  email VARCHAR(255) NOT NULL,
  website VARCHAR(255),
  images TEXT,
  rating FLOAT,
  isActive BOOLEAN DEFAULT TRUE,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (vendorId) REFERENCES vendors(id) ON DELETE CASCADE
);`,
    
    rooms: `
CREATE TABLE rooms (
  id VARCHAR(36) PRIMARY KEY,
  hotelId VARCHAR(36) NOT NULL,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(100) NOT NULL,
  description TEXT,
  capacity INT NOT NULL,
  pricePerNight DECIMAL(10, 2) NOT NULL,
  discountedPrice DECIMAL(10, 2),
  images TEXT,
  status VARCHAR(50) NOT NULL,
  roomNumbers TEXT,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (hotelId) REFERENCES hotels(id) ON DELETE CASCADE
);`,
    
    bookings: `
CREATE TABLE bookings (
  id VARCHAR(36) PRIMARY KEY,
  hotelId VARCHAR(36) NOT NULL,
  roomId VARCHAR(36) NOT NULL,
  customerId VARCHAR(36) NOT NULL,
  checkInDate DATE NOT NULL,
  checkOutDate DATE NOT NULL,
  numberOfGuests INT NOT NULL,
  totalAmount DECIMAL(10, 2) NOT NULL,
  status VARCHAR(50) NOT NULL,
  paymentStatus VARCHAR(50) NOT NULL,
  specialRequests TEXT,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (hotelId) REFERENCES hotels(id) ON DELETE CASCADE,
  FOREIGN KEY (roomId) REFERENCES rooms(id) ON DELETE CASCADE,
  FOREIGN KEY (customerId) REFERENCES customers(id) ON DELETE CASCADE
);`,
    
    payments: `
CREATE TABLE payments (
  id VARCHAR(36) PRIMARY KEY,
  bookingId VARCHAR(36) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  status VARCHAR(50) NOT NULL,
  paymentMethod VARCHAR(50) NOT NULL,
  transactionId VARCHAR(255),
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (bookingId) REFERENCES bookings(id) ON DELETE CASCADE
);`,
    
    modules: `
CREATE TABLE modules (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  type VARCHAR(50) NOT NULL,
  basePrice DECIMAL(10, 2) NOT NULL,
  isActive BOOLEAN DEFAULT TRUE,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);`,
    
    subscription_plans: `
CREATE TABLE subscription_plans (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  billingCycle VARCHAR(20) NOT NULL,
  isActive BOOLEAN DEFAULT TRUE,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);`,
    
    plan_features: `
CREATE TABLE plan_features (
  id VARCHAR(36) PRIMARY KEY,
  planId VARCHAR(36) NOT NULL,
  moduleId VARCHAR(36) NOT NULL,
  isIncluded BOOLEAN DEFAULT FALSE,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (planId) REFERENCES subscription_plans(id) ON DELETE CASCADE,
  FOREIGN KEY (moduleId) REFERENCES modules(id) ON DELETE CASCADE
);`,
    
    staff: `
CREATE TABLE staff (
  id VARCHAR(36) PRIMARY KEY,
  userId VARCHAR(36) UNIQUE NOT NULL,
  vendorId VARCHAR(36),
  hotelId VARCHAR(36),
  position VARCHAR(100) NOT NULL,
  permissions TEXT,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (vendorId) REFERENCES vendors(id) ON DELETE SET NULL,
  FOREIGN KEY (hotelId) REFERENCES hotels(id) ON DELETE SET NULL
);`,
    
    super_admins: `
CREATE TABLE super_admins (
  id VARCHAR(36) PRIMARY KEY,
  userId VARCHAR(36) UNIQUE NOT NULL,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);`
  };
  
  return schemas[tableName] || `-- No schema template available for ${tableName}`;
}

// Run the function
checkTables().catch(console.error); 