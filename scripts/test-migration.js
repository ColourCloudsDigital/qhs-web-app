#!/usr/bin/env node

/**
 * Migration Test Script
 * Tests the database schema after migration to ensure all tables and relationships work correctly
 */

import mysql from 'mysql2/promise';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';

dotenv.config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'qaras_combined'
};

console.log('='.repeat(50));
console.log('DATABASE MIGRATION TEST');
console.log('='.repeat(50));

async function testDatabaseSchema() {
  let connection;
  
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database');
    
    const tests = [];
    
    // Test 1: Check critical tables exist
    console.log('\n🧪 Testing table existence...');
    const requiredTables = [
      'users', 'vendors', 'hotels', 'rooms', 'room_units', 'bookings',
      'customers', 'orders', 'order_items', 'subscriptions', 
      'customer_bills', 'bill_payments', 'vendor_payment_gateways',
      'notifications', 'user_notification_settings'
    ];
    
    const [tables] = await connection.query('SHOW TABLES');
    const existingTables = tables.map(table => Object.values(table)[0]);
    
    for (const table of requiredTables) {
      if (existingTables.includes(table)) {
        tests.push({ test: `Table ${table}`, status: 'PASS' });
      } else {
        tests.push({ test: `Table ${table}`, status: 'FAIL' });
      }
    }
    
    // Test 2: Check foreign key relationships
    console.log('🔗 Testing foreign key relationships...');
    
    try {
      // Test orders -> vendors relationship
      const [orderCheck] = await connection.query(`
        SELECT COUNT(*) as count 
        FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
        WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'orders' 
        AND COLUMN_NAME = 'vendorId' AND REFERENCED_TABLE_NAME = 'vendors'
      `, [dbConfig.database]);
      
      tests.push({ 
        test: 'orders.vendorId -> vendors.id FK', 
        status: orderCheck[0].count > 0 ? 'PASS' : 'FAIL' 
      });
      
      // Test bookings -> room_units relationship  
      const [bookingCheck] = await connection.query(`
        SELECT COUNT(*) as count 
        FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
        WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'bookings' 
        AND COLUMN_NAME = 'roomUnitId' AND REFERENCED_TABLE_NAME = 'room_units'
      `, [dbConfig.database]);
      
      tests.push({ 
        test: 'bookings.roomUnitId -> room_units.id FK', 
        status: bookingCheck[0].count > 0 ? 'PASS' : 'FAIL' 
      });
      
    } catch (error) {
      tests.push({ test: 'Foreign Key Relationships', status: 'FAIL', error: error.message });
    }
    
    // Test 3: Check enhanced user columns
    console.log('👤 Testing user table enhancements...');
    
    try {
      const [userCols] = await connection.query('DESCRIBE users');
      const columnNames = userCols.map(col => col.Field);
      
      const expectedColumns = ['verificationToken', 'resetToken', 'emailVerified'];
      for (const col of expectedColumns) {
        tests.push({ 
          test: `users.${col} column`, 
          status: columnNames.includes(col) ? 'PASS' : 'FAIL' 
        });
      }
    } catch (error) {
      tests.push({ test: 'User Table Columns', status: 'FAIL', error: error.message });
    }
    
    // Test 4: Test data insertion (orders workflow)
    console.log('💾 Testing data insertion...');
    
    try {
      // Create a test order (if we have vendors and hotels)
      const [vendorCheck] = await connection.query('SELECT id FROM vendors LIMIT 1');
      const [hotelCheck] = await connection.query('SELECT id FROM hotels LIMIT 1');
      
      if (vendorCheck.length > 0 && hotelCheck.length > 0) {
        const testOrderId = uuidv4();
        const vendorId = vendorCheck[0].id;
        const hotelId = hotelCheck[0].id;
        
        await connection.query(`
          INSERT INTO orders (id, vendorId, hotelId, totalAmount, status) 
          VALUES (?, ?, ?, 100.00, 'placed')
        `, [testOrderId, vendorId, hotelId]);
        
        // Clean up test data
        await connection.query('DELETE FROM orders WHERE id = ?', [testOrderId]);
        
        tests.push({ test: 'Order Insert/Delete', status: 'PASS' });
      } else {
        tests.push({ test: 'Order Insert/Delete', status: 'SKIP', note: 'No test data available' });
      }
    } catch (error) {
      tests.push({ test: 'Order Insert/Delete', status: 'FAIL', error: error.message });
    }
    
    // Test 5: Check indexes
    console.log('📊 Testing database indexes...');
    
    try {
      const [indexes] = await connection.query(`
        SELECT TABLE_NAME, INDEX_NAME, COLUMN_NAME
        FROM INFORMATION_SCHEMA.STATISTICS 
        WHERE TABLE_SCHEMA = ? AND INDEX_NAME != 'PRIMARY'
        AND TABLE_NAME IN ('orders', 'bookings', 'users')
      `, [dbConfig.database]);
      
      tests.push({ 
        test: 'Database Indexes', 
        status: indexes.length > 5 ? 'PASS' : 'FAIL',
        note: `Found ${indexes.length} indexes`
      });
    } catch (error) {
      tests.push({ test: 'Database Indexes', status: 'FAIL', error: error.message });
    }
    
    // Display results
    console.log('\n' + '='.repeat(50));
    console.log('TEST RESULTS');
    console.log('='.repeat(50));
    
    let passed = 0;
    let failed = 0;
    let skipped = 0;
    
    tests.forEach(test => {
      const status = test.status === 'PASS' ? '✅ PASS' : 
                    test.status === 'FAIL' ? '❌ FAIL' : 
                    '⏭️  SKIP';
      
      console.log(`${status} - ${test.test}`);
      if (test.note) console.log(`    Note: ${test.note}`);
      if (test.error) console.log(`    Error: ${test.error}`);
      
      if (test.status === 'PASS') passed++;
      else if (test.status === 'FAIL') failed++;
      else skipped++;
    });
    
    console.log('\n' + '-'.repeat(30));
    console.log(`Total: ${tests.length} tests`);
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`⏭️  Skipped: ${skipped}`);
    
    const success = failed === 0;
    console.log('\n' + '='.repeat(50));
    console.log(success ? '🎉 ALL TESTS PASSED!' : '⚠️  SOME TESTS FAILED!');
    console.log('='.repeat(50));
    
    if (success) {
      console.log('\nYour database is ready for the QHS application! 🚀');
      console.log('\nRecommended next steps:');
      console.log('1. Start your application: npm run dev');
      console.log('2. Test user registration and login');
      console.log('3. Test booking creation');
      console.log('4. Test order management');
    } else {
      console.log('\nPlease review and fix the failed tests before proceeding.');
    }
    
    return success;
    
  } catch (error) {
    console.error('❌ Test suite failed:', error.message);
    return false;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Run tests if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testDatabaseSchema()
    .then(success => process.exit(success ? 0 : 1))
    .catch(error => {
      console.error('Unhandled error:', error);
      process.exit(1);
    });
}

export { testDatabaseSchema };