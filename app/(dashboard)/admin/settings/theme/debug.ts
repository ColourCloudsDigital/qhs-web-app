// This is a temporary debug file to help diagnose ThemeSettings issues

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import pool from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // Check if user is authenticated and is a SUPER_ADMIN
    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    
    // First check if the ThemeSettings table exists
    let tableExists = false;
    try {
      // This query will throw an error if the table doesn't exist
      await prisma.$queryRaw`SELECT 1 FROM ThemeSettings LIMIT 1`;
      tableExists = true;
    } catch (error) {
      console.error('ThemeSettings table might not exist:', error);
    }
    
    // Try to get all theme settings records
    let themeSettings: any[] = [];
    if (tableExists) {
      themeSettings = await prisma.themeSettings.findMany();
    }
    
    return NextResponse.json({
      tableExists,
      themeSettingsCount: themeSettings.length,
      themeSettings: themeSettings.map(s => ({ 
        id: s.id, 
        isActive: s.isActive,
        updatedAt: s.updatedAt,
        // Include just enough data to verify structure without overwhelming the response
        hasColorPalette: !!s.colorPalette,
        hasTypography: !!s.typography,
        hasButtons: !!s.buttons,
        hasLayout: !!s.layout,
        logoUrl: s.logoUrl,
        faviconUrl: s.faviconUrl,
        loginBannerUrl: s.loginBannerUrl
      }))
    });
  } catch (error) {
    console.error('Debug error:', error);
    return NextResponse.json({ 
      error: 'Debug error',
      message: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // Check if user is authenticated and is a SUPER_ADMIN
    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Create a bare minimum theme settings record
    const result = await prisma.themeSettings.create({
      data: {
        colorPalette: JSON.stringify({ primary: '#000000' }),
        typography: JSON.stringify({ fontFamily: 'Arial' }),
        buttons: JSON.stringify({ borderRadius: '0' }),
        layout: JSON.stringify({ containerWidth: '100%' }),
        isActive: true
      }
    });

    return NextResponse.json({ success: true, id: result.id });
  } catch (error) {
    console.error('Debug create error:', error);
    return NextResponse.json({
      error: 'Debug create error',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // Check if user is authenticated and is a SUPER_ADMIN
    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Delete all theme settings
    const count = await prisma.themeSettings.deleteMany({});

    return NextResponse.json({ success: true, deletedCount: count.count });
  } catch (error) {
    console.error('Debug delete error:', error);
    return NextResponse.json({
      error: 'Debug delete error',
      message: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}