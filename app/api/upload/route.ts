// app/api/upload/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    // entity can be a nested path like "hotels/hotelId/rooms"
    const url = new URL(req.url);
    const entity = url.searchParams.get('entity') || 'uploads';

    // Sanitize: strip leading/trailing slashes, prevent path traversal
    const safePath = entity
      .split('/')
      .map(s => s.replace(/[^a-zA-Z0-9_\-]/g, ''))
      .filter(Boolean)
      .join('/');

    // Extract files from form data
    const uploadFiles: {
      name: string;
      type: string;
      arrayBuffer: () => Promise<ArrayBuffer>;
    }[] = [];

    formData.forEach((value) => {
      if (
        typeof value === 'object' &&
        value !== null &&
        'arrayBuffer' in value &&
        typeof (value as any).arrayBuffer === 'function' &&
        'name' in value &&
        'type' in value
      ) {
        uploadFiles.push(value as any);
      }
    });

    if (uploadFiles.length === 0) {
      return NextResponse.json({ error: 'No files uploaded' }, { status: 400 });
    }

    // Build upload directory: public/uploads/<safePath>
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', safePath);
    await mkdir(uploadDir, { recursive: true });

    const savedFiles: string[] = [];

    for (const file of uploadFiles) {
      const ext = path.extname(file.name) || '.jpg';
      const fileName = `${randomUUID()}${ext}`;
      const filePath = path.join(uploadDir, fileName);

      const buffer = Buffer.from(await file.arrayBuffer());
      await writeFile(filePath, buffer);

      // Public URL matches the path under /public
      const publicUrl = `/uploads/${safePath}/${fileName}`;
      savedFiles.push(publicUrl);
    }

    return NextResponse.json({ success: true, files: savedFiles });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      {
        error: 'Failed to upload files',
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
