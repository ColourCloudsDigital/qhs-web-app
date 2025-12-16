import { NextAuthOptions, User } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { compare } from 'bcrypt';
import pool from '@/lib/db';
import { UserRole } from '@/lib/types/enums';

// Get auth settings from the database
const getAuthSettings = async () => {
  try {
    const query = `
      SELECT \`key\`, value 
      FROM settings 
      WHERE category = 'security'
      AND \`key\` IN ('jwt_expiry', 'refresh_token_expiry', 'allow_signup', 'require_email_verification')
    `;
    
    const [rows]: [any[], any] = await pool.query(query);
    
    return rows.reduce((acc: any, row: any) => {
      acc[row.key] = row.value;
      return acc;
    }, {});
  } catch (error) {
    console.error('Error fetching auth settings:', error);
    return {
      jwt_expiry: '1d',
      refresh_token_expiry: '7d',
      allow_signup: 'true',
      require_email_verification: 'true',
    };
  }
};

export const authOptions: NextAuthOptions = {
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 1 day
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
          const requireEmailVerification = settings.require_email_verification === 'true';
          
          const userQuery = `
            SELECT
              u.id, u.email, u.name, u.password, u.role, u.isActive, u.emailVerified,
              sa.id as superAdminId,
              v.id as vendorId,
              c.id as customerId,
              s.id as staffId
            FROM users u
            LEFT JOIN superadmins sa ON u.id = sa.userId
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

          // Check email verification
          if (requireEmailVerification && !dbUser.emailVerified && process.env.NODE_ENV !== 'development') {
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
      
      // Check for impersonation data in headers (if available)
      // const headers = (req as any)?.headers;
      // if (headers && headers['x-impersonation-data']) {
      //   try {
      //     const impersonationData = JSON.parse(headers['x-impersonation-data'] as string);
      //     if (impersonationData && impersonationData.userRole) {
      //       // When impersonating, use the role from impersonation data
      //       // but keep the admin's ID for reference
      //       token.originalRole = token.role;
      //       token.role = impersonationData.userRole;
      //       token.isImpersonating = true;
      //     }
      //   } catch (e) {
      //     console.error('Error parsing impersonation data:', e);
      //   }
      // }
      
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
        
        // Add impersonation data to session
        // if (token.isImpersonating) {
        //   (session.user as any).isImpersonating = true;
        //   (session.user as any).originalRole = token.originalRole;
        // }
      }
      return session;
    },
  },
  debug: process.env.NODE_ENV === 'development',
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