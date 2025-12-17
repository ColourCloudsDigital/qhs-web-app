import { compare } from "bcrypt";
import NextAuth, { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import pool from "@/lib/db";
import { UserRole } from "@/lib/types/enums";
import { RowDataPacket } from "mysql2";


export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            console.log("Missing credentials");
            throw new Error("Invalid credentials");
          }

          console.log("Attempting login for email:", credentials.email);
          
          try {
            // Get user from MySQL directly
            const [rows] = await pool.query(
              'SELECT * FROM users WHERE email = ? LIMIT 1', 
              [credentials.email]
            ) as [RowDataPacket[], any];
            
            console.log("Query executed, rows returned:", rows.length);
            if (rows.length > 0) {
              console.log("User data structure:", Object.keys(rows[0]).join(", "));
            }
            
            const user = rows.length > 0 ? rows[0] : null;

            console.log("User lookup result:", user ? "Found" : "Not found");
            
            if (!user) {
              console.log("User not found");
              throw new Error("Invalid credentials");
            }

            if (!user.password) {
              console.log("User has no password");
              throw new Error("Invalid credentials");
            }

            // Handle potential field name inconsistencies
            const isActive = user.isActive !== undefined ? user.isActive : 
                            user.is_active !== undefined ? user.is_active : true;
            
            console.log("User active status:", isActive);
            if (isActive === false) {
              console.log("User account is inactive");
              throw new Error("Your account has been deactivated. Please contact support.");
            }

            // Check if email is verified (unless in development environment)
            const emailVerified = user.emailVerified !== undefined ? user.emailVerified :
                                 user.email_verified !== undefined ? user.email_verified : null;
                                 
            if (process.env.NODE_ENV !== "development" && !emailVerified) {
              console.log("Email not verified");
              throw new Error("Please verify your email address before logging in.");
            }

            console.log("Comparing passwords for user:", user.email);
            console.log("Password from DB length:", user.password.length);
            
            try {
              // Handle potential password format issues
              let passwordToCompare = user.password;
              
              // Ensure the password has proper bcrypt format
              if (!passwordToCompare.startsWith('$2')) {
                console.log("Warning: Password does not appear to be a bcrypt hash");
              }
              
              const isCorrectPassword = await compare(
                credentials.password,
                passwordToCompare
              );

              console.log("Password comparison result:", isCorrectPassword);

              if (!isCorrectPassword) {
                console.log('Password comparison failed for email:', credentials.email);
                throw new Error("Invalid credentials");
              }

              console.log("Login successful, updating last login time");
              // Update last login time
              try {
                await pool.query(
                  'UPDATE users SET lastLoginAt = ? WHERE id = ?',
                  [new Date(), user.id]
                );
              } catch (updateError) {
                // Try with snake_case if camelCase fails
                try {
                  await pool.query(
                    'UPDATE users SET last_login_at = ? WHERE id = ?',
                    [new Date(), user.id]
                  );
                } catch (err) {
                  // Non-critical error, just log it
                  console.error("Could not update last login time:", err);
                }
              }

              // Normalize field names
              const userId = user.id;
              const userName = user.name;
              const userEmail = user.email;
              const userRole = user.role;
              
              // Get user role-specific IDs
              console.log("Fetching role-specific IDs for role:", userRole);
              
              let superAdminId = null, vendorId = null, customerId = null, staffId = null;
              
              try {
                // Try both camelCase and snake_case table names
                try {
                  const [superAdmins] = await pool.query(
                    'SELECT id FROM super_admins WHERE userId = ? LIMIT 1',
                    [userId]
                  ) as [RowDataPacket[], any];
                  
                  if (superAdmins.length > 0) {
                    superAdminId = superAdmins[0].id;
                    console.log("Found superAdmin ID:", superAdminId);
                  }
                } catch (e) {
                  // Try snake_case
                  const [superAdmins] = await pool.query(
                    'SELECT id FROM super_admins WHERE user_id = ? LIMIT 1',
                    [userId]
                  ) as [RowDataPacket[], any];
                  
                  if (superAdmins.length > 0) {
                    superAdminId = superAdmins[0].id;
                    console.log("Found superAdmin ID using snake_case:", superAdminId);
                  }
                }
              } catch (e) {
                console.error("Error fetching superAdmin:", e);
              }
              
              try {
                // Try both camelCase and snake_case
                try {
                  const [vendors] = await pool.query(
                    'SELECT id FROM vendors WHERE userId = ? LIMIT 1',
                    [userId]
                  ) as [RowDataPacket[], any];
                  
                  if (vendors.length > 0) {
                    vendorId = vendors[0].id;
                    console.log("Found vendor ID:", vendorId);
                  }
                } catch (e) {
                  // Try snake_case
                  const [vendors] = await pool.query(
                    'SELECT id FROM vendors WHERE user_id = ? LIMIT 1',
                    [userId]
                  ) as [RowDataPacket[], any];
                  
                  if (vendors.length > 0) {
                    vendorId = vendors[0].id;
                    console.log("Found vendor ID using snake_case:", vendorId);
                  }
                }
              } catch (e) {
                console.error("Error fetching vendor:", e);
              }
              
              try {
                // Try both camelCase and snake_case
                try {
                  const [customers] = await pool.query(
                    'SELECT id FROM customers WHERE userId = ? LIMIT 1',
                    [userId]
                  ) as [RowDataPacket[], any];
                  
                  if (customers.length > 0) {
                    customerId = customers[0].id;
                    console.log("Found customer ID:", customerId);
                  }
                } catch (e) {
                  // Try snake_case
                  const [customers] = await pool.query(
                    'SELECT id FROM customers WHERE user_id = ? LIMIT 1',
                    [userId]
                  ) as [RowDataPacket[], any];
                  
                  if (customers.length > 0) {
                    customerId = customers[0].id;
                    console.log("Found customer ID using snake_case:", customerId);
                  }
                }
              } catch (e) {
                console.error("Error fetching customer:", e);
              }
              
              try {
                // Try both camelCase and snake_case
                try {
                  const [staff] = await pool.query(
                    'SELECT id FROM staff WHERE userId = ? LIMIT 1',
                    [userId]
                  ) as [RowDataPacket[], any];
                  
                  if (staff.length > 0) {
                    staffId = staff[0].id;
                    console.log("Found staff ID:", staffId);
                  }
                } catch (e) {
                  // Try snake_case
                  const [staff] = await pool.query(
                    'SELECT id FROM staff WHERE user_id = ? LIMIT 1',
                    [userId]
                  ) as [RowDataPacket[], any];
                  
                  if (staff.length > 0) {
                    staffId = staff[0].id;
                    console.log("Found staff ID using snake_case:", staffId);
                  }
                }
              } catch (e) {
                console.error("Error fetching staff:", e);
              }

              const userObject = {
                id: userId,
                name: userName,
                email: userEmail,
                role: userRole,
                // Include role-specific IDs for easier access
                ...(superAdminId && { superAdminId }),
                ...(vendorId && { vendorId }),
                ...(customerId && { customerId }),
                ...(staffId && { staffId }),
              };
              
              console.log("Returning user object:", JSON.stringify(userObject));
              return userObject;
            } catch (passwordError) {
              console.error("Error during password verification:", passwordError);
              throw new Error("Invalid credentials");
            }
          } catch (dbError) {
            console.error("Database error during login:", dbError);
            throw new Error("Database error: " + String(dbError));
          }
        } catch (error) {
          console.error("Final authorization error:", error);
          throw error;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.superAdminId = user.superAdminId;
        token.vendorId = user.vendorId;
        token.customerId = user.customerId;
        token.staffId = user.staffId;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token) {
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
  pages: {
    signIn: "/login",
    error: "/login", // Error code passed in query string as ?error=
  },
  debug: process.env.NODE_ENV === "development",
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
  // Ensure cookie settings are explicit so middleware can reliably read the session cookie
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === 'production' ? '__Secure-next-auth.session-token' : 'next-auth.session-token',
      options: {
        path: '/',
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };

// Type declaration for NextAuth session
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      role: UserRole;
      superAdminId?: string;
      vendorId?: string;
      customerId?: string;
      staffId?: string;
    };
  }
  
  interface User {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    superAdminId?: string;
    vendorId?: string;
    customerId?: string;
    staffId?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: UserRole;
    superAdminId?: string;
    vendorId?: string;
    customerId?: string;
    staffId?: string;
  }
} 