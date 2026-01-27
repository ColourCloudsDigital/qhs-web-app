import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is staff
    const staff = await db.staff.findUnique({
      where: { userId: session.user.id },
      include: { hotel: true }
    })

    if (!staff) {
      return NextResponse.json({ error: 'Staff access required' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    const whereClause: any = {
      OR: [
        { vendorId: staff.hotelId },
        { 
          booking: {
            hotelId: staff.hotelId
          }
        }
      ]
    }

    if (status && status !== 'all') {
      whereClause.status = status
    }

    const payments = await db.payment.findMany({
      where: whereClause,
      include: {
        booking: {
          include: {
            customer: true
          }
        },
        customer: true
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset
    })

    const formattedPayments = payments.map(payment => ({
      id: payment.id,
      bookingId: payment.bookingId,
      amount: payment.amount,
      status: payment.status,
      paymentMethod: payment.paymentMethod,
      transactionId: payment.transactionId,
      transactionReference: payment.transaction_reference,
      currency: payment.currency,
      description: payment.description,
      customerId: payment.customer_id,
      vendorId: payment.vendor_id,
      subscriptionPlanId: payment.subscription_plan_id,
      createdAt: payment.createdAt,
      updatedAt: payment.updatedAt,
      customerName: payment.customer?.firstName && payment.customer?.lastName 
        ? `${payment.customer.firstName} ${payment.customer.lastName}`
        : payment.booking?.customer?.firstName && payment.booking?.customer?.lastName
        ? `${payment.booking.customer.firstName} ${payment.booking.customer.lastName}`
        : null,
      bookingReference: payment.booking?.id
    }))

    const total = await db.payment.count({
      where: whereClause
    })

    return NextResponse.json({
      payments: formattedPayments,
      total,
      hasMore: offset + limit < total
    })

  } catch (error) {
    console.error('Error fetching payments:', error)
    return NextResponse.json(
      { error: 'Failed to fetch payments' },
      { status: 500 }
    )
  }
}