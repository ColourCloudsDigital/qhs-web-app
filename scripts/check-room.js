import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config();

// Create MySQL connection pool
const pool = mysql.createPool({
  host: process.env.DATABASE_HOST || 'localhost',
  user: process.env.DATABASE_USER || 'root',
  password: process.env.DATABASE_PASSWORD || '',
  database: process.env.DATABASE_NAME || 'qh_app',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

async function checkRoom(roomId) {
  try {
    console.log(`Checking if room ID ${roomId} exists...`);
    
    // Try to find the room
    const [roomResults] = await pool.query(
      `SELECT id, hotelId, roomTypeId, name, status, type 
       FROM rooms 
       WHERE id = ?`,
      [roomId]
    );
    
    if (roomResults.length === 0) {
      console.log(`Room ID ${roomId} does NOT exist in the database.`);
      return;
    }
    
    const room = roomResults[0];
    console.log(`Room ID ${roomId} exists!`);
    console.log('Room details:', room);
    
    // Get hotel info
    const [hotelResults] = await pool.query(
      `SELECT h.id, h.name, h.vendorId, v.name as vendorName
       FROM hotels h
       LEFT JOIN vendors v ON h.vendorId = v.id
       WHERE h.id = ?`,
      [room.hotelId]
    );
    
    if (hotelResults.length > 0) {
      console.log('Hotel details:', hotelResults[0]);
    } else {
      console.log(`Associated hotel ID ${room.hotelId} not found!`);
    }
    
    // Check if room type exists
    if (room.roomTypeId) {
      const [roomTypeResults] = await pool.query(
        `SELECT id, name, basePrice
         FROM room_types
         WHERE id = ?`,
        [room.roomTypeId]
      );
      
      if (roomTypeResults.length > 0) {
        console.log('Room type details:', roomTypeResults[0]);
      } else {
        console.log(`Associated room type ID ${room.roomTypeId} not found!`);
      }
    } else {
      console.log('Room has no room type ID assigned.');
    }
    
  } catch (error) {
    console.error('Error checking room:', error);
  } finally {
    await pool.end();
  }
}

// Check room ID 27 (the one failing) and another ID for comparison
const roomId = process.argv[2] || '27';
checkRoom(roomId); 