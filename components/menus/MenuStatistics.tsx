'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { EyeIcon, UsersIcon, MapPinIcon, ArrowUpIcon, ArrowDownIcon } from 'lucide-react';
import { Loader2 } from 'lucide-react';

interface MenuStatsProps {
  hotelId: string;
}

interface MenuStats {
  totalViews: number;
  uniqueVisitors: number;
  viewsByDevice: {
    mobile: number;
    desktop: number;
    tablet: number;
  };
  viewsByLocation: Record<string, number>;
  viewsByTime: Record<string, number>;
  topReferrers: Array<{ source: string; count: number }>;
  recent: Array<{
    id: string;
    timestamp: string;
    ip: string;
    userAgent: string;
    referrer: string;
  }>;
  dailyChange: number;
  weeklyChange: number;
}

export default function MenuStatistics({ hotelId }: MenuStatsProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState<boolean>(true);
  const [stats, setStats] = useState<MenuStats | null>(null);

  useEffect(() => {
    fetchStats();

    // Refresh stats every 5 minutes
    const interval = setInterval(fetchStats, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [hotelId]);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/vendor/menus/stats/${hotelId}`);
      if (!res.ok) {
        throw new Error('Failed to fetch statistics');
      }
      
      const data = await res.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching menu statistics:', error);
      toast({
        title: 'Error',
        description: 'Failed to load menu statistics',
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-6">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!stats) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Menu Statistics</CardTitle>
          <CardDescription>
            No statistics available yet. Statistics will appear once customers view your menu.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Menu Statistics</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Views */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Views</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <EyeIcon className="h-4 w-4 mr-2 text-primary" />
              <div className="text-2xl font-bold">{stats.totalViews}</div>
              <div className="ml-auto flex items-center text-xs">
                {stats.dailyChange >= 0 ? (
                  <ArrowUpIcon className="h-4 w-4 text-green-500 mr-1" />
                ) : (
                  <ArrowDownIcon className="h-4 w-4 text-red-500 mr-1" />
                )}
                <span className={stats.dailyChange >= 0 ? 'text-green-500' : 'text-red-500'}>
                  {Math.abs(stats.dailyChange)}% today
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Unique Visitors */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Unique Visitors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <UsersIcon className="h-4 w-4 mr-2 text-primary" />
              <div className="text-2xl font-bold">{stats.uniqueVisitors}</div>
              <div className="ml-auto flex items-center text-xs">
                {stats.weeklyChange >= 0 ? (
                  <ArrowUpIcon className="h-4 w-4 text-green-500 mr-1" />
                ) : (
                  <ArrowDownIcon className="h-4 w-4 text-red-500 mr-1" />
                )}
                <span className={stats.weeklyChange >= 0 ? 'text-green-500' : 'text-red-500'}>
                  {Math.abs(stats.weeklyChange)}% this week
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Mobile Views */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Mobile Visitors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <div className="text-2xl font-bold">{stats.viewsByDevice?.mobile || 0}</div>
              <div className="ml-auto text-sm text-muted-foreground">
                {stats.viewsByDevice && stats.totalViews > 0 
                  ? Math.round(((stats.viewsByDevice.mobile || 0) / stats.totalViews) * 100)
                  : 0}% of total
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Locations */}
      <Card>
        <CardHeader>
          <CardTitle>Top Locations</CardTitle>
          <CardDescription>Where your customers are viewing your menu from</CardDescription>
        </CardHeader>
        <CardContent>
          {Object.entries(stats.viewsByLocation).length > 0 ? (
            <div className="space-y-2">
              {Object.entries(stats.viewsByLocation)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5)
                .map(([location, count]) => (
                  <div key={location} className="flex items-center">
                    <MapPinIcon className="h-4 w-4 mr-2 text-primary" />
                    <div>{location}</div>
                    <div className="ml-auto text-sm">{count} views</div>
                  </div>
                ))}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">No location data available yet</div>
          )}
        </CardContent>
      </Card>

      {/* Recent Access */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Access</CardTitle>
          <CardDescription>The last 5 visits to your menu</CardDescription>
        </CardHeader>
        <CardContent>
          {stats.recent && stats.recent.length > 0 ? (
            <div className="space-y-4">
              {stats.recent.map((access) => (
                <div key={access.id} className="border-b pb-2 last:border-0">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium">
                      {new Date(access.timestamp).toLocaleString()}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {access.userAgent.includes('Mobile') ? 'Mobile' : 'Desktop'}
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Referrer: {access.referrer === 'unknown' ? 'Direct' : access.referrer}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">No recent access data available</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 