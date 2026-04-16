/**
 * Migration: Add corporate customer support and billing tables
 * Run with: node scripts/migrate-corporate-customers.js
 */
import pool from '../lib/db.js';
import { randomUUID } from 'crypto';

async function migrate() {
  const connection = await pool.getConnection();
  try {
    console.log('Running corporate customers migration...');

    // 1. Add customerType and corporationId to customers table
    const [cols] = await connection.query(`
      SELECT COLUMN_NAME FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'customers'
        AND COLUMN_NAME IN ('customerType','corporationId','companyName','contactPerson','taxId')
    `);
    const existing = cols.map(c => c.COLUMN_NAME);

    if (!existing.includes('customerType')) {
      await connection.query(`ALTER TABLE customers ADD COLUMN customerType VARCHAR(20) NOT NULL DEFAULT 'individual' AFTER idNumber`);
      console.log('Added customerType column');
    }
    if (!existing.includes('corporationId')) {
      await connection.query(`ALTER TABLE customers ADD COLUMN corporationId VARCHAR(36) DEFAULT NULL AFTER customerType`);
      console.log('Added corporationId column');
    }
    if (!existing.includes('companyName')) {
      await connection.query(`ALTER TABLE customers ADD COLUMN companyName VARCHAR(255) DEFAULT NULL AFTER corporationId`);
      console.log('Added companyName column');
    }
    if (!existing.includes('contactPerson')) {
      await connection.query(`ALTER TABLE customers ADD COLUMN contactPerson VARCHAR(255) DEFAULT NULL AFTER companyName`);
      console.log('Added contactPerson column');
    }
    if (!existing.includes('taxId')) {
      await connection.query(`ALTER TABLE customers ADD COLUMN taxId VARCHAR(100) DEFAULT NULL AFTER contactPerson`);
      console.log('Added taxId column');
    }

    // 2. Create corporations table
    const [tables] = await connection.query(`
      SELECT TABLE_NAME FROM information_schema.TABLES
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'corporations'
    `);
    if (tables.length === 0) {
      await connection.query(`
        CREATE TABLE corporations (
          id VARCHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL PRIMARY KEY,
          hotelId VARCHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
          vendorId VARCHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
          name VARCHAR(255) NOT NULL,
          contactPerson VARCHAR(255) DEFAULT NULL,
          email VARCHAR(255) DEFAULT NULL,
          phone VARCHAR(50) DEFAULT NULL,
          address TEXT DEFAULT NULL,
          taxId VARCHAR(100) DEFAULT NULL,
          billType VARCHAR(30) DEFAULT NULL COMMENT 'hotel_only | hotel_and_orders | none',
          status VARCHAR(20) NOT NULL DEFAULT 'active',
          createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_corp_hotel (hotelId),
          FOREIGN KEY (hotelId) REFERENCES hotels(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
      `);
      console.log('Created corporations table');
    }

    // 3. Create customer_bills table
    const [billTables] = await connection.query(`
      SELECT TABLE_NAME FROM information_schema.TABLES
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'customer_bills'
    `);
    if (billTables.length === 0) {
      await connection.query(`
        CREATE TABLE customer_bills (
          id VARCHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL PRIMARY KEY,
          customerId VARCHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT 'individual customer',
          corporationId VARCHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT 'corporate customer',
          hotelId VARCHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
          billType VARCHAR(30) NOT NULL DEFAULT 'hotel_only' COMMENT 'hotel_only | hotel_and_orders',
          isActive TINYINT(1) NOT NULL DEFAULT 1,
          totalAmount DECIMAL(15,2) NOT NULL DEFAULT 0.00,
          paidAmount DECIMAL(15,2) NOT NULL DEFAULT 0.00,
          notes TEXT DEFAULT NULL,
          createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_bill_hotel (hotelId),
          FOREIGN KEY (hotelId) REFERENCES hotels(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
      `);
      console.log('Created customer_bills table');
    }

    // 4. Create bill_payments linking table
    const [bpTables] = await connection.query(`
      SELECT TABLE_NAME FROM information_schema.TABLES
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'bill_payments'
    `);
    if (bpTables.length === 0) {
      await connection.query(`
        CREATE TABLE bill_payments (
          id VARCHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL PRIMARY KEY,
          billId VARCHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
          paymentId VARCHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT 'links to payments table',
          bookingId VARCHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
          orderId VARCHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
          amount DECIMAL(15,2) NOT NULL DEFAULT 0.00,
          paymentType VARCHAR(20) NOT NULL DEFAULT 'booking' COMMENT 'booking | order',
          createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_bp_bill (billId),
          FOREIGN KEY (billId) REFERENCES customer_bills(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
      `);
      console.log('Created bill_payments table');
    }

    console.log('Migration complete.');
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  } finally {
    connection.release();
    process.exit(0);
  }
}

migrate();
