import { KeycardType } from '@/lib/types/enums'
import { Prisma } from '@prisma/client';
import pool from '@/lib/db';
import * as crypto from 'crypto';
import { notFound } from 'next/navigation';

/**
 * Service to handle all keycard-related operations
 */
export class KeycardService {
  /**
   * Get keycards with optional filtering
   */
  static async getKeycards(params: {
    hotelId?: string;
    isActive?: boolean;
    cardType?: KeycardType;
    isConfigured?: boolean;
    lockId?: string;
    assignedToId?: string;
    staffId?: string;
    searchTerm?: string;
    limit?: number;
    offset?: number;
  }) {
    const {
      hotelId,
      isActive,
      cardType,
      isConfigured,
      lockId,
      assignedToId,
      staffId,
      searchTerm,
      limit = 20,
      offset = 0,
    } = params;

    // Build the filter conditions
    const where: Prisma.KeycardWhereInput = {};
    
    if (hotelId) where.hotelId = hotelId;
    if (isActive !== undefined) where.isActive = isActive;
    if (cardType) where.cardType = cardType;
    if (isConfigured !== undefined) where.isConfigured = isConfigured;
    if (lockId) where.lockId = lockId;
    if (assignedToId) where.assignedToId = assignedToId;
    if (staffId) where.staffId = staffId;
    
    if (searchTerm) {
      where.OR = [
        { cardNumber: { contains: searchTerm } },
        { 
          assignedTo: {
            customer: {
              user: {
                name: { contains: searchTerm }
              }
            }
          }
        },
        {
          staff: {
            user: {
              name: { contains: searchTerm }
            }
          }
        }
      ];
    }

    // Get total count
    const totalCount = await prisma.keycard.count({ where });

    // Get the keycards
    const keycards = await prisma.keycard.findMany({
      where,
      take: limit,
      skip: offset,
      include: {
        lock: {
          include: {
            room: true
          }
        },
        assignedTo: {
          include: {
            customer: {
              include: {
                user: true
              }
            }
          }
        },
        staff: {
          include: {
            user: true
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });

    return {
      keycards,
      meta: {
        totalCount,
        limit,
        offset
      }
    };
  }

  /**
   * Get a single keycard by ID
   */
  static async getKeycard(id: string) {
    const keycard = await prisma.keycard.findUnique({
      where: { id },
      include: {
        lock: {
          include: {
            room: true
          }
        },
        assignedTo: {
          include: {
            customer: {
              include: {
                user: true
              }
            }
          }
        },
        staff: {
          include: {
            user: true
          }
        }
      }
    });

    if (!keycard) {
      notFound();
    }

    return keycard;
  }

  /**
   * Register a new batch of keycards
   */
  static async registerKeycards(data: {
    hotelId: string;
    cardType?: KeycardType;
    cardNumbers: string[];
  }) {
    const { hotelId, cardType = KeycardType.GUEST, cardNumbers } = data;

    // Check if the hotel exists
    const hotel = await prisma.hotel.findUnique({ where: { id: hotelId } });
    if (!hotel) {
      throw new Error('Hotel not found');
    }

    // Check for existing card numbers to avoid duplicates
    const existingCards = await prisma.keycard.findMany({
      where: {
        cardNumber: {
          in: cardNumbers
        }
      },
      select: {
        cardNumber: true
      }
    });

    const existingCardNumbers = existingCards.map(card => card.cardNumber);
    const newCardNumbers = cardNumbers.filter(num => !existingCardNumbers.includes(num));

    if (newCardNumbers.length === 0) {
      throw new Error('All card numbers already exist in the system');
    }

    // Create the new keycard records
    const keycards = await prisma.$transaction(
      newCardNumbers.map(cardNumber =>
        prisma.keycard.create({
          data: {
            hotelId,
            cardNumber,
            cardType,
            isActive: true,
            isConfigured: false,
          }
        })
      )
    );

    return {
      createdCount: keycards.length,
      totalRequested: cardNumbers.length,
      skippedCount: cardNumbers.length - keycards.length,
      keycards
    };
  }

  /**
   * Configure a keycard with a specific lock
   */
  static async configureKeycard(data: {
    keycardId: string;
    lockId: string;
  }) {
    const { keycardId, lockId } = data;

    // Get the keycard and lock
    const keycard = await prisma.keycard.findUnique({ where: { id: keycardId } });
    if (!keycard) throw new Error('Keycard not found');

    const lock = await prisma.lock.findUnique({ where: { id: lockId } });
    if (!lock) throw new Error('Lock not found');

    // Ensure they belong to the same hotel
    if (keycard.hotelId !== lock.hotelId) {
      throw new Error('Keycard and lock must belong to the same hotel');
    }

    // Generate unique encoded data for this card-lock combination
    const encodedData = this.generateEncodedData(keycard.cardNumber, lock.encodingKey);

    // Update the keycard
    const updatedKeycard = await prisma.keycard.update({
      where: { id: keycardId },
      data: {
        lockId,
        isConfigured: true,
        encodedData
      }
    });

    return updatedKeycard;
  }

  /**
   * Assign a keycard to a booking
   */
  static async assignToBooking(data: {
    keycardId: string;
    bookingId: string;
  }) {
    const { keycardId, bookingId } = data;

    // Get the keycard 
    const keycard = await prisma.keycard.findUnique({
      where: { id: keycardId },
      include: { lock: true }
    });
    if (!keycard) throw new Error('Keycard not found');
    if (!keycard.isConfigured) throw new Error('Keycard must be configured before assignment');

    // Get the booking
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { room: true }
    });
    if (!booking) throw new Error('Booking not found');

    // Ensure the keycard is configured for the correct room
    if (keycard.lock?.roomId !== booking.roomId) {
      throw new Error('Keycard is not configured for the booked room');
    }

    // Update the keycard with the booking details
    const updatedKeycard = await prisma.keycard.update({
      where: { id: keycardId },
      data: {
        assignedToId: bookingId,
        validFrom: booking.checkInDate,
        validTo: booking.checkOutDate,
        isActive: true,
        issueCount: {
          increment: 1
        }
      }
    });

    return updatedKeycard;
  }

  /**
   * Assign a keycard to a staff member
   */
  static async assignToStaff(data: {
    keycardId: string;
    staffId: string;
    accessLevel: number;
    validFrom: Date;
    validTo: Date;
  }) {
    const { keycardId, staffId, accessLevel, validFrom, validTo } = data;

    // Get the keycard
    const keycard = await prisma.keycard.findUnique({ where: { id: keycardId } });
    if (!keycard) throw new Error('Keycard not found');

    // Get the staff
    const staff = await prisma.staff.findUnique({ where: { id: staffId } });
    if (!staff) throw new Error('Staff not found');

    // Ensure they belong to the same hotel
    if (keycard.hotelId !== staff.hotelId) {
      throw new Error('Keycard and staff must belong to the same hotel');
    }

    // Update the keycard
    const updatedKeycard = await prisma.keycard.update({
      where: { id: keycardId },
      data: {
        cardType: KeycardType.STAFF,
        staffId,
        accessLevel,
        validFrom,
        validTo,
        isActive: true,
        assignedToId: null,
        issueCount: {
          increment: 1
        }
      }
    });

    return updatedKeycard;
  }

  /**
   * Deactivate a keycard
   */
  static async deactivateKeycard(id: string) {
    const keycard = await prisma.keycard.update({
      where: { id },
      data: {
        isActive: false
      }
    });

    return keycard;
  }

  /**
   * Record a lock access history
   */
  static async recordLockAccess(data: {
    lockId: string;
    keycardId?: string;
    isSuccess: boolean;
    accessType: string;
    entryData?: string;
  }) {
    const { lockId, keycardId, isSuccess, accessType, entryData } = data;

    const lockHistory = await prisma.lockHistory.create({
      data: {
        lockId,
        keycardId,
        isSuccess,
        accessType,
        entryData
      }
    });

    // If successful access, update the keycard lastUsed timestamp
    if (isSuccess && keycardId) {
      await prisma.keycard.update({
        where: { id: keycardId },
        data: {
          lastUsed: new Date()
        }
      });
    }

    return lockHistory;
  }

  /**
   * Helper method to generate encoded data for a keycard
   */
  private static generateEncodedData(cardNumber: string, encodingKey: string): string {
    // Create a simple encryption of the card data
    // In a real system, you'd use a more sophisticated encryption method
    // based on the lock manufacturer's specifications
    
    const timestamp = Date.now().toString();
    const dataToEncode = `${cardNumber}|${timestamp}`;
    
    // Create an HMAC
    const hmac = crypto.createHmac('sha256', encodingKey);
    hmac.update(dataToEncode);
    const signature = hmac.digest('hex');
    
    // Combine the data and signature
    return `${dataToEncode}|${signature}`;
  }
}