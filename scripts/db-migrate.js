#!/usr/bin/env node

// Database migration script to set up or repair the necessary tables
// Usage: node scripts/db-migrate.js

const mysql = require('mysql2/promise');
require('dotenv').config();

// Database configuration from environment variables
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
};

console.log('Database Migration Script');
console.log('========================');

async function main() {
  console.log('Connecting to database...');
  
  // Create connection
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('Connected to database.');
  } catch (err) {
    console.error('Failed to connect to database:', err.message);
    process.exit(1);
  }

  try {
    // Start transaction
    await connection.beginTransaction();
    console.log('Started transaction.');

    // Create or update hotels table
    console.log('Creating/updating hotels table...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS hotels (
        id VARCHAR(36) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        address VARCHAR(255),
        city VARCHAR(100),
        state VARCHAR(100),
        country VARCHAR(100),
        zipCode VARCHAR(20),
        phone VARCHAR(20),
        email VARCHAR(255),
        website VARCHAR(255),
        starRating INT,
        checkInTime TIME,
        checkOutTime TIME,
        latitude DECIMAL(10, 8),
        longitude DECIMAL(11, 8),
        isActive BOOLEAN DEFAULT TRUE,
        createdAt DATETIME NOT NULL,
        updatedAt DATETIME NOT NULL
      )
    `);

    // Create or update rooms table
    console.log('Creating/updating rooms table...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS rooms (
        id VARCHAR(36) PRIMARY KEY,
        hotelId VARCHAR(36) NOT NULL,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        roomType VARCHAR(50) NOT NULL,
        pricePerNight DECIMAL(10, 2) NOT NULL,
        discountedPrice DECIMAL(10, 2),
        capacity INT NOT NULL,
        numBeds INT NOT NULL,
        bedType VARCHAR(50),
        roomSize INT,
        roomSizeUnit VARCHAR(10) DEFAULT 'sq_ft',
        isActive BOOLEAN DEFAULT TRUE,
        createdAt DATETIME NOT NULL,
        updatedAt DATETIME NOT NULL,
        FOREIGN KEY (hotelId) REFERENCES hotels(id) ON DELETE CASCADE
      )
    `);

    // Create or update customers table
    console.log('Creating/updating customers table...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS customers (
        id VARCHAR(36) PRIMARY KEY,
        firstName VARCHAR(100) NOT NULL,
        lastName VARCHAR(100) NOT NULL,
        email VARCHAR(255) NOT NULL,
        phone VARCHAR(20),
        address VARCHAR(255),
        city VARCHAR(100),
        state VARCHAR(100),
        country VARCHAR(100),
        zipCode VARCHAR(20),
        isGuest BOOLEAN DEFAULT FALSE,
        createdAt DATETIME NOT NULL,
        updatedAt DATETIME NOT NULL
      )
    `);

    // Create or update bookings table
    console.log('Creating/updating bookings table...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS bookings (
        id VARCHAR(36) PRIMARY KEY,
        bookingRef VARCHAR(20) NOT NULL,
        hotelId VARCHAR(36) NOT NULL,
        roomId VARCHAR(36) NOT NULL,
        customerId VARCHAR(36) NOT NULL,
        checkInDate DATE NOT NULL,
        checkOutDate DATE NOT NULL,
        numberOfGuests INT NOT NULL,
        totalPrice DECIMAL(10, 2) NOT NULL,
        paymentMethod VARCHAR(50),
        paymentStatus VARCHAR(20) DEFAULT 'PENDING',
        bookingStatus VARCHAR(20) NOT NULL DEFAULT 'CONFIRMED',
        specialRequests TEXT,
        createdAt DATETIME NOT NULL,
        updatedAt DATETIME NOT NULL,
        FOREIGN KEY (hotelId) REFERENCES hotels(id) ON DELETE CASCADE,
        FOREIGN KEY (roomId) REFERENCES rooms(id) ON DELETE CASCADE,
        FOREIGN KEY (customerId) REFERENCES customers(id) ON DELETE CASCADE
      )
    `);

    // Insert sample data if needed (for development)
    if (process.env.NODE_ENV === 'development') {
      console.log('Checking for sample data...');
      
      // Check if sample hotel exists
      const [hotels] = await connection.query('SELECT COUNT(*) as count FROM hotels');
      if (hotels[0].count === 0) {
        console.log('Adding sample hotel...');
        
        // Add sample hotel
        const hotelId = 'sample-hotel-id-123456789';
        await connection.query(`
          INSERT INTO hotels (
            id, name, description, address, city, state, country, 
            starRating, isActive, createdAt, updatedAt
          ) VALUES (
            ?, 'Sample Hotel', 'A beautiful sample hotel for testing', 
            '123 Sample St', 'Sample City', 'Sample State', 'Sample Country',
            4, TRUE, NOW(), NOW()
          )
        `, [hotelId]);
        
        // Add sample room
        console.log('Adding sample room...');
        const roomId = 'sample-room-id-123456789';
        await connection.query(`
          INSERT INTO rooms (
            id, hotelId, name, description, roomType, 
            pricePerNight, capacity, numBeds, bedType,
            isActive, createdAt, updatedAt
          ) VALUES (
            ?, ?, 'Deluxe Room', 'A beautiful deluxe room', 'DELUXE',
            100.00, 2, 1, 'King',
            TRUE, NOW(), NOW()
          )
        `, [roomId, hotelId]);
      } else {
        console.log('Sample data already exists.');
      }
    }

    // Commit transaction
    await connection.commit();
    console.log('Transaction committed.');
    console.log('Database migration completed successfully!');

  } catch (err) {
    // Rollback transaction on error
    await connection.rollback();
    console.error('Migration failed, rolled back changes:', err.message);
    process.exit(1);
  } finally {
    // Close connection
    if (connection) {
      await connection.end();
      console.log('Database connection closed.');
    }
  }
}

main().catch(err => {
  console.error('Unhandled error:', err);
  process.exit(1);
}); 