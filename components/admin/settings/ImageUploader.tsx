'use client';

import React, { useState, useRef } from 'react';
import Image from 'next/image';
import { Upload, X, ImagePlus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import toast from '@/lib/toast';
import { cn } from '@/lib/utils';

interface ImageUploaderProps {
  imageUrl?: string | null;
  onUpload: (url: string) => void;
  onRemove?: () => void;
  size?: 'small' | 'medium' | 'large' | 'banner';
  aspect?: 'square' | 'landscape' | 'portrait';
  allowedFileTypes?: string[];
  maxSizeInMB?: number;
  uploadDir?: string;
  entityId?: string;
  label?: string;
  description?: string;
}

export function ImageUploader({
  imageUrl,
  onUpload,
  onRemove,
  size = 'medium',
  aspect = 'landscape',
  allowedFileTypes = ['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp'],
  maxSizeInMB = 2,
  uploadDir = 'theme',
  entityId,
  label,
  description
}: ImageUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(imageUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sizeClasses = {
    small: "h-20 w-20",
    medium: aspect === 'landscape' ? "h-32 w-auto max-w-md" : "h-40 w-auto max-w-[160px]",
    large: aspect === 'landscape' ? "h-48 w-auto max-w-lg" : "h-64 w-auto max-w-[240px]",
    banner: "w-full max-h-72"
  };

  const containerClasses = {
    small: "p-3",
    medium: "p-4",
    large: "p-6",
    banner: "p-4"
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!allowedFileTypes.includes(file.type)) {
      toast.error(`Invalid file type. Allowed types: ${allowedFileTypes.map(t => t.split('/')[1]).join(', ')}`);
      return;
    }

    // Validate file size
    if (file.size > maxSizeInMB * 1024 * 1024) {
      toast.error(`File size exceeds the limit of ${maxSizeInMB}MB`);
      return;
    }

    setIsUploading(true);

    try {
      // Create a local preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);

      // Actually upload the file to the server
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
        const fileUrl = data.files[0];
        setPreviewUrl(fileUrl);
        onUpload(fileUrl);
        toast.success('Image uploaded successfully');
      } else {
        throw new Error('No file URL returned from server');
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to upload image');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPreviewUrl(null);
    if (onRemove) {
      onRemove();
    } else {
      onUpload(''); // Pass empty string to indicate removal
    }
    toast.info('Image removed');
  };

  return (
    <div className="space-y-2">
      {label && <div className="text-sm font-medium mb-1">{label}</div>}
      {description && <div className="text-sm text-gray-500 mb-2">{description}</div>}
      
      <input
        type="file"
        ref={fileInputRef}
        accept={allowedFileTypes.join(',')}
        className="hidden"
        onChange={handleFileChange}
      />
      
      <div 
        onClick={handleClick}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center rounded-md border-2 border-dashed border-gray-300 bg-gray-50 hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700",
          "transition-all duration-200",
          { "opacity-50": isUploading },
          containerClasses[size]
        )}
      >
        {previewUrl ? (
          <div className="relative flex justify-center w-full">
            <Image
              src={previewUrl}
              alt="Image preview"
              width={size === 'banner' ? 1200 : 400}
              height={size === 'banner' ? 400 : 200}
              className={cn("object-contain", sizeClasses[size])}
            />
            <button
              type="button"
              onClick={handleRemove}
              className="absolute -right-2 -top-2 rounded-full bg-gray-200 p-1 text-gray-700 shadow-sm hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center space-y-2 p-4">
            {isUploading ? (
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
            ) : (
              <>
                <ImagePlus className="h-10 w-10 text-gray-400" />
                <div className="space-y-1 text-center">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    SVG, PNG, JPG or WEBP (max. {maxSizeInMB}MB)
                  </p>
                </div>
              </>
            )}
          </div>
        )}
      </div>
      
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleClick}
        disabled={isUploading}
        className="w-full"
      >
        {isUploading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Uploading...
          </>
        ) : (
          <>
            <Upload className="mr-2 h-4 w-4" />
            {previewUrl ? 'Change Image' : 'Upload Image'}
          </>
        )}
      </Button>
    </div>
  );
}