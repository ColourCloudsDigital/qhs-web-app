import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { UserRole } from '@/lib/types/enums';
import { UserService } from '@/services/users';

export const dynamic = 'force-dynamic';


// GET handler to fetch users with pagination, sorting, and filtering
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // Check authentication and authorization
    if (!session || session.user.role !== UserRole.SUPER_ADMIN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get query parameters
    const searchParams = req.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    const sortColumn = searchParams.get('sortColumn') || 'createdAt';
    const sortDirection = (searchParams.get('sortDirection') || 'desc') as 'asc' | 'desc';
    const search = searchParams.get('search') || '';
    
    // Fix the role and isActive parameters to use proper types
    const roleParam = searchParams.get('role');
    const role = roleParam ? roleParam as UserRole : undefined;
    
    const isActiveParam = searchParams.get('isActive');
    const isActive = isActiveParam === 'true' ? true : 
                    isActiveParam === 'false' ? false : 
                    undefined;

    // Use the service to fetch users
    const result = await UserService.getUsers({
      page,
      pageSize,
      sortColumn,
      sortDirection,
      search,
      role,
      isActive
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

// POST handler to create a new user
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // Check authentication and authorization
    if (!session || session.user.role !== UserRole.SUPER_ADMIN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const body = await req.json();
    
    // Validate required fields
    if (!body.name || !body.email || !body.password || !body.role) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Use service to create user
    try {
      const user = await UserService.createUser(body);
      
      return NextResponse.json({ user }, { status: 201 });
    } catch (err) {
      if (err instanceof Error) {
        if (err.message === 'User with this email already exists') {
          return NextResponse.json(
            { error: err.message },
            { status: 409 }
          );
        }
      }
      throw err;
    }
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
}
