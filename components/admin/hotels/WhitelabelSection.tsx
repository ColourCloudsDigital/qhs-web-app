import { FormSection, FormField, FormRow } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { LogoUploader } from './LogoUploader';
import { HotelFormData } from './types';

interface WhitelabelSectionProps {
  formData: {
    logo: string | null;
    primaryColor: string;
    secondaryColor: string;
    fontFamily: string;
  };
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onLogoUpload: (logoUrl: string | null) => void;
  hotelId?: string;
}

export function WhitelabelSection({
  formData,
  onInputChange,
  onLogoUpload,
  hotelId
}: WhitelabelSectionProps) {
  return (
    <FormSection title="White Label Settings" description="Customize the branding for this hotel">
       {/* Logo uploader */}
       <LogoUploader
        initialLogo={formData.logo}
        entityId={hotelId}
        onLogoChange={onLogoUpload}
      />
      
      <FormRow>
        <FormField 
          label="Primary Color" 
          helperText="Main brand color"
        >
          <div className="flex items-center space-x-2">
            <Input
              type="color"
              name="primaryColor"
              value={formData.primaryColor}
              onChange={onInputChange}
              className="h-10 w-16 cursor-pointer p-1"
            />
            <Input
              type="text"
              name="primaryColor"
              value={formData.primaryColor}
              onChange={onInputChange}
              className="h-10"
              maxLength={7}
              pattern="^#([A-Fa-f0-9]{6})$"
            />
          </div>
        </FormField>
        
        <FormField 
          label="Secondary Color" 
          helperText="Accent color for buttons, etc."
        >
          <div className="flex items-center space-x-2">
            <Input
              type="color"
              name="secondaryColor"
              value={formData.secondaryColor}
              onChange={onInputChange}
              className="h-10 w-16 cursor-pointer p-1"
            />
            <Input
              type="text"
              name="secondaryColor"
              value={formData.secondaryColor}
              onChange={onInputChange}
              className="h-10"
              maxLength={7}
              pattern="^#([A-Fa-f0-9]{6})$"
            />
          </div>
        </FormField>
      </FormRow>
      
      <FormField 
        label="Font Family" 
        helperText="Primary font for the hotel's pages"
      >
        <Input
          type="text"
          name="fontFamily"
          value={formData.fontFamily}
          onChange={onInputChange}
          placeholder="Poppins, sans-serif"
        />
      </FormField>
    </FormSection>
  );
}