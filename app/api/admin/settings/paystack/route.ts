import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    // Check if user is authenticated and is a super admin
    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized access' }, 
        { status: 401 }
      );
    }
    
    // Get paystack configuration from database
    const paystackConfig = await prisma.paystackConfiguration.findFirst({
      where: { isDefault: true }
    });
    
    // For security, don't return the secretKey in the response
    if (paystackConfig) {
      const { secretKey, ...safeConfig } = paystackConfig;
      return NextResponse.json(safeConfig);
    }
    
    return NextResponse.json(null);
  } catch (error) {
    console.error('Error fetching Paystack settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Paystack settings' }, 
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
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
    
    // Check if we're setting this config as default
    if (data.isDefault) {
      // Reset isDefault on all other configs
      await prisma.paystackConfiguration.updateMany({
        where: { isDefault: true },
        data: { isDefault: false }
      });
    }
    
    // Get existing paystack configuration
    const existingConfig = await prisma.paystackConfiguration.findFirst();
    
    // Update or create configuration
    let updatedConfig;
    if (existingConfig) {
      updatedConfig = await prisma.paystackConfiguration.update({
        where: { id: existingConfig.id },
        data
      });
    } else {
      updatedConfig = await prisma.paystackConfiguration.create({ data });
    }
    
    // For security, don't return the secretKey in the response
    const { secretKey, ...safeConfig } = updatedConfig;
    
    return NextResponse.json({
      message: 'Paystack settings updated successfully',
      data: safeConfig
    });
  } catch (error) {
    console.error('Error updating Paystack settings:', error);
    return NextResponse.json(
      { error: 'Failed to update Paystack settings' }, 
      { status: 500 }
    );
  }
}