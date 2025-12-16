console.log('seed-mysql.js script starting execution...');

import pool from '../lib/db.js'; // Path relative to script location
// Change the above line to use a path relative to the project root if needed:
// import pool from './lib/db.js'; 
import bcrypt from 'bcrypt';
import crypto from 'crypto';

// --- Configuration ---
const ADMIN_EMAIL = 'admin@qarashotels.com';
const VENDOR_EMAIL = 'info@qarashotels.com.ng';
const CUSTOMER_EMAIL = 'customer@example.com'; // Placeholder customer
const DEFAULT_PASSWORD = 'password'; // Use a secure default or env variable in production
const SALT_ROUNDS = 10;

// --- Helper Functions ---
async function hashPassword(password) {
  return bcrypt.hash(password, SALT_ROUNDS);
}

// Generates a UUID using Node's crypto module
function generateUUID() {
    return crypto.randomUUID();
}

// Inserts a user and returns their generated ID
async function insertUser(email, name, password, role) {
  const userId = generateUUID();
  const hashedPassword = await hashPassword(password);
  const sql = `
    INSERT INTO users (id, email, name, password, role, isActive, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, TRUE, NOW(), NOW())
  `;
  try {
    await pool.query(sql, [userId, email, name, hashedPassword, role]);
    console.log(`User created: ${email} (ID: ${userId})`);
    return userId;
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      console.warn(`User already exists: ${email}. Fetching existing ID.`);
      const [rows] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
      if (rows.length > 0) {
          return rows[0].id;
      } else {
          throw new Error(`Failed to fetch existing user ID for ${email}`);
      }
    } else {
      console.error(`Error creating user ${email}:`, error);
      throw error; // Re-throw to stop the script
    }
  }
}

// Inserts a vendor linked to a user
async function insertVendor(userId, companyName) {
  const vendorId = generateUUID();
  const sql = `
    INSERT INTO vendors (id, userId, companyName, createdAt, updatedAt)
    VALUES (?, ?, ?, NOW(), NOW())
  `;
   try {
    await pool.query(sql, [vendorId, userId, companyName]);
    console.log(`Vendor created: ${companyName} (ID: ${vendorId}) for User ID: ${userId}`);
    return vendorId;
   } catch (error) {
     if (error.code === 'ER_DUP_ENTRY' || error.message.includes('FOREIGN KEY (`userId`)')) { // Check for duplicate user link too
       console.warn(`Vendor profile potentially already exists for User ID: ${userId}. Fetching existing Vendor ID.`);
       const [rows] = await pool.query('SELECT id FROM vendors WHERE userId = ?', [userId]);
       if (rows.length > 0) {
           return rows[0].id;
       } else {
            // If the duplicate was the Vendor ID itself (less likely with UUIDs)
            console.warn(`Vendor ID ${vendorId} might already exist, trying to fetch by user ID.`);
            const [userRows] = await pool.query('SELECT id FROM vendors WHERE userId = ?', [userId]);
            if(userRows.length > 0) return userRows[0].id;
           throw new Error(`Failed to fetch existing vendor ID for User ID: ${userId}`);
       }
     } else {
       console.error(`Error creating vendor for User ID ${userId}:`, error);
       throw error;
     }
   }
}

// Inserts a hotel linked to a vendor
async function insertHotel(vendorId, name, description, address, city, state, country, phone, email, images = '[]') { // Default empty JSON array for images
  const hotelId = generateUUID();
  const sql = `
    INSERT INTO hotels (id, vendorId, name, description, address, city, state, country, phone, email, images, isActive, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, TRUE, NOW(), NOW())
  `;
  try {
    await pool.query(sql, [hotelId, vendorId, name, description, address, city, state, country, phone, email, images]);
    console.log(`Hotel created: ${name} (ID: ${hotelId}) for Vendor ID: ${vendorId}`);
    return hotelId;
  } catch (error) {
     // Hotels likely don't have unique constraints other than ID, but check FK
     if (error.code === 'ER_NO_REFERENCED_ROW_2' && error.message.includes('vendorId')) {
         console.error(`Vendor with ID ${vendorId} does not exist. Cannot create hotel ${name}.`);
         throw error;
     } else if (error.code === 'ER_DUP_ENTRY') {
         console.warn(`Hotel with ID ${hotelId} might already exist. Skipping.`);
         return null; // Indicate skipping
     }
     else {
       console.error(`Error creating hotel ${name}:`, error);
       throw error;
     }
  }
}

// Inserts a customer linked to a user
async function insertCustomer(userId) {
  const customerId = generateUUID();
  const sql = `
    INSERT INTO customers (id, userId, createdAt, updatedAt)
    VALUES (?, ?, NOW(), NOW())
  `;
  try {
    await pool.query(sql, [customerId, userId]);
    console.log(`Customer profile created (ID: ${customerId}) for User ID: ${userId}`);
    return customerId;
  } catch (error) {
     if (error.code === 'ER_DUP_ENTRY' || error.message.includes('FOREIGN KEY (`userId`)')) {
       console.warn(`Customer profile potentially already exists for User ID: ${userId}. Skipping.`);
       return null; // Indicate skipping
     } else {
       console.error(`Error creating customer profile for User ID ${userId}:`, error);
       throw error;
     }
  }
}

// --- Main Seeding Logic ---
async function seedDatabase() {
  console.log('Starting database seeding...');
  let connection;
  try {
      // Get a connection to potentially use transactions if needed later
      connection = await pool.getConnection();
      console.log('Database connection acquired.');
      // await connection.beginTransaction(); // Optional: Use transactions

      // 1. Create Super Admin
      await insertUser(ADMIN_EMAIL, 'Admin User', DEFAULT_PASSWORD, 'SUPER_ADMIN');

      // 2. Create Vendor User and Vendor Profile
      const vendorUserId = await insertUser(VENDOR_EMAIL, 'Default Vendor', DEFAULT_PASSWORD, 'VENDOR');
      const vendorId = await insertVendor(vendorUserId, 'Qara Hotels Group');

      // 3. Create Hotels for the Vendor
      if (vendorId) { // Only create hotels if vendor was created/found
          await insertHotel(
              vendorId,
              'Hoese 3', // Corrected name?
              'Description for Hoese 3',
              '123 Main St',
              'CityA',
              'StateA',
              'CountryA',
              '555-1111',
              'hoese3@qarashotels.com.ng'
              // images can be added here as JSON string if needed
          );
          await insertHotel(
              vendorId,
              'Bluxton Hill',
              'Description for Bluxton Hill',
              '456 Oak Ave',
              'CityB',
              'StateB',
              'CountryB',
              '555-2222',
              'bluxton@qarashotels.com.ng'
              // images can be added here as JSON string if needed
          );
      } else {
          console.warn("Skipping hotel creation as Vendor ID could not be obtained.");
      }


      // 4. Create Default Customer
      const customerUserId = await insertUser(CUSTOMER_EMAIL, 'Default Customer', DEFAULT_PASSWORD, 'CUSTOMER');
      await insertCustomer(customerUserId);


      // await connection.commit(); // Optional: Commit transaction
      console.log('Database seeding completed successfully.');

  } catch (error) {
      // if (connection) await connection.rollback(); // Optional: Rollback transaction on error
      console.error('Database seeding failed:', error);
      process.exitCode = 1; // Indicate failure
  } finally {
      if (connection) connection.release(); // Release connection back to the pool
      await pool.end(); // Close all connections in the pool
      console.log('Database connection pool closed.');
  }
}

// --- Run the Seeding ---
seedDatabase();