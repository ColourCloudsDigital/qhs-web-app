'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';

export default function RegisterPage() {
  const router = useRouter();
  // User information
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  // Hotel information
  const [companyName, setCompanyName] = useState('');
  const [businessAddress, setBusinessAddress] = useState('');
  const [businessPhone, setBusinessPhone] = useState('');
  const [taxId, setTaxId] = useState('');
  
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [themeSettings, setThemeSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(1);

  // Fetch theme settings
  useEffect(() => {
    const fetchThemeSettings = async () => {
      try {
        const response = await fetch('/api/theme');
        if (response.ok) {
          const data = await response.json();
          setThemeSettings(data);
        }
      } catch (error) {
        console.error('Error fetching theme settings:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchThemeSettings();
  }, []);

  const validateStep1 = () => {
    if (!name.trim()) {
      setError('Full name is required');
      return false;
    }
    
    if (!email.trim()) {
      setError('Email is required');
      return false;
    }
    
    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return false;
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    
    return true;
  };

  const handleNextStep = () => {
    if (validateStep1()) {
      setError('');
      setCurrentStep(2);
    }
  };

  const handlePrevStep = () => {
    setCurrentStep(1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (!termsAccepted) {
      setError('You must accept the Terms of Service and Privacy Policy');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          // User information
          name,
          email,
          password,
          role: 'VENDOR', // Always register as a vendor
          // Hotel information
          companyName,
          businessAddress,
          businessPhone,
          taxId
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Something went wrong');
      }

      // Show success message
      setIsSubmitted(true);
      
      // Redirect to login page after 3 seconds
      setTimeout(() => {
        router.push('/login');
      }, 3000);
    } catch (error: any) {
      setError(error.message || 'An unexpected error occurred');
      setIsLoading(false);
    }
  };

  const primaryColor = themeSettings?.colorPalette?.primary || '#000000';
  const appName = themeSettings?.general?.appName || 'Qaras Hospitality Solutions';
  const quote = "Effortless Stays";

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900">Create Account</h2>
        <p className="mt-2 text-gray-600">
          Start managing your hotel with our platform
        </p>
      </div>
      
      {error && (
        <div className="rounded-lg bg-red-50 p-4 dark:bg-red-900/30">
          <div className="text-sm text-red-700 dark:text-red-400">
            {error}
          </div>
        </div>
      )}
      
      <Input
        label="Full Name"
        id="name"
        name="name"
        type="text"
        autoComplete="name"
        required
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Enter your full name"
      />
      
      <Input
        label="Email"
        id="email"
        name="email"
        type="email"
        autoComplete="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Enter your email"
      />
      
      <Input
        label="Password"
        id="password"
        name="password"
        type="password"
        autoComplete="new-password"
        required
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Create a password"
        showPasswordToggle
      />
      
      <Input
        label="Confirm Password"
        id="confirmPassword"
        name="confirmPassword"
        type="password"
        autoComplete="new-password"
        required
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        placeholder="Confirm your password"
        showPasswordToggle
      />
      
      <Button
        type="button"
        fullWidth
        rounded="lg"
        onClick={handleNextStep}
      >
        Next Step
      </Button>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900">Hotel Information</h2>
        <p className="mt-2 text-gray-600">
          Tell us about your hotel business
        </p>
      </div>
      
      {error && (
        <div className="rounded-lg bg-red-50 p-4 dark:bg-red-900/30">
          <div className="text-sm text-red-700 dark:text-red-400">
            {error}
          </div>
        </div>
      )}
      
      <Input
        label="Business/Hotel Name"
        id="companyName"
        name="companyName"
        type="text"
        required
        value={companyName}
        onChange={(e) => setCompanyName(e.target.value)}
        placeholder="Enter your business name"
      />
      
      <Input
        label="Business Address"
        id="businessAddress"
        name="businessAddress"
        type="text"
        value={businessAddress}
        onChange={(e) => setBusinessAddress(e.target.value)}
        placeholder="Enter your business address"
      />
      
      <Input
        label="Business Phone"
        id="businessPhone"
        name="businessPhone"
        type="tel"
        autoComplete="off"
        value={businessPhone}
        onChange={(e) => setBusinessPhone(e.target.value)}
        placeholder="Enter your business phone"
      />
      
      <Input
        label="Tax ID (Optional)"
        id="taxId"
        name="taxId"
        type="text"
        autoComplete="off"
        value={taxId}
        onChange={(e) => setTaxId(e.target.value)}
        placeholder="Enter your tax ID"
      />
      
      <div className="rounded-lg bg-blue-50 p-4 dark:bg-blue-900/30">
        <div className="text-sm text-blue-700 dark:text-blue-400">
          <div className="font-medium mb-1">Free Plan Includes:</div>
          <ul className="list-disc list-inside space-y-1">
            <li>Up to 5 rooms</li>
            <li>Up to 10 bookings</li>
            <li>Basic QR Menu (20 items)</li>
          </ul>
          <div className="mt-2">You can upgrade to a paid plan anytime from your dashboard.</div>
        </div>
      </div>
      
      <Checkbox
        id="terms"
        name="terms"
        label="I agree to the Terms of Service and Privacy Policy"
        checked={termsAccepted}
        onChange={setTermsAccepted}
        required
      />
      
      <div className="text-xs text-gray-500 ml-6">
        By signing up, you agree to our{' '}
        <a href="/terms" className="font-medium text-gray-900 hover:underline">
          Terms of Service
        </a>{' '}
        and{' '}
        <a href="/privacy" className="font-medium text-gray-900 hover:underline">
          Privacy Policy
        </a>
      </div>
      
      <div className="flex space-x-3">
        <Button
          type="button"
          variant="outline"
          onClick={handlePrevStep}
          rounded="lg"
          className="flex-1"
        >
          Back
        </Button>
        
        <Button
          type="submit"
          className="flex-1"
          disabled={isLoading}
          rounded="lg"
        >
          {isLoading ? 'Creating Account...' : 'Sign Up'}
        </Button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen">
      {/* Left Panel */}
      <div className="hidden w-[45%] relative text-white md:block">
        <Image 
          src="/assets/images/place.jpg"
          alt="Hotel background"
          fill
          style={{ objectFit: 'cover' }}
          priority
        />
        <div className="absolute inset-0 bg-black/30"></div>
        <div className="relative flex h-full flex-col p-12 z-10">
          <div className="mb-8">
            <div className="text-sm font-medium uppercase tracking-wider">{quote}</div>
          </div>
          
          <div className="mt-auto">
            <h1 className="text-5xl font-bold leading-tight">
              Get <br />
              Everything <br />
              You Want
            </h1>
            <p className="mt-6 text-sm">
              From check-in to check-out, manage every moment with ease. Your guests deserve the best—so does your workflow.
            </p>
            <p className="mt-6 text-xs italic">
              photo by Toa Heftiba
            </p>
          </div>
        </div>
      </div>
      
      {/* Right Panel */}
      <div className="flex flex-1 flex-col p-6 md:p-10 lg:p-12">
        <div className="mb-auto flex justify-end">
          <Link href="/" className="flex items-center">
            <Image
              src="/assets/images/logo.svg"
              alt="Logo"
              width={80}
              height={80}
              className="mr-2"
            />
          </Link>
        </div>
        
        <div className="mx-auto flex w-full max-w-md flex-col justify-center flex-1">
          {!isSubmitted ? (
            <form className="space-y-6" onSubmit={handleSubmit}>
              {/* Progress indicator */}
              <div className="mb-8">
                <div className="flex items-center justify-between">
                  <div className={`flex-1 h-2 rounded-full ${currentStep >= 1 ? 'bg-primary' : 'bg-gray-200'}`}></div>
                  <div className="mx-2"></div>
                  <div className={`flex-1 h-2 rounded-full ${currentStep >= 2 ? 'bg-primary' : 'bg-gray-200'}`}></div>
                </div>
                <div className="flex justify-between mt-1 text-xs text-gray-500">
                  <span>Account</span>
                  <span>Hotel Details</span>
                </div>
              </div>
              
              {currentStep === 1 ? renderStep1() : renderStep2()}
            </form>
          ) : (
            <div className="rounded-lg bg-green-50 p-6 text-center dark:bg-green-900/30">
              <div className="mb-4 text-5xl">✓</div>
              <h3 className="mb-2 text-xl font-bold text-green-800 dark:text-green-300">Registration Successful!</h3>
              <p className="text-green-700 dark:text-green-400">
                We&apos;ve sent a verification email to your inbox. Please verify your email to complete the registration.
              </p>
              <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
                Your account has been created with our Free Plan. You can upgrade anytime after logging in.
              </p>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Redirecting to login page...
              </p>
            </div>
          )}
          
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link href="/login" className="font-medium text-gray-900 hover:underline">
                Sign In
              </Link>
            </p>
          </div>
          
          <div className="mt-8 pt-8 border-t border-gray-200 text-center">
            <p className="text-xs text-gray-500">
              © {new Date().getFullYear()} Qaras Hospitality Solutions. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}