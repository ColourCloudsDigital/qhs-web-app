import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import crypto from 'crypto';
import { paymentService } from '@/lib/services/payment.service';
import { getPaystackConfig } from '@/lib/services/settings.service';

export async function POST(request: NextRequest) {
  try {
    const headersList = headers();
    const signature = headersList.get('x-paystack-signature');
    
    // Verify request is coming from Paystack
    if (!signature) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Get the request body as text
    const payload = await request.text();
    
    // Get Paystack secret key to verify signature
    const paystackConfig = await getPaystackConfig();
    
    if (!paystackConfig) {
      console.error('Paystack configuration not found');
      return NextResponse.json(
        { error: 'Paystack configuration not found' },
        { status: 500 }
      );
    }
    
    // Verify webhook signature
    const hash = crypto
      .createHmac('sha512', paystackConfig.secretKey)
      .update(payload)
      .digest('hex');
    
    if (hash !== signature) {
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }
    
    // Parse the payload
    const event = JSON.parse(payload);
    
    // Process the webhook event
    const result = await paymentService.processPaystackWebhook(
      event.event,
      event.data
    );
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Failed to process webhook' },
      { status: 500 }
    );
  }
}