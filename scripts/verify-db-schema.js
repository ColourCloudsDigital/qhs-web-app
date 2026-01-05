#!/usr/bin/env node

// Script to verify database schema and check for column name inconsistencies
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const dbConfig = {
  host: process.env.DATABASE_HOST || 'localhost',
  user: process.env.DATABASE_USER || 'root',
  password: process.env.DATABASE_PASSWORD || '',
  database: process.env.DATABASE_NAME || 'qaras',
};

async function verifySchema() {
  console.log('🔍 Verifying database schema and column names...\n');

  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database');

    // Check bookings table columns
    console.log('\n📋 Checking bookings table columns:');
    const [bookingsColumns] = await connection.query('DESCRIBE bookings');
    console.log('Bookings table columns:');
    bookingsColumns.forEach(col => {
      console.log(`  - ${col.Field}: ${col.Type}`);
    });

    // Check if the problematic columns exist
    const camelCaseColumns = ['hotelId', 'customerId', 'paymentStatus'];
    const snakeCaseColumns = ['hotel_id', 'customer_id', 'payment_status'];

    console.log('\n🔎 Checking for column name issues:');

    const bookingsColumnNames = bookingsColumns.map(col => col.Field);

    camelCaseColumns.forEach(col => {
      if (bookingsColumnNames.includes(col)) {
        console.log(`✅ ${col} exists (camelCase)`);
      } else {
        console.log(`❌ ${col} missing (camelCase)`);
      }
    });

    snakeCaseColumns.forEach(col => {
      if (bookingsColumnNames.includes(col)) {
        console.log(`⚠️  ${col} exists (snake_case) - this should not be used`);
      } else {
        console.log(`✅ ${col} correctly missing (snake_case)`);
      }
    });

    // Test a sample query to make sure it works
    console.log('\n🧪 Testing booking query with correct column names:');
    try {
      const [testResult] = await connection.query(
        `SELECT b.id, b.hotelId, b.customerId, b.paymentStatus, b.status,
                h.name as hotelName, c.firstName, c.lastName
         FROM bookings b
         LEFT JOIN hotels h ON b.hotelId = h.id
         LEFT JOIN customers c ON b.customerId = c.id
         LIMIT 1`
      );

      if (testResult.length > 0) {
        console.log('✅ Query with camelCase column names works');
        console.log('Sample result:', testResult[0]);
      } else {
        console.log('⚠️  No bookings found in database');
      }
    } catch (queryError) {
      console.log('❌ Query failed:', queryError.message);
    }

    // Test the problematic query to confirm it fails
    console.log('\n🚫 Testing problematic query with snake_case:');
    try {
      await connection.query(
        `SELECT b.*, b.payment_status AS paymentStatus, h.id AS hotelId, h.name AS hotelName, h.vendor_id AS vendorId,
               c.id AS customerId, u.name AS customerName, u.email AS customerEmail
        FROM bookings b
        LEFT JOIN hotels h ON b.hotel_id = h.id
        LEFT JOIN customers c ON b.customer_id = c.id
        LEFT JOIN users u ON c.user_id = u.id
        WHERE b.id = 'test-id'`
      );
      console.log('❌ Snake_case query unexpectedly succeeded');
    } catch (queryError) {
      console.log('✅ Snake_case query correctly failed:', queryError.message);
    }

  } catch (error) {
    console.error('❌ Database error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Database connection closed');
    }
  }
}

verifySchema().catch(console.error);
