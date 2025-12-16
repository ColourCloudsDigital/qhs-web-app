import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

/**
 * GET /api/legal
 * Public route to fetch all published legal documents
 */
export async function GET(request: NextRequest) {
  try {
    const documents = await prisma.legalDocument.findMany({
      where: {
        isPublished: true, // Only return published documents
      },
      orderBy: {
        type: 'asc', // Order by document type
      },
      select: {
        id: true,
        type: true,
        title: true,
        slug: true,
        version: true,
        effectiveDate: true,
        updatedAt: true,
        // Don't include content to reduce payload size
      },
    });

    return NextResponse.json(documents);
  } catch (error) {
    console.error('Error fetching legal documents:', error);
    return NextResponse.json(
      { error: 'Failed to fetch legal documents' },
      { status: 500 }
    );
  }
}