import { v4 as uuidv4 } from 'uuid';
import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { PaginationParams } from '@/lib/utils';
import { generateQRCode } from './qrcode.service';

export interface MenuCategory {
  id: string;
  hotelId: string;
  name: string;
  description?: string;
  displayOrder: number;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface MenuItem {
  id: string;
  categoryId: string;
  name: string;
  description?: string;
  price: number;
  discountedPrice?: number;
  image?: string;
  ingredients?: string;
  allergens?: string;
  isVegetarian?: boolean;
  isVegan?: boolean;
  isGlutenFree?: boolean;
  isSpicy?: boolean;
  calories?: number;
  preparationTime?: number;
  displayOrder: number;
  isAvailable: boolean;
  isFeatured?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface MenuSettings {
  id: string;
  hotelId: string;
  theme?: string;
  primaryColor?: string;
  secondaryColor?: string;
  fontFamily?: string;
  logoUrl?: string;
  bannerUrl?: string;
  currency?: string;
  showPrices?: boolean;
  enableOrdering?: boolean;
  qrCodeStyle?: string;
  lastUpdated?: Date;
  createdAt?: Date;
}

export class MenuService {
  
  // Category operations
  async getCategoriesByHotelId(hotelId: string): Promise<MenuCategory[]> {
    try {
      const [rows] = await pool.query<RowDataPacket[]>(
        'SELECT * FROM menu_categories WHERE hotelId = ? ORDER BY displayOrder ASC',
        [hotelId]
      );
      
      return rows as MenuCategory[];
    } catch (error) {
      console.error('[MENU SERVICE] Error getting categories:', error);
      throw error;
    }
  }
  
  async createCategory(category: Omit<MenuCategory, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const id = uuidv4();
      
      await pool.query(
        `INSERT INTO menu_categories 
         (id, hotelId, name, description, displayOrder, isActive) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          id,
          category.hotelId,
          category.name,
          category.description || null,
          category.displayOrder,
          category.isActive
        ]
      );
      
      return id;
    } catch (error) {
      console.error('[MENU SERVICE] Error creating category:', error);
      throw error;
    }
  }
  
  async updateCategory(id: string, category: Partial<MenuCategory>): Promise<boolean> {
    try {
      const updateFields: string[] = [];
      const values: any[] = [];
      
      if (category.name !== undefined) {
        updateFields.push('name = ?');
        values.push(category.name);
      }
      
      if (category.description !== undefined) {
        updateFields.push('description = ?');
        values.push(category.description);
      }
      
      if (category.displayOrder !== undefined) {
        updateFields.push('displayOrder = ?');
        values.push(category.displayOrder);
      }
      
      if (category.isActive !== undefined) {
        updateFields.push('isActive = ?');
        values.push(category.isActive);
      }
      
      if (updateFields.length === 0) {
        return false;
      }
      
      values.push(id);
      
      const [result] = await pool.query<ResultSetHeader>(
        `UPDATE menu_categories SET ${updateFields.join(', ')} WHERE id = ?`,
        values
      );
      
      return result.affectedRows > 0;
    } catch (error) {
      console.error('[MENU SERVICE] Error updating category:', error);
      throw error;
    }
  }
  
  async deleteCategory(id: string): Promise<boolean> {
    try {
      const [result] = await pool.query<ResultSetHeader>(
        'DELETE FROM menu_categories WHERE id = ?',
        [id]
      );
      
      return result.affectedRows > 0;
    } catch (error) {
      console.error('[MENU SERVICE] Error deleting category:', error);
      throw error;
    }
  }
  
  // Item operations
  async getItemsByCategoryId(categoryId: string): Promise<MenuItem[]> {
    try {
      const [rows] = await pool.query<RowDataPacket[]>(
        'SELECT * FROM menu_items WHERE categoryId = ? ORDER BY displayOrder ASC',
        [categoryId]
      );
      
      return rows as MenuItem[];
    } catch (error) {
      console.error('[MENU SERVICE] Error getting items:', error);
      throw error;
    }
  }
  
  async getAllItemsByHotelId(hotelId: string): Promise<MenuItem[]> {
    try {
      const [rows] = await pool.query<RowDataPacket[]>(
        `SELECT mi.* 
         FROM menu_items mi
         JOIN menu_categories mc ON mi.categoryId = mc.id
         WHERE mc.hotelId = ?
         ORDER BY mc.displayOrder, mi.displayOrder`,
        [hotelId]
      );
      
      return rows as MenuItem[];
    } catch (error) {
      console.error('[MENU SERVICE] Error getting all items:', error);
      throw error;
    }
  }
  
  async createMenuItem(item: Omit<MenuItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const id = uuidv4();
      
      await pool.query(
        `INSERT INTO menu_items 
         (id, categoryId, name, description, price, discountedPrice, image, 
          ingredients, allergens, isVegetarian, isVegan, isGlutenFree, isSpicy,
          calories, preparationTime, displayOrder, isAvailable, isFeatured) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          item.categoryId,
          item.name,
          item.description || null,
          item.price,
          item.discountedPrice || null,
          item.image || null,
          item.ingredients || null,
          item.allergens || null,
          item.isVegetarian || false,
          item.isVegan || false,
          item.isGlutenFree || false,
          item.isSpicy || false,
          item.calories || null,
          item.preparationTime || null,
          item.displayOrder,
          item.isAvailable,
          item.isFeatured || false
        ]
      );
      
      return id;
    } catch (error) {
      console.error('[MENU SERVICE] Error creating menu item:', error);
      throw error;
    }
  }
  
  async updateMenuItem(id: string, item: Partial<MenuItem>): Promise<boolean> {
    try {
      const updateFields: string[] = [];
      const values: any[] = [];
      
      // Add all possible fields to update
      if (item.categoryId !== undefined) {
        updateFields.push('categoryId = ?');
        values.push(item.categoryId);
      }
      
      if (item.name !== undefined) {
        updateFields.push('name = ?');
        values.push(item.name);
      }
      
      if (item.description !== undefined) {
        updateFields.push('description = ?');
        values.push(item.description);
      }
      
      if (item.price !== undefined) {
        updateFields.push('price = ?');
        values.push(item.price);
      }
      
      if (item.discountedPrice !== undefined) {
        updateFields.push('discountedPrice = ?');
        values.push(item.discountedPrice);
      }
      
      if (item.image !== undefined) {
        updateFields.push('image = ?');
        values.push(item.image);
      }
      
      if (item.ingredients !== undefined) {
        updateFields.push('ingredients = ?');
        values.push(item.ingredients);
      }
      
      if (item.allergens !== undefined) {
        updateFields.push('allergens = ?');
        values.push(item.allergens);
      }
      
      if (item.isVegetarian !== undefined) {
        updateFields.push('isVegetarian = ?');
        values.push(item.isVegetarian);
      }
      
      if (item.isVegan !== undefined) {
        updateFields.push('isVegan = ?');
        values.push(item.isVegan);
      }
      
      if (item.isGlutenFree !== undefined) {
        updateFields.push('isGlutenFree = ?');
        values.push(item.isGlutenFree);
      }
      
      if (item.isSpicy !== undefined) {
        updateFields.push('isSpicy = ?');
        values.push(item.isSpicy);
      }
      
      if (item.calories !== undefined) {
        updateFields.push('calories = ?');
        values.push(item.calories);
      }
      
      if (item.preparationTime !== undefined) {
        updateFields.push('preparationTime = ?');
        values.push(item.preparationTime);
      }
      
      if (item.displayOrder !== undefined) {
        updateFields.push('displayOrder = ?');
        values.push(item.displayOrder);
      }
      
      if (item.isAvailable !== undefined) {
        updateFields.push('isAvailable = ?');
        values.push(item.isAvailable);
      }
      
      if (item.isFeatured !== undefined) {
        updateFields.push('isFeatured = ?');
        values.push(item.isFeatured);
      }
      
      if (updateFields.length === 0) {
        return false;
      }
      
      values.push(id);
      
      const [result] = await pool.query<ResultSetHeader>(
        `UPDATE menu_items SET ${updateFields.join(', ')} WHERE id = ?`,
        values
      );
      
      return result.affectedRows > 0;
    } catch (error) {
      console.error('[MENU SERVICE] Error updating menu item:', error);
      throw error;
    }
  }
  
  async deleteMenuItem(id: string): Promise<boolean> {
    try {
      const [result] = await pool.query<ResultSetHeader>(
        'DELETE FROM menu_items WHERE id = ?',
        [id]
      );
      
      return result.affectedRows > 0;
    } catch (error) {
      console.error('[MENU SERVICE] Error deleting menu item:', error);
      throw error;
    }
  }
  
  // Menu settings operations
  async getMenuSettings(hotelId: string): Promise<MenuSettings | null> {
    try {
      const [rows] = await pool.query<RowDataPacket[]>(
        'SELECT * FROM menu_settings WHERE hotelId = ?',
        [hotelId]
      );
      
      if (rows.length === 0) {
        return null;
      }
      
      return rows[0] as MenuSettings;
    } catch (error) {
      console.error('[MENU SERVICE] Error getting menu settings:', error);
      throw error;
    }
  }
  
  async saveMenuSettings(settings: Omit<MenuSettings, 'id' | 'lastUpdated' | 'createdAt'>): Promise<string> {
    try {
      // Check if settings already exist for this hotel
      const existing = await this.getMenuSettings(settings.hotelId);
      
      if (existing) {
        // Update existing settings
        const updateFields: string[] = [];
        const values: any[] = [];
        
        if (settings.theme !== undefined) {
          updateFields.push('theme = ?');
          values.push(settings.theme);
        }
        
        if (settings.primaryColor !== undefined) {
          updateFields.push('primaryColor = ?');
          values.push(settings.primaryColor);
        }
        
        if (settings.secondaryColor !== undefined) {
          updateFields.push('secondaryColor = ?');
          values.push(settings.secondaryColor);
        }
        
        if (settings.fontFamily !== undefined) {
          updateFields.push('fontFamily = ?');
          values.push(settings.fontFamily);
        }
        
        if (settings.logoUrl !== undefined) {
          updateFields.push('logoUrl = ?');
          values.push(settings.logoUrl);
        }
        
        if (settings.bannerUrl !== undefined) {
          updateFields.push('bannerUrl = ?');
          values.push(settings.bannerUrl);
        }
        
        if (settings.currency !== undefined) {
          updateFields.push('currency = ?');
          values.push(settings.currency);
        }
        
        if (settings.showPrices !== undefined) {
          updateFields.push('showPrices = ?');
          values.push(settings.showPrices);
        }
        
        if (settings.enableOrdering !== undefined) {
          updateFields.push('enableOrdering = ?');
          values.push(settings.enableOrdering);
        }
        
        if (settings.qrCodeStyle !== undefined) {
          updateFields.push('qrCodeStyle = ?');
          values.push(settings.qrCodeStyle);
        }
        
        if (updateFields.length === 0) {
          return existing.id;
        }
        
        values.push(existing.id);
        
        await pool.query(
          `UPDATE menu_settings SET ${updateFields.join(', ')} WHERE id = ?`,
          values
        );
        
        return existing.id;
      } else {
        // Create new settings
        const id = uuidv4();
        
        await pool.query(
          `INSERT INTO menu_settings 
           (id, hotelId, theme, primaryColor, secondaryColor, fontFamily, 
            logoUrl, bannerUrl, currency, showPrices, enableOrdering, qrCodeStyle) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            id,
            settings.hotelId,
            settings.theme || 'default',
            settings.primaryColor || '#1a73e8',
            settings.secondaryColor || '#34a853',
            settings.fontFamily || 'Inter, sans-serif',
            settings.logoUrl || null,
            settings.bannerUrl || null,
            settings.currency || 'NGN',
            settings.showPrices !== undefined ? settings.showPrices : true,
            settings.enableOrdering || false,
            settings.qrCodeStyle || 'standard'
          ]
        );
        
        return id;
      }
    } catch (error) {
      console.error('[MENU SERVICE] Error saving menu settings:', error);
      throw error;
    }
  }
  
  // Access log operations
  async logMenuAccess(hotelId: string, ip?: string, userAgent?: string, referrer?: string): Promise<void> {
    try {
      const id = uuidv4();
      
      await pool.query(
        `INSERT INTO menu_access_logs 
         (id, hotelId, ip, userAgent, referrer) 
         VALUES (?, ?, ?, ?, ?)`,
        [
          id,
          hotelId,
          ip || null,
          userAgent || null,
          referrer || null
        ]
      );
    } catch (error) {
      console.error('[MENU SERVICE] Error logging menu access:', error);
      // Don't throw here, just log the error
    }
  }
  
  async getMenuAccessStats(hotelId: string, days: number = 30): Promise<{ date: string; count: number }[]> {
    try {
      const [rows] = await pool.query<RowDataPacket[]>(
        `SELECT 
           DATE(accessedAt) as date, 
           COUNT(*) as count 
         FROM menu_access_logs 
         WHERE hotelId = ? AND accessedAt >= DATE_SUB(CURDATE(), INTERVAL ? DAY) 
         GROUP BY DATE(accessedAt) 
         ORDER BY date`,
        [hotelId, days]
      );
      
      return rows as { date: string; count: number }[];
    } catch (error) {
      console.error('[MENU SERVICE] Error getting menu access stats:', error);
      throw error;
    }
  }
  
  // Check if hotel has QR Menu access based on subscription
  async checkMenuAccess(hotelId: string, vendorId: string): Promise<boolean> {
    try {
      // Get the vendor's subscription plan
      const [subscriptionRows] = await pool.query<RowDataPacket[]>(
        `SELECT sp.id as planId
         FROM vendors v
         JOIN subscription_plans sp ON v.subscriptionPlanId = sp.id
         WHERE v.id = ?`,
        [vendorId]
      );
      
      if (subscriptionRows.length === 0) {
        return false;
      }
      
      const planId = subscriptionRows[0].planId;
      
      // Check if the plan includes QR Menu module
      const [moduleRows] = await pool.query<RowDataPacket[]>(
        `SELECT pf.isIncluded, pf.limits
         FROM plan_features pf
         JOIN modules m ON pf.moduleId = m.id
         WHERE pf.planId = ? AND m.name = 'QR Menu'`,
        [planId]
      );
      
      if (moduleRows.length === 0) {
        return false;
      }
      
      return moduleRows[0].isIncluded === 1;
    } catch (error) {
      console.error('[MENU SERVICE] Error checking menu access:', error);
      return false;
    }
  }
  
  // Get full menu data for the hotel (for the customer-facing view)
  async getFullMenu(hotelId: string): Promise<{ categories: (MenuCategory & { items: MenuItem[] })[]; settings: MenuSettings | null }> {
    try {
      const categories = await this.getCategoriesByHotelId(hotelId);
      const categoriesWithItems: (MenuCategory & { items: MenuItem[] })[] = [];
      
      for (const category of categories) {
        const items = await this.getItemsByCategoryId(category.id);
        categoriesWithItems.push({
          ...category,
          items
        });
      }
      
      const settings = await this.getMenuSettings(hotelId);
      
      return {
        categories: categoriesWithItems,
        settings
      };
    } catch (error) {
      console.error('[MENU SERVICE] Error getting full menu:', error);
      throw error;
    }
  }
  
  /**
   * Get menu categories with items for a specific hotel
   */
  async getMenuCategoriesWithItems(hotelId: string): Promise<(MenuCategory & { items: MenuItem[] })[]> {
    try {
      console.log(`[MENU SERVICE] Getting menu categories with items for hotel: ${hotelId}`);
      const categories = await this.getCategoriesByHotelId(hotelId);
      const categoriesWithItems: (MenuCategory & { items: MenuItem[] })[] = [];
      
      for (const category of categories) {
        const items = await this.getItemsByCategoryId(category.id);
        categoriesWithItems.push({
          ...category,
          items
        });
      }
      
      return categoriesWithItems;
    } catch (error) {
      console.error('[MENU SERVICE] Error getting menu categories with items:', error);
      throw error;
    }
  }
  
  /**
   * Track a menu view
   */
  async trackMenuView(hotelId: string, data: { 
    userAgent?: string; 
    referrer?: string; 
    device?: 'desktop' | 'mobile' | 'tablet' | 'unknown' 
  }): Promise<void> {
    try {
      console.log(`[MENU SERVICE] Tracking menu view for hotel: ${hotelId}`);
      
      const device = data.device || 'unknown';
      const ip = '0.0.0.0'; // We don't track actual IPs for privacy
      
      // Log basic access without sensitive information
      await this.logMenuAccess(hotelId, ip, data.userAgent, data.referrer);
      
      // Also update device-specific stats
      try {
        await pool.query(
          `INSERT INTO menu_view_stats (hotelId, viewDate, deviceType, count)
           VALUES (?, CURRENT_DATE(), ?, 1)
           ON DUPLICATE KEY UPDATE count = count + 1`,
          [hotelId, device]
        );
      } catch (statsError) {
        console.error('[MENU SERVICE] Error updating device stats:', statsError);
        // Continue execution, this is non-critical
      }
      
    } catch (error) {
      console.error('[MENU SERVICE] Error tracking menu view:', error);
      // We don't want to throw here, as this is a non-critical operation
    }
  }
  
  /**
   * Get device-specific view statistics for a menu
   */
  async getMenuViewsByDevice(hotelId: string, days: number = 30): Promise<{ 
    desktop: number; 
    mobile: number; 
    tablet: number; 
    unknown: number; 
    totalViews: number 
  }> {
    try {
      const [rows] = await pool.query<RowDataPacket[]>(
        `SELECT deviceType, SUM(count) as count
         FROM menu_view_stats
         WHERE hotelId = ? AND viewDate >= DATE_SUB(CURRENT_DATE(), INTERVAL ? DAY)
         GROUP BY deviceType`,
        [hotelId, days]
      );
      
      const result = {
        desktop: 0,
        mobile: 0,
        tablet: 0,
        unknown: 0,
        totalViews: 0
      };
      
      rows.forEach((row: RowDataPacket) => {
        const deviceType = row.deviceType as keyof typeof result;
        const count = Number(row.count) || 0;
        
        if (deviceType in result) {
          result[deviceType] = count;
        } else {
          result.unknown += count;
        }
        
        result.totalViews += count;
      });
      
      return result;
    } catch (error) {
      console.error('[MENU SERVICE] Error getting menu views by device:', error);
      return { desktop: 0, mobile: 0, tablet: 0, unknown: 0, totalViews: 0 };
    }
  }
}

export default new MenuService();