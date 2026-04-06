import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// Singleton pool — prevents new pool instances on Next.js hot reloads in dev mode
const globalForPool = globalThis;

if (!globalForPool._mysqlPool) {
  globalForPool._mysqlPool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 3306,
    socketPath: process.env.DB_SOCKET,
    waitForConnections: true,
    connectionLimit: 10,       // max simultaneous connections from this pool
    queueLimit: 50,            // queue up to 50 requests before rejecting
    connectTimeout: 10000,     // 10s to establish a connection
    idleTimeout: 60000,        // release idle connections after 60s
    maxIdle: 5,                // keep at most 5 idle connections open
    debug: process.env.NODE_ENV !== 'production' && process.env.SQL_DEBUG === 'true',
    supportBigNumbers: true,
    bigNumberStrings: true,
  });

  // Wrap query with error logging
  const pool = globalForPool._mysqlPool;
  const originalQuery = pool.query.bind(pool);
  pool.query = async function (sql, params) {
    try {
      return await originalQuery(sql, params);
    } catch (error) {
      console.error('SQL query error:', error.message);
      console.error('Failed query:', sql);
      console.error('Query parameters:', JSON.stringify(params));
      throw error;
    }
  };

  // Verify connectivity once on startup
  pool.getConnection()
    .then(conn => conn.release())
    .catch(err => console.error('Error connecting to database:', err));
}

const pool = globalForPool._mysqlPool;

export default pool;