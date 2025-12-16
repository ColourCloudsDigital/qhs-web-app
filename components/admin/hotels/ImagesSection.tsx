import { useState } from 'react';
import { FormSection, FormField } from '@/components/ui/form';
import { FileInput } from '@/components/ui/file-input';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface ImagesSectionProps {
  existingImages: string[];
  hotelId?: string; // Added hotel ID for folder structure
  onImagesChange: (images: string[]) => void; // Changed to report final image list
}

export function ImagesSection({
  existingImages,
  hotelId,
  onImagesChange
}: ImagesSectionProps) {
  const [uploading, setUploading] = useState(false);
  const [currentImages, setCurrentImages] = useState<string[]>(existingImages);
  const [previewImages, setPreviewImages] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    
    setUploading(true);
    setError(null);
    
    // Create preview URLs for immediate feedback
    const newPreviewUrls = Array.from(files).map(file => URL.createObjectURL(file));
    setPreviewImages([...previewImages, ...newPreviewUrls]);
    
    try {
      // Prepare form data
      const formData = new FormData();
      Array.from(files).forEach(file => {
        formData.append('files', file);
      });
      
      // Determine upload folder
      const entityPath = `hotels${hotelId ? `/${hotelId}` : ''}`;
      
      // Upload files
      const response = await fetch(`/api/upload?entity=${entityPath}`, {
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
      
      // Clean up preview URLs (use the actual uploaded URLs instead)
      previewImages.forEach(url => URL.revokeObjectURL(url));
      setPreviewImages([]);
      
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

  const removePreviewImage = (index: number) => {
    const newPreviewImages = [...previewImages];
    URL.revokeObjectURL(newPreviewImages[index]);
    newPreviewImages.splice(index, 1);
    setPreviewImages(newPreviewImages);
  };

  return (
    <FormSection title="Hotel Images">
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
              <div key={`existing-${index}`} className="relative rounded-lg border border-gray-200 p-2">
                <div className="relative h-32 w-full overflow-hidden rounded-md bg-gray-100">
                  <img 
                    src={url} 
                    alt={`Hotel image ${index + 1}`} 
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      // Fallback for broken images
                      e.currentTarget.src = '/assets/images/placeholder.jpg';
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
    
      <FormField label="Upload New Images" helperText="Upload additional hotel images (JPG, PNG, WebP)">
        <FileInput
          multiple
          acceptedFileTypes="image/jpeg,image/png,image/webp"
          onChange={handleImageUpload}
          buttonText={uploading ? "Uploading..." : "Upload Images"}
          disabled={uploading}
        />
      </FormField>
      
      {/* Preview of files waiting to be uploaded */}
      {previewImages.length > 0 && (
        <div>
          <h3 className="mb-3 mt-4 text-sm font-medium text-gray-700 dark:text-gray-300">Upload Previews</h3>
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {previewImages.map((url, index) => (
              <div key={`preview-${index}`} className="relative rounded-lg border border-gray-200 p-2">
                <div className="relative h-32 w-full overflow-hidden rounded-md bg-gray-100">
                  <img src={url} alt={`Preview ${index + 1}`} className="h-full w-full object-cover" />
                  {uploading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
                      <div className="h-8 w-8 animate-spin rounded-full border-4 border-white border-opacity-25 border-t-white"></div>
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => removePreviewImage(index)}
                  className="absolute -right-2 -top-2 rounded-full bg-red-500 p-1 text-white hover:bg-red-600"
                  disabled={uploading}
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </FormSection>
  );
}  