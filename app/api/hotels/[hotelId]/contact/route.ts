import { NextRequest, NextResponse } from 'next/server';
import { HotelService } from '@/services/hotels';
import { emailService } from '@/lib/services/email.service';

export async function GET(
  request: NextRequest,
  { params }: { params: { hotelId: string } }
) {
  try {
    const { hotelId } = params;
    const hotel = await HotelService.getHotelById(hotelId);

    if (!hotel) {
      return NextResponse.json({ error: 'Hotel not found' }, { status: 404 });
    }

    return NextResponse.json({
      email: hotel.email || null,
      phone: hotel.phone || null,
      vendorEmail: hotel.vendor?.user?.email || null,
    });
  } catch (error) {
    console.error('Contact GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch contact info' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { hotelId: string } }
) {
  try {
    const { hotelId } = params;
    const hotel = await HotelService.getHotelById(hotelId);

    if (!hotel) {
      return NextResponse.json({ error: 'Hotel not found' }, { status: 404 });
    }

    const body = await request.json();
    const { name, email, phone, message } = body || {};

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const to = hotel.email || hotel.vendor?.user?.email;

    if (!to) {
      return NextResponse.json({ error: 'No recipient email configured for this hotel' }, { status: 422 });
    }

    const subject = `Website Contact: ${name || 'Guest'} - ${hotel.name}`;
    const text = `You have a new message from the website contact form.

Sender: ${name || 'Anonymous'}
Email: ${email || 'N/A'}
Phone: ${phone || 'N/A'}

Message:
${message}
`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width:600px">
        <h3>New contact from website</h3>
        <p><strong>Sender:</strong> ${name || 'Anonymous'}</p>
        <p><strong>Email:</strong> ${email || 'N/A'}</p>
        <p><strong>Phone:</strong> ${phone || 'N/A'}</p>
        <hr />
        <p>${message.replace(/\n/g, '<br/>')}</p>
      </div>
    `;

    await emailService.sendEmail({
      to,
      subject,
      text,
      html,
      from: email ? `${name || 'Guest'} <${email}>` : undefined,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Contact POST error:', error);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}
