import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import { wifiService } from '@/lib/services/wifi.service';

// Schema for WiFi configuration
const wifiConfigSchema = z.object({
  networkName: z.string().min(1, 'Network name is required'),
  isEnabled: z.boolean(),
  bandwidthLimit: z.number().optional(),
  usernameFormat: z.string().optional(),
  passwordFormat: z.string().optional(),
  termsAndConditions: z.string().optional(),
  landingPageUrl: z.string().url().optional(),
  autoDeactivate: z.boolean().optional(),
});

// GET: Get WiFi configuration for a hotel
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  
  // Check authentication
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const { id: hotelId } = params;
  
  try {
    // Get WiFi configuration
    const config = await wifiService.getWiFiConfig(hotelId);
    
    return NextResponse.json(config || {});
  } catch (error) {
    console.error(`Error fetching WiFi configuration for hotel ID ${hotelId}:`, error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch WiFi configuration' },
      { status: 500 }
    );
  }
}

// PUT: Update WiFi configuration for a hotel
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  
  // Check authentication
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const { id: hotelId } = params;
  const body = await request.json();
  
  try {
    // Validate configuration data
    const validatedData = wifiConfigSchema.parse(body);
    
    // Update WiFi configuration
    const updatedConfig = await wifiService.updateWiFiConfig(hotelId, validatedData);
    
    return NextResponse.json(updatedConfig);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    
    console.error(`Error updating WiFi configuration for hotel ID ${hotelId}:`, error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update WiFi configuration' },
      { status: 500 }
    );
  }
}