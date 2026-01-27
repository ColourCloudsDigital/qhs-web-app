#!/usr/bin/env node

/**
 * Test Script for Automated Checkout System
 * 
 * This script helps test the automated checkout functionality
 * by creating test bookings and verifying the checkout process.
 * 
 * Usage: node scripts/test-automated-checkout.js
 */

const pool = require('../lib/db.js');
const { automatedCheckoutService } = require('../lib/services/automated-checkout.service.js');

async function createTestBooking() {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    // Create a test booking that's already expired
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    const bookingId = 'test-' + Date.now();
    const customerId = 'test-customer-' + Date.now();
    const userId = 'test-user-' + Date.now();
    const hotelId = 'test-hotel-' + Date.now();
    const roomId = 'test-room-' + Date.now();
    const roomUnitId = 'test-room-unit-' + Date.now();
    
    // Create test user
    await connection.query(`
      INSERT INTO users (id, email, password, role, emailVerified, createdAt, updatedAt)
      VALUES (?, ?, ?, 'CUSTOMER', 1, NOW(), NOW())
    `, [userId, 'test@example.com', 'hashed-password']);
    
    // Create test customer
    await connection.query(`
      INSERT INTO customers (id, userId, firstName, lastName, phone, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, NOW(), NOW())
    `, [customerId, userId, 'Test', 'Customer', '+1234567890']);
    
    // Create test hotel
    await connection.query(`
      INSERT INTO hotels (id, name, address, city, state, country, phone, email, isActive, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, NOW(), NOW())
    `, [hotelId, 'Test Hotel', '123 Test St', 'Test City', 'Test State', 'Test Country', '+1234567890', 'hotel@test.com']);
    
    // Create test room
    await connection.query(`
      INSERT INTO rooms (id, hotelId, name, description, type, capacity, pricePerNight, status, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'available', NOW(), NOW())
    `, [roomId, hotelId, 'Test Room', 'A test room', 'standard', 2, 100.00]);
    
    // Create test room unit
    await connection.query(`
      INSERT INTO room_units (id, roomId, unitNumber, status, currentBookingId, createdAt, updatedAt)
      VALUES (?, ?, ?, 'reserved', ?, NOW(), NOW())
    `, [roomUnitId, roomId, '101', bookingId]);
    
    // Create expired test booking
    await connection.query(`
      INSERT INTO bookings (id, hotelId, roomId, customerId, checkInDate, checkOutDate, numberOfGuests, numberOfRooms, totalAmount, status, paymentStatus, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'CHECKED_IN', 'PENDING', NOW(), NOW())
    `, [bookingId, hotelId, roomId, customerId, yesterday.toISOString().split('T')[0], yesterday.toISOString().split('T')[0], 2, 1, 200.00]);
    
    await connection.commit();
    
    console.log('✅ Test booking created successfully');
    console.log(`   Booking ID: ${bookingId}`);
    console.log(`   Checkout Date: ${yesterday.toISOString().split('T')[0]} (expired)`);
    
    return { bookingId, customerId, userId, hotelId, roomId, roomUnitId };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function cleanupTestData(testData) {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    // Delete in reverse order of creation
    await connection.query('DELETE FROM bookings WHERE id = ?', [testData.bookingId]);
    await connection.query('DELETE FROM room_units WHERE id = ?', [testData.roomUnitId]);
    await connection.query('DELETE FROM rooms WHERE id = ?', [testData.roomId]);
    await connection.query('DELETE FROM hotels WHERE id = ?', [testData.hotelId]);
    await connection.query('DELETE FROM customers WHERE id = ?', [testData.customerId]);
    await connection.query('DELETE FROM users WHERE id = ?', [testData.userId]);
    
    await connection.commit();
    console.log('🧹 Test data cleaned up successfully');
  } catch (error) {
    await connection.rollback();
    console.error('❌ Failed to cleanup test data:', error);
  } finally {
    connection.release();
  }
}

async function testAutomatedCheckout() {
  console.log('🚀 Starting Automated Checkout System Test\n');
  
  let testData = null;
  
  try {
    // Step 1: Create test data
    console.log('1. Creating test booking...');
    testData = await createTestBooking();
    
    // Step 2: Get stats before processing
    console.log('\n2. Getting expired bookings stats...');
    const statsBefore = await automatedCheckoutService.getExpiredBookingsStats();
    console.log(`   Found ${statsBefore.expiredCount} expired bookings`);
    console.log(`   Room units to free: ${statsBefore.roomUnitsToFree}`);
    
    // Step 3: Process expired bookings
    console.log('\n3. Processing expired bookings...');
    const result = await automatedCheckoutService.processExpiredBookings();
    console.log(`   Processed bookings: ${result.processedBookings}`);
    console.log(`   Freed room units: ${result.freedRoomUnits}`);
    console.log(`   Errors: ${result.errors.length}`);
    
    if (result.errors.length > 0) {
      console.log('   Error details:');
      result.errors.forEach((error, index) => {
        console.log(`     ${index + 1}. ${error}`);
      });
    }
    
    // Step 4: Verify results
    console.log('\n4. Verifying results...');
    const [bookingRows] = await pool.query('SELECT status FROM bookings WHERE id = ?', [testData.bookingId]);
    const [roomUnitRows] = await pool.query('SELECT status, currentBookingId FROM room_units WHERE id = ?', [testData.roomUnitId]);
    
    if (bookingRows.length > 0) {
      const booking = bookingRows[0];
      console.log(`   Booking status: ${booking.status} ${booking.status === 'CHECKED_OUT' ? '✅' : '❌'}`);
    }
    
    if (roomUnitRows.length > 0) {
      const roomUnit = roomUnitRows[0];
      console.log(`   Room unit status: ${roomUnit.status} ${roomUnit.status === 'available' ? '✅' : '❌'}`);
      console.log(`   Current booking ID: ${roomUnit.currentBookingId || 'NULL'} ${!roomUnit.currentBookingId ? '✅' : '❌'}`);
    }
    
    // Step 5: Get stats after processing
    console.log('\n5. Getting stats after processing...');
    const statsAfter = await automatedCheckoutService.getExpiredBookingsStats();
    console.log(`   Expired bookings remaining: ${statsAfter.expiredCount}`);
    
    console.log('\n🎉 Test completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error);
  } finally {
    // Cleanup test data
    if (testData) {
      console.log('\n6. Cleaning up test data...');
      await cleanupTestData(testData);
    }
    
    // Close database connection
    await pool.end();
  }
}

// Run the test
testAutomatedCheckout();