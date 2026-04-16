/**
 * Migration: add CANCELLATION_REQUESTED to bookings.status ENUM
 * Run with: node scripts/migrate-booking-cancellation-status.js
 */

import pool from '../lib/db.js';

async function migrate() {
  const connection = await pool.getConnection();
  try {
    console.log('Running bookings status ENUM migration...');

    // Check current column definition
    const [cols] = await connection.query(`
      SELECT COLUMN_TYPE FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'bookings'
        AND COLUMN_NAME = 'status'
    `);

    if (cols.length === 0) {
      console.error('bookings.status column not found');
      process.exit(1);
    }

    const columnType = cols[0].COLUMN_TYPE;
    console.log('Current column type:', columnType);

    if (columnType.includes('CANCELLATION_REQUESTED')) {
      console.log('✓ CANCELLATION_REQUESTED already in ENUM, skipping');
      return;
    }

    // Check if it's an ENUM or VARCHAR
    if (columnType.startsWith('enum(')) {
      // Parse existing enum values and add the new one
      const existing = columnType
        .replace(/^enum\(/, '')
        .replace(/\)$/, '')
        .split(',')
        .map(v => v.trim());

      const newValues = [...existing, "'CANCELLATION_REQUESTED'"].join(',');

      await connection.query(`
        ALTER TABLE bookings
          MODIFY COLUMN status ENUM(${newValues}) NOT NULL DEFAULT 'PENDING'
      `);
      console.log('✓ CANCELLATION_REQUESTED added to bookings.status ENUM');
    } else {
      // It's a VARCHAR — no change needed, any string value is accepted
      console.log('✓ bookings.status is VARCHAR — no ENUM change needed');
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
