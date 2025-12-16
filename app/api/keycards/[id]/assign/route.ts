import { NextRequest, NextResponse } from 'next/server';
import { KeycardService } from '@/lib/services/keycard.service';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import pool from '@/lib/db';

interface RouteParams {
  params: {
    id: string;
  };
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only vendors and staff can assign keycards
    if (session.user.role !== 'VENDOR' && session.user.role !== 'STAFF' && session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = params;
    const body = await req.json();

    // Get the current keycard to check access permissions
    const keycard = await KeycardService.getKeycard(id);

    // Check permissions
    if (session.user.role === 'VENDOR') {
      const vendorId = session.user.vendor?.id;
      if (!vendorId) {
        return NextResponse.json({ error: 'Vendor profile not found' }, { status: 403 });
      }

      const hotel = await prisma.hotel.findUnique({
        where: { id: keycard.hotelId },
        select: { vendorId: true }
      });

      if (!hotel || hotel.vendorId !== vendorId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    } else if (session.user.role === 'STAFF') {
      const staffId = session.user.staff?.id;
      if (!staffId) {
        return NextResponse.json({ error: 'Staff profile not found' }, { status: 403 });
      }

      const staff = await prisma.staff.findUnique({
        where: { id: staffId },
        select: { hotelId: true }
      });

      if (!staff || staff.hotelId !== keycard.hotelId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    let result;
    if (body.type === 'booking' && body.bookingId) {
      // Assign keycard to booking
      result = await KeycardService.assignToBooking({
        keycardId: id,
        bookingId: body.bookingId
      });
    } else if (body.type === 'staff' && body.staffId) {
      // Assign keycard to staff
      result = await KeycardService.assignToStaff({
        keycardId: id,
        staffId: body.staffId,
        accessLevel: body.accessLevel || 1,
        validFrom: body.validFrom ? new Date(body.validFrom) : new Date(),
        validTo: body.validTo ? new Date(body.validTo) : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // Default 1 year
      });
    } else {
      return NextResponse.json({ error: 'Invalid assignment type or missing required parameters' }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error assigning keycard:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}