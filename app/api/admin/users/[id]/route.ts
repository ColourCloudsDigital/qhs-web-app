import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { UserRole } from '@/lib/types/enums';
import { UserService } from '@/services/users';

// GET a specific user by ID
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    // Check authentication and authorization
    if (!session || session.user.role !== UserRole.SUPER_ADMIN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = params.id;

    try {
      const user = await UserService.getUserById(userId);
      return NextResponse.json({ user });
    } catch (err) {
      if (err instanceof Error) {
        if (err.message === 'User not found') {
          return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }
      }
      throw err;
    }
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    );
  }
}

// PUT to update a user
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    // Check authentication and authorization
    if (!session || session.user.role !== UserRole.SUPER_ADMIN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = params.id;
    const body = await req.json();

    try {
      const user = await UserService.updateUser(userId, body);
      return NextResponse.json({ user });
    } catch (err) {
      if (err instanceof Error) {
        if (err.message === 'User not found') {
          return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }
        if (err.message === 'Email is already taken') {
          return NextResponse.json(
            { error: 'Email is already taken' },
            { status: 409 }
          );
        }
      }
      throw err;
    }
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
}

// DELETE a user
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    // Check authentication and authorization
    if (!session || session.user.role !== UserRole.SUPER_ADMIN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = params.id;

    try {
      await UserService.deleteUser(userId, session.user.id);
      return NextResponse.json(
        { message: 'User deleted successfully' },
        { status: 200 }
      );
    } catch (err) {
      if (err instanceof Error) {
        if (err.message === 'User not found') {
          return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }
        if (err.message === 'Cannot delete your own account') {
          return NextResponse.json(
            { error: 'Cannot delete your own account' },
            { status: 400 }
          );
        }
      }
      throw err;
    }
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    );
  }
}