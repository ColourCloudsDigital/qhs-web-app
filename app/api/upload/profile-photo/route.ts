import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import pool from '@/lib/db';

// Function to ensure directory exists
async function ensureDir(dirPath: string) {
  try {
    await mkdir(dirPath, { recursive: true });
  } catch (err) {
    // Ignore if directory already exists
    if ((err as NodeJS.ErrnoException).code !== 'EEXIST') {
      throw err;
    }
  }
}

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse the FormData
    const formData = await req.formData();
    const photo = formData.get('photo') as File;
    const userId = formData.get('userId') as string;

    if (!photo || !userId) {
      return NextResponse.json({ error: 'Photo and userId are required' }, { status: 400 });
    }

    // Check file type
    if (!photo.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Only image files are allowed' }, { status: 400 });
    }

    // Check file size (max 5MB)
    if (photo.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'Image size must be less than 5MB' }, { status: 400 });
    }

    // Create upload directory if it doesn't exist
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'profile-photo');
    await ensureDir(uploadDir);

    // Generate unique filename
    const fileExtension = photo.name.split('.').pop();
    const fileName = `${userId}_${Date.now()}.${fileExtension}`;
    const filePath = path.join(uploadDir, fileName);

    // Convert the file to ArrayBuffer
    const buffer = await photo.arrayBuffer();

    // Write the file to the server
    await writeFile(filePath, Buffer.from(buffer));

    // Path to be stored in the database (relative to public directory)
    const relativePath = `/uploads/profile-photo/${fileName}`;

    // Update the user's profile photo in the database
    await pool.query(
      'UPDATE users SET userPhoto = ? WHERE id = ?',
      [relativePath, userId]
    );

    return NextResponse.json({ 
      success: true, 
      filepath: relativePath
    });
  } catch (error) {
    console.error('Error uploading profile photo:', error);
    return NextResponse.json(
      { error: 'Failed to upload profile photo' }, 
      { status: 500 }
    );
  }
} 