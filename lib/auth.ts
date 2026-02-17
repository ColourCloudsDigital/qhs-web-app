import { NextAuthOptions, User } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { compare } from 'bcrypt';
import pool from '@/lib/db';
import { UserRole } from '@/lib/types/enums';
import { RowDataPacket } from 'mysql2';

// Get auth settings from the database
const getAuthSettings = async () => {
  try {
    const query = `
      SELECT 
        jwtExpiry,
        sessionTimeout,
        twoFactorAuthEnabled,
        loginAttempts,
        lockoutDuration
      FROM security_settings 
      LIMIT 1
    `;
    
    const [rows]: [any[], any] = await pool.query(query);
    
    if (rows.length === 0) {
      // Return defaults if no settings found
      return {
        jwtExpiry: 86400, // 1 day in seconds
        sessionTimeout: 3600, // 1 hour in seconds
        twoFactorAuthEnabled: false,
        loginAttempts: 5,
        lockoutDuration: 30,
      };
    }
    
    return rows[0];
  } catch (error) {
    console.error('Error fetching auth settings:', error);
    return {
      jwtExpiry: 86400, // 1 day in seconds
      sessionTimeout: 3600, // 1 hour in seconds
      twoFactorAuthEnabled: false,
      loginAttempts: 5,
      lockoutDuration: 30,
    };
  }
};

export const authOptions: NextAuthOptions = {
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 1 day (will be overridden by settings if available)
  },
  pages: {
    signIn: '/login',
    error: '/login', // Error code passed in query string as ?error=
  },
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials): Promise<User | null> {
        console.log('Authorize attempt with credentials:', { email: credentials?.email, password: credentials?.password ? '[SET]' : '[NOT SET]' });
        if (!credentials?.email || !credentials?.password) {
          console.error('Login attempt with missing credentials');
          return null;
        }

        try {
          // Get auth settings from database
          const settings = await getAuthSettings();
          
          const userQuery = `
            SELECT
              u.id, u.email, u.name, u.password, u.role, u.isActive, u.emailVerified,
              sa.id as superAdminId,
              v.id as vendorId,
              c.id as customerId,
              s.id as staffId
            FROM users u
            LEFT JOIN super_admins sa ON u.id = sa.userId
            LEFT JOIN vendors v ON u.id = v.userId
            LEFT JOIN customers c ON u.id = c.userId
            LEFT JOIN staff s ON u.id = s.userId
            WHERE u.email = ?
            LIMIT 1;
          `;

          // Fetch user
          console.log(`Executing user query for email: ${credentials.email}`);
          const [rows]: [any[], any] = await pool.query(userQuery, [credentials.email]);
          console.log('Raw rows from database:', JSON.stringify(rows));

          if (rows.length === 0) {
            console.log(`Login failed: User not found for email ${credentials.email}`);
            return null;
          }
          
          const dbUser = rows[0];
          console.log('DB User object:', JSON.stringify(dbUser));
          
          // Check active status
          if (!dbUser.isActive) {
            console.log(`Login failed: User ${credentials.email} is inactive.`);
            throw new Error('ACCOUNT_INACTIVE');
          }

          // Check email verification (only in production)
          if (!dbUser.emailVerified && process.env.NODE_ENV !== 'development') {
            console.log(`Login failed: User ${credentials.email} email not verified.`);
            throw new Error('EMAIL_NOT_VERIFIED');
          }

          // Verify password
          console.log('Verifying password...');
          const isPasswordValid = await compare(credentials.password, dbUser.password);
          console.log('Password validation result:', isPasswordValid);

          if (!isPasswordValid) {
            console.log(`Login failed: Invalid password for user ${credentials.email}`);
            return null;
          }

          // Update last login time
          try {
            await pool.query(
              'UPDATE users SET lastLoginAt = ? WHERE id = ?',
              [new Date(), dbUser.id]
            );
          } catch (updateError) {
            console.error('Failed to update last login time:', updateError);
            // Continue even if this fails
          }

          // Return user data
          return {
            id: dbUser.id,
            name: dbUser.name,
            email: dbUser.email,
            role: dbUser.role,
            superAdminId: dbUser.superAdminId,
            vendorId: dbUser.vendorId,
            customerId: dbUser.customerId,
            staffId: dbUser.staffId,
            emailVerified: dbUser.emailVerified ? new Date(dbUser.emailVerified) : null,
          };
        } catch (error) {
          // Rethrow specific errors
          if (error instanceof Error && 
             (error.message === 'ACCOUNT_INACTIVE' || error.message === 'EMAIL_NOT_VERIFIED')) {
            throw error;
          }
          
          // Log the database error but return a generic error for security
          console.error('Authorization error:', error);
          
          // Convert database errors to a generic credentials error
          throw new Error('CredentialsSignin');
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, account, profile, trigger, isNewUser, session }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.superAdminId = (user as any).superAdminId;
        token.vendorId = (user as any).vendorId;
        token.customerId = (user as any).customerId;
        token.staffId = (user as any).staffId;
      }
      
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as UserRole;
        session.user.superAdminId = token.superAdminId as string | undefined;
        session.user.vendorId = token.vendorId as string | undefined;
        session.user.customerId = token.customerId as string | undefined;
        session.user.staffId = token.staffId as string | undefined;
      }
      return session;
    },
  },
  debug: process.env.NODE_ENV === 'development',
  secret: process.env.NEXTAUTH_SECRET,
  events: {
    async signIn({ user }) {
      // Add any custom login event logic here
      console.log(`User ${user.email} signed in successfully`);
    },
    async signOut({ token }) {
      // Add any custom logout event logic here
      if (token?.id) {
        console.log(`User ID ${token.id} signed out`);
      }
    },
  },
};