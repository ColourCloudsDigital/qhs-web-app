import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import pool from '@/lib/db';
import { z } from 'zod';

// Simple schema for publish/unpublish action
const publishSchema = z.object({
  isPublished: z.boolean(),
});

interface RouteParams {
  params: {
    id: string;
  };
}

/**
 * PUT /api/admin/settings/legal/[id]/publish
 * Publish or unpublish a legal document
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
    const { isPublished } = publishSchema.parse(body);

    // Check if the document exists
    const [existingRows] = await pool.query(
      'SELECT * FROM legal_documents WHERE id = ?',
      [params.id]
    );

    const existingDocument = (existingRows as any[])[0];

    if (!existingDocument) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Update the document's publish status
    await pool.query(
      'UPDATE legal_documents SET isPublished = ?, updatedAt = NOW() WHERE id = ?',
      [isPublished, params.id]
    );

    // Get updated document
    const [updatedRows] = await pool.query(
      'SELECT * FROM legal_documents WHERE id = ?',
      [params.id]
    );

    const updatedDocument = (updatedRows as any[])[0];

    return NextResponse.json(updatedDocument);
  } catch (error) {
    console.error('Error updating document publish status:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to update document publish status' },
      { status: 500 }
    );
  }
}