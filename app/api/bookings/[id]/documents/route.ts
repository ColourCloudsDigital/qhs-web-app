import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import pool from '@/lib/db';

// GET handler to fetch documents for a booking
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const bookingId = params.id;
    
    // Verify access rights based on user role
    if (session.user.role === 'VENDOR') {
      // Check if the booking belongs to one of the vendor's hotels
      const [vendorBooking] = await pool.query(`
        SELECT b.id 
        FROM bookings b
        JOIN hotels h ON b.hotelId = h.id
        JOIN vendors v ON h.vendorId = v.id
        JOIN users u ON v.userId = u.id
        WHERE b.id = ? AND u.id = ?
      `, [bookingId, session.user.id]);
      
      if ((vendorBooking as any[]).length === 0) {
        return NextResponse.json(
          { error: 'You do not have access to this booking' },
          { status: 403 }
        );
      }
    } else if (session.user.role === 'CUSTOMER') {
      // Check if the booking belongs to the customer
      const [customerBooking] = await pool.query(`
        SELECT b.id 
        FROM bookings b
        JOIN customers c ON b.customerId = c.id
        JOIN users u ON c.userId = u.id
        WHERE b.id = ? AND u.id = ?
      `, [bookingId, session.user.id]);
      
      if ((customerBooking as any[]).length === 0) {
        return NextResponse.json(
          { error: 'You do not have access to this booking' },
          { status: 403 }
        );
      }
    } else if (session.user.role === 'STAFF') {
      // Check if the booking belongs to the hotel the staff is assigned to
      const [staffBooking] = await pool.query(`
        SELECT b.id 
        FROM bookings b
        JOIN staff s ON b.hotelId = s.hotelId
        JOIN users u ON s.userId = u.id
        WHERE b.id = ? AND u.id = ?
      `, [bookingId, session.user.id]);
      
      if ((staffBooking as any[]).length === 0) {
        return NextResponse.json(
          { error: 'You do not have access to this booking' },
          { status: 403 }
        );
      }
    }
    // Super admins and admins have access to all bookings
    
    // Fetch documents for the booking
    const [documents] = await pool.query(`
      SELECT d.id, d.name, d.type, d.url, d.createdAt, d.updatedAt
      FROM booking_documents d
      WHERE d.bookingId = ?
      ORDER BY d.createdAt DESC
    `, [bookingId]);
    
    return NextResponse.json({ documents });
  } catch (error) {
    console.error('Error fetching booking documents:', error);
    return NextResponse.json(
      { error: 'Failed to fetch booking documents' },
      { status: 500 }
    );
  }
}

// POST handler to add a document to a booking
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const bookingId = params.id;
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const name = formData.get('name') as string || file.name;
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }
    
    // Verify access rights based on user role
    if (session.user.role === 'VENDOR') {
      // Check if the booking belongs to one of the vendor's hotels
      const [vendorBooking] = await pool.query(`
        SELECT b.id 
        FROM bookings b
        JOIN hotels h ON b.hotelId = h.id
        JOIN vendors v ON h.vendorId = v.id
        JOIN users u ON v.userId = u.id
        WHERE b.id = ? AND u.id = ?
      `, [bookingId, session.user.id]);
      
      if ((vendorBooking as any[]).length === 0) {
        return NextResponse.json(
          { error: 'You do not have access to this booking' },
          { status: 403 }
        );
      }
    } else if (session.user.role === 'CUSTOMER') {
      // Check if the booking belongs to the customer
      const [customerBooking] = await pool.query(`
        SELECT b.id 
        FROM bookings b
        JOIN customers c ON b.customerId = c.id
        JOIN users u ON c.userId = u.id
        WHERE b.id = ? AND u.id = ?
      `, [bookingId, session.user.id]);
      
      if ((customerBooking as any[]).length === 0) {
        return NextResponse.json(
          { error: 'You do not have access to this booking' },
          { status: 403 }
        );
      }
    } else if (session.user.role === 'STAFF') {
      // Check if the booking belongs to the hotel the staff is assigned to
      const [staffBooking] = await pool.query(`
        SELECT b.id 
        FROM bookings b
        JOIN staff s ON b.hotelId = s.hotelId
        JOIN users u ON s.userId = u.id
        WHERE b.id = ? AND u.id = ?
      `, [bookingId, session.user.id]);
      
      if ((staffBooking as any[]).length === 0) {
        return NextResponse.json(
          { error: 'You do not have access to this booking' },
          { status: 403 }
        );
      }
    }
    // Super admins and admins have access to all bookings
    
    // In a real implementation, you would:
    // 1. Upload the file to a storage service (S3, GCS, etc.)
    // 2. Get the URL of the uploaded file
    // 3. Store the file metadata in the database
    
    // For now, we'll simulate this process
    const fileType = file.type;
    const fileUrl = `/api/uploads/${bookingId}/${file.name}`; // This would be a real URL in production
    
    // Insert document record into database
    const [result] = await pool.query(`
      INSERT INTO booking_documents (bookingId, name, type, url, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, NOW(), NOW())
    `, [bookingId, name, fileType, fileUrl]);
    
    const insertId = (result as any).insertId;
    
    // Return the new document
    const [documents] = await pool.query(`
      SELECT id, name, type, url, createdAt, updatedAt
      FROM booking_documents
      WHERE id = ?
    `, [insertId]);
    
    return NextResponse.json({ document: (documents as any[])[0] });
  } catch (error) {
    console.error('Error adding booking document:', error);
    return NextResponse.json(
      { error: 'Failed to add booking document' },
      { status: 500 }
    );
  }
}

// DELETE handler to remove a document
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const bookingId = params.id;
    const searchParams = request.nextUrl.searchParams;
    const documentId = searchParams.get('documentId');
    
    if (!documentId) {
      return NextResponse.json(
        { error: 'No document ID provided' },
        { status: 400 }
      );
    }
    
    // Verify access rights based on user role
    if (session.user.role === 'VENDOR') {
      // Check if the booking belongs to one of the vendor's hotels
      const [vendorBooking] = await pool.query(`
        SELECT b.id 
        FROM bookings b
        JOIN hotels h ON b.hotelId = h.id
        JOIN vendors v ON h.vendorId = v.id
        JOIN users u ON v.userId = u.id
        WHERE b.id = ? AND u.id = ?
      `, [bookingId, session.user.id]);
      
      if ((vendorBooking as any[]).length === 0) {
        return NextResponse.json(
          { error: 'You do not have access to this booking' },
          { status: 403 }
        );
      }
    } else if (session.user.role === 'CUSTOMER') {
      // Check if the booking belongs to the customer
      const [customerBooking] = await pool.query(`
        SELECT b.id 
        FROM bookings b
        JOIN customers c ON b.customerId = c.id
        JOIN users u ON c.userId = u.id
        WHERE b.id = ? AND u.id = ?
      `, [bookingId, session.user.id]);
      
      if ((customerBooking as any[]).length === 0) {
        return NextResponse.json(
          { error: 'You do not have access to this booking' },
          { status: 403 }
        );
      }
    } else if (session.user.role === 'STAFF') {
      // Check if the booking belongs to the hotel the staff is assigned to
      const [staffBooking] = await pool.query(`
        SELECT b.id 
        FROM bookings b
        JOIN staff s ON b.hotelId = s.hotelId
        JOIN users u ON s.userId = u.id
        WHERE b.id = ? AND u.id = ?
      `, [bookingId, session.user.id]);
      
      if ((staffBooking as any[]).length === 0) {
        return NextResponse.json(
          { error: 'You do not have access to this booking' },
          { status: 403 }
        );
      }
    }
    // Super admins and admins have access to all bookings
    
    // In a real implementation, you would:
    // 1. Delete the file from the storage service
    // 2. Delete the file metadata from the database
    
    // For now, we'll simulate deleting from the database
    await pool.query(`
      DELETE FROM booking_documents
      WHERE id = ? AND bookingId = ?
    `, [documentId, bookingId]);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting booking document:', error);
    return NextResponse.json(
      { error: 'Failed to delete booking document' },
      { status: 500 }
    );
  }
} 