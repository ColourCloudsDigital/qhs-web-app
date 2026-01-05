import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function testConfirmationQuery() {
  let connection;
  try {
    console.log('Testing the fixed confirmation query...');

    // Create connection
    connection = await mysql.createConnection({
      host: process.env.DATABASE_HOST || 'localhost',
      user: process.env.DATABASE_USER || 'root',
      password: process.env.DATABASE_PASSWORD || '',
      database: process.env.DATABASE_NAME || 'qaras',
      waitForConnections: true,
      connectionLimit: 1
    });

    console.log('Database connected successfully.');

    // Get the booking ID from sample data
    const bookingId = 'd89cbb4c-e1c5-492d-988f-c50eea279c6b';

    console.log(`Testing confirmation query for booking ID: ${bookingId}`);

    const [confirmationResult] = await connection.query(
      `SELECT
        b.id, b.checkInDate, b.checkOutDate,
        b.numberOfGuests, b.totalAmount, b.paymentStatus,
        b.status, b.specialRequests, b.createdAt,
        c.firstName, c.lastName, c.phone,
        u.email,
        h.name AS hotelName, h.address AS hotelAddress,
        h.city AS hotelCity, h.state AS hotelState, h.country AS hotelCountry,
        r.name AS roomName, r.roomType
      FROM bookings b
      JOIN customers c ON b.customerId = c.id
      LEFT JOIN users u ON c.userId = u.id
      JOIN hotels h ON b.hotelId = h.id
      JOIN rooms r ON b.roomId = r.id
      WHERE b.id = ?`,
      [bookingId]
    );

    if (confirmationResult.length > 0) {
      console.log('✅ Confirmation query successful!');
      const booking = confirmationResult[0];
      console.log('Booking details:');
      console.log(`- ID: ${booking.id}`);
      console.log(`- Status: ${booking.status}`);
      console.log(`- Total Amount: ${booking.totalAmount}`);
      console.log(`- Customer: ${booking.firstName} ${booking.lastName}`);
      console.log(`- Email: ${booking.email || 'NULL'}`);
      console.log(`- Phone: ${booking.phone}`);
      console.log(`- Hotel: ${booking.hotelName}`);
      console.log(`- Room: ${booking.roomName} (${booking.roomType})`);
      console.log(`- Check-in: ${booking.checkInDate}`);
      console.log(`- Check-out: ${booking.checkOutDate}`);
    } else {
      console.log('❌ Confirmation query returned no results');
    }

  } catch (error) {
    console.error('Database error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('Database connection closed.');
    }
  }
}

testConfirmationQuery();
