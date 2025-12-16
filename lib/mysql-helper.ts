import pool from './db';

// Helper to execute MySQL queries with tracing only when explicitly enabled
export async function executeQuery(sql: string, params: any[] = []): Promise<any[]> {
  try {
    // Only trace queries if enabled
    if (process.env.QUERY_TRACE === 'true') {
      console.log('SQL:', sql.substring(0, 100) + (sql.length > 100 ? '...' : ''));
      
      // If SQL_DEBUG is set, log more details
      if (process.env.SQL_DEBUG === 'true') {
        console.log('Params:', JSON.stringify(params));
      }
    }
    
    const [rows] = await pool.query(sql, params);
    return rows as any[];
  } catch (error) {
    // Always log errors
    console.error('Database query error:', error);
    console.error('Failed query:', sql);
    console.error('Query parameters:', JSON.stringify(params));
    throw error;
  }
} 