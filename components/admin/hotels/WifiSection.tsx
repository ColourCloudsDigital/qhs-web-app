import { FormSection, FormGroup, FormField } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { HotelFormData } from './types';

interface WifiSectionProps {
  formData: Pick<HotelFormData, 'wifiEnabled' | 'networkName' | 'bandwidthLimit'>;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onWifiEnabledChange: (checked: boolean) => void;
}

export function WifiSection({
  formData,
  onInputChange,
  onWifiEnabledChange
}: WifiSectionProps) {
  return (
    <FormSection title="WiFi Configuration" description="Configure guest WiFi settings">
      <FormGroup cols={2}>
        <FormField label="WiFi Status">
          <div className="flex items-center">
            <Checkbox
              checked={formData.wifiEnabled}
              onChange={(checked: boolean) => onWifiEnabledChange(checked)}
              label="WiFi Enabled"
            />
          </div>
        </FormField>
        
        <FormField label="Network Name">
          <Input
            name="networkName"
            value={formData.networkName}
            onChange={onInputChange}
            placeholder="Enter network name"
            disabled={!formData.wifiEnabled}
          />
        </FormField>
        
        <FormField label="Bandwidth Limit (Mbps)">
          <Input
            type="number"
            name="bandwidthLimit"
            value={formData.bandwidthLimit.toString()}
            onChange={onInputChange}
            min="1"
            step="1"
            placeholder="Enter bandwidth limit"
            disabled={!formData.wifiEnabled}
          />
        </FormField>
      </FormGroup>
    </FormSection>
  );
}