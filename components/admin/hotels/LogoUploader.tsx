import { useState, useRef } from 'react';
import { FormField } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Upload, X, Loader2 } from 'lucide-react';

interface LogoUploaderProps {
  initialLogo?: string | null;
  entityId?: string;
  onLogoChange: (logoUrl: string | null) => void;
  label?: string;
  helperText?: string;
}

export function LogoUploader({
  initialLogo = null,
  entityId,
  onLogoChange,
  label = "Upload Logo",
  helperText = "Upload a square logo image (PNG or SVG preferred)"
}: LogoUploaderProps) {
  const [logo, setLogo] = useState<string | null>(initialLogo);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    
    // Basic file validation
    if (!['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'].includes(file.type)) {
      setError('Please upload a PNG, JPG, WebP, or SVG file');
      return;
    }
    
    if (file.size > 2 * 1024 * 1024) {
      setError('Logo must be smaller than 2MB');
      return;
    }
    
    setUploading(true);
    setError(null);
    
    try {
      // Prepare form data
      const formData = new FormData();
      formData.append('files', file);
      
      // Build query params - store in dedicated logos directory
      const params = new URLSearchParams({
        entity: entityId ? `hotels/${entityId}/logos` : 'logos', // Store in hotel-specific folder
        square: 'true' // Ensure logo is processed as square
      });
      
      // Upload the logo
      const response = await fetch(`/api/upload?${params.toString()}`, {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to upload logo');
      }
      
      const data = await response.json();
      
      if (data.files && data.files.length > 0) {
        const newLogoUrl = data.files[0];
        console.log('Logo uploaded to:', newLogoUrl); // For debugging
        setLogo(newLogoUrl);
        onLogoChange(newLogoUrl);
      }
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      console.error('Error uploading logo:', err);
      setError(err instanceof Error ? err.message : 'Failed to upload logo');
    } finally {
      setUploading(false);
    }
  };
  
  const handleRemoveLogo = () => {
    setLogo(null);
    onLogoChange(null);
  };
  
  const handleLogoClick = () => {
    if (!uploading && !logo) {
      fileInputRef.current?.click();
    }
  };
  
  return (
    <FormField label={label} helperText={helperText}>
      <div className="space-y-4">
        {/* Logo preview or upload button */}
        <div 
          onClick={handleLogoClick}
          className={`mx-auto flex h-32 w-32 cursor-pointer items-center justify-center rounded-md border-2 ${
            logo ? 'border-solid border-gray-200' : 'border-dashed border-gray-300 hover:border-gray-400 hover:bg-gray-50'
          }`}
        >
          {logo ? (
            <div className="relative h-full w-full">
              <img 
                src={logo} 
                alt="Logo" 
                className="h-full w-full rounded-md object-contain"
                onError={() => {
                  setError('Failed to load logo');
                  setLogo(null);
                }} 
              />
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveLogo();
                }}
                className="absolute -right-2 -top-2 rounded-full bg-red-500 p-1 text-white hover:bg-red-600"
                disabled={uploading}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : uploading ? (
            <div className="flex flex-col items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="mt-2 text-xs text-gray-500">Uploading...</span>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-center p-2">
              <Upload className="h-6 w-6 text-gray-400" />
              <span className="mt-2 text-xs text-gray-500">Click to upload logo</span>
            </div>
          )}
        </div>
        
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept="image/png,image/jpeg,image/webp,image/svg+xml"
          onChange={handleFileChange}
          disabled={uploading}
        /> 
        
        {/* Error message */}
        {error && (
          <p className="text-xs text-red-500">{error}</p>
        )}
        
        {/* Explicit upload button for better UX */}
        {!logo && (
          <Button
            type="button"
            onClick={handleLogoClick}
            variant="outline"
            size="sm"
            className="mx-auto flex"
            disabled={uploading}
          >
            {uploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Upload Logo
              </>
            )}
          </Button>
        )}
      </div>
    </FormField>
  );
}