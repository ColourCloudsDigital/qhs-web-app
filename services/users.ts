// services/users.ts
import pool from '@/lib/db';
import { UserRole } from '@/lib/types/enums';
import * as bcrypt from 'bcrypt';
import { RowDataPacket } from 'mysql2';

type UserCreateInput = {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  isActive?: boolean;
  vendor?: any;
  customer?: any;
  staff?: any;
};

type UserUpdateInput = {
  name?: string;
  email?: string;
  password?: string;
  role?: UserRole;
  isActive?: boolean;
  vendor?: any;
  customer?: any;
  staff?: any;
};

export class UserService {
  // Get users with pagination, filtering and sorting
  static async getUsers({
    page = 1,
    pageSize = 10,
    sortColumn = 'createdAt',
    sortDirection = 'desc',
    search = '',
    role = undefined,
    isActive = undefined,
  }: {
    page?: number;
    pageSize?: number;
    sortColumn?: string;
    sortDirection?: 'asc' | 'desc';
    search?: string;
    role?: UserRole | undefined;
    isActive?: boolean | undefined;
  }) {
    // Calculate skip value for pagination
    const skip = (page - 1) * pageSize;

    // Build query for MySQL
    let whereClause = 'WHERE 1=1';
    const params: any[] = [];
    
    // Add search filter if provided
    if (search) {
      whereClause += ' AND (name LIKE ? OR email LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }
    
    // Add role filter if provided
    if (role) {
      whereClause += ' AND role = ?';
      params.push(role);
    }
    
    // Add isActive filter if provided
    if (isActive !== undefined) {
      whereClause += ' AND isActive = ?';
      params.push(isActive);
    }

    // Count total users matching filter for pagination
    const [countRows] = await pool.query(
      `SELECT COUNT(*) as total FROM users ${whereClause}`,
      params
    ) as [RowDataPacket[], any];
    const totalUsers = countRows[0].total;

    // Fetch users with pagination and sorting
    const [users] = await pool.query(
      `SELECT * FROM users ${whereClause} 
       ORDER BY ${sortColumn} ${sortDirection}
       LIMIT ? OFFSET ?`,
      [...params, pageSize, skip]
    ) as [RowDataPacket[], any];

    // Get additional data for each user
    const formattedUsers = await Promise.all(users.map(async (user: any) => {
      // Get vendor data if exists
      let vendor = null;
      const [vendorRows] = await pool.query(
        'SELECT id, subscriptionStatus FROM vendors WHERE userId = ?',
        [user.id]
      ) as [RowDataPacket[], any];
      if (vendorRows.length > 0) {
        vendor = vendorRows[0];
      }

      // Get customer data if exists
      let customer = null;
      const [customerRows] = await pool.query(
        'SELECT id, phone FROM customers WHERE userId = ?',
        [user.id]
      ) as [RowDataPacket[], any];
      if (customerRows.length > 0) {
        customer = customerRows[0];
      }

      // Get staff data if exists
      let staff = null;
      const [staffRows] = await pool.query(
        `SELECT s.*, v.companyName as vendorName 
         FROM staff s 
         LEFT JOIN vendors v ON s.vendorId = v.id 
         WHERE s.userId = ?`,
        [user.id]
      ) as [RowDataPacket[], any];
      if (staffRows.length > 0) {
        staff = staffRows[0];
      }

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
        isActive: user.isActive,
        lastLoginAt: user.lastLoginAt,
        ...(vendor && { vendor }),
        ...(customer && { customer }),
        ...(staff && { staff }),
      };
    }));

    return {
      users: formattedUsers,
      total: totalUsers,
      page,
      pageSize,
      totalPages: Math.ceil(totalUsers / pageSize),
    };
  }

  // Get a single user by ID
  static async getUserById(userId: string) {
    const [userRows] = await pool.query(
      'SELECT id, name, email, role, isActive, createdAt, updatedAt, lastLoginAt, emailVerified FROM users WHERE id = ?',
      [userId]
    ) as [RowDataPacket[], any];

    if (userRows.length === 0) {
      throw new Error('User not found');
    }

    const user = userRows[0];

    // Get vendor data if exists
    const [vendorRows] = await pool.query(
      `SELECT v.*, sp.name as subscriptionPlanName
       FROM vendors v
       LEFT JOIN subscription_plans sp ON v.subscriptionPlanId = sp.id
       WHERE v.userId = ?`,
      [userId]
    ) as [RowDataPacket[], any];
    
    // Get customer data if exists
    const [customerRows] = await pool.query(
      'SELECT id, phone, address FROM customers WHERE userId = ?',
      [userId]
    ) as [RowDataPacket[], any];
    
    // Get staff data if exists
    const [staffRows] = await pool.query(
      `SELECT s.*, v.companyName as vendorName 
       FROM staff s 
       LEFT JOIN vendors v ON s.vendorId = v.id 
       WHERE s.userId = ?`,
      [userId]
    ) as [RowDataPacket[], any];
    
    // Get superAdmin data if exists
    const [adminRows] = await pool.query(
      'SELECT * FROM super_admins WHERE userId = ?',
      [userId]
    ) as [RowDataPacket[], any];

    // Remove sensitive data
    const { password, ...userWithoutPassword } = user;
    
    // Process customer data
    let customerData = null;
    if (customerRows.length > 0) {
      customerData = customerRows[0];
    }
    
    // Process vendor data to map businessPhone field
    let vendorData = null;
    if (vendorRows.length > 0) {
      vendorData = {
        ...vendorRows[0],
        businessPhone: vendorRows[0].businessPhone
      };
    }
    
    return {
      ...userWithoutPassword,
      vendor: vendorData,
      customer: customerData,
      staff: staffRows.length > 0 ? staffRows[0] : null,
      superAdmin: adminRows.length > 0 ? adminRows[0] : null,
    };
  }

  // Create a new user
  static async createUser(data: UserCreateInput): Promise<any> {
    // Check if user with this email already exists
    const [existingUserRows] = await pool.query(
      'SELECT * FROM users WHERE email = ?',
      [data.email]
    ) as [RowDataPacket[], any];

    if (existingUserRows.length > 0) {
      throw new Error('User with this email already exists');
    }

    // Validate vendor has company name
    if (data.role === UserRole.VENDOR && (!data.vendor || !data.vendor.companyName)) {
      throw new Error('Company name is required for vendor accounts');
    }

    // Validate staff has vendor associated
    if (data.role === UserRole.STAFF && (!data.staff || !data.staff.vendorId)) {
      throw new Error('Staff must be associated with a vendor');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // Get connection for transaction
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      
      // Create the base user
      const [userResult] = await connection.query(
        `INSERT INTO users (id, name, email, password, role, isActive, createdAt, updatedAt) 
         VALUES (UUID(), ?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          data.name,
          data.email,
          hashedPassword,
          data.role,
          data.isActive !== undefined ? data.isActive : true
        ]
      );
      
      // Get the inserted user ID
      const [userRows] = await connection.query(
        'SELECT * FROM users WHERE email = ?',
        [data.email]
      ) as [RowDataPacket[], any];
      
      const userId = userRows[0].id;

      // Create role-specific profile
      switch (data.role) {
        case UserRole.VENDOR:
          // Check subscription plan status
          let subscriptionStatus = 'pending';
          if (data.vendor.subscriptionPlanId) {
            subscriptionStatus = 'active';
          }
          
          await connection.query(
            `INSERT INTO vendors (id, userId, companyName, businessAddress, businessPhone, taxId, subscriptionStatus, subscriptionPlanId) 
             VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?)`,
            [
              userId,
              data.vendor.companyName,
              data.vendor.businessAddress || null,
              data.vendor.businessPhone || null,
              data.vendor.taxId || null,
              subscriptionStatus,
              data.vendor.subscriptionPlanId || null
            ]
          );
          break;
        case UserRole.CUSTOMER:
          await connection.query(
            `INSERT INTO customers (id, userId, phone, address) 
             VALUES (UUID(), ?, ?, ?)`,
            [
              userId,
              data.customer?.phone || null,
              data.customer?.address || null
            ]
          );
          break;
        case UserRole.STAFF:
          // Verify the vendorId exists
          const [vendorRows] = await connection.query(
            'SELECT * FROM vendors WHERE id = ?',
            [data.staff.vendorId]
          ) as [RowDataPacket[], any];
          
          if (vendorRows.length === 0) {
            throw new Error('Selected vendor does not exist');
          }
          
          await connection.query(
            `INSERT INTO staff (id, userId, jobTitle, vendorId) 
             VALUES (UUID(), ?, ?, ?)`,
            [
              userId,
              data.staff.position || 'Staff Member',
              data.staff.vendorId
            ]
          );
          break;
        case UserRole.SUPER_ADMIN:
          await connection.query(
            `INSERT INTO super_admins (id, userId) 
             VALUES (UUID(), ?)`,
            [userId]
          );
          break;
      }

      await connection.commit();
      
      // Return created user without password
      const { password, ...userWithoutPassword } = userRows[0];
      return userWithoutPassword;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  // Update an existing user
  static async updateUser(userId: string, data: UserUpdateInput): Promise<any> {
    // Check if user exists
    const existingUser = await pool.query(
      'SELECT * FROM users WHERE id = ?',
      [userId]
    ) as [RowDataPacket[], any];

    if (existingUser[0].length === 0) {
      throw new Error('User not found');
    }

    // Check email uniqueness if being changed
    if (data.email && data.email !== existingUser[0][0].email) {
      const [emailTakenRows] = await pool.query(
        'SELECT * FROM users WHERE email = ?',
        [data.email]
      ) as [RowDataPacket[], any];

      if (emailTakenRows.length > 0) {
        throw new Error('Email is already taken');
      }
    }

    // Validate vendor has company name if updating to vendor or updating vendor data
    if ((data.role === UserRole.VENDOR || existingUser[0][0].role === UserRole.VENDOR) && 
        data.vendor && !data.vendor.companyName && 
        (!existingUser[0][0].vendor || !existingUser[0][0].vendor.companyName)) {
      throw new Error('Company name is required for vendor accounts');
    }

    // Validate staff has vendor associated if updating to staff or updating staff data
    if ((data.role === UserRole.STAFF || existingUser[0][0].role === UserRole.STAFF) && 
        data.staff && !data.staff.vendorId && 
        (!existingUser[0][0].staff || !existingUser[0][0].staff.vendorId)) {
      throw new Error('Staff must be associated with a vendor');
    }

    // Hash password if provided
    let hashedPassword: string | undefined;
    if (data.password) {
      hashedPassword = await bcrypt.hash(data.password, 10);
    }

    // Update user in a transaction to handle role changes
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      
      // Update basic user data
      const [userResult] = await connection.query(
        `UPDATE users SET name = ?, email = ?, password = ?, isActive = ? 
         WHERE id = ?`,
        [
          data.name || existingUser[0][0].name,
          data.email || existingUser[0][0].email,
          hashedPassword || existingUser[0][0].password,
          data.isActive !== undefined ? data.isActive : existingUser[0][0].isActive,
          userId
        ]
      );

      // Handle role change if needed
      if (data.role && data.role !== existingUser[0][0].role) {
        // Update user role
        await connection.query(
          `UPDATE users SET role = ? WHERE id = ?`,
          [data.role, userId]
        );

        // Create appropriate role-specific profile based on new role
        switch (data.role) {
          case UserRole.VENDOR:
            // Additional validation for vendor
            if (!data.vendor || !data.vendor.companyName) {
              throw new Error('Company name is required for vendor accounts');
            }
            
            const [vendorExists] = await connection.query(
              'SELECT * FROM vendors WHERE userId = ?',
              [userId]
            ) as [RowDataPacket[], any];
            
            if (vendorExists.length === 0) {
              // Check subscription plan status
              let subscriptionStatus = 'pending';
              if (data.vendor.subscriptionPlanId) {
                subscriptionStatus = 'active';
              }
              
              await connection.query(
                `INSERT INTO vendors (id, userId, companyName, businessAddress, businessPhone, taxId, subscriptionStatus, subscriptionPlanId) 
                 VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?)`,
                [
                  userId,
                  data.vendor.companyName,
                  data.vendor.businessAddress || null,
                  data.vendor.businessPhone || null,
                  data.vendor.taxId || null,
                  subscriptionStatus,
                  data.vendor.subscriptionPlanId || null
                ]
              );
            }
            break;
          case UserRole.CUSTOMER:
            const [customerExists] = await connection.query(
              'SELECT * FROM customers WHERE userId = ?',
              [userId]
            ) as [RowDataPacket[], any];
            
            if (customerExists.length === 0) {
              await connection.query(
                `INSERT INTO customers (id, userId, phone, address) 
                 VALUES (UUID(), ?, ?, ?)`,
                [
                  userId,
                  data.customer?.phone || null,
                  data.customer?.address || null
                ]
              );
            }
            break;
          case UserRole.STAFF:
            // Additional validation for staff
            if (!data.staff || !data.staff.vendorId) {
              throw new Error('Staff must be associated with a vendor');
            }
            
            // Verify the vendorId exists
            const [vendorRows] = await connection.query(
              'SELECT * FROM vendors WHERE id = ?',
              [data.staff.vendorId]
            ) as [RowDataPacket[], any];
            
            if (vendorRows.length === 0) {
              throw new Error('Selected vendor does not exist');
            }
            
            const [staffExists] = await connection.query(
              'SELECT * FROM staff WHERE userId = ?',
              [userId]
            ) as [RowDataPacket[], any];
            
            if (staffExists.length === 0) {
              await connection.query(
                `INSERT INTO staff (id, userId, jobTitle, vendorId) 
                 VALUES (UUID(), ?, ?, ?)`,
                [
                  userId,
                  data.staff.position || 'Staff Member',
                  data.staff.vendorId
                ]
              );
            }
            break;
          case UserRole.SUPER_ADMIN:
            const [adminExists] = await connection.query(
              'SELECT * FROM super_admins WHERE userId = ?',
              [userId]
            ) as [RowDataPacket[], any];
            
            if (adminExists.length === 0) {
              await connection.query(
                `INSERT INTO super_admins (id, userId) 
                 VALUES (UUID(), ?)`,
                [userId]
              );
            }
            break;
        }
      }

      // Update role-specific data if provided
      if (data.vendor && existingUser[0][0].role === UserRole.VENDOR) {
        // Validate company name is not being removed
        if (data.vendor.companyName === null || data.vendor.companyName === '') {
          throw new Error('Company name cannot be removed for vendor accounts');
        }
        
        // Check subscription plan status
        let subscriptionStatus = 'pending';
        if (data.vendor.subscriptionPlanId) {
          subscriptionStatus = 'active';
        }
        
        await connection.query(
          `UPDATE vendors SET companyName = ?, businessAddress = ?, businessPhone = ?, taxId = ?, subscriptionStatus = ?, subscriptionPlanId = ? 
           WHERE userId = ?`,
          [
            data.vendor.companyName,
            data.vendor.businessAddress || null,
            data.vendor.businessPhone || null,
            data.vendor.taxId || null,
            subscriptionStatus,
            data.vendor.subscriptionPlanId || null,
            userId
          ]
        );
      }

      if (data.customer && existingUser[0][0].role === UserRole.CUSTOMER) {
        await connection.query(
          `UPDATE customers SET phone = ?, address = ? 
           WHERE userId = ?`,
          [
            data.customer.phone || null,
            data.customer.address || null,
            userId
          ]
        );
      }

      if (data.staff && existingUser[0][0].role === UserRole.STAFF) {
        // Validate staff is not being disconnected from vendor
        if (data.staff.vendorId === null) {
          throw new Error('Staff must be associated with a vendor');
        }
        
        // If changing vendor, verify the new vendor exists
        if (data.staff.vendorId && data.staff.vendorId !== existingUser[0][0].staff.vendorId) {
          const [vendorRows] = await connection.query(
            'SELECT * FROM vendors WHERE id = ?',
            [data.staff.vendorId]
          ) as [RowDataPacket[], any];
          
          if (vendorRows.length === 0) {
            throw new Error('Selected vendor does not exist');
          }
        }
        
        await connection.query(
          `UPDATE staff SET jobTitle = ?, vendorId = ? 
           WHERE userId = ?`,
          [
            data.staff.position || 'Staff Member',
            data.staff.vendorId,
            userId
          ]
        );
      }

      await connection.commit();
      
      // Return updated user without password
      const { password, ...userWithoutPassword } = existingUser[0][0];
      return userWithoutPassword;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      // Fix connection leak by releasing the connection
      connection.release();
    }
  }

  // Delete a user
  static async deleteUser(userId: string, currentUserId: string) {
    // Check if user exists
    const [userRows] = await pool.query(
      'SELECT * FROM users WHERE id = ?',
      [userId]
    ) as [RowDataPacket[], any];

    if (userRows.length === 0) {
      throw new Error('User not found');
    }

    // Prevent deleting own account
    if (userId === currentUserId) {
      throw new Error('Cannot delete your own account');
    }

    // Delete user
    await pool.query(
      'DELETE FROM users WHERE id = ?',
      [userId]
    );

    return { success: true };
  }
  
  // Fetch all vendors (for vendor selection in staff form)
  static async getAllVendors() {
    try {
      const sql = `
        SELECT 
          v.id, 
          v.companyName, 
          u.name, 
          u.email 
        FROM 
          vendors v 
        JOIN 
          users u ON v.userId = u.id
      `;
      
      const [vendors] = await pool.query(sql) as [RowDataPacket[], any];
      
      return vendors.map((vendor: any) => ({
        id: vendor.id,
        name: vendor.companyName || vendor.name,
        email: vendor.email,
      }));
    } catch (error) {
      console.error('Error fetching vendors:', error);
      return [];
    }
  }
}