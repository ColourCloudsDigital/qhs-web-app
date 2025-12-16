import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';

/**
 * GET /api/public/legal
 * Public route to fetch all published legal documents
 */
export async function GET(request: NextRequest) {
  try {
    // Fetch published legal documents
    const [documents] = await pool.query<RowDataPacket[]>(`
      SELECT id, type, title, slug, version, effectiveDate, updatedAt 
      FROM legal_documents 
      WHERE isPublished = 1
      ORDER BY type ASC
    `);
    
    return NextResponse.json(documents || []);
  } catch (error) {
    console.error('Error fetching legal documents:', error);
    return NextResponse.json(
      { error: 'Failed to fetch legal documents' },
      { status: 500 }
    );
  }
} 