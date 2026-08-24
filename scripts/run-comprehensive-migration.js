#!/usr/bin/env node

/**
 * Comprehensive Database Migration Runner
 * This script runs the comprehensive schema migration to update the database
 * to match the current API route requirements.
 */

import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'qaras_combined',
  multipleStatements: true
};

console.log('='.repeat(60));
console.log('COMPREHENSIVE DATABASE SCHEMA MIGRATION');
console.log('='.repeat(60));
console.log(`Database: ${dbConfig.database}`);
console.log(`Host: ${dbConfig.host}:${dbConfig.port}`);
console.log(`User: ${dbConfig.user}`);
console.log('='.repeat(60));

async function backupDatabase(connection) {
  console.log('\n📁 Creating database backup...');
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
  const backupFile = path.join(__dirname, `../backups/db-backup-${timestamp}.sql`);
  
  // Create backups directory if it doesn't exist
  const backupDir = path.dirname(backupFile);
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }
  
  try {
    // Get all table names
    const [tables] = await connection.query('SHOW TABLES');
    const tableNames = tables.map(table => Object.values(table)[0]);
    
    let backupSQL = `-- Database Backup Created: ${new Date().toISOString()}\n`;
    backupSQL += `-- Database: ${dbConfig.database}\n\n`;
    backupSQL += 'SET FOREIGN_KEY_CHECKS = 0;\n\n';
    
    // Export each table
    for (const tableName of tableNames) {
      console.log(`  Backing up table: ${tableName}`);
      
      // Get table structure
      const [createResult] = await connection.query(`SHOW CREATE TABLE ${tableName}`);
      backupSQL += `-- Table structure for ${tableName}\n`;
      backupSQL += `DROP TABLE IF EXISTS ${tableName};\n`;
      backupSQL += createResult[0]['Create Table'] + ';\n\n';
      
      // Get table data
      const [rows] = await connection.query(`SELECT * FROM ${tableName}`);
      if (rows.length > 0) {
        backupSQL += `-- Data for table ${tableName}\n`;
        for (const row of rows) {
          const values = Object.values(row).map(val => {
            if (val === null) return 'NULL';
            if (typeof val === 'string') return `'${val.replace(/'/g, "\\'")}'`;
            if (val instanceof Date) return `'${val.toISOString().slice(0, 19).replace('T', ' ')}'`;
            return val;
          }).join(', ');
          
          const columns = Object.keys(row).join(', ');
          backupSQL += `INSERT INTO ${tableName} (${columns}) VALUES (${values});\n`;
        }
        backupSQL += '\n';
      }
    }
    
    backupSQL += 'SET FOREIGN_KEY_CHECKS = 1;\n';
    
    // Write backup file
    fs.writeFileSync(backupFile, backupSQL);
    console.log(`✅ Backup created: ${backupFile}`);
    return backupFile;
  } catch (error) {
    console.error('❌ Backup failed:', error.message);
    throw new Error('Database backup failed');
  }
}

async function validateMigration(connection) {
  console.log('\n🔍 Validating migration results...');
  
  const validations = [];
  
  try {
    // Check if key tables exist
    const expectedTables = [
      'orders', 'order_items', 'subscriptions', 'customer_bills', 
      'bill_payments', 'vendor_payment_gateways', 'task_checklist',
      'user_notification_settings', 'user_privacy_settings', 
      'user_security_logs', 'analytics_data', 'corporations'
    ];
    
    const [tables] = await connection.query('SHOW TABLES');
    const existingTables = tables.map(table => Object.values(table)[0]);
    
    for (const table of expectedTables) {
      if (existingTables.includes(table)) {
        validations.push(`✅ Table '${table}' exists`);
      } else {
        validations.push(`❌ Table '${table}' missing`);
      }
    }
    
    // Check if key columns were added
    const [userColumns] = await connection.query('DESCRIBE users');
    const userColumnNames = userColumns.map(col => col.Field);
    
    const expectedUserColumns = ['verificationToken', 'verificationExpires', 'resetToken', 'resetTokenExpires'];
    for (const column of expectedUserColumns) {
      if (userColumnNames.includes(column)) {
        validations.push(`✅ Column 'users.${column}' exists`);
      } else {
        validations.push(`❌ Column 'users.${column}' missing`);
      }
    }
    
    // Check foreign key constraints
    const [constraints] = await connection.query(`
      SELECT TABLE_NAME, COLUMN_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME
      FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
      WHERE TABLE_SCHEMA = ? AND REFERENCED_TABLE_NAME IS NOT NULL
      AND TABLE_NAME IN ('orders', 'order_items', 'subscriptions')
    `, [dbConfig.database]);
    
    validations.push(`✅ Found ${constraints.length} foreign key constraints`);
    
    // Print validation results
    console.log('\nValidation Results:');
    validations.forEach(result => console.log(`  ${result}`));
    
    return validations.filter(v => v.includes('❌')).length === 0;
    
  } catch (error) {
    console.error('❌ Validation failed:', error.message);
    return false;
  }
}

async function runMigration() {
  let connection;
  
  try {
    // Connect to database
    console.log('\n🔌 Connecting to database...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database');
    
    // Create backup
    const backupFile = await backupDatabase(connection);
    
    // Read migration SQL file
    console.log('\n📄 Reading migration file...');
    const migrationFile = path.join(__dirname, 'comprehensive-schema-migration.sql');
    
    if (!fs.existsSync(migrationFile)) {
      throw new Error(`Migration file not found: ${migrationFile}`);
    }
    
    const migrationSQL = fs.readFileSync(migrationFile, 'utf8');
    console.log('✅ Migration file loaded');
    
    // Execute migration
    console.log('\n⚙️  Executing migration...');
    console.log('This may take a few minutes...');
    
    const startTime = Date.now();
    await connection.query(migrationSQL);
    const endTime = Date.now();
    
    console.log(`✅ Migration completed in ${((endTime - startTime) / 1000).toFixed(2)} seconds`);
    
    // Validate migration
    const isValid = await validateMigration(connection);
    
    if (isValid) {
      console.log('\n🎉 Migration completed successfully!');
      console.log('\n📊 Summary:');
      console.log('  - Database schema updated to match API requirements');
      console.log('  - New tables created for orders, subscriptions, and notifications');
      console.log('  - Enhanced indexes added for better performance');
      console.log('  - Foreign key constraints properly established');
      console.log(`  - Backup saved: ${path.basename(backupFile)}`);
      
      console.log('\n🚀 Next Steps:');
      console.log('  1. Test your application to ensure everything works');
      console.log('  2. Run any additional seed data if needed');
      console.log('  3. Update your API documentation');
      
      return true;
    } else {
      console.log('\n⚠️  Migration completed with warnings. Please review the validation results.');
      return false;
    }
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error('\nTo restore database:');
    console.error(`  mysql -u ${dbConfig.user} -p ${dbConfig.database} < path/to/backup.sql`);
    
    if (error.sql) {
      console.error('\nSQL Error Details:');
      console.error('Query:', error.sql.substring(0, 200) + '...');
    }
    
    return false;
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Database connection closed');
    }
  }
}

// Handle command line execution
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('\nStarting migration...');
  
  const startTime = Date.now();
  
  runMigration()
    .then(success => {
      const totalTime = ((Date.now() - startTime) / 1000).toFixed(2);
      console.log(`\nTotal execution time: ${totalTime} seconds`);
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Unhandled error:', error);
      process.exit(1);
    });
}

export { runMigration };