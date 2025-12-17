'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { UserRole } from '@/lib/types/enums';
import { useToast } from "@/components/ui/toast";
import { ArrowLeftIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { Camera, X, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

interface EditUserPageProps {
  params: {
    id: string;
  };
}

export default function EditUserPage({ params }: EditUserPageProps) {
  const userId = params.id;
  const router = useRouter();
  const { addToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: '' as UserRole,
    isActive: true,
    userPhoto: '',
    // Customer fields
    phone: '',
    address: '',
    // Vendor fields
    companyName: '',
    businessAddress: '',
    businessPhone: '',
    taxId: '',
    subscriptionPlanId: '',
    // Staff fields
    position: '',
    hotelId: '',
    vendorId: '',
    permissions: [] as string[],
  });
  
  const [subscriptionPlans, setSubscriptionPlans] = useState<Array<{id: string, name: string, price: number}>>([]);
  const [loading, setLoading] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hotels, setHotels] = useState<{id: string, name: string}[]>([]);
  const [vendors, setVendors] = useState<{id: string, name: string}[]>([]);
  
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  
  // Fetch subscription plans
  useEffect(() => {
    const fetchSubscriptionPlans = async () => {
      try {
        console.log("Fetching subscription plans...");
        // Fixed endpoint to match the one used in subscription plans page
        const response = await fetch('/api/admin/subscription-plans?simple=true');
        
        const responseText = await response.text();
        let data;
        
        try {
          // Try to parse the response as JSON
          data = JSON.parse(responseText);
        } catch (parseError) {
          console.error('Failed to parse subscription plans response as JSON:', responseText);
          addToast({
            title: "Error",
            description: "Invalid response format from subscription plans API",
            type: "error"
          });
          return;
        }
        
        if (response.ok) {
          console.log("Subscription plans fetched successfully:", data.plans?.length || 0);
          setSubscriptionPlans(data.plans || []);
        } else {
          console.error('Failed to fetch subscription plans. Status:', response.status, 'Response:', data);
          addToast({
            title: "Error",
            description: `Failed to load subscription plans: ${data.error || response.statusText}`,
            type: "error"
          });
        }
      } catch (err) {
        console.error('Error fetching subscription plans:', err);
        addToast({
          title: "Error",
          description: `Error loading subscription plans: ${err instanceof Error ? err.message : String(err)}`,
          type: "error"
        });
      }
    };
    
    fetchSubscriptionPlans();
  }, [addToast]);

  // Fetch user data
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setIsDataLoading(true);
        
        console.log("Fetching user data for ID:", userId);
        const response = await fetch(`/api/admin/users/${userId}`);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error("Server response:", errorText);
          throw new Error(`Failed to fetch user data: ${response.status} ${response.statusText} - ${errorText}`);
        }
        
        const { user } = await response.json();
        console.log("Received user data:", user);
        
        // Set form data from user object
        setFormData({
          name: user.name || '',
          email: user.email || '',
          password: '',
          confirmPassword: '',
          role: user.role,
          isActive: user.isActive,
          userPhoto: user.userPhoto || '',
          // Customer fields
          phone: user.customer?.phone || '',
          address: user.customer?.address || '',
          // Vendor fields
          companyName: user.vendor?.companyName || '',
          businessAddress: user.vendor?.businessAddress || '',
          businessPhone: user.vendor?.businessPhone || '',
          taxId: user.vendor?.taxId || '',
          subscriptionPlanId: user.vendor?.subscriptionPlanId || 'none',
          // Staff fields
          position: user.staff?.position || '',
          hotelId: user.staff?.hotelId || 'none',
          vendorId: user.staff?.vendorId || '',
          permissions: user.staff?.permissions 
            ? JSON.parse(user.staff.permissions) 
            : [],
        });
        
        // Set photo preview if exists
        if (user.userPhoto) {
          setPhotoPreview(user.userPhoto);
        }
        
        setError(null);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load user data';
        setError(errorMessage);
        addToast({
          title: "Error",
          description: errorMessage,
          type: "error"
        });
        console.error('Error fetching user:', err);
      } finally {
        setIsDataLoading(false);
      }
    };
    
    fetchUserData();
  }, [userId, addToast]);
  
  // Fetch vendors for staff assignment
  useEffect(() => {
    const fetchVendors = async () => {
      try {
        console.log("Fetching vendors...");
        const response = await fetch('/api/admin/vendors?simple=true');
        
        const responseText = await response.text();
        let data;
        
        try {
          // Try to parse the response as JSON
          data = JSON.parse(responseText);
        } catch (parseError) {
          console.error('Failed to parse vendors response as JSON:', responseText);
          addToast({
            title: "Error",
            description: "Invalid response format from vendors API",
            type: "error"
          });
          return;
        }
        
        if (response.ok) {
          console.log("Vendors fetched successfully:", data.vendors?.length || 0);
          setVendors(data.vendors || []);
        } else {
          console.error('Failed to fetch vendors. Status:', response.status, 'Response:', data);
          addToast({
            title: "Error",
            description: `Failed to load vendors: ${data.error || response.statusText}`,
            type: "error"
          });
        }
      } catch (err) {
        console.error('Error fetching vendors:', err);
        addToast({
          title: "Error",
          description: `Error loading vendors: ${err instanceof Error ? err.message : String(err)}`,
          type: "error"
        });
      }
    };
    
    fetchVendors();
  }, [addToast]);
  
  // Fetch hotels for staff assignment when role is STAFF
  useEffect(() => {
    if (formData.role === UserRole.STAFF) {
      fetchHotels();
    }
  }, [formData.role]);
  
  // Fetch hotels for staff assignment
  const fetchHotels = async () => {
    try {
      console.log("Fetching hotels...");
      const response = await fetch('/api/admin/hotels?simple=true');
      
      const responseText = await response.text();
      let data;
      
      try {
        // Try to parse the response as JSON
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Failed to parse hotels response as JSON:', responseText);
        addToast({
          title: "Error",
          description: "Invalid response format from hotels API",
          type: "error"
        });
        return;
      }
      
      if (response.ok) {
        console.log("Hotels fetched successfully:", data.hotels?.length || 0);
        setHotels(data.hotels || []);
      } else {
        console.error('Failed to fetch hotels. Status:', response.status, 'Response:', data);
        addToast({
          title: "Error",
          description: `Failed to load hotels: ${data.error || response.statusText}`,
          type: "error"
        });
      }
    } catch (err) {
      console.error('Error fetching hotels:', err);
      addToast({
        title: "Error",
        description: `Error loading hotels: ${err instanceof Error ? err.message : String(err)}`,
        type: "error"
      });
    }
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checkbox = e.target as HTMLInputElement;
      setFormData(prev => ({
        ...prev,
        [name]: checkbox.checked,
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value,
      }));
    }
  };
  
  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };
  
  const handleCheckboxChange = (name: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      [name]: checked,
    }));
  };
  
  const handlePermissionChange = (permission: string, checked: boolean) => {
    setFormData(prev => {
      if (checked) {
        return {
          ...prev,
          permissions: [...prev.permissions, permission],
        };
      } else {
        return {
          ...prev,
          permissions: prev.permissions.filter(p => p !== permission),
        };
      }
    });
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      addToast({
        title: "Error",
        description: "Image size must be less than 5MB",
        type: "error"
      });
      return;
    }
    
    // Check file type
    if (!file.type.startsWith('image/')) {
      addToast({
        title: "Error",
        description: "Only image files are allowed",
        type: "error"
      });
      return;
    }
    
    setPhotoFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };
  
  const removePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
    setFormData(prev => ({
      ...prev,
      userPhoto: '',
    }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError(null);
      
      // Validate passwords if they were entered
      if (formData.password && formData.password !== formData.confirmPassword) {
        setError('Passwords do not match');
        setLoading(false);
        return;
      }
      
      // Handle file upload first if there's a new photo
      let userPhotoPath = formData.userPhoto;
      
      if (photoFile) {
        const fileFormData = new FormData();
        fileFormData.append('photo', photoFile);
        fileFormData.append('userId', userId);
        
        const uploadResponse = await fetch('/api/upload/profile-photo', {
          method: 'POST',
          body: fileFormData,
        });
        
        if (!uploadResponse.ok) {
          const errorData = await uploadResponse.json();
          throw new Error(errorData.error || 'Failed to upload profile photo');
        }
        
        const { filepath } = await uploadResponse.json();
        userPhotoPath = filepath;
      }
      
      // Prepare data according to user role
      const userData: any = {
        name: formData.name,
        email: formData.email,
        role: formData.role,
        isActive: formData.isActive,
        userPhoto: userPhotoPath,
      };
      
      // Only include password if it was changed
      if (formData.password) {
        userData.password = formData.password;
      }
      
      // Add role-specific data
      if (formData.role === UserRole.CUSTOMER) {
        userData.customer = {
          phone: formData.phone || null,
          address: formData.address || null,
        };
      } else if (formData.role === UserRole.VENDOR) {
        userData.vendor = {
          companyName: formData.companyName,
          businessAddress: formData.businessAddress || null,
          businessPhone: formData.businessPhone || null,
          taxId: formData.taxId || null,
          subscriptionPlanId: formData.subscriptionPlanId === 'none' ? null : formData.subscriptionPlanId,
        };
      } else if (formData.role === UserRole.STAFF) {
        userData.staff = {
          position: formData.position,
          hotelId: formData.hotelId === 'none' ? null : formData.hotelId,
          vendorId: formData.vendorId,
          permissions: JSON.stringify(formData.permissions),
        };
      }
      
      console.log("Submitting user data:", userData);
      
      // Send update request
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update user');
      }
      
      addToast({
        title: "Success",
        description: "User updated successfully",
        type: "success"
      });
      
      // Redirect to user details page
      router.push(`/admin/users/${userId}`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update user';
      setError(errorMessage);
      addToast({
        title: "Error",
        description: errorMessage,
        type: "error"
      });
      console.error('Error updating user:', err);
    } finally {
      setLoading(false);
    }
  };
  
  if (isDataLoading) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <div className="text-center">
          <div className="spinner-border h-8 w-8 text-primary"></div>
          <p className="mt-2 text-gray-700 dark:text-gray-300">Loading user data...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Link 
            href={`/admin/users/${userId}`} 
            className="mr-4 rounded-full p-2 text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Edit User</h1>
        </div>
      </div>
      
      {error && (
        <Alert variant="error">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="mb-4 flex items-center justify-center md:justify-start">
              <div className="relative">
                <div className="h-32 w-32 overflow-hidden rounded-full border-2 border-gray-200 dark:border-gray-700">
                  {photoPreview ? (
                    <img 
                      src={photoPreview} 
                      alt="Profile preview" 
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gray-100 dark:bg-gray-800">
                      {formData.name ? (
                        <span className="text-4xl font-bold text-gray-400">
                          {formData.name.charAt(0).toUpperCase()}
                        </span>
                      ) : (
                        <Camera className="h-12 w-12 text-gray-400" />
                      )}
                    </div>
                  )}
                </div>
                <input 
                  type="file" 
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden" 
                />
                <div className="absolute -right-2 -top-2">
                  {photoPreview ? (
                    <button 
                      type="button"
                      onClick={removePhoto}
                      className="rounded-full bg-red-100 p-1 text-red-600 hover:bg-red-200 dark:bg-red-900/50 dark:text-red-400 dark:hover:bg-red-900/75"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 rounded-full bg-primary p-2 text-white shadow-md hover:bg-primary-dark"
                >
                  <Camera className="h-4 w-4" />
                </button>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-900 dark:text-white">Profile Photo</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Upload a profile photo (max 5MB)
                </p>
              </div>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium">Full Name</label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">Email Address</label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium">
                  Password <span className="text-xs text-gray-500">(Leave blank to keep unchanged)</span>
                </label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="••••••••"
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="confirmPassword" className="text-sm font-medium">Confirm Password</label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  placeholder="••••••••"
                />
              </div>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="role" className="text-sm font-medium">Role</label>
                <Select
                  value={formData.role}
                  onValueChange={(value) => handleSelectChange('role', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={UserRole.CUSTOMER}>Customer</SelectItem>
                    <SelectItem value={UserRole.VENDOR}>Vendor</SelectItem>
                    <SelectItem value={UserRole.STAFF}>Staff</SelectItem>
                    <SelectItem value={UserRole.SUPER_ADMIN}>Super Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-end space-x-2 pb-2">
                <Checkbox 
                  id="isActive" 
                  checked={formData.isActive} 
                  onCheckedChange={(checked) => handleCheckboxChange('isActive', checked as boolean)}
                />
                <label htmlFor="isActive" className="text-sm font-medium">Active Account</label>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Role-specific fields */}
        {formData.role === UserRole.CUSTOMER && (
          <Card>
            <CardHeader>
              <CardTitle>Customer Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label htmlFor="phone" className="text-sm font-medium">Phone Number</label>
                  <Input
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="Optional"
                  />
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="address" className="text-sm font-medium">Address</label>
                  <Textarea
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder="Optional"
                    rows={3}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        
        {formData.role === UserRole.VENDOR && (
          <Card>
            <CardHeader>
              <CardTitle>Vendor Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label htmlFor="companyName" className="text-sm font-medium">Company Name</label>
                  <Input
                    id="companyName"
                    name="companyName"
                    value={formData.companyName}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="businessPhone" className="text-sm font-medium">Business Phone</label>
                  <Input
                    id="businessPhone"
                    name="businessPhone"
                    value={formData.businessPhone}
                    onChange={handleInputChange}
                    placeholder="Optional"
                  />
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="taxId" className="text-sm font-medium">Tax ID / Business Registration Number</label>
                  <Input
                    id="taxId"
                    name="taxId"
                    value={formData.taxId}
                    onChange={handleInputChange}
                    placeholder="Optional"
                  />
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="subscriptionPlanId" className="text-sm font-medium">Subscription Plan</label>
                  <Select
                    value={formData.subscriptionPlanId}
                    onValueChange={(value) => handleSelectChange('subscriptionPlanId', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select plan" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Plan</SelectItem>
                      {subscriptionPlans.map((plan) => (
                        <SelectItem key={plan.id} value={plan.id}>
                          {plan.name} (₦{plan.price.toLocaleString()})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2 md:col-span-2">
                  <label htmlFor="businessAddress" className="text-sm font-medium">Business Address</label>
                  <Textarea
                    id="businessAddress"
                    name="businessAddress"
                    value={formData.businessAddress}
                    onChange={handleInputChange}
                    placeholder="Optional"
                    rows={3}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        
        {formData.role === UserRole.STAFF && (
          <Card>
            <CardHeader>
              <CardTitle>Staff Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label htmlFor="position" className="text-sm font-medium">Position</label>
                  <Input
                    id="position"
                    name="position"
                    value={formData.position}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="vendorId" className="text-sm font-medium">Vendor</label>
                  <Select
                    value={formData.vendorId}
                    onValueChange={(value) => handleSelectChange('vendorId', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select vendor" />
                    </SelectTrigger>
                    <SelectContent>
                      {vendors.map((vendor) => (
                        <SelectItem key={vendor.id} value={vendor.id}>{vendor.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="hotelId" className="text-sm font-medium">Assigned Hotel (Optional)</label>
                  <Select
                    value={formData.hotelId}
                    onValueChange={(value) => {
                      if (value === 'unassigned') {
                        return "";
                      } else {handleSelectChange('hotelId', value)}}
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select hotel" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassigned">Not Assigned</SelectItem>
                      {hotels.map((hotel) => (
                        <SelectItem key={hotel.id} value={hotel.id}>{hotel.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Permissions</label>
                <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="perm-bookings" 
                      checked={formData.permissions.includes('bookings')}
                      onCheckedChange={(checked) => handlePermissionChange('bookings', checked as boolean)}
                    />
                    <label htmlFor="perm-bookings" className="text-sm">Manage Bookings</label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="perm-rooms" 
                      checked={formData.permissions.includes('rooms')}
                      onCheckedChange={(checked) => handlePermissionChange('rooms', checked as boolean)}
                    />
                    <label htmlFor="perm-rooms" className="text-sm">Manage Rooms</label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="perm-customers" 
                      checked={formData.permissions.includes('customers')}
                      onCheckedChange={(checked) => handlePermissionChange('customers', checked as boolean)}
                    />
                    <label htmlFor="perm-customers" className="text-sm">Manage Customers</label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="perm-payments" 
                      checked={formData.permissions.includes('payments')}
                      onCheckedChange={(checked) => handlePermissionChange('payments', checked as boolean)}
                    />
                    <label htmlFor="perm-payments" className="text-sm">Process Payments</label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="perm-reports" 
                      checked={formData.permissions.includes('reports')}
                      onCheckedChange={(checked) => handlePermissionChange('reports', checked as boolean)}
                    />
                    <label htmlFor="perm-reports" className="text-sm">View Reports</label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="perm-settings" 
                      checked={formData.permissions.includes('settings')}
                      onCheckedChange={(checked) => handlePermissionChange('settings', checked as boolean)}
                    />
                    <label htmlFor="perm-settings" className="text-sm">Modify Settings</label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="perm-staff" 
                      checked={formData.permissions.includes('staff')}
                      onCheckedChange={(checked) => handlePermissionChange('staff', checked as boolean)}
                    />
                    <label htmlFor="perm-staff" className="text-sm">Manage Staff</label>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        
        <div className="flex justify-between">
          <Link 
            href={`/admin/users/${userId}`}
            className="rounded-md bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
          >
            Cancel
          </Link>
          
          <Button type="submit" disabled={loading || isDataLoading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </div>
      </form>
    </div>
  );
}