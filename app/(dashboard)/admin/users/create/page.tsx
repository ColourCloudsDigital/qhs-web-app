'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { UserRole } from '@/lib/types/enums';
import { useToast } from "@/components/ui/toast";
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';

export default function CreateUserPage() {
  const router = useRouter();
  const { addToast } = useToast();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: UserRole.CUSTOMER,
    isActive: true,
    // Customer fields
    phone: '',
    address: '',
    // Vendor fields
    businessName: '',
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
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hotels, setHotels] = useState<{id: string, name: string}[]>([]);
  const [vendors, setVendors] = useState<{id: string, name: string}[]>([]);
  const [subscriptionPlans, setSubscriptionPlans] = useState<{id: string, name: string, price: number}[]>([]);
  
  // Fetch vendors for staff assignment
  const fetchVendors = async () => {
    try {
      const response = await fetch('/api/admin/vendors?simple=true');
      if (response.ok) {
        const data = await response.json();
        setVendors(data.vendors || []);
      } else {
        console.error('Failed to fetch vendors');
        addToast({
          title: "Error",
          description: "Failed to load vendors",
          type: "error"
        });
      }
    } catch (err) {
      console.error('Error fetching vendors:', err);
      addToast({
        title: "Error",
        description: "Error loading vendors",
        type: "error"
      });
    }
  };
  
  // Fetch hotels for staff assignment
  const fetchHotels = async () => {
    try {
      const response = await fetch('/api/admin/hotels?simple=true');
      if (response.ok) {
        const data = await response.json();
        setHotels(data.hotels || []);
      } else {
        console.error('Failed to fetch hotels');
        addToast({
          title: "Error",
          description: "Failed to load hotels",
          type: "error"
        });
      }
    } catch (err) {
      console.error('Error fetching hotels:', err);
      addToast({
        title: "Error",
        description: "Error loading hotels",
        type: "error"
      });
    }
  };
  
  // Fetch subscription plans for vendors
  const fetchSubscriptionPlans = async () => {
    try {
      // Fixed API endpoint to match the one used in the subscription plans page
      const response = await fetch('/api/admin/subscription-plans?simple=true');
      if (response.ok) {
        const data = await response.json();
        setSubscriptionPlans(data.plans || []);
      } else {
        console.error('Failed to fetch subscription plans');
        addToast({
          title: "Error",
          description: "Failed to load subscription plans",
          type: "error"
        });
      }
    } catch (err) {
      console.error('Error fetching subscription plans:', err);
      addToast({
        title: "Error",
        description: "Error loading subscription plans",
        type: "error"
      });
    }
  };
  
  // Initial fetch of subscription plans on component mount
  useEffect(() => {
    fetchSubscriptionPlans();
  }, []);
  
  // Handle role change
  const handleRoleChange = (role: UserRole) => {
    setFormData(prev => ({
      ...prev,
      role,
    }));
    
    // Fetch related data when role changes
    if (role === UserRole.STAFF) {
      fetchVendors();
      fetchHotels();
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
  
  const validateForm = () => {
    // Reset error
    setError(null);
    
    // Check required fields
    if (!formData.name.trim()) {
      setError('Name is required');
      return false;
    }
    
    if (!formData.email.trim()) {
      setError('Email is required');
      return false;
    }
    
    if (!formData.password) {
      setError('Password is required');
      return false;
    }
    
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    
    // Validate password strength
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      return false;
    }
    
    // Role-specific validations
    if (formData.role === UserRole.STAFF) {
      if (!formData.position) {
        setError('Position is required for staff members');
        return false;
      }
      
      if (!formData.vendorId) {
        setError('Staff must be associated with a vendor');
        return false;
      }
    }
    
    if (formData.role === UserRole.VENDOR && !formData.businessName) {
      setError('Company name is required for vendors');
      return false;
    }
    
    return true;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!validateForm()) {
      return;
    }
    
    try {
      setLoading(true);
      
      // Prepare data according to user role
      const userData: any = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        isActive: formData.isActive,
      };
      
      // Add role-specific data
      if (formData.role === UserRole.CUSTOMER) {
        userData.customer = {
          phone: formData.phone || null,
          address: formData.address || null,
        };
      } else if (formData.role === UserRole.VENDOR) {
        userData.vendor = {
          businessName: formData.businessName,
          businessAddress: formData.businessAddress || null,
          businessPhone: formData.businessPhone || null,
          taxId: formData.taxId || null,
          subscriptionPlanId: formData.subscriptionPlanId || null,
        };
      } else if (formData.role === UserRole.STAFF) {
        userData.staff = {
          position: formData.position,
          hotelId: formData.hotelId || null,
          vendorId: formData.vendorId,
          permissions: JSON.stringify(formData.permissions),
        };
      }
      
      // Send creation request
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create user');
      }
      
      const result = await response.json();
      
      addToast({
        title: "Success",
        description: "User created successfully",
        type: "success"
      });
      
      // Redirect to user details page
      router.push(`/admin/users/${result.user.id}`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create user';
      setError(errorMessage);
      addToast({
        title: "Error",
        description: errorMessage,
        type: "error"
      });
      console.error('Error creating user:', err);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Link 
            href="/admin/users" 
            className="mr-4 rounded-full p-2 text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Create New User</h1>
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
                <label htmlFor="password" className="text-sm font-medium">Password</label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  minLength={8}
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
                  required
                />
              </div>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="role" className="text-sm font-medium">Role</label>
                <Select
                  value={formData.role}
                  onValueChange={(value) => handleRoleChange(value as UserRole)}
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
                  <label htmlFor="businessName" className="text-sm font-medium">Company Name</label>
                  <Input
                    id="businessName"
                    name="businessName"
                    value={formData.businessName}
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
                      <SelectItem value="">No Plan</SelectItem>
                      {subscriptionPlans.map((plan) => (
                        <SelectItem key={plan.id} value={plan.id}>
                          {plan.name} (₦{plan.price.toLocaleString()})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                    onValueChange={(value) => handleSelectChange('hotelId', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select hotel" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Not Assigned</SelectItem>
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
            href="/admin/users"
            className="rounded-md bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
          >
            Cancel
          </Link>
          
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create User
          </Button>
        </div>
      </form>
    </div>
  );
}