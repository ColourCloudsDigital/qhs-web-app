// Script to update admin password
import mysql from 'mysql2/promise';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

dotenv.config();

async function updateAdminPassword() {
  const newPassword = 'passwords';
  const saltRounds = 10;
  
  try {
    // Hash the new password
    console.log('Hashing password...');
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
    console.log('New password hash:', hashedPassword);
    
    // Connect to the database
    const pool = mysql.createPool({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 3306,
      socketPath: process.env.DB_SOCKET
    });
    
    // Update the admin user's password
    console.log('Updating admin password...');
    const [result] = await pool.query(
      'UPDATE users SET password = ? WHERE email = ?',
      [hashedPassword, 'admin@qarashotels.com.ng']
    );
    
    console.log('Update result:', result);
    console.log(`Rows affected: ${result.affectedRows}`);
    
    // Verify the update
    const [rows] = await pool.query(
      'SELECT * FROM users WHERE email = ?',
      ['admin@qarashotels.com.ng']
    );
    
    if (rows.length > 0) {
      console.log('Admin password updated successfully!');
      console.log('New password hash in DB:', rows[0].password);
    } else {
      console.log('Admin user not found after update!');
    }
    
    await pool.end();
  } catch (err) {
    console.error('Error updating admin password:', err);
  }
}

updateAdminPassword(); 