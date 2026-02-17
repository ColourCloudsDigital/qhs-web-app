'use client';

import React, { useState, useRef } from 'react';
import Image from 'next/image';
import { Upload, X, ImagePlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';

interface LogoUploaderProps {
  imageUrl?: string | null;
  onUpload: (url: string) => void;
  size?: 'small' | 'medium' | 'large';
  allowedFileTypes?: string[];
  maxSizeInMB?: number;
}

export function LogoUploader({
  imageUrl,
  onUpload,
  size = 'medium',
  allowedFileTypes = ['image/png', 'image/jpeg', 'image/svg+xml', 'image/x-icon'],
  maxSizeInMB = 2
}: LogoUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(imageUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const sizeClasses = {
    small: "h-20 w-20",
    medium: "h-32 w-auto",
    large: "h-48 w-auto"
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!allowedFileTypes.includes(file.type)) {
      toast({
        title: 'Error',
        description: `Invalid file type. Allowed types: ${allowedFileTypes.join(', ')}`,
      });
      return;
    }

    // Validate file size
    if (file.size > maxSizeInMB * 1024 * 1024) {
      toast({
        title: 'Error',
        description: `File size exceeds the limit of ${maxSizeInMB}MB`,
      });
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

      // In a real app, you would upload to your server/cloud storage here
      // This is a mock implementation
      await mockUploadToServer(file);

      // Simulate getting the URL back from server
      const mockUrl = URL.createObjectURL(file);
      
      onUpload(mockUrl);
      
      toast({
        title: 'Success',
        description: 'Logo uploaded successfully',
      });
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: 'Error',
        description: 'Failed to upload logo',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPreviewUrl(null);
    // In a real app, you might want to call an API to delete the file
    // onUpload(''); // Pass empty string or null to indicate removal
    toast({
      title: 'Info',
      description: 'Logo removed',
    });
  };

  // Mock function to simulate server upload
  const mockUploadToServer = async (file: File): Promise<void> => {
    return new Promise((resolve) => {
      // Simulate network delay
      setTimeout(() => {
        resolve();
      }, 1000);
    });
  };

  return (
    <div className="space-y-2">
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
          "flex cursor-pointer flex-col items-center justify-center rounded-md border-2 border-dashed border-gray-300 bg-gray-50 p-4 hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700",
          "transition-all duration-200",
          { "opacity-50": isUploading }
        )}
      >
        {previewUrl ? (
          <div className="relative">
            <Image
              src={previewUrl}
              alt="Logo preview"
              width={size === 'small' ? 80 : 200}
              height={size === 'small' ? 80 : 60}
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
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-300 border-t-primary"></div>
            ) : (
              <>
                <ImagePlus className="h-10 w-10 text-gray-400" />
                <div className="space-y-1 text-center">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    SVG, PNG, JPG or ICO (max. {maxSizeInMB}MB)
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
        <Upload className="mr-2 h-4 w-4" />
        {previewUrl ? 'Change Logo' : 'Upload Logo'}
      </Button>
    </div>
  );
}