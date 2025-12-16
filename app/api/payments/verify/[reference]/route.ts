import { NextRequest, NextResponse } from 'next/server';
import { paymentService } from '@/lib/services/payment.service';

export async function GET(
  request: NextRequest,
  { params }: { params: { reference: string } }
) {
  try {
    const reference = params.reference;
    
    if (!reference) {
      return NextResponse.json(
        { error: 'Payment reference is required' },
        { status: 400 }
      );
    }
    
    try {
      // Verify payment
      const result = await paymentService.verifyPayment(reference);
      
      return NextResponse.json(result);
    } catch (err) {
      if (err instanceof Error) {
        return NextResponse.json(
          { error: err.message },
          { status: 400 }
        );
      }
      throw err;
    }
  } catch (error) {
    console.error('Error verifying payment:', error);
    return NextResponse.json(
      { error: 'Failed to verify payment' },
      { status: 500 }
    );
  }
}