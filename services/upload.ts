import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';
import sharp from 'sharp';

// Configuration for file uploads
const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
// Define output formats with their processing options
interface FormatConfig {
  format: string;
  extension: string;
  quality?: number;
}

const OUTPUT_FORMATS: Record<string, FormatConfig> = {
  'image/jpeg': { format: 'jpeg', extension: '.jpg', quality: 80 },
  'image/png': { format: 'png', extension: '.png', quality: 80 },
  'image/webp': { format: 'webp', extension: '.webp', quality: 80 },
  'image/gif': { format: 'gif', extension: '.gif' } // GIF doesn't support quality option
};

// Base directories for different entity types
const UPLOAD_DIRECTORIES = {
  hotels: 'uploads/hotels',
  logos: 'uploads/logos',
  rooms: 'uploads/rooms',
  amenities: 'uploads/amenities',
  profiles: 'uploads/profiles',
  default: 'uploads/misc'
};

export interface ProcessedImage {
  path: string;
  width: number;
  height: number;
  size: number;
  type: string;
}

export class UploadService {
  /**
   * Upload and process a single image file
   * @param file - The file to upload
   * @param entityType - The type of entity (hotels, logos, etc.)
   * @param entityId - Optional ID of the entity
   * @param options - Processing options
   */
  static async uploadImage(
    file: File,
    entityType: string = 'default',
    entityId?: string,
    options: {
      square?: boolean;
      maxWidth?: number;
      maxHeight?: number;
    } = {}
  ): Promise<ProcessedImage> {
    try {
      // Validate file type
      if (!ALLOWED_FILE_TYPES.includes(file.type)) {
        throw new Error(`Invalid file type. Allowed types: ${ALLOWED_FILE_TYPES.join(', ')}`);
      }
      
      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        throw new Error(`File too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB`);
      }
      
      // Determine directory based on entity type
      const baseDir = UPLOAD_DIRECTORIES[entityType as keyof typeof UPLOAD_DIRECTORIES] || UPLOAD_DIRECTORIES.default;
      
      // Create a more structured directory path if entityId is provided
      const uploadDir = entityId 
        ? path.join(process.cwd(), 'public', baseDir, entityId)
        : path.join(process.cwd(), 'public', baseDir);
      
      // Ensure directory exists
      await mkdir(uploadDir, { recursive: true });
      
      // Generate a descriptive filename with UUID
      const fileExtension = path.extname(file.name).toLowerCase();
      const fileNameBase = file.name.split('.')[0]
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .substring(0, 30); // Limit the original filename part
      
      const timestamp = Date.now();
      const uniqueId = randomUUID().split('-')[0]; // Use first segment of UUID
      const finalFilename = `${fileNameBase}-${timestamp}-${uniqueId}${fileExtension}`;
      
      // Path where original file will be temporarily saved
      const tempPath = path.join(uploadDir, `temp-${finalFilename}`);
      
      // Read file as buffer
      const fileBuffer = Buffer.from(await file.arrayBuffer());
      
      // Process image with sharp
      const outputConfig = OUTPUT_FORMATS[file.type as keyof typeof OUTPUT_FORMATS];
      
      if (!outputConfig) {
        throw new Error(`Unsupported image format: ${file.type}`);
      }
      
      // Prepare sharp instance
      let sharpInstance = sharp(fileBuffer);
      
      // Get image metadata
      const metadata = await sharpInstance.metadata();
      
      // If square option is enabled (for logos)
      if (options.square && metadata.width && metadata.height) {
        const size = Math.min(metadata.width, metadata.height);
        sharpInstance = sharpInstance.resize({
          width: size,
          height: size,
          fit: 'cover'
        });
      } 
      // Apply max dimensions if specified
      else if ((options.maxWidth || options.maxHeight) && metadata.width && metadata.height) {
        sharpInstance = sharpInstance.resize({
          width: options.maxWidth,
          height: options.maxHeight,
          fit: 'inside',
          withoutEnlargement: true
        });
      }
      
      // Apply format-specific processing
      if (outputConfig.format === 'jpeg' || outputConfig.format === 'webp') {
        sharpInstance = sharpInstance[outputConfig.format]({
          quality: outputConfig.quality,
          progressive: true
        });
      } else if (outputConfig.format === 'png') {
        sharpInstance = sharpInstance.png({
          compressionLevel: 9,
          progressive: true
        });
      } else if (outputConfig.format === 'gif') {
        // GIF doesn't have quality options in Sharp
        sharpInstance = sharpInstance.gif();
      }
      
      // Process and save the image
      const outputPath = path.join(uploadDir, finalFilename);
      await sharpInstance.toFile(outputPath);
      
      // Get final image metadata
      const processedMetadata = await sharp(outputPath).metadata();
      const stats = await sharp(outputPath).stats();
      
      // Return processed image info
      return {
        path: `/${baseDir}${entityId ? `/${entityId}` : ''}/${finalFilename}`,
        width: processedMetadata.width || 0,
        height: processedMetadata.height || 0,
        size: processedMetadata.size || 0,
        type: file.type
      };
    } catch (error) {
      console.error('Error processing image:', error);
      throw error;
    }
  }
  
  /**
   * Upload multiple image files
   * @param files - Array of files to upload
   * @param entityType - The type of entity (hotels, logos, etc.)
   * @param entityId - Optional ID of the entity
   * @param options - Processing options
   */
  static async uploadImages(
    files: File[],
    entityType: string = 'default',
    entityId?: string,
    options: {
      square?: boolean;
      maxWidth?: number;
      maxHeight?: number;
    } = {}
  ): Promise<ProcessedImage[]> {
    const uploadPromises = files.map(file => 
      this.uploadImage(file, entityType, entityId, options)
    );
    
    return Promise.all(uploadPromises);
  }
  
  /**
   * Delete an image file
   * @param filePath - Path to the file to delete
   */
  static async deleteImage(filePath: string): Promise<boolean> {
    try {
      // Remove the leading slash if present
      const normalizedPath = filePath.startsWith('/') ? filePath.slice(1) : filePath;
      
      // Full path to file
      const fullPath = path.join(process.cwd(), 'public', normalizedPath);
      
      // Delete file
      await unlink(fullPath);
      
      return true;
    } catch (error) {
      console.error('Error deleting file:', error);
      return false;
    }
  }
  
  /**
   * Delete multiple image files
   * @param filePaths - Array of paths to delete
   */
  static async deleteImages(filePaths: string[]): Promise<boolean[]> {
    const deletePromises = filePaths.map(path => this.deleteImage(path));
    return Promise.all(deletePromises);
  }
}

// Import unlink here to avoid TypeScript errors
import { unlink } from 'fs/promises';