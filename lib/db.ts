import mysql from 'mysql2/promise';

// Create MySQL connection pool with optimized settings
const pool = mysql.createPool({
  host: process.env.DATABASE_HOST || 'localhost',
  user: process.env.DATABASE_USER || 'root',
  password: process.env.DATABASE_PASSWORD || '',
  database: process.env.DATABASE_NAME || 'qaras_hotels',
  waitForConnections: true,
  connectionLimit: 5, // Reduced from 10 to prevent too many connections
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000, // 10 seconds
  idleTimeout: 60000 // Close idle connections after 60 seconds
});

export default pool; 