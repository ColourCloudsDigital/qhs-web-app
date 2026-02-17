import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { paymentService } from '@/lib/services/payment.service';
import { PaymentMethod } from '@/lib/types/enums';

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Only customers can initialize payments
    if (session.user.role !== 'CUSTOMER' || !session.user.customerId) {
      return NextResponse.json(
        { error: 'Only customers can make payments' },
        { status: 403 }
      );
    }
    
    // Parse request body
    const body = await request.json();
    const { bookingId, method, callbackUrl } = body;
    
    // Validate required fields
    if (!bookingId || !method || !callbackUrl) {
      return NextResponse.json(
        { error: 'bookingId, method, and callbackUrl are required' },
        { status: 400 }
      );
    }
    
    // Validate payment method
    if (!Object.values(PaymentMethod).includes(method)) {
      return NextResponse.json(
        { error: 'Invalid payment method' },
        { status: 400 }
      );
    }
    
    try {
      // Initialize payment
      const paymentResult = await paymentService.initializePayment({
        bookingId,
        customerId: session.user.customerId,
        method,
        callbackUrl,
      });
      
      return NextResponse.json(paymentResult);
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
    console.error('Error initializing payment:', error);
    return NextResponse.json(
      { error: 'Failed to initialize payment' },
      { status: 500 }
    );
  }
}