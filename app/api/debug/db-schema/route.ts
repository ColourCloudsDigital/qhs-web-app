import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket, OkPacket, ResultSetHeader, ProcedureCallPacket } from 'mysql2';

export const dynamic = 'force-dynamic';


interface TableRow extends RowDataPacket {
  Tables_in_database: string;
}

interface ColumnInfo extends RowDataPacket {
  Field: string;
  Type: string;
  Null: string;
  Key: string;
  Default: string | null;
  Extra: string;
}

interface CountResult extends RowDataPacket {
  count: number;
}

/**
 * GET /api/debug/db-schema
 * Development-only endpoint to check database schema
 */
export async function GET(request: NextRequest) {
  // Only allow in development environment
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Only available in development mode' }, { status: 403 });
  }

  const connection = await pool.getConnection();
  const results: any = {};
  
  try {
    // Get tables
    const [tables] = await connection.query<TableRow[]>('SHOW TABLES');
    results.tables = tables;
    
    // Get schema for each relevant table
    const relevantTables = ['hotels', 'rooms', 'customers', 'bookings'];
    results.schema = {};
    
    for (const table of relevantTables) {
      try {
        const [columns] = await connection.query<ColumnInfo[]>(`DESCRIBE ${table}`);
        results.schema[table] = columns;
      } catch (error: any) {
        results.schema[table] = { error: error.message };
      }
    }
    
    // Check if tables exist
    results.exists = {};
    for (const table of relevantTables) {
      try {
        const [rows] = await connection.query<CountResult[]>(
          `SELECT COUNT(*) as count FROM information_schema.tables 
           WHERE table_schema = DATABASE() 
           AND table_name = ?`, 
          [table]
        );
        results.exists[table] = rows[0]?.count > 0;
      } catch (error: any) {
        results.exists[table] = { error: error.message };
      }
    }
    
    // Additional check for required columns
    results.columnsCheck = {
      rooms: await checkColumns('rooms', ['id', 'hotelId', 'name', 'roomType', 'pricePerNight']),
      bookings: await checkColumns('bookings', ['id', 'hotelId', 'roomUnitId', 'customerId', 'checkInDate', 'checkOutDate']),
      customers: await checkColumns('customers', ['id', 'firstName', 'lastName', 'email', 'phone', 'isGuest'])
    };
    
    return NextResponse.json(results);
  } catch (error: any) {
    return NextResponse.json({ 
      error: 'Failed to get database schema',
      message: error.message,
      stack: error.stack
    }, { status: 500 });
  } finally {
    connection.release();
  }
  
  async function checkColumns(table: string, requiredColumns: string[]) {
    try {
      const [columns] = await connection.query<ColumnInfo[]>(`DESCRIBE ${table}`);
      const columnNames = columns.map((col: ColumnInfo) => col.Field);
      const missingColumns = requiredColumns.filter(col => !columnNames.includes(col));
      
      return {
        exists: true,
        allColumnsExist: missingColumns.length === 0,
        missingColumns: missingColumns.length > 0 ? missingColumns : null
      };
    } catch (error: any) {
      return {
        exists: false,
        error: error.message
      };
    }
  }
} 
