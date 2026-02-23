import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import pool from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is staff
    const [staffRows] = await pool.query(
      `SELECT s.*, h.name as hotelName, u.name as userName
       FROM staff s 
       JOIN hotels h ON s.hotelId = h.id 
       JOIN users u ON s.userId = u.id
       WHERE s.userId = ?`,
      [session.user.id]
    );

    const staff = (staffRows as any[])[0];

    if (!staff) {
      return NextResponse.json({ error: 'Staff access required' }, { status: 403 })
    }

    // For now, return mock reports since we don't have a reports table yet
    const mockReports = [
      {
        id: '1',
        title: 'Monthly Revenue Report - January 2024',
        type: 'revenue',
        description: 'Comprehensive revenue analysis for January 2024',
        dateRange: '2024-01-01 to 2024-01-31',
        generatedBy: 'System',
        createdAt: '2024-01-31T23:59:59Z',
        status: 'generated',
        fileUrl: '/reports/revenue-jan-2024.pdf'
      },
      {
        id: '2',
        title: 'Weekly Occupancy Report',
        type: 'occupancy',
        description: 'Room occupancy analysis for the past week',
        dateRange: '2024-01-15 to 2024-01-21',
        generatedBy: staff.userName || 'Staff',
        createdAt: '2024-01-22T08:00:00Z',
        status: 'generated',
        fileUrl: '/reports/occupancy-week-3.pdf'
      },
      {
        id: '3',
        title: 'Customer Analytics Report',
        type: 'customer',
        description: 'Customer behavior and demographics analysis',
        dateRange: '2024-01-01 to 2024-01-21',
        generatedBy: 'System',
        createdAt: '2024-01-22T10:30:00Z',
        status: 'processing'
      },
      {
        id: '4',
        title: 'Payment Processing Report',
        type: 'payment',
        description: 'Payment success rates and transaction analysis',
        dateRange: '2024-01-01 to 2024-01-21',
        generatedBy: staff.userName || 'Staff',
        createdAt: '2024-01-22T14:15:00Z',
        status: 'failed'
      }
    ]

    return NextResponse.json({
      reports: mockReports
    })

  } catch (error) {
    console.error('Error fetching reports:', error)
    return NextResponse.json(
      { error: 'Failed to fetch reports' },
      { status: 500 }
    )
  }
}