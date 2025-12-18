'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSession, signOut } from 'next-auth/react';
import { Menu, X, User, LogOut } from 'lucide-react';
import { useTheme } from '@/components/providers/theme-provider';

export default function Navbar() {
  const { data: session, status } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const { theme } = useTheme();

  // This ensures we only render authenticated content on the client
  useEffect(() => {
    setIsClient(true);
  }, []);

  const logoUrl = theme?.logoUrl || '/assets/images/logo-dark.svg';
  const primaryColor = theme?.colorPalette?.primary || '#1a73e8';
  
  // Extract button styles from theme
  const buttonStyle = theme?.buttons?.style || 'rounded';
  const buttonSize = theme?.buttons?.size || 'medium';
  
  // Set button styles based on theme settings
  const getButtonStyles = (isPrimary = true) => {
    // Size mapping
    const sizeClasses = {
      small: 'px-3 py-1 text-sm',
      medium: 'px-4 py-2',
      large: 'px-6 py-3 text-lg'
    };
    
    // Style mapping (border radius)
    const styleClasses = {
      square: 'rounded-none',
      rounded: 'rounded-md',
      pill: 'rounded-full'
    };
    
    // Get correct classes based on theme settings
    const sizeClass = sizeClasses[buttonSize as keyof typeof sizeClasses] || sizeClasses.medium;
    const styleClass = styleClasses[buttonStyle as keyof typeof styleClasses] || styleClasses.rounded;
    
    // Return styles for primary or secondary buttons
    if (isPrimary) {
      return {
        className: `${sizeClass} ${styleClass} text-white hover:bg-opacity-90`,
        style: { backgroundColor: primaryColor }
      };
    } else {
      return {
        className: `${sizeClass} ${styleClass} border border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700`,
        style: {}
      };
    }
  };

  // Get primary and secondary button styles
  const primaryButtonStyles = getButtonStyles(true);
  const secondaryButtonStyles = getButtonStyles(false);

  const handleSignOut = async (e: React.MouseEvent) => {
    e.preventDefault();
    await signOut({ redirect: true, callbackUrl: '/login' });
  };

  // Only show auth-dependent UI elements after client-side hydration
  // and when we're sure of the auth status (not 'loading')
  const showAuthUI = isClient && status !== 'loading';

  return (
    <header className="sticky top-0 z-40 bg-white shadow-sm dark:bg-gray-900">
      <nav className="container mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link href="/" className="flex items-center">
          <Image
            src={logoUrl}
            alt="Qaras Hotels"
            width={100}
            height={20}
            className="h-10 w-auto"
            priority
            unoptimized
          />
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden space-x-8 md:flex">
          <Link href="/hotels" className="text-gray-700 hover:text-primary dark:text-gray-300 dark:hover:text-white">
            Find Hotels
          </Link>
          <Link href="/pricing" className="text-gray-700 hover:text-primary dark:text-gray-300 dark:hover:text-white">
            Pricing
          </Link>
          <Link href="/about" className="text-gray-700 hover:text-primary dark:text-gray-300 dark:hover:text-white">
            About
          </Link>
          <Link href="/contact" className="text-gray-700 hover:text-primary dark:text-gray-300 dark:hover:text-white">
            Contact
          </Link>
        </div>

        {/* Desktop Auth Buttons */}
        <div className="hidden items-center space-x-4 md:flex">
          {showAuthUI && (
            <>
              {status === 'authenticated' && session ? (
                <div className="flex items-center space-x-4">
                  <Link
                    href="/dashboard"
                    className={primaryButtonStyles.className}
                    style={primaryButtonStyles.style}
                  >
                    Dashboard
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="flex items-center text-gray-700 hover:text-primary dark:text-gray-300 dark:hover:text-white"
                  >
                    <LogOut className="mr-1 h-4 w-4" />
                    <span>Logout</span>
                  </button>
                </div>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="text-gray-700 hover:text-primary dark:text-gray-300 dark:hover:text-white"
                  >
                    Login
                  </Link>
                  <Link
                    href="/register"
                    className={primaryButtonStyles.className}
                    style={primaryButtonStyles.style}
                  >
                    Register
                  </Link>
                </>
              )}
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          className="ml-auto md:hidden"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? (
            <X className="h-6 w-6 text-gray-700 dark:text-gray-300" />
          ) : (
            <Menu className="h-6 w-6 text-gray-700 dark:text-gray-300" />
          )}
        </button>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="absolute inset-x-0 top-full z-50 bg-white py-4 shadow-md dark:bg-gray-900 md:hidden">
            <div className="container mx-auto flex flex-col space-y-4 px-4">
              <Link 
                href="/hotels" 
                className="text-gray-700 hover:text-primary dark:text-gray-300 dark:hover:text-white"
                onClick={() => setMobileMenuOpen(false)}
              >
                Find Hotels
              </Link>
              <Link 
                href="/pricing" 
                className="text-gray-700 hover:text-primary dark:text-gray-300 dark:hover:text-white"
                onClick={() => setMobileMenuOpen(false)}
              >
                Pricing
              </Link>
              <Link 
                href="/about" 
                className="text-gray-700 hover:text-primary dark:text-gray-300 dark:hover:text-white"
                onClick={() => setMobileMenuOpen(false)}
              >
                About
              </Link>
              <Link 
                href="/contact" 
                className="text-gray-700 hover:text-primary dark:text-gray-300 dark:hover:text-white"
                onClick={() => setMobileMenuOpen(false)}
              >
                Contact
              </Link>
              {showAuthUI && (
                <div className="border-t border-gray-200 pt-4 dark:border-gray-700">
                  {status === 'authenticated' && session ? (
                    <div className="flex flex-col space-y-2">
                      <Link
                        href="/dashboard"
                        className={primaryButtonStyles.className}
                        style={primaryButtonStyles.style}
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Dashboard
                      </Link>
                      <button
                        onClick={handleSignOut}
                        className="flex items-center justify-center text-gray-700 hover:text-primary dark:text-gray-300 dark:hover:text-white"
                      >
                        <LogOut className="mr-1 h-4 w-4" />
                        <span>Logout</span>
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col space-y-2">
                      <Link
                        href="/login"
                        className="text-gray-700 hover:text-primary dark:text-gray-300 dark:hover:text-white"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Login
                      </Link>
                      <Link
                        href="/register"
                        className={primaryButtonStyles.className}
                        style={primaryButtonStyles.style}
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Register
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}