import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import pool from '@/lib/db';
import { z } from 'zod';

export const dynamic = 'force-dynamic';


// Validation schema for legal documents
const legalDocumentSchema = z.object({
  type: z.enum(['PRIVACY_POLICY', 'TERMS_OF_SERVICE', 'COOKIE_POLICY', 'REFUND_POLICY', 'USER_AGREEMENT']),
  title: z.string().min(1, 'Title is required'),
  slug: z.string().min(1, 'Slug is required'),
  content: z.string().min(1, 'Content is required'),
  version: z.string(),
  isPublished: z.boolean(),
  effectiveDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: 'Effective date must be a valid date',
  }),
});

/**
 * GET /api/admin/settings/legal
 * Fetch all legal documents
 */
export async function GET(request: NextRequest) {
  try {
    // Get legal documents from database
    const [documents] = await pool.query(`
      SELECT * FROM legal_documents
    `);
    
    return NextResponse.json(documents);
  } catch (error) {
    console.error('Error fetching legal documents:', error);
    return NextResponse.json(
      { error: 'Failed to fetch legal documents' }, 
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/settings/legal
 * Create a new legal document
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // Check if user is authenticated and is a super admin
    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized access' }, 
        { status: 401 }
      );
    }
    
    const data = await request.json();
    
    // Validate required fields
    if (!data.documentType || !data.content) {
      return NextResponse.json(
        { error: 'Document type and content are required' }, 
        { status: 400 }
      );
    }
    
    // Check if document with this type already exists
    const [existingDoc] = await pool.query(`
      SELECT * FROM legal_documents WHERE documentType = ?
    `, [data.documentType]);
    
    if (existingDoc && (existingDoc as any[]).length > 0) {
      // Update existing document
      const docId = (existingDoc as any[])[0].id;
      
      await pool.query(`
        UPDATE legal_documents SET
          content = ?,
          version = ?,
          effectiveDate = ?,
          lastUpdated = NOW()
        WHERE id = ?
      `, [
        data.content,
        data.version || '1.0',
        data.effectiveDate || new Date(),
        docId
      ]);
      
      return NextResponse.json({
        message: 'Legal document updated successfully',
        id: docId
      });
    } else {
      // Create new document
      const [result] = await pool.query(`
        INSERT INTO legal_documents (
          id, documentType, content, version, effectiveDate
        ) VALUES (
          UUID(), ?, ?, ?, ?
        )
      `, [
        data.documentType,
        data.content,
        data.version || '1.0',
        data.effectiveDate || new Date()
      ]);
      
      return NextResponse.json({
        message: 'Legal document created successfully',
        id: (result as any).insertId
      });
    }
  } catch (error) {
    console.error('Error creating/updating legal document:', error);
    return NextResponse.json(
      { error: 'Failed to create/update legal document' }, 
      { status: 500 }
    );
  }
}
