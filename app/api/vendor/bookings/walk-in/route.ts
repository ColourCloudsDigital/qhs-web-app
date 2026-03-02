import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import pool from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import { BookingStatus, PaymentStatus, PaymentMethod, UserRole, NotificationType } from '@/lib/types/enums';
import { emailService } from '@/lib/services/email.service';
import * as bcrypt from 'bcrypt';
import NotificationService from '@/lib/services/notification.service';
import { getUserVendorId } from '@/lib/utils/vendor';

export const dynamic = 'force-dynamic';


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
      roomUnitId, // Changed from roomId to roomUnitId
      customerId,
      guestFirstName, // Changed from guestName to separate fields
      guestLastName,
      guestEmail,
      guestPhone,
      guestNationality,
      guestIdType,
      guestIdNumber,
      checkInDate,
      checkOutDate,
      numberOfGuests,
      specialRequests,
      paymentMethod,
      totalAmount,
      amountPaid,
      depositAmount,
      discountAmount = 0,
      taxAmount = 0
    } = body;
    
    // Validate required fields
    if (!hotelId || !roomUnitId || !checkInDate || !checkOutDate || !paymentMethod || !totalAmount) {
      console.log('[API] Missing required fields');
      return NextResponse.json(
        { error: 'Missing required fields', details: { hotelId, roomUnitId, checkInDate, checkOutDate, paymentMethod, totalAmount } },
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
    
    // Verify room unit exists and get room details
    const [roomUnitRows] = await pool.query(
      `SELECT ru.*, r.* FROM room_units ru 
       JOIN rooms r ON ru.roomId = r.id 
       WHERE ru.id = ? AND r.hotelId = ?`,
      [roomUnitId, hotelId]
    );
    
    const roomUnits = roomUnitRows as any[];
    if (roomUnits.length === 0) {
      console.log('[API] Room unit not found or does not belong to this hotel');
      return NextResponse.json(
        { error: 'Room unit not found or does not belong to this hotel' },
        { status: 404 }
      );
    }
    
    const roomUnit = roomUnits[0];
    const room = {
      id: roomUnit.roomId,
      pricePerNight: roomUnit.pricePerNight
    };
    
    // Check if the room unit is available
    if (roomUnit.status !== 'available') {
      console.log('[API] Room unit is not available, status:', roomUnit.status);
      return NextResponse.json(
        { error: 'Room unit is not available' },
        { status: 400 }
      );
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
    
    // Use provided customerId if available, otherwise create new customer
    let finalCustomerId = customerId;
    
    if (!finalCustomerId) {
      // Create customer entry if needed
      finalCustomerId = uuidv4();
      
      try {
        // Try to find customer by name and contact details
        const [existingCustomers] = await pool.query(
          `SELECT c.id FROM customers c 
           WHERE (c.firstName = ? OR CONCAT(c.firstName, ' ', c.lastName) = ?) AND c.phone = ? AND c.hotelId = ?`,
          [guestFirstName || '', `${guestFirstName || ''} ${guestLastName || ''}`.trim(), guestPhone || '', hotelId]
        );
        
        if ((existingCustomers as any[]).length > 0) {
          finalCustomerId = (existingCustomers as any[])[0].id;
          console.log(`[API] Found existing customer: ${finalCustomerId}`);
        } else {
          // Create new customer
          const userId = uuidv4();
          const firstName = guestFirstName || '';
          const lastName = guestLastName || '';
          const fullName = `${firstName} ${lastName}`.trim();
          
          console.log('[API] Creating new user and customer');
          
          // Create user if email is provided
          if (guestEmail) {
            await pool.query(
              `INSERT INTO users (id, name, firstName, lastName, email, password, role) 
               VALUES (?, ?, ?, ?, ?, ?, ?)`,
              [
                userId, 
                fullName, 
                firstName,
                lastName || null,
                guestEmail, 
                'NOT_SET', // Password will be set when user registers
                UserRole.CUSTOMER
              ]
            );
          }
          
          // Create customer
          await pool.query(
            `INSERT INTO customers (id, firstName, lastName, userId, hotelId, phone, address, nationality, idType, idNumber) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              finalCustomerId, 
              firstName, 
              lastName || null, 
              guestEmail ? userId : null, 
              hotelId, 
              guestPhone || '', 
              '', 
              guestNationality || null,
              guestIdType || null,
              guestIdNumber || null
            ]
          );
          
          console.log(`[API] Created new customer with ID: ${finalCustomerId}`);
        }
      } catch (error) {
        console.error('[API] Error creating/finding customer:', error);
        return NextResponse.json(
          { error: 'Failed to create customer record' },
          { status: 500 }
        );
      }
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
            id,
            hotelId,
            roomUnitId,
            customerId,
            checkInDate,
            checkOutDate,
            numberOfGuests,
            totalAmount,
            status,
            paymentStatus,
            specialRequests,
            createdAt,
            updatedAt
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            bookingId,
            hotelId,
            roomUnitId,
            finalCustomerId,
            checkInDateObj,
            checkOutDateObj,
            numberOfGuests || 1,
            calculatedTotalAmount,
            BookingStatus.CONFIRMED,
            PaymentStatus.COMPLETED,
            specialRequests || null,
            now,
            now
          ]
        );
        
        console.log(`[API] Created booking with ID: ${bookingId}`);
        
        // Create payment record
        const paymentId = uuidv4();
        await connection.query(
          `INSERT INTO payments (
            id,
            bookingId,
            amount,
            paymentMethod,
            status,
            createdAt,
            updatedAt
          ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            paymentId,
            bookingId,
            amountPaid || calculatedTotalAmount,
            paymentMethod,
            PaymentStatus.COMPLETED,
            now,
            now
          ]
        );
        
        console.log(`[API] Created payment record with ID: ${bookingId}`);
        
        // Update room unit status
        await connection.query(
          `UPDATE room_units SET status = 'occupied', currentBookingId = ? WHERE id = ?`,
          [bookingId, roomUnitId]
        );
        
        console.log(`[API] Updated room unit status to occupied: ${roomUnitId}`);
        
        // Send confirmation email if we have customer email
        if (guestEmail) {
          try {
            await emailService.sendBookingConfirmation({
              to: guestEmail,
              guestName: `${guestFirstName} ${guestLastName}`.trim(),
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
        
        // Create notification for new booking
        try {
          const customerName = `${guestFirstName} ${guestLastName || ''}`.trim();
          await NotificationService.notifyBookingCreated(
            session.user.id,
            bookingId,
            customerName,
            hotelRows[0].name,
            roomUnit.roomNumber,
            session.user.id
          );
          
          // Also notify hotel staff if this is a vendor booking
          if (session.user.role === UserRole.VENDOR) {
            const hotelStaff = await NotificationService.getHotelStaff(hotelId);
            if (hotelStaff.length > 0) {
              await NotificationService.createBulkNotifications(
                hotelStaff,
                {
                  title: 'New Walk-in Booking',
                  content: `New walk-in booking created for ${customerName} in room ${roomUnit.roomNumber}`,
                  type: NotificationType.BOOKING,
                  senderId: session.user.id,
                  metadata: {
                    bookingId,
                    action: 'created',
                    entityType: 'booking'
                  }
                }
              );
            }
          }
        } catch (notificationError) {
          console.error('[API] Failed to create booking notification:', notificationError);
          // Don't fail the booking if notification fails
        }
        
        // Return success response
        return NextResponse.json({
          success: true,
          bookingId,
          message: 'Walk-in booking created successfully',
          booking: {
            id: bookingId,
            hotelId,
            roomUnitId: roomUnitId,
            customerId: finalCustomerId,
            checkInDate: checkInDateObj,
            checkOutDate: checkOutDateObj,
            numberOfGuests: numberOfGuests || 1,
            totalAmount: calculatedTotalAmount,
            status: BookingStatus.CONFIRMED,
            paymentStatus: PaymentStatus.COMPLETED,
            amountPaid: amountPaid || calculatedTotalAmount
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
