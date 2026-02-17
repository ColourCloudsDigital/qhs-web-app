import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

// Test endpoint to check database connectivity and table existence
export async function GET(req: NextRequest) {
  try {
    // Check database connection
    const tables = [
      'menu_categories',
      'menu_items',
      'menu_settings',
      'menu_access_logs',
      'hotels',
      'vendors'
    ];
    
    const results: Record<string, { exists: boolean, count?: number, error?: string }> = {};
    
    // Check each table
    for (const table of tables) {
      try {
        const [rows] = await pool.query(`SHOW TABLES LIKE '${table}'`);
        const exists = Array.isArray(rows) && rows.length > 0;
        
        if (exists) {
          // Count records in the table
          const [countRows] = await pool.query(`SELECT COUNT(*) as count FROM ${table}`);
          results[table] = { 
            exists,
            count: (countRows as any[])[0].count
          };
        } else {
          results[table] = { exists };
        }
      } catch (error) {
        results[table] = { 
          exists: false,
          error: 'Error checking table'
        };
      }
    }
    
    // Also check one vendor's data
    try {
      const [rows] = await pool.query(
        `SELECT v.id, v.userId, v.subscriptionPlanId, h.id as hotelId
         FROM vendors v
         LEFT JOIN hotels h ON h.vendorId = v.id
         LIMIT 1`
      );
      
      results.vendorData = Array.isArray(rows) && rows.length > 0 ? (rows as any[])[0] : null;
    } catch (error) {
      results.vendorData = { exists: false, error: 'Failed to query vendor data' };
    }
    
    return NextResponse.json({
      dbConnection: 'success',
      tables: results,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Database connection error:', error);
    
    return NextResponse.json({
      dbConnection: 'error',
      error: error.message || 'Unknown database error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
} 