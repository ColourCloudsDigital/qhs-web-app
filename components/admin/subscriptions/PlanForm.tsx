'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Trash } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { formatCurrency } from '@/lib/utils';
import toast from '@/lib/services/toast.service';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Option } from '@/components/ui/option';

type FormMode = 'create' | 'edit';

interface Module {
  id: string;
  name: string;
  type: string;
  description: string;
}

interface PlanFormProps {
  planId?: string;
  mode: FormMode;
  initialData?: any;
}

export default function PlanForm({ planId, mode, initialData }: PlanFormProps) {
  const router = useRouter();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [isActive, setIsActive] = useState(true);
  const [featuresObj, setFeaturesObj] = useState<Record<string, boolean>>({});
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Fetch modules first, then initialize form data
  useEffect(() => {
    const initData = async () => {
      try {
        setLoading(true);
        
        // Initialize form with data if in edit mode
        if (mode === 'edit' && initialData) {
          setName(initialData.name || '');
          setDescription(initialData.description || '');
          setPrice(initialData.price?.toString() || '');
          setBillingCycle(initialData.billingCycle || 'monthly');
          setIsActive(initialData.isActive !== undefined ? initialData.isActive : true);
          
          // Initialize features from the object structure
          if (initialData.features && typeof initialData.features === 'object') {
            console.log('Features from API:', initialData.features);
            setFeaturesObj(initialData.features);
          }
        }
        
        // Try to fetch modules from API
        await fetchModules();
      } finally {
        setLoading(false);
      }
    };
    
    initData();
  }, [mode, initialData]);

  // Fetch available modules
  const fetchModules = async () => {
    try {
      console.log('Attempting to fetch modules from API...');
      
      // Try fetching modules from correct endpoint
      let response;
      try {
        response = await fetch('/api/modules');
      } catch (error) {
        console.error('Error fetching from modules endpoint:', error);
      }
      
      // If we got a successful response
      if (response && response.ok) {
        const data = await response.json();
        
        if (data.modules && data.modules.length > 0) {
          console.log('Successfully fetched modules from API:', data.modules);
          setModules(data.modules);
          
          // Initialize features if none exist yet
          if (Object.keys(featuresObj).length === 0) {
            const initialFeatures: Record<string, boolean> = {};
            data.modules.forEach((module: Module) => {
              initialFeatures[module.id] = false;
            });
            setFeaturesObj(initialFeatures);
          }
        }
      }
    } catch (error) {
      console.error('Error in fetchModules:', error);
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!name.trim()) {
      toast.error('Plan name is required');
      return;
    }
    
    if (!price || isNaN(Number(price)) || Number(price) < 0) {
      toast.error('Please enter a valid price');
      return;
    }
    
    setSubmitting(true);
    
    try {
      // Prepare data
      const planData = {
        name,
        description,
        price: Number(price),
        billingCycle,
        isActive,
        features: featuresObj
      };
      
      // Determine endpoint and method based on mode
      const endpoint = mode === 'create' 
        ? '/api/admin/subscription-plans' 
        : `/api/admin/subscription-plans/${planId}`;
      
      const method = mode === 'create' ? 'POST' : 'PUT';
      
      console.log('Submitting plan data:', planData);
      
      // Submit the form
      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(planData),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save plan');
      }
      
      toast.success(`Subscription plan ${mode === 'create' ? 'created' : 'updated'} successfully`);
      
      // Redirect to plans list
      router.push('/admin/subscription-plans');
    } catch (error) {
      console.error('Error saving plan:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save plan');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle feature toggle
  const handleFeatureToggle = (moduleId: string, enabled: boolean) => {
    setFeaturesObj(prev => ({
      ...prev,
      [moduleId]: enabled
    }));
  };

  // Get module name by ID
  const getModuleName = (moduleId: string) => {
    const foundModule = modules.find(m => m.id === moduleId);
    if (foundModule) return foundModule.name;
    
    // Fallback names for common modules
    if (moduleId === "ROOM_BOOKING") return "Room Booking Module";
    if (moduleId === "FACILITY_MANAGEMENT") return "Facility Management Module";
    if (moduleId === "KEYCARD") return "Keycard Module";
    if (moduleId === "CCTV") return "CCTV Module";
    if (moduleId === "WIFI") return "WiFi Module";
    if (moduleId === "QR_MENU") return "QR Menu Module";
    if (moduleId === "WHITE_LABEL") return "WhiteLabel Module";
    if (moduleId === "BLOG") return "Blog Module";
    if (moduleId === "POS") return "POS System Module";
    
    return `Module ${moduleId}`;
  };

  // Get module description by ID
  const getModuleDescription = (moduleId: string) => {
    const foundModule = modules.find(m => m.id === moduleId);
    if (foundModule) return foundModule.description;
    return 'No description available';
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Basic Plan Details */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">Plan Details</h2>
        
        <div className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Plan Name <span className="text-red-500">*</span>
            </label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter plan name"
              required
              className="mt-1"
            />
          </div>
          
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Description
            </label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter plan description"
              className="mt-1"
              rows={3}
            />
          </div>
          
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label htmlFor="price" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Price (NGN) <span className="text-red-500">*</span>
              </label>
              <Input
                id="price"
                type="number"
                min="0"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="Enter price"
                required
                className="mt-1"
              />
              {price && !isNaN(Number(price)) && (
                <p className="mt-1 text-sm text-gray-500">
                  {formatCurrency(Number(price))}
                </p>
              )}
            </div>
            
            <div>
              <label htmlFor="billingCycle" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Billing Cycle <span className="text-red-500">*</span>
              </label>
              <Select
                value={billingCycle}
                onValueChange={(value) => setBillingCycle(value)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select billing cycle" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                  <SelectItem value="biannually">Bi-annually</SelectItem>
                  <SelectItem value="annually">Annually</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="isActive" 
              checked={isActive}
              onCheckedChange={(checked) => setIsActive(checked as boolean)}
            />
            <label
              htmlFor="isActive"
              className="text-sm font-medium leading-none text-gray-700 dark:text-gray-300"
            >
              Active plan
            </label>
          </div>
        </div>
      </div>
      
      {/* Included Features Section */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">Module Access</h2>
        
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Select which modules this subscription plan will have access to.
          </p>
          
          {modules.length > 0 ? (
            <div className="space-y-4">
              {modules.map((module) => (
                <div 
                  key={module.id} 
                  className="rounded-lg border border-gray-200 p-4 dark:border-gray-700"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <Checkbox
                        id={`module-${module.id}`}
                        checked={featuresObj[module.id] === true}
                        onCheckedChange={(checked) => 
                          handleFeatureToggle(module.id, checked as boolean)
                        }
                      />
                      <div>
                        <label
                          htmlFor={`module-${module.id}`}
                          className="font-medium text-gray-900 dark:text-white"
                        >
                          {module.name}
                        </label>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {module.description}
                        </p>
                      </div>
                    </div>
                    <span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-medium text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                      {module.type}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex justify-center">
              <div className="text-center">
                <p className="text-gray-500 dark:text-gray-400">No modules available</p>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Please create modules before setting up subscription plans
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Form Actions */}
      <div className="flex items-center justify-between">
        <Button 
          type="button"
          variant="outline"
          onClick={() => router.push('/admin/subscription-plans')}
          className="flex items-center gap-1"
        >
          <ArrowLeft className="h-4 w-4" />
          Cancel
        </Button>
        
        <Button
          type="submit"
          disabled={submitting}
          className="flex items-center gap-1"
        >
          {submitting ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
          ) : null}
          {mode === 'create' ? 'Create Plan' : 'Update Plan'}
        </Button>
      </div>
    </form>
  );
}