/**
 * Migration: convert facility_tasks date columns from DATE to DATETIME
 *
 * Run with:  node scripts/migrate-facility-tasks-datetime.js
 */

import pool from '../lib/db.js';

async function migrate() {
  const connection = await pool.getConnection();
  try {
    console.log('Running facility_tasks datetime migration...');

    // due_date: DATE → DATETIME (keep existing dates, time defaults to 00:00:00)
    const [dueDateCols] = await connection.query(`
      SELECT COLUMN_NAME, DATA_TYPE FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'facility_tasks'
        AND COLUMN_NAME = 'due_date'
    `);

    if (dueDateCols.length > 0 && dueDateCols[0].DATA_TYPE === 'date') {
      await connection.query(`
        ALTER TABLE facility_tasks
          MODIFY COLUMN due_date DATETIME NULL
      `);
      console.log('✓ due_date converted to DATETIME');
    } else {
      console.log('✓ due_date already DATETIME or not found, skipping');
    }

    // created_at
    const [createdCols] = await connection.query(`
      SELECT DATA_TYPE FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'facility_tasks'
        AND COLUMN_NAME = 'created_at'
    `);

    if (createdCols.length > 0 && createdCols[0].DATA_TYPE === 'date') {
      await connection.query(`
        ALTER TABLE facility_tasks
          MODIFY COLUMN created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      `);
      console.log('✓ created_at converted to DATETIME');
    } else {
      console.log('✓ created_at already DATETIME or not found, skipping');
    }

    // updated_at
    const [updatedCols] = await connection.query(`
      SELECT DATA_TYPE FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'facility_tasks'
        AND COLUMN_NAME = 'updated_at'
    `);

    if (updatedCols.length > 0 && updatedCols[0].DATA_TYPE === 'date') {
      await connection.query(`
        ALTER TABLE facility_tasks
          MODIFY COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      `);
      console.log('✓ updated_at converted to DATETIME');
    } else {
      console.log('✓ updated_at already DATETIME or not found, skipping');
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
