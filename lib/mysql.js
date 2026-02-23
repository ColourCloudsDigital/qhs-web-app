// MySQL client implementation for database operations
import pool from './db.js';

// Helper function to execute SQL queries
async function executeQuery(sql, params = []) {
  try {
    const [rows] = await pool.execute(sql, params);
    return rows;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

// This object provides MySQL database operations with a familiar API
const mysql = {
  // Helper function to execute SQL queries
  query: executeQuery,

  // MySQL transaction method
  async $transaction(operations) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      
      // If operations is an array of functions, execute them in sequence
      const results = Array.isArray(operations) 
        ? await Promise.all(operations.map(op => typeof op === 'function' ? op() : op))
        : await operations(connection);
      
      await connection.commit();
      return results;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },

  // User model
  user: {
    findUnique: async ({ where, include }) => {
      let user = null;
      
      // Get the basic user
      if (where.id) {
        const users = await executeQuery('SELECT * FROM users WHERE id = ? LIMIT 1', [where.id]);
        user = users[0] || null;
      } else if (where.email) {
        const users = await executeQuery('SELECT * FROM users WHERE email = ? LIMIT 1', [where.email]);
        user = users[0] || null;
      }
      
      if (!user) return null;
      
      // Handle includes if present
      if (include) {
        // Include superAdmin details if requested
        if (include.superAdmin) {
          const superAdmins = await executeQuery(
            'SELECT * FROM super_admins WHERE userId = ? LIMIT 1', 
            [user.id]
          );
          user.superAdmin = superAdmins[0] || null;
        }
        
        // Include vendor details if requested
        if (include.vendor) {
          const vendors = await executeQuery(
            'SELECT * FROM vendors WHERE userId = ? LIMIT 1', 
            [user.id]
          );
          user.vendor = vendors[0] || null;
        }
        
        // Include customer details if requested
        if (include.customer) {
          const customers = await executeQuery(
            'SELECT * FROM customers WHERE userId = ? LIMIT 1', 
            [user.id]
          );
          user.customer = customers[0] || null;
        }
        
        // Include staff details if requested
        if (include.staff) {
          const staffMembers = await executeQuery(
            'SELECT * FROM staff WHERE userId = ? LIMIT 1', 
            [user.id]
          );
          user.staff = staffMembers[0] || null;
        }
      }
      
      return user;
    },
    
    findFirst: async ({ where, orderBy, select, include }) => {
      // Build a dynamic query based on where conditions
      let sql = 'SELECT * FROM users WHERE 1=1';
      const params = [];

      // Add where conditions
      if (where) {
        Object.entries(where).forEach(([key, value]) => {
          sql += ` AND ${key} = ?`;
          params.push(value);
        });
      }

      // Add order by
      if (orderBy) {
        const [field, direction] = Object.entries(orderBy)[0];
        sql += ` ORDER BY ${field} ${direction}`;
      }

      sql += ' LIMIT 1';

      const users = await executeQuery(sql, params);
      const user = users[0] || null;
      
      if (!user) return null;
      
      // Handle includes if present
      if (include && user) {
        // Similar include logic as findUnique
        if (include.superAdmin) {
          const superAdmins = await executeQuery(
            'SELECT * FROM super_admins WHERE userId = ? LIMIT 1', 
            [user.id]
          );
          user.superAdmin = superAdmins[0] || null;
        }
        
        // Include other relations as needed
        // ...
      }
      
      return user;
    },
    
    findMany: async ({ where, orderBy, take, skip, include }) => {
      let sql = 'SELECT * FROM users WHERE 1=1';
      const params = [];

      // Add where conditions
      if (where) {
        Object.entries(where).forEach(([key, value]) => {
          if (value === null) {
            sql += ` AND ${key} IS NULL`;
          } else {
            sql += ` AND ${key} = ?`;
            params.push(value);
          }
        });
      }

      // Add order by
      if (orderBy) {
        const [field, direction] = Object.entries(orderBy)[0];
        sql += ` ORDER BY ${field} ${direction}`;
      }

      // Add pagination
      if (take) {
        sql += ' LIMIT ?';
        params.push(parseInt(take));

        if (skip) {
          sql += ' OFFSET ?';
          params.push(parseInt(skip));
        }
      }

      const users = await executeQuery(sql, params);
      
      // Handle includes if present
      if (include && users.length > 0) {
        // We need a more efficient approach for findMany with includes
        // For each user, load the included relations
        const userIds = users.map(user => user.id);
        
        if (include.superAdmin) {
          const superAdmins = await executeQuery(
            'SELECT * FROM super_admins WHERE userId IN (?)', 
            [userIds]
          );
          
          // Map super admins to their users
          const superAdminMap = {};
          superAdmins.forEach(admin => {
            superAdminMap[admin.userId] = admin;
          });
          
          // Add super admin to each user
          users.forEach(user => {
            user.superAdmin = superAdminMap[user.id] || null;
          });
        }
        
        // Add other includes as needed...
      }
      
      return users;
    },
    
    create: async ({ data }) => {
      const keys = Object.keys(data);
      const values = Object.values(data);
      const placeholders = keys.map(() => '?').join(', ');
      
      const sql = `
        INSERT INTO users (${keys.join(', ')}) 
        VALUES (${placeholders})
      `;
      
      const result = await executeQuery(sql, values);
      return { ...data, id: result.insertId };
    },
    
    update: async ({ where, data }) => {
      const keys = Object.keys(data);
      const values = Object.values(data);
      const setClause = keys.map(key => `${key} = ?`).join(', ');
      
      let sql = `UPDATE users SET ${setClause} WHERE `;
      let whereValues = [];
      
      if (where.id) {
        sql += 'id = ?';
        whereValues.push(where.id);
      } else if (where.email) {
        sql += 'email = ?';
        whereValues.push(where.email);
      }
      
      await executeQuery(sql, [...values, ...whereValues]);
      
      // Fetch the updated record by calling findUnique directly
      const updatedUser = await executeQuery(
        where.id ? 'SELECT * FROM users WHERE id = ? LIMIT 1' : 'SELECT * FROM users WHERE email = ? LIMIT 1',
        [where.id || where.email]
      );
      return updatedUser[0] || null;
    },
    
    delete: async ({ where }) => {
      let sql = 'DELETE FROM users WHERE ';
      let whereValues = [];
      
      if (where.id) {
        sql += 'id = ?';
        whereValues.push(where.id);
      } else if (where.email) {
        sql += 'email = ?';
        whereValues.push(where.email);
      }
      
      await executeQuery(sql, whereValues);
      return { id: where.id };
    },
    
    count: async ({ where }) => {
      let sql = 'SELECT COUNT(*) as count FROM users WHERE 1=1';
      const params = [];

      // Add where conditions
      if (where) {
        Object.entries(where).forEach(([key, value]) => {
          sql += ` AND ${key} = ?`;
          params.push(value);
        });
      }

      const result = await executeQuery(sql, params);
      return result[0].count;
    }
  },

  // Hotel model
  hotel: {
    findUnique: async ({ where, include }) => {
      let hotel = null;
      
      if (where.id) {
        const hotels = await executeQuery('SELECT * FROM hotels WHERE id = ? LIMIT 1', [where.id]);
        hotel = hotels[0] || null;
      }
      
      if (!hotel) return null;
      
      // Handle includes
      if (include) {
        if (include.vendor) {
          const vendors = await executeQuery('SELECT * FROM vendors WHERE id = ? LIMIT 1', [hotel.vendorId]);
          hotel.vendor = vendors[0] || null;
        }
        
        if (include.rooms) {
          const rooms = await executeQuery('SELECT * FROM rooms WHERE hotelId = ?', [hotel.id]);
          hotel.rooms = rooms;
        }
        
        if (include.amenities) {
          const amenities = await executeQuery(`
            SELECT a.* FROM amenities a 
            JOIN hotel_amenities ha ON a.id = ha.amenityId 
            WHERE ha.hotelId = ?
          `, [hotel.id]);
          hotel.amenities = amenities;
        }
      }
      
      return hotel;
    },
    
    findMany: async ({ where, orderBy, take, skip, include }) => {
      let sql = 'SELECT * FROM hotels WHERE 1=1';
      const params = [];

      // Add where conditions
      if (where) {
        Object.entries(where).forEach(([key, value]) => {
          if (value === null) {
            sql += ` AND ${key} IS NULL`;
          } else {
            sql += ` AND ${key} = ?`;
            params.push(value);
          }
        });
      }

      // Add order by
      if (orderBy) {
        const [field, direction] = Object.entries(orderBy)[0];
        sql += ` ORDER BY ${field} ${direction}`;
      }

      // Add pagination
      if (take) {
        sql += ' LIMIT ?';
        params.push(parseInt(take));

        if (skip) {
          sql += ' OFFSET ?';
          params.push(parseInt(skip));
        }
      }

      const hotels = await executeQuery(sql, params);
      
      // Handle includes
      if (include && hotels.length > 0) {
        const hotelIds = hotels.map(hotel => hotel.id);
        
        if (include.vendor) {
          // Get all vendors for these hotels
          const vendorIds = [...new Set(hotels.map(hotel => hotel.vendorId))];
          const vendors = await executeQuery('SELECT * FROM vendors WHERE id IN (?)', [vendorIds]);
          
          const vendorMap = {};
          vendors.forEach(vendor => {
            vendorMap[vendor.id] = vendor;
          });
          
          hotels.forEach(hotel => {
            hotel.vendor = vendorMap[hotel.vendorId] || null;
          });
        }
        
        if (include.rooms) {
          const rooms = await executeQuery('SELECT * FROM rooms WHERE hotelId IN (?)', [hotelIds]);
          
          const roomsByHotel = {};
          rooms.forEach(room => {
            if (!roomsByHotel[room.hotelId]) {
              roomsByHotel[room.hotelId] = [];
            }
            roomsByHotel[room.hotelId].push(room);
          });
          
          hotels.forEach(hotel => {
            hotel.rooms = roomsByHotel[hotel.id] || [];
          });
        }
        
        if (include.amenities) {
          const amenityQuery = `
            SELECT a.*, ha.hotelId FROM amenities a 
            JOIN hotel_amenities ha ON a.id = ha.amenityId 
            WHERE ha.hotelId IN (?)
          `;
          
          const amenities = await executeQuery(amenityQuery, [hotelIds]);
          
          const amenitiesByHotel = {};
          amenities.forEach(amenity => {
            if (!amenitiesByHotel[amenity.hotelId]) {
              amenitiesByHotel[amenity.hotelId] = [];
            }
            amenitiesByHotel[amenity.hotelId].push(amenity);
          });
          
          hotels.forEach(hotel => {
            hotel.amenities = amenitiesByHotel[hotel.id] || [];
          });
        }
      }
      
      return hotels;
    },
    
    create: async ({ data }) => {
      // Extract amenities to handle separately if they exist
      const { amenities, ...hotelData } = data;
      
      const keys = Object.keys(hotelData);
      const values = Object.values(hotelData);
      const placeholders = keys.map(() => '?').join(', ');
      
      const sql = `
        INSERT INTO hotels (${keys.join(', ')}) 
        VALUES (${placeholders})
      `;
      
      const result = await executeQuery(sql, values);
      const hotelId = result.insertId;
      
      // Handle amenities if provided
      if (amenities && amenities.length > 0) {
        const amenityValues = amenities.map(amenityId => [hotelId, amenityId]);
        const amenitySql = `
          INSERT INTO hotel_amenities (hotelId, amenityId) 
          VALUES ?
        `;
        
        await executeQuery(amenitySql, [amenityValues]);
      }
      
      return { ...hotelData, id: hotelId };
    },
    
    update: async ({ where, data }) => {
      // Extract amenities to handle separately if they exist
      const { amenities, ...hotelData } = data;
      
      if (Object.keys(hotelData).length > 0) {
        const keys = Object.keys(hotelData);
        const values = Object.values(hotelData);
        const setClause = keys.map(key => `${key} = ?`).join(', ');
        
        let sql = `UPDATE hotels SET ${setClause} WHERE id = ?`;
        await executeQuery(sql, [...values, where.id]);
      }
      
      // Handle amenities if provided
      if (amenities) {
        // Delete existing amenities
        await executeQuery('DELETE FROM hotel_amenities WHERE hotelId = ?', [where.id]);
        
        // Add new amenities
        if (amenities.length > 0) {
          const amenityValues = amenities.map(amenityId => [where.id, amenityId]);
          const amenitySql = `
            INSERT INTO hotel_amenities (hotelId, amenityId) 
            VALUES ?
          `;
          
          await executeQuery(amenitySql, [amenityValues]);
        }
      }
      
      // Fetch the updated record by calling findUnique directly
      const updatedHotel = await executeQuery('SELECT * FROM hotels WHERE id = ? LIMIT 1', [where.id]);
      return updatedHotel[0] || null;
    },
    
    delete: async ({ where }) => {
      // Delete related records first (cascade delete)
      await executeQuery('DELETE FROM hotel_amenities WHERE hotelId = ?', [where.id]);
      await executeQuery('DELETE FROM rooms WHERE hotelId = ?', [where.id]);
      
      // Delete the hotel
      await executeQuery('DELETE FROM hotels WHERE id = ?', [where.id]);
      
      return { id: where.id };
    },
    
    count: async ({ where }) => {
      let sql = 'SELECT COUNT(*) as count FROM hotels WHERE 1=1';
      const params = [];

      // Add where conditions
      if (where) {
        Object.entries(where).forEach(([key, value]) => {
          sql += ` AND ${key} = ?`;
          params.push(value);
        });
      }

      const result = await executeQuery(sql, params);
      return result[0].count;
    }
  },

  // Booking model
  booking: {
    findUnique: async ({ where, include }) => {
      let booking = null;
      
      if (where.id) {
        const bookings = await executeQuery('SELECT * FROM bookings WHERE id = ? LIMIT 1', [where.id]);
        booking = bookings[0] || null;
      }
      
      if (!booking) return null;
      
      // Handle includes
      if (include) {
        if (include.customer) {
          const customers = await executeQuery('SELECT * FROM customers WHERE id = ? LIMIT 1', [booking.customerId]);
          booking.customer = customers[0] || null;
        }
        
        if (include.room) {
          // Get room through room_units table
          const roomUnits = await executeQuery('SELECT * FROM room_units WHERE id = ? LIMIT 1', [booking.roomUnitId]);
          if (roomUnits.length > 0) {
            const roomUnit = roomUnits[0];
            const rooms = await executeQuery('SELECT * FROM rooms WHERE id = ? LIMIT 1', [roomUnit.roomId]);
            booking.room = rooms[0] || null;
            
            // If hotel is also included, include it for the room
            if ((include.hotel || include.room?.include?.hotel) && booking.room) {
              const hotels = await executeQuery('SELECT * FROM hotels WHERE id = ? LIMIT 1', [booking.room.hotelId]);
              booking.room.hotel = hotels[0] || null;
            }
          } else {
            booking.room = null;
          }
        }
        
        if (include.payments) {
          const payments = await executeQuery('SELECT * FROM payments WHERE bookingId = ?', [booking.id]);
          booking.payments = payments;
        }
      }
      
      return booking;
    },
    
    findMany: async ({ where, orderBy, take, skip, include }) => {
      let sql = 'SELECT * FROM bookings WHERE 1=1';
      const params = [];

      // Add where conditions
      if (where) {
        Object.entries(where).forEach(([key, value]) => {
          if (value === null) {
            sql += ` AND ${key} IS NULL`;
          } else {
            sql += ` AND ${key} = ?`;
            params.push(value);
          }
        });
      }

      // Add order by
      if (orderBy) {
        const [field, direction] = Object.entries(orderBy)[0];
        sql += ` ORDER BY ${field} ${direction}`;
      }

      // Add pagination
      if (take) {
        sql += ' LIMIT ?';
        params.push(parseInt(take));

        if (skip) {
          sql += ' OFFSET ?';
          params.push(parseInt(skip));
        }
      }

      const bookings = await executeQuery(sql, params);
      
      // Handle includes
      if (include && bookings.length > 0) {
        const bookingIds = bookings.map(booking => booking.id);
        const roomUnitIds = [...new Set(bookings.map(booking => booking.roomUnitId).filter(id => id))];
        const customerIds = [...new Set(bookings.map(booking => booking.customerId))];
        
        if (include.customer) {
          const customers = await executeQuery('SELECT * FROM customers WHERE id IN (?)', [customerIds]);
          
          const customerMap = {};
          customers.forEach(customer => {
            customerMap[customer.id] = customer;
          });
          
          bookings.forEach(booking => {
            booking.customer = customerMap[booking.customerId] || null;
          });
        }
        
        if (include.room) {
          // Get rooms through room_units table
          let roomMap = {};
          
          if (roomUnitIds.length > 0) {
            const roomUnits = await executeQuery('SELECT * FROM room_units WHERE id IN (?)', [roomUnitIds]);
            const roomIds = [...new Set(roomUnits.map(ru => ru.roomId))];
            
            if (roomIds.length > 0) {
              const rooms = await executeQuery('SELECT * FROM rooms WHERE id IN (?)', [roomIds]);
              
              // Create room unit to room mapping
              const roomUnitToRoomMap = {};
              roomUnits.forEach(ru => {
                roomUnitToRoomMap[ru.id] = ru.roomId;
              });
              
              rooms.forEach(room => {
                roomMap[room.id] = room;
              });
              
              // If hotel is also included, include it for the rooms
              if (include.hotel || include.room?.include?.hotel) {
                const hotelIds = [...new Set(rooms.map(room => room.hotelId))];
                const hotels = await executeQuery('SELECT * FROM hotels WHERE id IN (?)', [hotelIds]);
                
                const hotelMap = {};
                hotels.forEach(hotel => {
                  hotelMap[hotel.id] = hotel;
                });
                
                rooms.forEach(room => {
                  room.hotel = hotelMap[room.hotelId] || null;
                });
              }
              
              bookings.forEach(booking => {
                const roomId = roomUnitToRoomMap[booking.roomUnitId];
                booking.room = roomId ? roomMap[roomId] : null;
              });
            }
          }
        }
        
        if (include.payments) {
          const payments = await executeQuery('SELECT * FROM payments WHERE bookingId IN (?)', [bookingIds]);
          
          const paymentsByBooking = {};
          payments.forEach(payment => {
            if (!paymentsByBooking[payment.bookingId]) {
              paymentsByBooking[payment.bookingId] = [];
            }
            paymentsByBooking[payment.bookingId].push(payment);
          });
          
          bookings.forEach(booking => {
            booking.payments = paymentsByBooking[booking.id] || [];
          });
        }
      }
      
      return bookings;
    },
    
    // Other CRUD operations similar to above
    create: async ({ data }) => {
      const keys = Object.keys(data);
      const values = Object.values(data);
      const placeholders = keys.map(() => '?').join(', ');
      
      const sql = `
        INSERT INTO bookings (${keys.join(', ')}) 
        VALUES (${placeholders})
      `;
      
      const result = await executeQuery(sql, values);
      return { ...data, id: result.insertId };
    },
    
    update: async ({ where, data }) => {
      const keys = Object.keys(data);
      const values = Object.values(data);
      const setClause = keys.map(key => `${key} = ?`).join(', ');
      
      const sql = `UPDATE bookings SET ${setClause} WHERE id = ?`;
      await executeQuery(sql, [...values, where.id]);
      
      // Fetch the updated record by calling findUnique directly
      const updatedBooking = await executeQuery('SELECT * FROM bookings WHERE id = ? LIMIT 1', [where.id]);
      return updatedBooking[0] || null;
    },
    
    delete: async ({ where }) => {
      // Delete related records first (cascade delete)
      await executeQuery('DELETE FROM payments WHERE bookingId = ?', [where.id]);
      
      // Delete the booking
      await executeQuery('DELETE FROM bookings WHERE id = ?', [where.id]);
      
      return { id: where.id };
    },
    
    count: async ({ where }) => {
      let sql = 'SELECT COUNT(*) as count FROM bookings WHERE 1=1';
      const params = [];

      // Add where conditions
      if (where) {
        Object.entries(where).forEach(([key, value]) => {
          sql += ` AND ${key} = ?`;
          params.push(value);
        });
      }

      const result = await executeQuery(sql, params);
      return result[0].count;
    }
  },

  // Add more models as needed based on your database schema
  
  // Subscription Plan model
  subscriptionPlan: {
    findUnique: async ({ where }) => {
      let plan = null;
      
      if (where.id) {
        const plans = await executeQuery('SELECT * FROM subscription_plans WHERE id = ? LIMIT 1', [where.id]);
        plan = plans[0] || null;
      }
      
      return plan;
    },
    
    findFirst: async ({ where, orderBy }) => {
      let sql = 'SELECT * FROM subscription_plans WHERE 1=1';
      const params = [];

      // Add where conditions
      if (where) {
        Object.entries(where).forEach(([key, value]) => {
          sql += ` AND ${key} = ?`;
          params.push(value);
        });
      }

      // Add order by
      if (orderBy) {
        const [field, direction] = Object.entries(orderBy)[0];
        sql += ` ORDER BY ${field} ${direction}`;
      }

      sql += ' LIMIT 1';

      const plans = await executeQuery(sql, params);
      return plans[0] || null;
    },
    
    findMany: async ({ where, orderBy, take, skip }) => {
      let sql = 'SELECT * FROM subscription_plans WHERE 1=1';
      const params = [];

      // Add where conditions
      if (where) {
        Object.entries(where).forEach(([key, value]) => {
          if (value === null) {
            sql += ` AND ${key} IS NULL`;
          } else {
            sql += ` AND ${key} = ?`;
            params.push(value);
          }
        });
      }

      // Add order by
      if (orderBy) {
        const [field, direction] = Object.entries(orderBy)[0];
        sql += ` ORDER BY ${field} ${direction}`;
      }

      // Add pagination
      if (take) {
        sql += ' LIMIT ?';
        params.push(parseInt(take));

        if (skip) {
          sql += ' OFFSET ?';
          params.push(parseInt(skip));
        }
      }

      return executeQuery(sql, params);
    },
    
    create: async ({ data }) => {
      const keys = Object.keys(data);
      const values = Object.values(data);
      const placeholders = keys.map(() => '?').join(', ');
      
      const sql = `
        INSERT INTO subscription_plans (${keys.join(', ')}) 
        VALUES (${placeholders})
      `;
      
      const result = await executeQuery(sql, values);
      return { ...data, id: result.insertId };
    },
    
    update: async ({ where, data }) => {
      const keys = Object.keys(data);
      const values = Object.values(data);
      const setClause = keys.map(key => `${key} = ?`).join(', ');
      
      const sql = `UPDATE subscription_plans SET ${setClause} WHERE id = ?`;
      await executeQuery(sql, [...values, where.id]);
      
      // Fetch the updated record by calling findUnique directly
      const updatedPlan = await executeQuery('SELECT * FROM subscription_plans WHERE id = ? LIMIT 1', [where.id]);
      return updatedPlan[0] || null;
    },
    
    delete: async ({ where }) => {
      await executeQuery('DELETE FROM subscription_plans WHERE id = ?', [where.id]);
      return { id: where.id };
    },
    
    count: async ({ where }) => {
      let sql = 'SELECT COUNT(*) as count FROM subscription_plans WHERE 1=1';
      const params = [];

      // Add where conditions
      if (where) {
        Object.entries(where).forEach(([key, value]) => {
          sql += ` AND ${key} = ?`;
          params.push(value);
        });
      }

      const result = await executeQuery(sql, params);
      return result[0].count;
    }
  },
  
  // Other models can be added as needed
};

export default mysql;