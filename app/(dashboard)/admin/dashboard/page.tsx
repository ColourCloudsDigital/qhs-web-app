'use client';

import { useState, useEffect } from 'react';
import { 
  ArrowUpIcon,
  ArrowDownIcon,
  UsersIcon,
  BuildingOfficeIcon,
  CreditCardIcon,
  ShoppingBagIcon
} from '@heroicons/react/24/outline';
import IconDollarSign from '@/components/icon/icon-dollar-sign';
import IconUsersGroup from '@/components/icon/icon-users-group';
import IconCalendar from '@/components/icon/icon-calendar';
import IconChartSquare from '@/components/icon/icon-chart-square';
import Link from 'next/link';
import StatCard from '@/components/admin/StatCard';
import PerformanceList from '@/components/admin/PerformanceList';
import DataTable from '@/components/admin/DataTable';
import { formatCurrency } from '@/lib/utils';
import dynamic from 'next/dynamic';

// Dynamically import ApexCharts with no SSR to prevent window errors
const ReactApexChart = dynamic(() => import('react-apexcharts'), { ssr: false });

interface DashboardStats {
  summary: {
    totalRevenue: number;
    thisMonthRevenue: number;
    vendorsCount: number;
    customersCount: number;
    bookingsCount: number;
  };
  hotelRevenue: {
    id: string;
    name: string;
    revenue: number;
  }[];
  recentTransactions: {
    id: string;
    amount: number;
    status: string;
    paymentMethod: string;
    hotel: string;
    userName: string;
    date: string;
  }[];
  modules: any[];
  plans: any[];
  vendors: any[];
}

export default function AdminDashboardPage() {
  const [dashboardData, setDashboardData] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeframe, setTimeframe] = useState('year');
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/dashboard');
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data');
      }
      const data = await response.json();
      setDashboardData(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Revenue chart options
  const revenueChartOptions = {
    chart: {
      height: 300,
      type: 'area' as const,
      fontFamily: 'Nunito, sans-serif',
      zoom: {
        enabled: false,
      },
      toolbar: {
        show: false,
      },
    },
    dataLabels: {
      enabled: false,
    },
    stroke: {
      show: true,
      curve: 'smooth' as const,
      width: 2,
      lineCap: 'square' as const,
    },
    dropShadow: {
      enabled: true,
      opacity: 0.2,
      blur: 10,
      left: -7,
      top: 22,
    },
    colors: ['#161616'],
    markers: {
      discrete: [
        {
          seriesIndex: 0,
          dataPointIndex: 6,
          fillColor: '#161616',
          strokeColor: 'white',
          size: 5,
          shape: 'circle' as const,
        },
      ],
    },
    grid: {
      borderColor: '#e0e6ed',
      strokeDashArray: 5,
      xaxis: {
        lines: {
          show: true,
        },
      },
      yaxis: {
        lines: {
          show: false,
        },
      },
      padding: {
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
      },
    },
    xaxis: {
      categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    },
    yaxis: {
      show: false,
    },
    fill: {
      type: 'gradient',
      gradient: {
        shade: 'light',
        type: 'vertical',
        shadeIntensity: 0.3,
        inverseColors: false,
        opacityFrom: 1,
        opacityTo: 0.8,
        stops: [0, 100],
      },
    },
    tooltip: {
      marker: {
        show: true,
      },
      y: {
        formatter: function(value: number) {
          return '₦' + value.toLocaleString('en-NG');
        }
      }
    },
  };

  const revenueSeries = [
    {
      name: 'Revenue',
      data: [16800000, 16800000, 15500000, 17800000, 15500000, 17000000, 19000000, 16000000, 15000000, 17000000, 14000000, 17000000],
    },
  ];

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="spinner-border h-8 w-8 text-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen flex-col items-center justify-center">
        <div className="mb-4 text-xl font-semibold text-red-500">Error loading dashboard data</div>
        <div className="text-gray-600">{error}</div>
        <button 
          className="mt-4 rounded-md bg-primary px-4 py-2 text-white hover:bg-primary-dark"
          onClick={fetchDashboardData}
        >
          Retry
        </button>
      </div>
    );
  }

  // Prepare data for top hotels performance list
  const topHotelsData = dashboardData?.hotelRevenue.map((hotel, index) => {
    // Calculate percentage based on the highest value hotel
    const maxRevenue = dashboardData.hotelRevenue[0].revenue;
    const percentOfTotal = (hotel.revenue / maxRevenue) * 100;
    
    // Set different colors for each hotel
    const colors = ['#161616', '#805dca', '#00ab55', '#e7515a'];
    
    return {
      id: hotel.id,
      name: hotel.name,
      value: hotel.revenue,
      percentOfTotal,
      color: colors[index % colors.length],
    };
  }) || [];

  // Prepare data for modules usage
  const moduleData = dashboardData?.modules.map((module, index) => {
    // For each module, count vendors using this module (default to 0 if undefined)
    const activeVendors = module.activeVendors || 0;
    
    // Calculate percentage based on the highest value module
    // Safely handle potential undefined values
    const allActiveVendors = dashboardData.modules.map(m => m.activeVendors || 0);
    const maxActiveVendors = allActiveVendors.length > 0 ? Math.max(...allActiveVendors) : 0;
    const percentOfTotal = maxActiveVendors > 0 ? (activeVendors / maxActiveVendors) * 100 : 0;
    
    // Set different colors for each module
    const colors = ['#00ab55', '#805dca', '#161616', '#e7515a', '#0086ef', '#ffc107'];
    
    return {
      id: module.id,
      name: module.name,
      value: activeVendors,
      percentOfTotal,
      color: colors[index % colors.length],
    };
  }) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
        <div className="flex space-x-3">
          <div className="flex items-center space-x-2 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800">
            <span className="text-gray-500 dark:text-gray-400">Timeframe:</span>
            <select 
              className="form-select border-0 bg-transparent p-0 focus:ring-0"
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value)}
            >
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="year">This Year</option>
            </select>
          </div>
          <button
            onClick={fetchDashboardData}
            className="rounded-md bg-gray-100 p-2 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          title="Total Revenue" 
          value={formatCurrency(dashboardData?.summary.totalRevenue || 0)}
          icon={<IconDollarSign className="h-6 w-6" />}
          change={2.35}
          changeText={`+${formatCurrency(dashboardData?.summary.thisMonthRevenue || 0)} This Month`}
        />

        <StatCard 
          title="Vendors" 
          value={dashboardData?.summary.vendorsCount || 0}
          icon={<BuildingOfficeIcon className="h-6 w-6" />}
          change={3.65}
          changeText="Compared to last month"
        />

        <StatCard 
          title="Customers" 
          value={dashboardData?.summary.customersCount || 0}
          icon={<UsersIcon className="h-6 w-6" />}
          change={1.25}
          changeText="Compared to last month"
        />

        <StatCard 
          title="Bookings" 
          value={dashboardData?.summary.bookingsCount || 0}
          icon={<IconCalendar className="h-6 w-6" />}
          change={4.75}
          changeText="Compared to last month"
        />
      </div>

      {/* Module Usage - Horizontal Cards */}
      <div className="rounded-lg bg-white p-6 shadow-md dark:bg-gray-800">
        <div className="mb-5 flex items-center justify-between">
          <h5 className="text-lg font-semibold text-gray-900 dark:text-white">Module Usage</h5>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {moduleData.map((module) => (
            <div 
              key={module.id} 
              className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-all hover:shadow-md dark:border-gray-700 dark:bg-gray-900"
            >
              <div className="flex items-center mb-3">
                <div 
                  className="h-10 w-10 rounded-lg mr-3 flex items-center justify-center text-white"
                  style={{ backgroundColor: module.color }}
                >
                  <IconChartSquare className="h-6 w-6" />
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white">{module.name}</h3>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">Active Vendors</span>
                <span className="font-bold text-gray-900 dark:text-white">{module.value}</span>
              </div>
              <div className="h-2 rounded-full bg-gray-200 dark:bg-gray-700">
                <div 
                  className="h-full rounded-full"
                  style={{ 
                    width: `${module.percentOfTotal}%`,
                    backgroundColor: module.color,
                  }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chart and Top Performing Hotels */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="rounded-lg bg-white p-6 shadow-md dark:bg-gray-800">
            <div className="mb-5 flex items-center justify-between">
              <h5 className="text-lg font-semibold text-gray-900 dark:text-white">Revenue Overview</h5>
            </div>
            {isMounted && (
              <div className="mt-5">
                <ReactApexChart 
                  options={revenueChartOptions} 
                  series={revenueSeries} 
                  type="area" 
                  height={300} 
                />
              </div>
            )}
          </div>
        </div>

        <div>
          <PerformanceList
            title="Top Performing Hotels"
            items={topHotelsData}
            valuePrefix="₦"
          />
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="rounded-lg bg-white shadow-md dark:bg-gray-800">
        <DataTable
          title="Recent Transactions"
          data={dashboardData?.recentTransactions || []}
          columns={[
            {
              key: 'hotel',
              title: 'Hotel',
              render: (item) => (
                <div className="font-medium text-gray-900 dark:text-white">
                  {item.hotel !== 'Unknown Hotel' ? item.hotel : 'Pending Assignment'}
                </div>
              )
            },
            {
              key: 'customer',
              title: 'Customer',
              render: (item) => (
                <div className="text-gray-800 dark:text-gray-300">{item.userName}</div>
              )
            },
            {
              key: 'date',
              title: 'Date',
              render: (item) => (
                <span>{new Date(item.date).toLocaleDateString()}</span>
              )
            },
            {
              key: 'amount',
              title: 'Amount',
              render: (item) => (
                <span className="font-medium text-gray-900 dark:text-white">
                  {formatCurrency(item.amount)}
                </span>
              )
            },
            {
              key: 'status',
              title: 'Status',
              render: (item) => {
                const statusClasses = {
                  COMPLETED: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
                  CONFIRMED: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
                  PENDING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
                  CANCELLED: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
                  CHECKED_IN: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
                  CHECKED_OUT: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
                };
                
                const statusClass = statusClasses[item.status as keyof typeof statusClasses] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
                
                return (
                  <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${statusClass}`}>
                    {item.status.replace('_', ' ')}
                  </span>
                );
              }
            },
          ]}
          pagination={false}
          actions={
            <Link
              href="/admin/payments"
              className="rounded-md bg-gray-100 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
            >
              View All
            </Link>
          }
        />
      </div>

      {/* Quick Access Links */}
      <div className="rounded-lg bg-white p-6 shadow-md dark:bg-gray-800">
        <h5 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Quick Actions</h5>
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          <Link href="/admin/vendors" className="flex flex-col items-center rounded-lg border border-gray-200 bg-white p-4 text-center shadow-sm transition-all hover:shadow-md dark:border-gray-700 dark:bg-gray-900">
            <BuildingOfficeIcon className="mb-2 h-8 w-8 text-primary" />
            <span className="text-sm font-medium text-gray-900 dark:text-white">Manage Vendors</span>
          </Link>
          
          <Link href="/admin/users" className="flex flex-col items-center rounded-lg border border-gray-200 bg-white p-4 text-center shadow-sm transition-all hover:shadow-md dark:border-gray-700 dark:bg-gray-900">
            <UsersIcon className="mb-2 h-8 w-8 text-primary" />
            <span className="text-sm font-medium text-gray-900 dark:text-white">Manage Users</span>
          </Link>
          
          <Link href="/admin/payments" className="flex flex-col items-center rounded-lg border border-gray-200 bg-white p-4 text-center shadow-sm transition-all hover:shadow-md dark:border-gray-700 dark:bg-gray-900">
            <CreditCardIcon className="mb-2 h-8 w-8 text-primary" />
            <span className="text-sm font-medium text-gray-900 dark:text-white">View Payments</span>
          </Link>
          
          <Link href="/admin/subscription-plans" className="flex flex-col items-center rounded-lg border border-gray-200 bg-white p-4 text-center shadow-sm transition-all hover:shadow-md dark:border-gray-700 dark:bg-gray-900">
            <ShoppingBagIcon className="mb-2 h-8 w-8 text-primary" />
            <span className="text-sm font-medium text-gray-900 dark:text-white">Subscription Plans</span>
          </Link>
        </div>
      </div>
    </div>
  );
}