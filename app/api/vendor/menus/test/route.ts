import { NextRequest, NextResponse } from 'next/server';

// Simple test endpoint to verify API routing is working
export async function GET(req: NextRequest) {
  return NextResponse.json({ 
    success: true, 
    message: 'Test endpoint is working correctly',
    timestamp: new Date().toISOString()
  });
} 