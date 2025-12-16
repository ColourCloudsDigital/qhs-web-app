import { NextRequest, NextResponse } from 'next/server';
import { generateQRCode } from '@/lib/services/qrcode.service';

// GET /api/qrcode - Generate a QR code
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const data = searchParams.get('data');

    if (!data) {
      return NextResponse.json(
        { error: 'Data parameter is required' },
        { status: 400 }
      );
    }

    // Generate QR code
    const qrCode = await generateQRCode(data);

    return NextResponse.json({ qrCode });
  } catch (error) {
    console.error('Error generating QR code:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An unknown error occurred' },
      { status: 500 }
    );
  }
}