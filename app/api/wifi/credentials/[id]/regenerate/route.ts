import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { wifiService } from '@/lib/services/wifi.service';

// POST: Regenerate password for a WiFi credential
export async function POST(
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
    // Regenerate password
    const updatedCredential = await wifiService.regeneratePassword(id);
    
    return NextResponse.json(updatedCredential);
  } catch (error) {
    console.error(`Error regenerating password for WiFi credential with ID ${id}:`, error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to regenerate password' },
      { status: 500 }
    );
  }
}