// app/api/upload/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';

export const dynamic = 'force-dynamic';


export async function POST(req: NextRequest) {
  console.log('â­ Upload API called');
  
  try {
    // Parse form data
    const formData = await req.formData();
    console.log('ðŸ“ Form data received');

    // Get query parameters
    const url = new URL(req.url);
    const entity = url.searchParams.get('entity') || 'uploads';
    const id = url.searchParams.get('id');
    
    console.log(`ðŸ“‚ Entity: ${entity}, ID: ${id || 'none'}`);

    // Extract files
    const uploadFiles: { 
      name: string;
      type: string;
      arrayBuffer: () => Promise<ArrayBuffer>;
    }[] = [];
    
    formData.forEach((value, key) => {
      // Check if the value is a file (has arrayBuffer method) without using instanceof File
      if (
        typeof value === 'object' && 
        value !== null && 
        'arrayBuffer' in value && 
        typeof value.arrayBuffer === 'function' &&
        'name' in value && 
        'type' in value
      ) {
        console.log(`ðŸ“„ Found file: ${value.name}, type: ${value.type}`);
        uploadFiles.push(value as any);
      }
    });
    
    if (uploadFiles.length === 0) {
      console.log('âŒ No files in request');
      return NextResponse.json({ error: 'No files uploaded' }, { status: 400 });
    }
    
    // Now let's actually save the files
    
    // Create upload directory path
    let uploadDir = path.join(process.cwd(), 'public', 'uploads', entity);
    if (id) {
      uploadDir = path.join(uploadDir, id);
    }
    
    console.log(`ðŸ“ Creating directory: ${uploadDir}`);
    try {
      await mkdir(uploadDir, { recursive: true });
      console.log(`âœ… Directory created successfully`);
    } catch (dirError) {
      console.error(`âŒ Error creating directory:`, dirError);
      throw dirError;
    }

    // Process files one by one
    const savedFiles = [];
    for (const file of uploadFiles) {
      // Create a unique filename based on the original name
      const fileExt = path.extname(file.name);
      const fileName = `${randomUUID()}${fileExt}`;
      const filePath = path.join(uploadDir, fileName);
      
      console.log(`ðŸ“ Full file path: ${filePath}`);
      
      console.log(`ðŸ’¾ Saving file: ${fileName}`);
      
      // Convert file to buffer and save
      const buffer = Buffer.from(await file.arrayBuffer());
      await writeFile(filePath, buffer);
      
      // Generate public URL
      const publicPath = `/uploads/${entity}${id ? `/${id}` : ''}/${fileName}`;
      savedFiles.push(publicPath);
      
      console.log(`ðŸ”— File URL: ${publicPath}`);
    }
    
    return NextResponse.json({
      success: true,
      files: savedFiles
    });
    
  } catch (error) {
    console.error('â›” Upload error:', error);
    return NextResponse.json({
      error: 'Failed to upload files',
      message: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
