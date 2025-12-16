import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import { wifiService } from '@/lib/services/wifi.service';

// GET: Get all WiFi credentials for a hotel
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  // Check authentication
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // Extract query parameters
  const searchParams = request.nextUrl.searchParams;
  const hotelId = searchParams.get('hotelId');
  const page = searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1;
  const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 10;
  const search = searchParams.get('search') || undefined;
  const isActive = searchParams.get('isActive') 
    ? searchParams.get('isActive') === 'true' 
    : undefined;
  const bookingId = searchParams.get('bookingId') || undefined;
  const roomId = searchParams.get('roomId') || undefined;
  
  // Validate hotel ID
  if (!hotelId) {
    return NextResponse.json({ error: 'Hotel ID is required' }, { status: 400 });
  }
  
  try {
    // Get credentials with pagination
    const result = await wifiService.getCredentials(hotelId, {
      page,
      limit,
      search,
      isActive,
      bookingId,
      roomId,
    });
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching WiFi credentials:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch WiFi credentials' },
      { status: 500 }
    );
  }
}

// POST: Create a new WiFi credential or bulk credentials
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  // Check authentication
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const body = await request.json();
  
  // Check if this is a bulk creation request
  const isBulkCreate = body.quantity !== undefined;
  
  try {
    if (isBulkCreate) {
      // Validate bulk creation data
      const validatedData = createBulkCredentialsSchema.parse(body);
      
      // Create bulk credentials
      const credentials = await wifiService.createBulkCredentials({
        hotelId: validatedData.hotelId,
        quantity: validatedData.quantity,
        validFrom: validatedData.validFrom,
        validTo: validatedData.validTo,
        isActive: validatedData.isActive,
        prefix: validatedData.prefix,
      });
      
      return NextResponse.json(credentials);
    } else {
      // Validate single credential data
      const validatedData = createCredentialSchema.parse(body);
      
      // Create credential
      const credential = await wifiService.createCredential({
        hotelId: validatedData.hotelId,
        bookingId: validatedData.bookingId,
        roomId: validatedData.roomId,
        username: validatedData.username,
        password: validatedData.password,
        validFrom: validatedData.validFrom,
        validTo: validatedData.validTo,
        isActive: validatedData.isActive,
      });
      
      return NextResponse.json(credential);
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    
    console.error('Error creating WiFi credential:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create WiFi credential' },
      { status: 500 }
    );
  }
}

// Schema for creating a new WiFi credential
const createCredentialSchema = z.object({
  hotelId: z.string().uuid(),
  bookingId: z.string().uuid().optional(),
  roomId: z.string().uuid().optional(),
  username: z.string().optional(),
  password: z.string().optional(),
  validFrom: z.string().transform(str => new Date(str)),
  validTo: z.string().transform(str => new Date(str)),
  isActive: z.boolean().optional(),
});

// Schema for creating bulk WiFi credentials
const createBulkCredentialsSchema = z.object({
  hotelId: z.string().uuid(),
  quantity: z.number().int().min(1).max(100),
  validFrom: z.string().transform(str => new Date(str)),
  validTo: z.string().transform(str => new Date(str)),
  isActive: z.boolean().optional(),
  prefix: z.string().optional(),
});