'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  Cog,
  CreditCard,
  Mail,
  Users,
  Search,
  Globe,
  Cookie,
  Shield,
  BarChart,
  Palette,
  FileText,
  ArrowLeft,
  ArrowRight,
} from 'lucide-react';

const settingsNavItems = [
  {
    title: 'General',
    href: '/admin/settings/general',
    icon: Cog,
    description: 'Basic site settings and configurations',
  },
  {
    title: 'Email',
    href: '/admin/settings/email',
    icon: Mail,
    description: 'SMTP and email template settings',
  },
  {
    title: 'Payment',
    href: '/admin/settings/payment',
    icon: CreditCard,
    description: 'Payment gateway configurations',
  },
  {
    title: 'SEO',
    href: '/admin/settings/seo',
    icon: Search,
    description: 'Search engine optimization settings',
  },
  {
    title: 'Cookies',
    href: '/admin/settings/cookies',
    icon: Cookie,
    description: 'Cookie consent and privacy settings',
  },
  {
    title: 'Security',
    href: '/admin/settings/security',
    icon: Shield,
    description: 'Security and access settings',
  },
  {
    title: 'Analytics',
    href: '/admin/settings/analytics',
    icon: BarChart,
    description: 'Tracking and analytics configuration',
  },
  {
    title: 'Theme',
    href: '/admin/settings/theme',
    icon: Palette,
    description: 'Site appearance and branding',
  },
  {
    title: 'Legal',
    href: '/admin/settings/legal',
    icon: FileText,
    description: 'Terms of service and privacy policy',
  },
];

export function SettingsSidebar() {
  const pathname = usePathname();
  const [searchQuery, setSearchQuery] = useState('');
  const navScrollRef = useRef<HTMLDivElement>(null);
  const [showLeftScroll, setShowLeftScroll] = useState(false);
  const [showRightScroll, setShowRightScroll] = useState(false);

  const filteredNavItems = settingsNavItems.filter((item) =>
    item.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Check if scrolling is needed for the horizontal nav
  useEffect(() => {
    const checkScroll = () => {
      if (navScrollRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = navScrollRef.current;
        setShowLeftScroll(scrollLeft > 0);
        setShowRightScroll(scrollLeft < scrollWidth - clientWidth - 10); // 10px buffer
      }
    };

    checkScroll();
    window.addEventListener('resize', checkScroll);
    
    // Add event listener to the scrollable element
    const currentRef = navScrollRef.current;
    currentRef?.addEventListener('scroll', checkScroll);

    return () => {
      window.removeEventListener('resize', checkScroll);
      currentRef?.removeEventListener('scroll', checkScroll);
    };
  }, [filteredNavItems]);

  // Scroll the navbar horizontally
  const scrollNav = (direction: 'left' | 'right') => {
    if (navScrollRef.current) {
      const scrollAmount = 200; // Adjust as needed
      const newScrollLeft = direction === 'left'
        ? navScrollRef.current.scrollLeft - scrollAmount
        : navScrollRef.current.scrollLeft + scrollAmount;
      
      navScrollRef.current.scrollTo({
        left: newScrollLeft,
        behavior: 'smooth'
      });
    }
  };

  // Find active item index for scrolling into view on mobile
  useEffect(() => {
    if (navScrollRef.current) {
      const activeItem = navScrollRef.current.querySelector('[data-active="true"]');
      if (activeItem) {
        // Calculate position to center the active item
        const containerWidth = navScrollRef.current.offsetWidth;
        const itemLeft = (activeItem as HTMLElement).offsetLeft;
        const itemWidth = (activeItem as HTMLElement).offsetWidth;
        const centerPosition = itemLeft - (containerWidth / 2) + (itemWidth / 2);
        
        navScrollRef.current.scrollTo({
          left: Math.max(0, centerPosition),
          behavior: 'smooth'
        });
      }
    }
  }, [pathname]);

  return (
    <>
      {/* Mobile Horizontal Navigation - Fixed to top of the content area */}
      <div className="block md:hidden sticky top-0 z-10 mb-6 bg-gray-50 dark:bg-gray-900 pt-4 pb-2 -mt-4 -mx-6 px-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          {/* Scroll shadows and controls */}
          {showLeftScroll && (
            <button 
              onClick={() => scrollNav('left')}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 h-full px-2 flex items-center justify-center bg-gradient-to-r from-white dark:from-gray-800 to-transparent"
              aria-label="Scroll left"
            >
              <ArrowLeft className="h-4 w-4 text-gray-600 dark:text-gray-400" />
            </button>
          )}
          
          {showRightScroll && (
            <button 
              onClick={() => scrollNav('right')}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 h-full px-2 flex items-center justify-center bg-gradient-to-l from-white dark:from-gray-800 to-transparent"
              aria-label="Scroll right"
            >
              <ArrowRight className="h-4 w-4 text-gray-600 dark:text-gray-400" />
            </button>
          )}
          
          {/* Scrollable navigation */}
          <div 
            ref={navScrollRef}
            className="flex overflow-x-auto hide-scrollbar py-2 px-2"
          >
            {filteredNavItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  data-active={isActive}
                  className={cn(
                    'flex items-center whitespace-nowrap px-3 py-2 text-sm rounded-md transition-colors flex-shrink-0 mr-1 last:mr-0',
                    isActive
                      ? 'bg-primary text-white'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  )}
                >
                  <item.icon className={cn('mr-2 h-4 w-4', isActive ? 'text-white' : 'text-gray-400')} />
                  <span>{item.title}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
      
      {/* Desktop Sidebar */}
      <div className="hidden md:block sticky top-4 self-start">
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="relative mb-4">
            <input
              type="text"
              placeholder="Search settings..."
              className="w-full rounded-md border border-gray-300 dark:border-gray-700 py-2 pl-8 pr-4 bg-white dark:bg-gray-900 text-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
          </div>
          
          <nav className="space-y-1 max-h-[calc(100vh-12rem)] overflow-y-auto pr-1">
            {filteredNavItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center px-3 py-2 text-sm rounded-md transition-colors',
                    isActive
                      ? 'bg-primary text-white'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  )}
                >
                  <item.icon className={cn('mr-2 h-4 w-4', isActive ? 'text-white' : 'text-gray-400')} />
                  <span>{item.title}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </>
  );
}

export default SettingsSidebar;