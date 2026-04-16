/**
 * Migration: vendor_payment_gateways table
 * Run with: node scripts/migrate-vendor-payment-gateways.js
 */
import pool from '../lib/db.js';

async function migrate() {
  const connection = await pool.getConnection();
  try {
    console.log('Running vendor payment gateways migration...');

    const [tables] = await connection.query(`
      SELECT TABLE_NAME FROM information_schema.TABLES
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'vendor_payment_gateways'
    `);

    if (tables.length === 0) {
      await connection.query(`
        CREATE TABLE vendor_payment_gateways (
          id VARCHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL PRIMARY KEY,
          vendorId VARCHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
          provider VARCHAR(30) NOT NULL COMMENT 'paystack | flutterwave | opay',
          publicKey VARCHAR(500) DEFAULT NULL,
          secretKey VARCHAR(500) DEFAULT NULL,
          encryptionKey VARCHAR(500) DEFAULT NULL,
          webhookSecret VARCHAR(500) DEFAULT NULL,
          isActive TINYINT(1) NOT NULL DEFAULT 0,
          isDefault TINYINT(1) NOT NULL DEFAULT 0,
          isTest TINYINT(1) NOT NULL DEFAULT 1,
          merchantId VARCHAR(255) DEFAULT NULL COMMENT 'OPay merchant ID',
          createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          UNIQUE KEY uq_vendor_provider (vendorId, provider),
          INDEX idx_vpg_vendor (vendorId)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
      `);
      console.log('Created vendor_payment_gateways table');
    } else {
      console.log('vendor_payment_gateways already exists, skipping');
    }

    // Add cardReference column to orders if missing
    const [orderCols] = await connection.query(`
      SELECT COLUMN_NAME FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'orders'
        AND COLUMN_NAME IN ('cardReference', 'billId', 'customerId', 'transferReference')
    `);
    const existing = orderCols.map((c) => c.COLUMN_NAME);

    if (!existing.includes('cardReference')) {
      await connection.query(`ALTER TABLE orders ADD COLUMN cardReference VARCHAR(255) DEFAULT NULL AFTER paymentStatus`);
      console.log('Added cardReference to orders');
    }
    if (!existing.includes('transferReference')) {
      await connection.query(`ALTER TABLE orders ADD COLUMN transferReference VARCHAR(255) DEFAULT NULL AFTER cardReference`);
      console.log('Added transferReference to orders');
    }
    if (!existing.includes('billId')) {
      await connection.query(`ALTER TABLE orders ADD COLUMN billId VARCHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL AFTER transferReference`);
      console.log('Added billId to orders');
    }
    if (!existing.includes('customerId')) {
      await connection.query(`ALTER TABLE orders ADD COLUMN customerId VARCHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL AFTER billId`);
      console.log('Added customerId to orders');
    }

    console.log('Migration complete.');
  } catch (err) {
    console.error('Migration failed:', err.message);
    process.exit(1);
  } finally {
    connection.release();
    process.exit(0);
  }
}

migrate();
