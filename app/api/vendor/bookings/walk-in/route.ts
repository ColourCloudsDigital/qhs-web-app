import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import pool from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import { BookingStatus, PaymentStatus, PaymentMethod, UserRole } from '@/lib/types/enums';
import { emailService } from '@/lib/services/email.service';
import * as bcrypt from 'bcrypt';
import { getUserVendorId } from '@/lib/utils/vendor';

export async function POST(request: NextRequest) {
  try {
    console.log('[API] Processing walk-in booking request');
    
    // Get authenticated user
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Only vendors and staff can create walk-in bookings
    if (
      session.user.role !== UserRole.VENDOR && 
      session.user.role !== UserRole.STAFF && 
      session.user.role !== UserRole.SUPER_ADMIN
    ) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }
    
    // Get vendor id
    const { vendorId } = await getUserVendorId(session);
    if (!vendorId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Parse request body
    const body = await request.json();
    console.log('[API] Request body:', JSON.stringify(body));
    
    const { 
      hotelId, 
      roomId,
      guestName,
      guestEmail,
      guestPhone,
      checkInDate,
      checkOutDate,
      numberOfGuests,
      specialRequests,
      paymentMethod,
      totalAmount,
      depositAmount,
      discountAmount = 0,
      taxAmount = 0,
    } = body;
    
    // Validate required fields
    if (!hotelId || !roomId || !guestName || !checkInDate || !checkOutDate || !paymentMethod || !totalAmount) {
      console.log('[API] Missing required fields');
      return NextResponse.json(
        { error: 'Missing required fields', details: { hotelId, roomId, guestName, checkInDate, checkOutDate, paymentMethod, totalAmount } },
        { status: 400 }
      );
    }
    
    // Verify hotel belongs to vendor
    const [hotelRows]: any = await pool.query(
      'SELECT id FROM hotels WHERE id = ? AND vendorId = ?',
      [hotelId, vendorId]
    );
    
    if (hotelRows.length === 0) {
      console.log('[API] Hotel not found or unauthorized');
      return NextResponse.json(
        { error: 'Hotel not found or unauthorized' },
        { status: 404 }
      );
    }
    
    // Verify room exists and is available
    const [roomRows] = await pool.query(
      `SELECT r.* FROM rooms r WHERE r.id = ? AND r.hotelId = ?`,
      [roomId, hotelId]
    );
    
    const rooms = roomRows as any[];
    if (rooms.length === 0) {
      console.log('[API] Room not found or does not belong to this hotel');
      return NextResponse.json(
        { error: 'Room not found or does not belong to this hotel' },
        { status: 404 }
      );
    }
    
    const room = rooms[0];
    
    // Check if the room unit is available
    const [roomUnitRows] = await pool.query(
      `SELECT ru.* FROM room_units ru WHERE ru.id = ? AND ru.status = 'available'`,
      [roomId]
    );
    
    // If we're booking at the room unit level, ensure it's available
    if (roomUnitRows && (roomUnitRows as any[]).length === 0) {
      console.log('[API] Room unit is not available');
      // Let's check if there are any available units for this room type
      const [availableUnitRows] = await pool.query(
        `SELECT ru.* FROM room_units ru WHERE ru.roomId = ? AND ru.status = 'available' LIMIT 1`,
        [room.id]
      );
      
      if ((availableUnitRows as any[]).length === 0) {
        return NextResponse.json(
          { error: 'No available units for this room' },
          { status: 400 }
        );
      }
    }
    
    // Parse dates
    const checkInDateObj = new Date(checkInDate);
    const checkOutDateObj = new Date(checkOutDate);
    
    // Calculate total amount if not provided
    const pricePerNight = parseFloat(String(room.pricePerNight)) || 0;
    const nights = Math.ceil((checkOutDateObj.getTime() - checkInDateObj.getTime()) / (1000 * 60 * 60 * 24));
    const calculatedAmount = pricePerNight * Math.max(1, nights);
    
    const calculatedTotalAmount = calculatedAmount;
    
    console.log(`[API] Room price per night: ${pricePerNight}, Nights: ${nights}, Total: ${calculatedTotalAmount}`);
    
    // Create customer entry if needed
    let customerId = uuidv4();
    
    try {
      // Try to find customer by name and contact details
      const [existingCustomers] = await pool.query(
        `SELECT c.id FROM customers c 
         JOIN users u ON c.userId = u.id 
         WHERE u.name = ? OR c.phone = ?`,
        [guestName, guestPhone]
      );
      
      if ((existingCustomers as any[]).length > 0) {
        customerId = (existingCustomers as any[])[0].id;
        console.log(`[API] Found existing customer: ${customerId}`);
      } else {
        // Create new customer
        const userId = uuidv4();
        
        console.log('[API] Creating new user and customer');
        
        // Create user
        await pool.query(
          `INSERT INTO users (id, name, email, password, role) 
           VALUES (?, ?, ?, ?, ?)`,
          [
            userId, 
            guestName, 
            guestEmail || `guest_${Date.now()}@example.com`, 
            'NOT_A_REAL_PASSWORD', // This should be hashed in production
            UserRole.CUSTOMER
          ]
        );
        
        // Create customer
        await pool.query(
          `INSERT INTO customers (id, userId, phone, address) 
           VALUES (?, ?, ?, ?)`,
          [customerId, userId, guestPhone || '', '']
        );
        
        console.log(`[API] Created new customer with ID: ${customerId}`);
      }
    } catch (error) {
      console.error('[API] Error creating/finding customer:', error);
      return NextResponse.json(
        { error: 'Failed to create customer record' },
        { status: 500 }
      );
    }
    
    // Create booking
    const bookingId = uuidv4();
    const now = new Date();
    
    try {
      console.log('[API] Creating booking record');
      
      // Start transaction
      const connection = await pool.getConnection();
      await connection.beginTransaction();
      
      try {
        // Create booking
        await connection.query(
          `INSERT INTO bookings (
            hotelId,
            roomId,
            guestName,
            guestEmail,
            guestPhone,
            checkInDate,
            checkOutDate,
            numberOfGuests,
            specialRequests,
            status,
            totalAmount,
            depositAmount,
            discountAmount,
            taxAmount,
            bookingType,
            createdBy
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            hotelId,
            roomId,
            guestName,
            guestEmail || null,
            guestPhone || null,
            checkInDateObj,
            checkOutDateObj,
            numberOfGuests || 1,
            specialRequests || null,
            BookingStatus.CONFIRMED,
            calculatedTotalAmount,
            depositAmount || 0,
            discountAmount,
            taxAmount,
            'WALK_IN',
            session.user.id
          ]
        );
        
        console.log(`[API] Created booking with ID: ${bookingId}`);
        
        // Create payment record
        await connection.query(
          `INSERT INTO payments (
            bookingId,
            amount,
            paymentMethod,
            status,
            createdBy
          ) VALUES (?, ?, ?, ?, ?)`,
          [
            bookingId,
            depositAmount || calculatedTotalAmount,
            paymentMethod,
            PaymentStatus.COMPLETED,
            session.user.id
          ]
        );
        
        console.log(`[API] Created payment record with ID: ${bookingId}`);
        
        // Update room unit status if applicable
        if (roomUnitRows && (roomUnitRows as any[]).length > 0) {
          const roomUnit = (roomUnitRows as any[])[0];
          
          await connection.query(
            `UPDATE room_units SET status = 'occupied', currentBookingId = ? WHERE id = ?`,
            [bookingId, roomUnit.id]
          );
          
          console.log(`[API] Updated room unit status to occupied: ${roomUnit.id}`);
        } else {
          // Find an available room unit and update it
          const [availableUnitRows] = await pool.query(
            `SELECT ru.* FROM room_units ru WHERE ru.roomId = ? AND ru.status = 'available' LIMIT 1`,
            [room.id]
          );
          
          if ((availableUnitRows as any[]).length > 0) {
            const roomUnit = (availableUnitRows as any[])[0];
            
            await connection.query(
              `UPDATE room_units SET status = 'occupied', currentBookingId = ? WHERE id = ?`,
              [bookingId, roomUnit.id]
            );
            
            console.log(`[API] Updated room unit status to occupied: ${roomUnit.id}`);
          }
        }
        
        // Issue keycard if requested
        if (specialRequests && specialRequests.includes('issueKeycard')) {
          // Find an available keycard
          const availableKeycard = await pool.query(
            `SELECT kc.* FROM keycards kc WHERE kc.hotelId = ? AND kc.isActive = 1 AND kc.isConfigured = 1 AND kc.assignedToId IS NULL AND kc.staffId IS NULL`,
            [hotelId]
          );
          
          if (availableKeycard && (availableKeycard as any[]).length > 0) {
            const keycard = (availableKeycard as any[])[0];
            
            await connection.query(
              `UPDATE keycards SET assignedToId = ?, validFrom = ?, validTo = ? WHERE id = ?`,
              [bookingId, checkInDateObj, checkOutDateObj, keycard.id]
            );
            
            console.log(`[API] Updated keycard status to assigned: ${keycard.id}`);
          }
        }
        
        // Send confirmation email if we have customer email
        if (guestEmail) {
          try {
            await emailService.sendBookingConfirmation({
              to: guestEmail,
              guestName: guestName,
              bookingDetails: {
                id: bookingId,
                checkInDate: checkInDateObj,
                checkOutDate: checkOutDateObj,
                totalAmount: calculatedTotalAmount
              },
              hotelDetails: {
                name: hotelRows[0].name
              }
            });
          } catch (error) {
            console.error('Error sending confirmation email:', error);
            // Don't fail the booking creation if email fails
          }
        }
        
        // Commit transaction
        await connection.commit();
        
        // Return success response
        return NextResponse.json({
          success: true,
          bookingId,
          message: 'Walk-in booking created successfully',
          booking: {
            id: bookingId,
            hotelId,
            roomId: room.id,
            customerId,
            checkInDate: checkInDateObj,
            checkOutDate: checkOutDateObj,
            numberOfGuests: numberOfGuests || 1,
            totalAmount: calculatedTotalAmount,
            status: BookingStatus.CONFIRMED,
            paymentStatus: PaymentStatus.COMPLETED,
            amountPaid: depositAmount || calculatedTotalAmount
          }
        });
      } catch (error) {
        // Rollback transaction on error
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error('[API] Error creating booking:', error);
      return NextResponse.json(
        { error: 'Failed to create walk-in booking', details: error },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('[API] Unexpected error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred', details: error },
      { status: 500 }
    );
  }
}

// Helper function to calculate total amount
function calculateTotalAmount(pricePerNight: number, checkIn: Date, checkOut: Date): number {
  const nights = Math.max(
    1, 
    Math.ceil(
      (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)
    )
  );
  
  return pricePerNight * nights;
}

// Helper function to generate a random password
function generateRandomPassword(length = 12): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()-_=+';
  let password = '';
  
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * chars.length);
    password += chars[randomIndex];
  }
  
  return password;
}