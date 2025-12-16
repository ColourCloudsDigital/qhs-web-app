import { Prisma } from '@prisma/client';

declare global {
  namespace PrismaExtensions {
    // Extend User Model types
    interface UserExtensions {
      emailVerified?: Date | string | null;
      verificationToken?: string | null;
      verificationExpires?: Date | string | null;
      resetToken?: string | null;
      resetExpires?: Date | string | null;
    }
  }
}

// Extend Prisma User input types
declare module '@prisma/client' {
  // Extend User Where Input
  export interface UserWhereInput extends PrismaExtensions.UserExtensions {}
  
  // Extend User Create Input
  export interface UserCreateInput extends PrismaExtensions.UserExtensions {}
  
  // Extend User Update Input
  export interface UserUpdateInput extends PrismaExtensions.UserExtensions {}
  
  // Extend User Unchecked Update Input
  export interface UserUncheckedUpdateInput extends PrismaExtensions.UserExtensions {}
}

export {};