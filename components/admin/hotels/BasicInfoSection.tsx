import { FormSection, FormField, FormGroup } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import SimpleSelect, { SelectItem } from '@/components/ui/select';
import { Option } from '@/components/ui/option';
import { Vendor } from './types';
import { useSession } from 'next-auth/react';

interface BasicInfoSectionProps {
  formData: {
    name: string;
    description: string;
    address: string;
    city: string;
    state: string;
    country: string;
    zipCode: string;
    phone: string;
    email: string;
    website: string;
    rating: number;
    vendorId: string;
  };
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  onVendorChange: (value: string) => void;
  vendors: Vendor[];
}

export function BasicInfoSection({ 
  formData, 
  onInputChange, 
  onVendorChange, 
  vendors 
}: BasicInfoSectionProps) {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === 'SUPER_ADMIN';
  const vendorName = vendors.find(v => v.id === formData.vendorId)?.name || '';

  return (
    <FormSection title="Basic Information">
      <FormGroup cols={2}>
        <FormField label="Hotel Name" required>
          <Input
            name="name"
            value={formData.name}
            onChange={onInputChange}
            placeholder="Grand Plaza Hotel"
            required
          />
        </FormField>
        
        {isAdmin ? (
          <FormField label="Vendor" required>
            <SimpleSelect
              value={formData.vendorId}
              onValueChange={onVendorChange}
              placeholder="Select vendor"
            >
              {vendors.map(vendor => (
                <Option key={vendor.id} value={vendor.id}>
                  {vendor.name}
                </Option>
              ))}
            </SimpleSelect>
          </FormField>
        ) : (
          <FormField label="Vendor">
            <Input
              value={vendorName || 'Your account'}
              disabled
              className="bg-gray-50"
            />
          </FormField>
        )}
      </FormGroup>
      
      <FormField label="Description">
        <Textarea
          name="description"
          value={formData.description}
          onChange={onInputChange}
          rows={4}
          placeholder="A luxurious hotel in the heart of the city..."
        />
      </FormField>
      
      <FormGroup cols={2}>
        <FormField label="Address" required>
          <Input
            name="address"
            value={formData.address}
            onChange={onInputChange}
            placeholder="123 Main Street"
            required
          />
        </FormField>
        
        <FormField label="City" required>
          <Input
            name="city"
            value={formData.city}
            onChange={onInputChange}
            placeholder="Lagos"
            required
          />
        </FormField>
        
        <FormField label="State/Province">
          <Input
            name="state"
            value={formData.state}
            onChange={onInputChange}
            placeholder="Lagos State"
          />
        </FormField>
        
        <FormField label="Country" required>
          <Input
            name="country"
            value={formData.country}
            onChange={onInputChange}
            placeholder="Nigeria"
            required
          />
        </FormField>
        
        <FormField label="Postal/ZIP Code">
          <Input
            name="zipCode"
            value={formData.zipCode}
            onChange={onInputChange}
            placeholder="101233"
          />
        </FormField>
      </FormGroup>
      
      <FormGroup cols={3}>
        <FormField label="Phone Number" required>
          <Input
            name="phone"
            value={formData.phone}
            onChange={onInputChange}
            placeholder="+234 800 123 4567"
            required
          />
        </FormField>
        
        <FormField label="Email Address" required>
          <Input
            type="email"
            name="email"
            value={formData.email}
            onChange={onInputChange}
            placeholder="contact@hotelname.com"
            required
          />
        </FormField>
        
        <FormField label="Website">
          <Input
            name="website"
            value={formData.website}
            onChange={onInputChange}
            placeholder="https://hotelname.com"
          />
        </FormField>
      </FormGroup>
    </FormSection>
  );
}