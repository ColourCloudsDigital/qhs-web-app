// lib/services/auth.service.ts
import { hash, compare } from 'bcrypt';
import crypto from 'crypto';
import pool from '@/lib/db';
import { emailService } from './email.service';

// Define UserRole type locally or import from a shared types file
type UserRole = 'SUPERADMIN' | 'ADMIN' | 'VENDOR' | 'STAFF' | 'CUSTOMER';

export const authService = {
  async register(data: {
    name: string;
    email: string;
    password: string;
    role: UserRole;
  }) {
    let connection: any = null;
    try {
      connection = await pool.getConnection();
      await connection.beginTransaction();

      // Check if email already exists
      const checkSql = 'SELECT id FROM User WHERE email = ? LIMIT 1';
      const [existingUsers]: [any[], any] = await connection.query(checkSql, [data.email]);

      if (existingUsers.length > 0) {
        throw new Error('Email already in use');
      }

      // Hash password
      const hashedPassword = await hash(data.password, 10);

      // Create verification token
      const verificationToken = crypto.randomBytes(32).toString('hex');
      const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      // Create user
      const userId = crypto.randomUUID();
      const userSql = `
        INSERT INTO User (id, name, email, password, role, verificationToken, verificationExpires, createdAt, updatedAt, isActive)
        VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW(), FALSE) 
      `;
      await connection.query(userSql, [
        userId,
        data.name,
        data.email,
        hashedPassword,
        data.role,
        verificationToken,
        verificationExpires,
      ]);

      // Create role-specific profile
      if (data.role === 'CUSTOMER') {
        const customerId = crypto.randomUUID();
        const customerSql = 'INSERT INTO Customer (id, userId, createdAt, updatedAt) VALUES (?, ?, NOW(), NOW())';
        await connection.query(customerSql, [customerId, userId]);
      } else if (data.role === 'VENDOR') {
        const vendorId = crypto.randomUUID();
        const vendorSql = 'INSERT INTO Vendor (id, userId, createdAt, updatedAt) VALUES (?, ?, NOW(), NOW())';
        await connection.query(vendorSql, [vendorId, userId]);
      }

      await connection.commit();

      // Send verification email
      await emailService.sendVerificationEmail({
        to: data.email,
        name: data.name,
        token: verificationToken,
      });

      return {
        id: userId,
        name: data.name,
        email: data.email,
        role: data.role,
      };
    } catch (error: any) {
      if (connection) await connection.rollback();
      console.error("Registration failed:", error);
      if (error.message === 'Email already in use') {
        throw error;
      }
      throw new Error('Registration failed due to an internal error.');
    } finally {
      if (connection) connection.release();
    }
  },

  async verifyEmail(token: string) {
    const findSql = 'SELECT id FROM User WHERE verificationToken = ? AND verificationExpires > NOW() LIMIT 1';
    const updateSql = 'UPDATE User SET verificationToken = NULL, verificationExpires = NULL, emailVerified = NOW(), isActive = TRUE WHERE id = ?';

    let connection: any = null;
    try {
      connection = await pool.getConnection();
      await connection.beginTransaction();

      const [users]: [any[], any] = await connection.query(findSql, [token]);

      if (users.length === 0) {
        throw new Error('Invalid or expired verification token');
      }

      const userId = users[0].id;
      const [updateResult]: [any, any] = await connection.query(updateSql, [userId]);

      if (updateResult.affectedRows === 0) {
        throw new Error('Failed to update user verification status.');
      }

      await connection.commit();

      return {
        message: 'Email verified successfully',
      };
    } catch (error: any) {
      if (connection) await connection.rollback();
      console.error("Email verification failed:", error);
      if (error.message === 'Invalid or expired verification token') {
        throw error;
      }
      throw new Error('Email verification failed due to an internal error.');
    } finally {
      if (connection) connection.release();
    }
  },

  async forgotPassword(email: string) {
    const findSql = 'SELECT id, name FROM User WHERE email = ? LIMIT 1';
    const updateSql = 'UPDATE User SET resetToken = ?, resetExpires = ? WHERE id = ?';

    try {
      const [users]: [any[], any] = await pool.query(findSql, [email]);

      if (users.length > 0) {
        const user = users[0];
        // Generate reset token
        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetExpires = new Date(Date.now() + 1 * 60 * 60 * 1000); // 1 hour

        // Save token to user
        await pool.query(updateSql, [resetToken, resetExpires, user.id]);

        // Send reset email
        await emailService.sendPasswordResetEmail({
          to: email,
          name: user.name,
          token: resetToken,
        });
      } else {
        console.log(`Password reset requested for non-existent email: ${email}`);
      }

      return {
        message: 'If an account with that email exists, a password reset link has been sent.',
      };
    } catch (error: any) {
      console.error("Forgot password process failed:", error);
      return {
        message: 'If an account with that email exists, a password reset link has been sent.',
      };
    }
  },

  async resetPassword(token: string, newPassword: string) {
    const findSql = 'SELECT id FROM User WHERE resetToken = ? AND resetExpires > NOW() LIMIT 1';
    const updateSql = 'UPDATE User SET password = ?, resetToken = NULL, resetExpires = NULL WHERE id = ?';

    let connection: any = null;
    try {
      connection = await pool.getConnection();
      await connection.beginTransaction();

      const [users]: [any[], any] = await connection.query(findSql, [token]);

      if (users.length === 0) {
        throw new Error('Invalid or expired reset token');
      }

      const userId = users[0].id;

      // Hash new password
      const hashedPassword = await hash(newPassword, 10);

      // Update user with new password
      const [updateResult]: [any, any] = await connection.query(updateSql, [hashedPassword, userId]);

      if (updateResult.affectedRows === 0) {
        throw new Error('Failed to reset password.');
      }

      await connection.commit();

      return {
        message: 'Password reset successfully',
      };
    } catch (error: any) {
      if (connection) await connection.rollback();
      console.error("Password reset failed:", error);
      if (error.message === 'Invalid or expired reset token') {
        throw error;
      }
      throw new Error('Password reset failed due to an internal error.');
    } finally {
      if (connection) connection.release();
    }
  },

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const findSql = 'SELECT password FROM User WHERE id = ? LIMIT 1';
    const updateSql = 'UPDATE User SET password = ? WHERE id = ?';

    try {
      const [users]: [any[], any] = await pool.query(findSql, [userId]);

      if (users.length === 0) {
        throw new Error('User not found');
      }
      const user = users[0];

      // Verify current password
      const isPasswordValid = await compare(currentPassword, user.password);

      if (!isPasswordValid) {
        throw new Error('Current password is incorrect');
      }

      // Hash new password
      const hashedPassword = await hash(newPassword, 10);

      // Update user with new password
      const [updateResult]: [any, any] = await pool.query(updateSql, [hashedPassword, userId]);

      if (updateResult.affectedRows === 0) {
        throw new Error('Failed to change password.');
      }

      return {
        message: 'Password changed successfully',
      };
    } catch (error: any) {
      console.error(`Password change failed for user ${userId}:`, error);
      if (error.message === 'User not found' || error.message === 'Current password is incorrect') {
        throw error;
      }
      throw new Error('Password change failed due to an internal error.');
    }
  },
};