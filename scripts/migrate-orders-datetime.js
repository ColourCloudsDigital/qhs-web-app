/**
 * Migration: alter orders and order_items date columns from DATE to DATETIME
 *
 * Run with:  node scripts/migrate-orders-datetime.js
 */

import pool from '../lib/db.js';

async function migrate() {
  const connection = await pool.getConnection();
  try {
    console.log('Running orders datetime migration...');

    await connection.query(`
      ALTER TABLE orders
        MODIFY COLUMN createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        MODIFY COLUMN updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    `);
    console.log('✓ orders table updated');

    await connection.query(`
      ALTER TABLE order_items
        MODIFY COLUMN createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    `);
    console.log('✓ order_items table updated');

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
