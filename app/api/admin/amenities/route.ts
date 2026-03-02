import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import pool from '@/lib/db';
import { UserRole } from '@/lib/types/enums';

export const dynamic = 'force-dynamic';


export async function GET(req: NextRequest) {
  try {
    console.log('[API AMENITIES] GET request received');
    const session = await getServerSession(authOptions);
    
    // Check authentication
    if (!session) {
      console.log('[API AMENITIES] Unauthorized: No session found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    console.log(`[API AMENITIES] User role: ${session.user.role}`);
    // Everyone should be able to fetch amenities
    
    // Get query parameters
    const searchParams = req.nextUrl.searchParams;
    const type = searchParams.get('type') || searchParams.get('category'); // Support both for backward compatibility
    console.log(`[API AMENITIES] Requested type: ${type || 'all'}`);
    
    // Build the query
    try {
      let amenities: any[] = [];
      if (type) {
        // Using pool for MySQL query
        try {
          const [rows]: [any[], any] = await pool.query(
            `SELECT * FROM amenities WHERE type = ? ORDER BY name ASC`,
            [type]
          );
          amenities = rows;
        } catch (e: any) {
          // Handle table not found error gracefully
          console.error('[API AMENITIES] SQL query error:', e);
          if (e.message && e.message.includes("doesn't exist")) {
            console.log('[API AMENITIES] Amenities table not found, returning empty array');
            amenities = [];
          } else {
            throw e; // Re-throw other errors
          }
        }
      } else {
        // Get all amenities
        try {
          const [rows]: [any[], any] = await pool.query(
            `SELECT * FROM amenities ORDER BY name ASC`
          );
          amenities = rows;
        } catch (e: any) {
          // Handle table not found error gracefully
          console.error('[API AMENITIES] SQL query error:', e);
          if (e.message && e.message.includes("doesn't exist")) {
            console.log('[API AMENITIES] Amenities table not found, returning empty array');
            amenities = [];
          } else {
            throw e; // Re-throw other errors
          }
        }
      }
      
      // Add category for backward compatibility
      if (Array.isArray(amenities)) {
        amenities = amenities.map(amenity => ({
          ...amenity,
          category: amenity.type
        }));
      }
      
      const totalCount = Array.isArray(amenities) ? amenities.length : 0;
      console.log(`[API AMENITIES] Found ${totalCount} amenities`);
      return NextResponse.json({ amenities });
    } catch (dbError) {
      console.error('[API AMENITIES] Database error:', dbError);
      throw new Error('Database query failed');
    }
  } catch (error) {
    console.error('[API AMENITIES] Error fetching amenities:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch amenities' },
      { status: 500 }
    );
  }
}
