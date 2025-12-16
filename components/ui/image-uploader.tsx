'use client';

import { useState, useCallback, useRef } from 'react';
import { Trash, Upload, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ImageUploaderProps {
  existingImages?: string[];
  onImagesChange: (images: string[]) => void;
  entityType: string;
  entityId?: string;
  maxImages?: number;
  className?: string;
  square?: boolean;
  maxWidth?: number;
  maxHeight?: number;
  showDimensions?: boolean;
}

export function ImageUploader({
  existingImages = [],
  onImagesChange,
  entityType,
  entityId,
  maxImages = 5,
  className = '',
  square = false,
  maxWidth,
  maxHeight,
  showDimensions = false,
}: ImageUploaderProps) {
  const [images, setImages] = useState<string[]>(existingImages);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle file selection
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    // Check if adding these files would exceed maxImages
    if (images.length + files.length > maxImages) {
      setError(`You can only upload a maximum of ${maxImages} images`);
      return;
    }
    
    setError(null);
    setUploading(true);
    setUploadProgress(0);
    
    try {
      const formData = new FormData();
      for (let i = 0; i < files.length; i++) {
        formData.append('files', files[i]);
      }
      
      // Build query parameters
      const queryParams = new URLSearchParams();
      queryParams.append('entity', entityType);
      if (entityId) queryParams.append('id', entityId);
      if (square) queryParams.append('square', 'true');
      if (maxWidth) queryParams.append('maxWidth', maxWidth.toString());
      if (maxHeight) queryParams.append('maxHeight', maxHeight.toString());
      
      const response = await fetch(`/api/upload?${queryParams.toString()}`, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to upload images');
      }
      
      const data = await response.json();
      
      // Update images array with new uploads
      const newImages = [...images, ...data.files];
      setImages(newImages);
      onImagesChange(newImages);
      
    } catch (err) {
      console.error('Error uploading images:', err);
      setError(err instanceof Error ? err.message : 'Failed to upload images');
    } finally {
      setUploading(false);
      setUploadProgress(0);
      // Reset input so the same file can be uploaded again if needed
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };
  
  // Remove an image
  const removeImage = useCallback((index: number) => {
    const newImages = [...images];
    newImages.splice(index, 1);
    setImages(newImages);
    onImagesChange(newImages);
  }, [images, onImagesChange]);
  
  // Trigger file input click
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };
  
  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex flex-wrap gap-4">
        {images.map((image, index) => (
          <div key={index} className="relative group">
            <div className="h-32 w-32 rounded-md overflow-hidden bg-gray-100 border border-gray-200">
              <img
                src={image}
                alt={`Upload ${index + 1}`}
                className="h-full w-full object-cover"
                onError={(e) => {
                  // Fallback for broken images
                  (e.target as HTMLImageElement).src = '/assets/images/placeholder.jpg';
                }}
              />
            </div>
            <button
              type="button"
              onClick={() => removeImage(index)}
              className="absolute top-1 right-1 bg-white bg-opacity-70 rounded-full p-1 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label="Remove image"
            >
              <X size={16} />
            </button>
          </div>
        ))}
        
        {images.length < maxImages && (
          <button
            type="button"
            onClick={handleUploadClick}
            disabled={uploading}
            className="h-32 w-32 rounded-md border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-500 hover:border-gray-400 hover:bg-gray-50 transition-colors"
          >
            {uploading ? (
              <div className="flex flex-col items-center">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <span className="mt-2 text-xs">Uploading...</span>
                {uploadProgress > 0 && (
                  <div className="w-16 h-1 bg-gray-200 rounded-full mt-2">
                    <div 
                      className="h-full bg-primary rounded-full" 
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                )}
              </div>
            ) : (
              <>
                <Upload size={24} />
                <span className="mt-2 text-xs">Add Image</span>
              </>
            )}
          </button>
        )}
      </div>
      
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="hidden"
      />
      
      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}
      
      <div className="text-sm text-gray-500">
        {images.length} of {maxImages} images uploaded. 
        <span className="ml-1">Allowed formats: JPG, PNG, WEBP. Max size: 2MB per image.</span>
      </div>
    </div>
  );
}