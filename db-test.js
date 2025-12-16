// Test script to check database connectivity
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function testConnection() {
  console.log('DB Connection Settings:');
  console.log('Host:', process.env.DB_HOST);
  console.log('User:', process.env.DB_USER);
  console.log('Password:', '***' + (process.env.DB_PASSWORD || '').slice(-3));
  console.log('Database:', process.env.DB_NAME);
  console.log('Port:', process.env.DB_PORT);
  console.log('Socket Path:', process.env.DB_SOCKET);

  const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 3306,
    socketPath: process.env.DB_SOCKET,
    waitForConnections: true,
    connectionLimit: 1
  });

  try {
    console.log('Connecting to database...');
    const conn = await pool.getConnection();
    console.log('Connected successfully!');
    
    // Try to get admin user
    const [rows] = await conn.query(
      `SELECT id, name, email, password FROM users WHERE email = ?`, 
      ['admin@qarashotels.com.ng']
    );
    
    console.log('Query executed successfully!');
    console.log('Found users:', rows.length);
    
    if (rows.length > 0) {
      console.log('Admin user exists:');
      console.log('ID:', rows[0].id);
      console.log('Name:', rows[0].name);
      console.log('Email:', rows[0].email);
      console.log('Password Hash (first 10 chars):', rows[0].password.substring(0, 10) + '...');
    } else {
      console.log('Admin user not found!');
    }
    
    conn.release();
  } catch (err) {
    console.error('Error connecting to database:', err);
  } finally {
    await pool.end();
  }
}

testConnection(); 