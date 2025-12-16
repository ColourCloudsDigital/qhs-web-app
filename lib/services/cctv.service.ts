import pool from '@/lib/db';
import { Camera, CameraSnapshot, CameraAccessLog } from '@prisma/client';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { PaginationParams, PaginatedResponse } from '@/lib/utils';
import { canAccessModule } from '@/lib/services/module-access.service';
import { ModuleType } from '@/lib/types/enums';

// Types
export interface CameraCreateInput {
  hotelId: string;
  name: string;
  description?: string;
  ipAddress: string;
  port?: number;
  username?: string;
  password?: string;
  streamUrl?: string;
  type?: string;
  brand?: string;
  model?: string;
  location?: string;
  onvifCompliant?: boolean;
  ptzEnabled?: boolean;
  rtspUrl?: string;
  httpUrl?: string;
  configuration?: Record<string, any>;
}

export interface CameraUpdateInput extends Partial<Omit<CameraCreateInput, 'hotelId'>> {
  id: string;
  isActive?: boolean;
}

export interface CameraSnapshotCreateInput {
  cameraId: string;
  imageUrl: string;
  metadata?: Record<string, any>;
}

export interface CameraAccessLogCreateInput {
  cameraId: string;
  userId: string;
  action: string;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Service for managing CCTV cameras
 */
export const cctvService = {
  /**
   * Get all cameras for a hotel with pagination
   */
  async getCamerasForHotel(
    hotelId: string,
    { page = 1, limit = 10 }: PaginationParams = {}
  ): Promise<PaginatedResponse<Camera>> {
    // Check if authorized to access this module
    const session = await getServerSession(authOptions);
    if (!session) {
      throw new Error('Unauthorized');
    }

    // Check if user has access to CCTV module
    const hasAccess = await canAccessModule(session.user.id, ModuleType.CCTV);
    if (!hasAccess) {
      throw new Error('You do not have access to the CCTV module');
    }

    const skip = (page - 1) * limit;
    
    const [cameras, totalCount] = await Promise.all([
      prisma.camera.findMany({
        where: { hotelId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.camera.count({
        where: { hotelId },
      }),
    ]);

    return {
      data: cameras,
      meta: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalItems: totalCount,
        itemsPerPage: limit,
      },
    };
  },

  /**
   * Get a camera by ID
   */
  async getCameraById(id: string): Promise<Camera | null> {
    return prisma.camera.findUnique({
      where: { id },
    });
  },

  /**
   * Create a new camera
   */
  async createCamera(data: CameraCreateInput): Promise<Camera> {
    // Validate access to this module
    const session = await getServerSession(authOptions);
    if (!session) {
      throw new Error('Unauthorized');
    }

    // Check if user has access to CCTV module
    const hasAccess = await canAccessModule(session.user.id, ModuleType.CCTV);
    if (!hasAccess) {
      throw new Error('You do not have access to the CCTV module');
    }

    // Mask password in logs/storage if needed
    const inputData = {
      ...data,
      configuration: data.configuration ? JSON.stringify(data.configuration) : undefined,
    };

    return prisma.camera.create({
      data: inputData as any,
    });
  },

  /**
   * Update a camera
   */
  async updateCamera(data: CameraUpdateInput): Promise<Camera> {
    const { id, ...updateData } = data;

    // Check if camera exists
    const camera = await prisma.camera.findUnique({
      where: { id },
      select: { id: true, hotelId: true },
    });

    if (!camera) {
      throw new Error('Camera not found');
    }

    // Validate access
    const session = await getServerSession(authOptions);
    if (!session) {
      throw new Error('Unauthorized');
    }

    // Process configuration if provided
    const processedData = {
      ...updateData,
      configuration: updateData.configuration 
        ? JSON.stringify(updateData.configuration) 
        : undefined,
    };

    return prisma.camera.update({
      where: { id },
      data: processedData as any,
    });
  },

  /**
   * Delete a camera
   */
  async deleteCamera(id: string): Promise<boolean> {
    // Check if camera exists
    const camera = await prisma.camera.findUnique({
      where: { id },
      select: { id: true, hotelId: true },
    });

    if (!camera) {
      throw new Error('Camera not found');
    }

    // Validate access
    const session = await getServerSession(authOptions);
    if (!session) {
      throw new Error('Unauthorized');
    }

    await prisma.camera.delete({
      where: { id },
    });

    return true;
  },

  /**
   * Take a snapshot from a camera
   */
  async createSnapshot(data: CameraSnapshotCreateInput): Promise<CameraSnapshot> {
    return prisma.cameraSnapshot.create({
      data: {
        cameraId: data.cameraId,
        imageUrl: data.imageUrl,
        metadata: data.metadata ? JSON.stringify(data.metadata) : undefined,
      },
    });
  },

  /**
   * Get snapshots for a camera
   */
  async getSnapshotsForCamera(
    cameraId: string,
    { page = 1, limit = 10 }: PaginationParams = {}
  ): Promise<PaginatedResponse<CameraSnapshot>> {
    const skip = (page - 1) * limit;
    
    const [snapshots, totalCount] = await Promise.all([
      prisma.cameraSnapshot.findMany({
        where: { cameraId },
        skip,
        take: limit,
        orderBy: { timestamp: 'desc' },
      }),
      prisma.cameraSnapshot.count({
        where: { cameraId },
      }),
    ]);

    return {
      data: snapshots,
      meta: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalItems: totalCount,
        itemsPerPage: limit,
      },
    };
  },

  /**
   * Log camera access
   */
  async logCameraAccess(data: CameraAccessLogCreateInput): Promise<CameraAccessLog> {
    return prisma.cameraAccessLog.create({
      data,
    });
  },

  /**
   * Test camera connection
   */
  async testCameraConnection(id: string): Promise<boolean> {
    const camera = await prisma.camera.findUnique({
      where: { id },
    });

    if (!camera) {
      throw new Error('Camera not found');
    }

    // In a real implementation, you would test the actual connection
    // This is a placeholder for demonstration purposes
    const isConnected = true; 

    // Update last connected time if successful
    if (isConnected) {
      await prisma.camera.update({
        where: { id },
        data: { lastConnected: new Date() },
      });
    }

    return isConnected;
  },

  /**
   * Get camera stream URL
   */
  async getCameraStreamUrl(id: string): Promise<string> {
    const camera = await prisma.camera.findUnique({
      where: { id },
      select: { streamUrl: true, rtspUrl: true, httpUrl: true, ipAddress: true, port: true, username: true, password: true, type: true },
    });

    if (!camera) {
      throw new Error('Camera not found');
    }

    // Log access
    const session = await getServerSession(authOptions);
    if (session) {
      await this.logCameraAccess({
        cameraId: id,
        userId: session.user.id,
        action: 'VIEW',
      });
    }

    // If a direct stream URL is provided, use that
    if (camera.streamUrl) {
      return camera.streamUrl;
    }

    // Otherwise, construct URL based on camera type and configuration
    if (camera.type === 'RTSP' && camera.rtspUrl) {
      // For RTSP, we'd need a streaming server to convert to WebRTC or HLS
      // This is a placeholder - in a real app, you'd return a WebRTC or HLS URL
      return `/api/cctv/streams/${id}`;
    }

    if (camera.httpUrl) {
      return camera.httpUrl;
    }

    // Construct a basic URL from the camera's IP and credentials
    const auth = camera.username && camera.password 
      ? `${encodeURIComponent(camera.username)}:${encodeURIComponent(camera.password)}@`
      : '';
    
    // Return a generic stream URL - this would need to be customized based on camera brand/model
    return `/api/cctv/streams/${id}`;
  }
};