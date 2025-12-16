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
    
    // Get flutterwave configuration from database
    const flutterwaveConfig = await prisma.flutterwaveConfiguration.findFirst({
      where: { isDefault: true }
    });
    
    // For security, don't return the secretKey and encryptionKey in the response
    if (flutterwaveConfig) {
      const { secretKey, encryptionKey, ...safeConfig } = flutterwaveConfig;
      return NextResponse.json(safeConfig);
    }
    
    return NextResponse.json(null);
  } catch (error) {
    console.error('Error fetching Flutterwave settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Flutterwave settings' }, 
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
      await prisma.flutterwaveConfiguration.updateMany({
        where: { isDefault: true },
        data: { isDefault: false }
      });
      
      // If Flutterwave is default, Paystack shouldn't be
      await prisma.paystackConfiguration.updateMany({
        where: { isDefault: true },
        data: { isDefault: false }
      });
    }
    
    // Get existing flutterwave configuration
    const existingConfig = await prisma.flutterwaveConfiguration.findFirst();
    
    // Update or create configuration
    let updatedConfig;
    if (existingConfig) {
      updatedConfig = await prisma.flutterwaveConfiguration.update({
        where: { id: existingConfig.id },
        data
      });
    } else {
      updatedConfig = await prisma.flutterwaveConfiguration.create({ data });
    }
    
    // For security, don't return the secretKey and encryptionKey in the response
    const { secretKey, encryptionKey, ...safeConfig } = updatedConfig;
    
    return NextResponse.json({
      message: 'Flutterwave settings updated successfully',
      data: safeConfig
    });
  } catch (error) {
    console.error('Error updating Flutterwave settings:', error);
    return NextResponse.json(
      { error: 'Failed to update Flutterwave settings' }, 
      { status: 500 }
    );
  }
}