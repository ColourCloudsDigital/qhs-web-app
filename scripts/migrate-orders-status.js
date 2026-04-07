/**
 * Migration: add status column to orders table
 * Run with: node scripts/migrate-orders-status.js
 */
import pool from '../lib/db.js';

async function migrate() {
  const connection = await pool.getConnection();
  try {
    console.log('Running orders status migration...');

    const [cols] = await connection.query(`
      SELECT COLUMN_NAME FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'orders' AND COLUMN_NAME = 'status'
    `);

    if (cols.length === 0) {
      await connection.query(`
        ALTER TABLE orders
          ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'placed'
          AFTER paymentMethod
      `);
      console.log('✓ status column added to orders');
    } else {
      console.log('✓ status column already exists, skipping');
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
