import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import { wifiService } from '@/lib/services/wifi.service';

// Schema for updating a WiFi credential
const updateCredentialSchema = z.object({
  username: z.string().optional(),
  password: z.string().optional(),
  validFrom: z.string().transform(str => new Date(str)).optional(),
  validTo: z.string().transform(str => new Date(str)).optional(),
  isActive: z.boolean().optional(),
});

// GET: Get a single WiFi credential by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  
  // Check authentication
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const { id } = params;
  
  try {
    // Get credential by ID
    const credential = await wifiService.getCredentialById(id);
    
    return NextResponse.json(credential);
  } catch (error) {
    console.error(`Error fetching WiFi credential with ID ${id}:`, error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch WiFi credential' },
      { status: 500 }
    );
  }
}

// PUT: Update a WiFi credential
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  
  // Check authentication
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const { id } = params;
  const body = await request.json();
  
  try {
    // Validate update data
    const validatedData = updateCredentialSchema.parse(body);
    
    // Update credential
    const updatedCredential = await wifiService.updateCredential(id, validatedData);
    
    return NextResponse.json(updatedCredential);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    
    console.error(`Error updating WiFi credential with ID ${id}:`, error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update WiFi credential' },
      { status: 500 }
    );
  }
}

// DELETE: Delete a WiFi credential
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  
  // Check authentication
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const { id } = params;
  
  try {
    // Delete credential
    const result = await wifiService.deleteCredential(id);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error(`Error deleting WiFi credential with ID ${id}:`, error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete WiFi credential' },
      { status: 500 }
    );
  }
}