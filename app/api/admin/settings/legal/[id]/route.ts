import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import pool from '@/lib/db';
import { z } from 'zod';

// Validation schema for legal document updates
const legalDocumentUpdateSchema = z.object({
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

interface RouteParams {
  params: {
    id: string;
  };
}

/**
 * GET /api/admin/settings/legal/[id]
 * Fetch a specific legal document
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    
    // Check if user is authenticated and is a SUPER_ADMIN
    // For public legal documents, we'll handle this differently in the public route
    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const [rows] = await pool.query(
      'SELECT * FROM legal_documents WHERE id = ?',
      [params.id]
    );

    const document = (rows as any[])[0];

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
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

/**
 * PUT /api/admin/settings/legal/[id]
 * Update a legal document
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    
    // Check if user is authenticated and is a SUPER_ADMIN
    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = legalDocumentUpdateSchema.parse(body);

    // Check if the document exists
    const [existingRows] = await pool.query(
      'SELECT * FROM legal_documents WHERE id = ?',
      [params.id]
    );

    const existingDocument = (existingRows as any[])[0];

    if (!existingDocument) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Check if slug is unique (except for this document)
    const [slugRows] = await pool.query(
      'SELECT id FROM legal_documents WHERE slug = ? AND id != ?',
      [validatedData.slug, params.id]
    );

    if ((slugRows as any[]).length > 0) {
      return NextResponse.json(
        { error: 'A document with this slug already exists' },
        { status: 400 }
      );
    }

    // Update the document
    await pool.query(
      `UPDATE legal_documents 
       SET type = ?, title = ?, slug = ?, content = ?, version = ?, 
           isPublished = ?, effectiveDate = ?, updatedAt = NOW()
       WHERE id = ?`,
      [
        validatedData.type,
        validatedData.title,
        validatedData.slug,
        validatedData.content,
        validatedData.version,
        validatedData.isPublished,
        new Date(validatedData.effectiveDate),
        params.id
      ]
    );

    // Get updated document
    const [updatedRows] = await pool.query(
      'SELECT * FROM legal_documents WHERE id = ?',
      [params.id]
    );

    const updatedDocument = (updatedRows as any[])[0];

    return NextResponse.json(updatedDocument);
  } catch (error) {
    console.error('Error updating legal document:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to update legal document' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/settings/legal/[id]
 * Delete a legal document
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    
    // Check if user is authenticated and is a SUPER_ADMIN
    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Check if the document exists
    const [existingRows] = await pool.query(
      'SELECT * FROM legal_documents WHERE id = ?',
      [params.id]
    );

    const existingDocument = (existingRows as any[])[0];

    if (!existingDocument) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Delete the document
    await pool.query(
      'DELETE FROM legal_documents WHERE id = ?',
      [params.id]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting legal document:', error);
    return NextResponse.json(
      { error: 'Failed to delete legal document' },
      { status: 500 }
    );
  }
}