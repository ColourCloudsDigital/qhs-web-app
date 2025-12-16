import { useState } from 'react';
import { FormSection, FormField } from '@/components/ui/form';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface HotelImagesUploaderProps {
  existingImages: string[];
  hotelId?: string;
  onImagesChange: (images: string[]) => void;
  title?: string;
  description?: string;
  maxImages?: number;
}

export function HotelImagesUploader({
  existingImages,
  hotelId,
  onImagesChange,
  title = "Hotel Images",
  description = "Upload images of the hotel (exterior, amenities, common areas)",
  maxImages = 10
}: HotelImagesUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [currentImages, setCurrentImages] = useState<string[]>(existingImages);
  const [error, setError] = useState<string | null>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    
    // Check if adding these files would exceed the limit
    if (currentImages.length + files.length > maxImages) {
      setError(`You can only upload a maximum of ${maxImages} images`);
      return;
    }
    
    setUploading(true);
    setError(null);
    
    try {
      // Prepare form data
      const formData = new FormData();
      Array.from(files).forEach(file => {
        formData.append('files', file);
      });
      
      // Build the query params
      const queryParams = new URLSearchParams();
      queryParams.append('entity', 'hotels');
      if (hotelId) queryParams.append('id', hotelId);
      
      // Set max dimensions for hotel images
      queryParams.append('maxWidth', '1920');
      queryParams.append('maxHeight', '1080');
      
      // Upload files
      const response = await fetch(`/api/upload?${queryParams.toString()}`, {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to upload images');
      }
      
      const data = await response.json();
      
      // Update images list with new uploads
      const updatedImages = [...currentImages, ...data.files];
      setCurrentImages(updatedImages);
      onImagesChange(updatedImages);
      
      // Clear file input
      e.target.value = '';
      
    } catch (err) {
      console.error('Error uploading images:', err);
      setError(err instanceof Error ? err.message : 'Failed to upload images');
    } finally {
      setUploading(false);
    }
  };
  
  const removeImage = (index: number) => {
    const newImages = [...currentImages];
    newImages.splice(index, 1);
    setCurrentImages(newImages);
    onImagesChange(newImages);
  };

  return (
    <FormSection title={title}>
      {/* Display error if any */}
      {error && (
        <div className="mb-4 rounded-md bg-red-50 p-4 dark:bg-red-900/20">
          <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
        </div>
      )}
      
      {/* Existing Images */}
      {currentImages.length > 0 && (
        <div>
          <h3 className="mb-3 text-sm font-medium text-gray-700 dark:text-gray-300">Current Images</h3>
          <div className="mb-6 grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {currentImages.map((url, index) => (
              <div key={`existing-${index}`} className="relative group rounded-lg border border-gray-200 p-2">
                <div className="relative aspect-video w-full overflow-hidden rounded-md bg-gray-100">
                  <img 
                    src={url} 
                    alt={`Hotel image ${index + 1}`} 
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      // Fallback for broken images
                      (e.currentTarget as HTMLImageElement).src = '/assets/images/placeholder.jpg';
                    }} 
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute -right-2 -top-2 rounded-full bg-red-500 p-1 text-white hover:bg-red-600"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    
      <FormField 
        label="Upload Images" 
        helperText={`Upload up to ${maxImages} images. ${description}. Supported formats: JPG, PNG, WebP. Max size: 2MB per image.`}
      >
        <div>
          <label 
            htmlFor="image-upload" 
            className={`flex cursor-pointer flex-col items-center justify-center rounded-md border-2 border-dashed border-gray-300 px-6 py-8 transition-colors hover:border-gray-400 hover:bg-gray-50 ${uploading ? 'opacity-50' : ''}`}
          >
            <div className="flex flex-col items-center justify-center text-center">
              <svg
                className="mb-2 h-12 w-12 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <p className="mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                {uploading ? 'Uploading...' : 'Click to upload or drag and drop'}
              </p>
              <p className="text-xs text-gray-500">
                {uploading ? 'Please wait...' : `${currentImages.length}/${maxImages} images`}
              </p>
            </div>
            <input
              id="image-upload"
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp"
              onChange={handleImageUpload}
              disabled={uploading}
              className="hidden"
            />
          </label>
        </div>
      </FormField>
    </FormSection>
  );
}