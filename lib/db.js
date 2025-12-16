import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config(); // Load environment variables from .env file

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 3306, // Default MySQL port
  socketPath: process.env.DB_SOCKET, // Use socket path if provided
  waitForConnections: true,
  connectionLimit: 10, // Adjust as needed
  queueLimit: 0,
  // Adding debug options
  debug: process.env.NODE_ENV !== 'production' && process.env.SQL_DEBUG === 'true',
  supportBigNumbers: true,
  bigNumberStrings: true
});

// Add custom query method with better error handling
const originalQuery = pool.query.bind(pool);
pool.query = async function (sql, params) {
  try {
    const result = await originalQuery(sql, params);
    return result;
  } catch (error) {
    console.error('SQL query error:', error.message);
    console.error('Failed query:', sql);
    console.error('Query parameters:', JSON.stringify(params));
    throw error;
  }
};

// Test the connection but only log on error
pool.getConnection()
  .then(connection => {
    connection.release();
  })
  .catch(err => {
    console.error('Error connecting to database:', err);
    // Consider throwing the error or exiting if the connection is critical
    // process.exit(1); 
  });

export default pool; 