import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

/**
 * GET /api/legal/[slug]
 * Public route to fetch a specific published legal document by slug
 */
export async function GET(request: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const [rows] = await pool.query(
      `SELECT id, type, title, slug, content, version, effectiveDate, updatedAt 
       FROM legal_documents 
       WHERE slug = ? AND isPublished = true`,
      [params.slug]
    );

    const document = (rows as any[])[0];

    if (!document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(document);
  } catch (error) {
    console.error('Error fetching legal document:', error);
    return NextResponse.json(
      { error: 'Failed to fetch legal document' },
      { status: 500 }
    );
  }
}