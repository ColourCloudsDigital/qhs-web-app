'use client';

import React, { useState, useRef } from 'react';
import Image from 'next/image';
import { Upload, X, ImagePlus, Loader2, ArrowUp, ArrowDown, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import toast from '@/lib/toast';
import { cn } from '@/lib/utils';

interface MultiImageUploaderProps {
  images: string[];
  onImagesChange: (images: string[]) => void;
  maxImages?: number;
  uploadDir?: string;
  entityId?: string;
  label?: string;
  description?: string;
  aspectRatio?: 'square' | 'landscape' | 'portrait';
  maxSizeInMB?: number;
  allowedFileTypes?: string[];
}

export function MultiImageUploader({
  images = [],
  onImagesChange,
  maxImages = 5,
  uploadDir = 'general',
  entityId,
  label = 'Images',
  description,
  aspectRatio = 'landscape',
  maxSizeInMB = 2,
  allowedFileTypes = ['image/png', 'image/jpeg', 'image/webp']
}: MultiImageUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAddImages = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const selectedFiles = Array.from(files);
    
    // Check if adding these files would exceed maxImages
    if (images.length + selectedFiles.length > maxImages) {
      toast.warning(`You can only upload a maximum of ${maxImages} images`);
      return;
    }

    // Validate files
    for (const file of selectedFiles) {
      // Validate file type
      if (!allowedFileTypes.includes(file.type)) {
        toast.error(`Invalid file type: ${file.name}. Allowed types: ${allowedFileTypes.map(t => t.split('/')[1]).join(', ')}`);
        return;
      }

      // Validate file size
      if (file.size > maxSizeInMB * 1024 * 1024) {
        toast.error(`File size exceeds the limit of ${maxSizeInMB}MB: ${file.name}`);
        return;
      }
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const uploadedUrls: string[] = [];
      
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        
        // Update progress
        setUploadProgress(Math.round((i / selectedFiles.length) * 100));
        
        // Upload file
        const formData = new FormData();
        formData.append('file', file);
        
        // Set up the upload URL with query parameters
        let uploadUrl = `/api/upload?entity=${uploadDir}`;
        if (entityId) {
          uploadUrl += `&id=${entityId}`;
        }
        
        const response = await fetch(uploadUrl, {
          method: 'POST',
          body: formData,
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Upload failed');
        }
        
        const data = await response.json();
        
        if (data.success && data.files && data.files.length > 0) {
          uploadedUrls.push(data.files[0]);
        } else {
          throw new Error('No file URL returned from server');
        }
      }
      
      // Update images array with new uploads
      const newImages = [...images, ...uploadedUrls];
      onImagesChange(newImages);
      
      toast.success(`${uploadedUrls.length} image${uploadedUrls.length > 1 ? 's' : ''} uploaded successfully`);
    } catch (error) {
      console.error('Error uploading files:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to upload images');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveImage = (index: number) => {
    const newImages = [...images];
    newImages.splice(index, 1);
    onImagesChange(newImages);
    toast.info('Image removed');
  };

  const handleMoveImage = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) || 
      (direction === 'down' && index === images.length - 1)
    ) {
      return;
    }

    const newImages = [...images];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    
    // Swap images
    [newImages[index], newImages[newIndex]] = [newImages[newIndex], newImages[index]];
    
    onImagesChange(newImages);
  };

  return (
    <div className="space-y-4">
      {label && <div className="text-base font-medium">{label}</div>}
      {description && <div className="text-sm text-gray-500">{description}</div>}
      
      <input
        type="file"
        ref={fileInputRef}
        accept={allowedFileTypes.join(',')}
        className="hidden"
        onChange={handleFileChange}
        multiple
      />
      
      {/* Image Gallery */}
      {images.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {images.map((imageUrl, index) => (
            <div key={index} className="relative rounded-md border border-gray-200 dark:border-gray-700">
              <div className="group relative aspect-[4/3] overflow-hidden rounded-t-md">
                <Image
                  src={imageUrl}
                  alt={`Image ${index + 1}`}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw"
                  className={cn(
                    "object-cover",
                    aspectRatio === 'square' && "aspect-square",
                    aspectRatio === 'portrait' && "aspect-[3/4]"
                  )}
                />
                
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-0 transition-all group-hover:bg-opacity-30">
                  <div className="flex scale-0 transform space-x-1 opacity-0 transition-all group-hover:scale-100 group-hover:opacity-100">
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      className="h-8 w-8 rounded-full p-0"
                      onClick={() => handleRemoveImage(index)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between border-t border-gray-200 bg-gray-50 p-2 dark:border-gray-700 dark:bg-gray-800">
                <div className="text-xs font-medium">
                  {index === 0 ? 'Main' : `Image ${index + 1}`}
                </div>
                <div className="flex space-x-1">
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 rounded-full p-0"
                    onClick={() => handleMoveImage(index, 'up')}
                    disabled={index === 0}
                  >
                    <ArrowUp className="h-3 w-3" />
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 rounded-full p-0"
                    onClick={() => handleMoveImage(index, 'down')}
                    disabled={index === images.length - 1}
                  >
                    <ArrowDown className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Upload button and dropzone */}
      {images.length < maxImages && (
        <div 
          onClick={handleAddImages}
          className={cn(
            "flex cursor-pointer flex-col items-center justify-center rounded-md border-2 border-dashed border-gray-300 bg-gray-50 p-6 hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700",
            "transition-all duration-200",
            { "opacity-50": isUploading }
          )}
        >
          {isUploading ? (
            <div className="flex flex-col items-center space-y-2">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <div className="w-full max-w-xs">
                <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                  <div 
                    className="h-full bg-primary transition-all" 
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p className="mt-2 text-center text-sm text-gray-500">
                  Uploading... {uploadProgress}%
                </p>
              </div>
            </div>
          ) : (
            <>
              <ImagePlus className="h-10 w-10 text-gray-400" />
              <div className="mt-2 space-y-1 text-center">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Click to upload or drag and drop
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  PNG, JPG or WEBP (max. {maxSizeInMB}MB)
                </p>
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  {images.length} of {maxImages} images added
                </p>
              </div>
            </>
          )}
        </div>
      )}
      
      {/* Add more button */}
      {images.length > 0 && images.length < maxImages && !isUploading && (
        <Button
          type="button"
          variant="outline"
          onClick={handleAddImages}
          className="mt-2"
        >
          <Upload className="mr-2 h-4 w-4" />
          Add more images ({images.length}/{maxImages})
        </Button>
      )}
    </div>
  );
}