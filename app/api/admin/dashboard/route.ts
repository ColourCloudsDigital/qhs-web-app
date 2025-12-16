import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import pool from '@/lib/db';
import { UserRole } from '@/lib/types/enums';
import { RowDataPacket } from 'mysql2';

// Type definitions
interface PlanFeature {
  id: string;
  moduleId: string;
  isIncluded: boolean;
}

interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  planFeatures: PlanFeature[];
}

interface PlansWithFeaturesMap {
  [key: string]: SubscriptionPlan;
}

interface HotelRevenue {
  id: string;
  name: string;
  revenue: number;
}

interface Transaction {
  id: string;
  hotel: string;
  customer: string;
  date: string | Date;
  amount: number;
  status: string;
}

interface ModuleStats {
  id: string;
  name: string;
  activeVendors: number;
  revenue: number;
}

interface DashboardData {
  totalRevenue: number;
  lastMonthRevenue: number;
  vendorCount: number;
  customerCount: number;
  bookingCount: number;
  topHotels: HotelRevenue[];
  recentTransactions: Transaction[];
  modules: ModuleStats[];
}

export async function GET(request: Request) {
  try {
    // Verify user is authenticated and has admin role
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    // Get all payment transactions
    const [paymentRows] = await pool.query(
      `SELECT * FROM payments ORDER BY createdAt DESC LIMIT 100`
    );
    
    const payments = paymentRows as any[];
    
    // Calculate revenue summary
    const totalRevenue = payments.reduce((sum, payment) => sum + parseFloat(payment.amount), 0);
    const thisMonth = new Date().getMonth() + 1;
    const thisYear = new Date().getFullYear();
    
    // Filter for this month's payments
    const thisMonthPayments = payments.filter(payment => {
      const paymentMonth = new Date(payment.createdAt).getMonth() + 1;
      const paymentYear = new Date(payment.createdAt).getFullYear();
      return paymentMonth === thisMonth && paymentYear === thisYear;
    });
    
    const thisMonthRevenue = thisMonthPayments.reduce((sum, payment) => sum + parseFloat(payment.amount), 0);
    
    // Get vendors count
    const [vendorRows] = await pool.query(`SELECT COUNT(*) as count FROM vendors`);
    const vendorsCount = (vendorRows as any[])[0].count;
    
    // Get customers count
    const [customerRows] = await pool.query(`SELECT COUNT(*) as count FROM customers`);
    const customersCount = (customerRows as any[])[0].count;
    
    // Get bookings count
    const [bookingRows] = await pool.query(`SELECT COUNT(*) as count FROM bookings`);
    const bookingsCount = (bookingRows as any[])[0].count;
    
    // Get hotels
    const [hotelRows] = await pool.query(`SELECT * FROM hotels`);
    const hotels = hotelRows as any[];
    
    // Calculate hotel revenue
    const hotelRevenuePromises = hotels.map(async (hotel) => {
      const [hotelBookingRows] = await pool.query(
        `SELECT SUM(totalAmount) as revenue FROM bookings WHERE hotelId = ?`,
        [hotel.id]
      );
      
      const revenue = (hotelBookingRows as any[])[0].revenue || 0;
      
      return {
        id: hotel.id,
        name: hotel.name,
        revenue
      };
    });
    
    const hotelRevenue = await Promise.all(hotelRevenuePromises);
    
    // Get recent transactions with improved hotel information
    const [transactionRows] = await pool.query(
      `SELECT 
         p.*, 
         b.hotelId, 
         h.name as hotelName, 
         c.userId, 
         u.name as userName,
         CASE 
           WHEN h.name IS NULL AND p.bookingId IS NULL THEN 'Direct Payment'
           WHEN h.name IS NULL THEN 'Pending Assignment'
           ELSE h.name 
         END as displayHotelName
       FROM payments p
       LEFT JOIN bookings b ON p.bookingId = b.id
       LEFT JOIN hotels h ON b.hotelId = h.id
       LEFT JOIN customers c ON b.customerId = c.id
       LEFT JOIN users u ON c.userId = u.id
       ORDER BY p.createdAt DESC
       LIMIT 10`
    );
    
    const recentTransactions = (transactionRows as any[]).map(tx => ({
      id: tx.id,
      amount: parseFloat(tx.amount),
      currency: tx.currency || 'NGN',
      status: tx.status,
      paymentMethod: tx.paymentMethod,
      hotel: tx.displayHotelName || 'Unknown Hotel',
      userName: tx.userName || 'Anonymous Customer',
      date: tx.createdAt
    }));
    
    // Get modules
    const [moduleRows] = await pool.query(`SELECT * FROM modules`);
    const modules = moduleRows as any[];
    
    // Get active vendor count for each module
    const moduleStatsPromises = modules.map(async (module) => {
      // Count vendors using this module through subscription plans
      const [vendorCountRows] = await pool.query(
        `SELECT COUNT(DISTINCT v.id) as count
         FROM vendors v
         JOIN subscription_plans sp ON v.subscriptionPlanId = sp.id
         JOIN plan_features pf ON pf.planId = sp.id
         WHERE pf.moduleId = ? AND pf.isIncluded = 1`,
        [module.id]
      );
      
      const activeVendors = (vendorCountRows as any[])[0]?.count || 0;
      
      return {
        ...module,
        activeVendors
      };
    });
    
    const modulesWithStats = await Promise.all(moduleStatsPromises);
    
    // Get subscription plans
    const [planRows] = await pool.query(`SELECT * FROM subscription_plans`);
    const plans = planRows as any[];
    
    // Get vendors with their subscription plans
    const [vendorDataRows] = await pool.query(
      `SELECT v.*, u.name, u.email, sp.name as planName
       FROM vendors v
       LEFT JOIN users u ON v.userId = u.id
       LEFT JOIN subscription_plans sp ON v.subscriptionPlanId = sp.id
       ORDER BY v.createdAt DESC
       LIMIT 10`
    );
    
    const vendors = vendorDataRows as any[];
    
    // Build dashboard data
    const dashboardData = {
      summary: {
        totalRevenue,
        thisMonthRevenue,
        vendorsCount,
        customersCount,
        bookingsCount
      },
      hotelRevenue: hotelRevenue.sort((a, b) => parseFloat(b.revenue) - parseFloat(a.revenue)).slice(0, 5),
      recentTransactions,
      modules: modulesWithStats,
      plans,
      vendors
    };
    
    return NextResponse.json(dashboardData);
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return new NextResponse(JSON.stringify({ error: 'Failed to fetch dashboard data' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}