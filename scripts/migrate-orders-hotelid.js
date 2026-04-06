/**
 * Migration: add hotelId to orders table + convert date columns to DATETIME
 *
 * Run with:  node scripts/migrate-orders-hotelid.js
 */

import pool from '../lib/db.js';

async function migrate() {
  const connection = await pool.getConnection();
  try {
    console.log('Running orders migration...');

    // Add hotelId column only if it doesn't already exist
    const [cols] = await connection.query(`
      SELECT COLUMN_NAME FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'orders'
        AND COLUMN_NAME = 'hotelId'
    `);
    if (cols.length === 0) {
      await connection.query(`
        ALTER TABLE orders ADD COLUMN hotelId VARCHAR(255) NULL AFTER vendorId
      `);
      console.log('✓ hotelId column added to orders');
    } else {
      console.log('✓ hotelId column already exists, skipping');
    }

    // Convert date columns to DATETIME
    await connection.query(`
      ALTER TABLE orders
        MODIFY COLUMN createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        MODIFY COLUMN updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    `);
    await connection.query(`
      ALTER TABLE order_items
        MODIFY COLUMN createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    `);
    console.log('✓ Date columns converted to DATETIME');

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
