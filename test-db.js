import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function testDatabase() {
  try {
    // Try connecting to the configured database
    const pool = mysql.createPool({
      host: process.env.DATABASE_HOST || 'localhost',
      user: process.env.DATABASE_USER || 'root',
      password: process.env.DATABASE_PASSWORD || '',
      database: process.env.DATABASE_NAME || 'qaras_hotels',
      waitForConnections: true,
      connectionLimit: 1
    });

    console.log('Testing database connection...');

    // Check if we can connect and see tables
    const [tables] = await pool.query('SHOW TABLES');
    console.log('Tables found:', tables.length);
    console.log('Table names:', tables.map(r => Object.values(r)[0]));

    // Check bookings table specifically
    if (tables.some(t => Object.values(t)[0] === 'bookings')) {
      const [bookings] = await pool.query('SELECT COUNT(*) as count FROM bookings');
      console.log('Bookings count:', bookings[0].count);

      // Get a sample booking if any exist
      if (bookings[0].count > 0) {
        const [sample] = await pool.query('SELECT id, customerId, status, createdAt FROM bookings LIMIT 1');
        console.log('Sample booking:', sample[0]);
      }
    } else {
      console.log('Bookings table does not exist!');
    }

    await pool.end();
  } catch (error) {
    console.error('Database connection failed:', error.message);

    // Try connecting without database to see what databases exist
    try {
      const pool = mysql.createPool({
        host: process.env.DATABASE_HOST || 'localhost',
        user: process.env.DATABASE_USER || 'root',
        password: process.env.DATABASE_PASSWORD || '',
        waitForConnections: true,
        connectionLimit: 1
      });

      console.log('Checking available databases...');
      const [databases] = await pool.query('SHOW DATABASES');
      console.log('Available databases:', databases.map(d => d.Database));
      await pool.end();
    } catch (dbError) {
      console.error('Cannot list databases:', dbError.message);
    }
  }
}

testDatabase();
