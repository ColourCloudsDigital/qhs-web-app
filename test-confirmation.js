import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function testBookingConfirmation() {
  let connection;
  try {
    console.log('Testing database connection for booking confirmation...');

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

    // Check if bookings table exists and has data
    const [bookings] = await connection.query('SELECT id, status, customerId FROM bookings LIMIT 5');
    console.log('Sample bookings found:', bookings.length);
    if (bookings.length > 0) {
      console.log('First booking ID:', bookings[0].id);
      console.log('First booking status:', bookings[0].status);
      console.log('First booking customerId:', bookings[0].customerId);
    }

    // Test the confirmation query with the first booking if it exists
    if (bookings.length > 0) {
      const bookingId = bookings[0].id;
      console.log(`\nTesting confirmation query for booking ID: ${bookingId}`);

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
        JOIN users u ON c.userId = u.id
        JOIN hotels h ON b.hotelId = h.id
        JOIN rooms r ON b.roomId = r.id
        WHERE b.id = ?`,
        [bookingId]
      );

      if (confirmationResult.length > 0) {
        console.log('Confirmation query successful!');
        console.log('Booking details:', {
          id: confirmationResult[0].id,
          status: confirmationResult[0].status,
          totalAmount: confirmationResult[0].totalAmount,
          customerEmail: confirmationResult[0].email,
          hotelName: confirmationResult[0].hotelName
        });
      } else {
        console.log('Confirmation query returned no results');
      }
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

testBookingConfirmation();
