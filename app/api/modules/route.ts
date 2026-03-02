import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';

export const dynamic = 'force-dynamic';


// GET handler to return list of available modules
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // Fetch modules from the database
    const [modulesRows] = await pool.query(
      'SELECT * FROM modules ORDER BY name ASC'
    ) as [RowDataPacket[], any];
    
    // If no modules found in database, use the fallback static list
    if (modulesRows.length === 0) {
      console.log('No modules found in database, using fallback static list');
      // Define static list of modules available in the system as fallback
      const fallbackModules = [
        {
          id: '1',
          name: 'Hotel Management',
          type: 'CORE',
          description: 'Create and manage hotels, rooms, and amenities'
        },
        {
          id: '2',
          name: 'Bookings',
          type: 'CORE',
          description: 'Manage reservations and bookings'
        },
        {
          id: '3',
          name: 'POS System',
          type: 'ADDON',
          description: 'Point of sale system for hotel restaurants and shops'
        },
        {
          id: '6',
          name: 'QR Menu',
          type: 'ADDON',
          description: 'Digital menus for hotel restaurants'
        },
        {
          id: '7',
          name: 'Reports & Analytics',
          type: 'ADDON',
          description: 'Advanced reporting and business analytics'
        },
        {
          id: '8',
          name: 'API Access',
          type: 'ADDON',
          description: 'Integration with third-party systems'
        }
      ];
      
      return NextResponse.json({ modules: fallbackModules });
    }
    
    // Map database rows to expected format
    const modules = modulesRows.map(module => ({
      id: module.id,
      name: module.name,
      type: module.type,
      description: module.description,
      basePrice: parseFloat(module.basePrice || 0),
      isActive: Boolean(module.isActive)
    }));

    return NextResponse.json({ modules });
  } catch (error) {
    console.error('Error in modules API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch modules' },
      { status: 500 }
    );
  }
}
