import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';


export async function POST(req: NextRequest) {
  try {
    // Create a response
    const response = NextResponse.json({
      success: true,
      message: 'Impersonation ended successfully',
      redirectPath: '/admin/dashboard'
    });
    
    // Delete the impersonation cookie
    response.cookies.delete('impersonation_token');
    
    return response;
  } catch (error) {
    console.error('Error ending impersonation:', error);
    return NextResponse.json(
      { error: 'Failed to end impersonation' },
      { status: 500 }
    );
  }
} 
