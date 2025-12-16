import { Prisma } from '@prisma/client';
import pool from '@/lib/db';
import { notFound } from 'next/navigation';
import * as crypto from 'crypto';

/**
 * Service to handle all door lock-related operations
 */
export class LockService {
  /**
   * Get locks with optional filtering
   */
  static async getLocks(params: {
    hotelId?: string;
    roomId?: string;
    isActive?: boolean;
    searchTerm?: string;
    limit?: number;
    offset?: number;
  }) {
    const {
      hotelId,
      roomId,
      isActive,
      searchTerm,
      limit = 20,
      offset = 0,
    } = params;

    // Build the filter conditions
    const where: Prisma.LockWhereInput = {};
    
    if (hotelId) where.hotelId = hotelId;
    if (roomId) where.roomId = roomId;
    if (isActive !== undefined) where.isActive = isActive;
    
    if (searchTerm) {
      where.OR = [
        { serialNumber: { contains: searchTerm } },
        { lockModel: { contains: searchTerm } },
        { 
          room: {
            name: { contains: searchTerm }
          }
        }
      ];
    }

    // Get total count
    const totalCount = await prisma.lock.count({ where });

    // Get the locks
    const locks = await prisma.lock.findMany({
      where,
      take: limit,
      skip: offset,
      include: {
        room: true,
        _count: {
          select: {
            keycards: true,
            lockHistory: true,
            lockErrors: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return {
      locks,
      meta: {
        totalCount,
        limit,
        offset
      }
    };
  }

  /**
   * Get a single lock by ID
   */
  static async getLock(id: string) {
    const lock = await prisma.lock.findUnique({
      where: { id },
      include: {
        room: true,
        keycards: {
          where: {
            isActive: true
          },
          take: 10,
          orderBy: {
            updatedAt: 'desc'
          }
        },
        lockHistory: {
          take: 20,
          orderBy: {
            timestamp: 'desc'
          }
        },
        lockErrors: {
          take: 10,
          orderBy: {
            timestamp: 'desc'
          },
          where: {
            isResolved: false
          }
        }
      }
    });

    if (!lock) {
      notFound();
    }

    return lock;
  }

  /**
   * Register a new lock
   */
  static async registerLock(data: {
    hotelId: string;
    roomId?: string;
    serialNumber: string;
    lockModel: string;
    firmwareVersion?: string;
  }) {
    const { hotelId, roomId, serialNumber, lockModel, firmwareVersion } = data;

    // Check if the hotel exists
    const hotel = await prisma.hotel.findUnique({ where: { id: hotelId } });
    if (!hotel) {
      throw new Error('Hotel not found');
    }

    // If roomId is provided, make sure it exists and belongs to the hotel
    if (roomId) {
      const room = await prisma.room.findUnique({ 
        where: { id: roomId },
        select: { hotelId: true }
      });
      
      if (!room) {
        throw new Error('Room not found');
      }
      
      if (room.hotelId !== hotelId) {
        throw new Error('Room does not belong to the specified hotel');
      }
    }

    // Check if the serial number is already in use
    const existingLock = await prisma.lock.findUnique({ 
      where: { serialNumber },
    });

    if (existingLock) {
      throw new Error('A lock with this serial number already exists');
    }

    // Generate a unique encoding key for this lock
    const encodingKey = this.generateEncodingKey();

    // Create the new lock
    const lock = await prisma.lock.create({
      data: {
        hotelId,
        roomId,
        serialNumber,
        lockModel,
        encodingKey,
        firmwareVersion,
        isActive: true,
        installDate: new Date()
      }
    });

    return lock;
  }

  /**
   * Update lock details
   */
  static async updateLock(id: string, data: {
    roomId?: string;
    lockModel?: string;
    firmwareVersion?: string;
    batteryLevel?: number;
    lastMaintenance?: Date;
    isActive?: boolean;
  }) {
    const lock = await prisma.lock.findUnique({ 
      where: { id },
      select: { hotelId: true }
    });

    if (!lock) {
      throw new Error('Lock not found');
    }

    // If roomId is provided, make sure it exists and belongs to the hotel
    if (data.roomId) {
      const room = await prisma.room.findUnique({ 
        where: { id: data.roomId },
        select: { hotelId: true }
      });
      
      if (!room) {
        throw new Error('Room not found');
      }
      
      if (room.hotelId !== lock.hotelId) {
        throw new Error('Room does not belong to the same hotel as the lock');
      }
    }

    // Update the lock
    const updatedLock = await prisma.lock.update({
      where: { id },
      data
    });

    return updatedLock;
  }

  /**
   * Record a lock error
   */
  static async recordLockError(data: {
    lockId: string;
    errorCode: string;
    errorMsg: string;
  }) {
    const { lockId, errorCode, errorMsg } = data;

    // Check if the lock exists
    const lock = await prisma.lock.findUnique({ where: { id: lockId } });
    if (!lock) {
      throw new Error('Lock not found');
    }

    // Create the error record
    const lockError = await prisma.lockError.create({
      data: {
        lockId,
        errorCode,
        errorMsg,
        isResolved: false
      }
    });

    return lockError;
  }

  /**
   * Resolve a lock error
   */
  static async resolveLockError(id: string) {
    const error = await prisma.lockError.update({
      where: { id },
      data: {
        isResolved: true,
        resolvedAt: new Date()
      }
    });

    return error;
  }

  /**
   * Get lock history
   */
  static async getLockHistory(params: {
    lockId: string;
    isSuccess?: boolean;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }) {
    const {
      lockId,
      isSuccess,
      startDate,
      endDate,
      limit = 50,
      offset = 0,
    } = params;

    // Build the filter conditions
    const where: Prisma.LockHistoryWhereInput = {
      lockId
    };
    
    if (isSuccess !== undefined) where.isSuccess = isSuccess;
    
    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) where.timestamp.gte = startDate;
      if (endDate) where.timestamp.lte = endDate;
    }

    // Get total count
    const totalCount = await prisma.lockHistory.count({ where });

    // Get the history records
    const history = await prisma.lockHistory.findMany({
      where,
      take: limit,
      skip: offset,
      orderBy: {
        timestamp: 'desc'
      },
      include: {
        lock: {
          include: {
            room: true
          }
        }
      }
    });

    return {
      history,
      meta: {
        totalCount,
        limit,
        offset
      }
    };
  }

  /**
   * Generate a random encoding key for a lock
   */
  private static generateEncodingKey(): string {
    // Generate a random 32-byte key and convert to hex
    return crypto.randomBytes(32).toString('hex');
  }
}