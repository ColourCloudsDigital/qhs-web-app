import NextAuth, { DefaultSession } from "next-auth";
import { UserRole } from "@/lib/types/enums";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: UserRole;
      superAdminId?: string;
      vendorId?: string;
      customerId?: string;
      staffId?: string;
    } & DefaultSession["user"];
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
    emailVerified?: Date | null;
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
