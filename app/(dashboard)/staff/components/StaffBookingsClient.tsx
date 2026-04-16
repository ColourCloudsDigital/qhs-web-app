'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Calendar, TrendingUp, CreditCard, AlertCircle, Bed, Plus,
  Search, Eye, CheckCircle, XCircle, Clock, Users, Loader2,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, RefreshCw
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Booking {
  id: string;
  hotel: { id: string; name: string };
  room: { id: string; name: string; type: string };
  customer: { id: string; name: string; email: string; phone: string };
  checkInDate: string;
  checkOutDate: string;
  numberOfGuests: number;
  totalAmount: number;
  status: string;
  paymentStatus: string;
  createdAt: string;
}

interface BookingStats {
  totalBookings: number;
  todayCheckIns: number;
  todayCheckOuts: number;
  pendingBookings: number;
  confirmedBookings: number;
  checkedInBookings: number;
  totalRevenue: number;
}

interface StaffBookingsClientProps {
  staffId: string;
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
  checkInDate?: Date;
  checkOutDate?: Date;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  CONFIRMED: 'bg-blue-100 text-blue-800',
  CHECKED_IN: 'bg-green-100 text-green-800',
  CHECKED_OUT: 'bg-gray-100 text-gray-800',
  CANCELLED: 'bg-red-100 text-red-800',
  CANCELLATION_REQUESTED: 'bg-orange-100 text-orange-800',
  NO_SHOW: 'bg-purple-100 text-purple-800',
};

const PAYMENT_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  PARTIAL: 'bg-orange-100 text-orange-800',
  PAID: 'bg-green-100 text-green-800',
  REFUNDED: 'bg-blue-100 text-blue-800',
};

const PAGE_SIZES = [10, 20, 50];

export default function StaffBookingsClient({ staffId }: StaffBookingsClientProps) {
  // ── Data state ──────────────────────────────────────────────────────────────
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [stats, setStats] = useState<BookingStats>({ totalBookings: 0, todayCheckIns: 0, todayCheckOuts: 0, pendingBookings: 0, confirmedBookings: 0, checkedInBookings: 0, totalRevenue: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);

  // ── Pagination ───────────────────────────────────────────────────────────────
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  // ── Filters (input state vs submitted state) ─────────────────────────────────
  const [searchInput, setSearchInput] = useState('');
  const [activeSearch, setActiveSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // ── Fetch ────────────────────────────────────────────────────────────────────
  const fetchBookings = useCallback(async (silent = false) => {
    silent ? setRefreshing(true) : setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(pageSize),
        sortBy: 'createdAt',
        sortOrder: 'desc',
      });
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (activeSearch) params.append('search', activeSearch);
      if (dateFrom) params.append('dateFrom', dateFrom);
      if (dateTo)   params.append('dateTo', dateTo);

      const res = await fetch(`/api/staff/bookings?${params}`);
      if (!res.ok) throw new Error('Failed to fetch bookings');
      const data = await res.json();
      setBookings(data.bookings || []);
      setStats(data.stats || stats);
      setTotal(data.total || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch bookings');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [page, pageSize, statusFilter, activeSearch, dateFrom, dateTo]);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  useEffect(() => { setPage(1); }, [statusFilter, activeSearch, dateFrom, dateTo, pageSize]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setActiveSearch(searchInput);
  };

  const clearFilters = () => {
    setSearchInput(''); setActiveSearch('');
    setStatusFilter('all');
    setDateFrom(''); setDateTo('');
    setPage(1);
  };

  const hasActiveFilters = activeSearch || statusFilter !== 'all' || dateFrom || dateTo;

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Bookings</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Manage hotel bookings and reservations</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => fetchBookings(true)} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 mr-1 ${refreshing ? 'animate-spin' : ''}`} />Refresh
          </Button>
          <Link href="/staff/bookings/new"><Button size="sm"><Plus className="h-4 w-4 mr-1" />New Booking</Button></Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: 'Total Bookings', value: stats.totalBookings, icon: <Bed className="h-4 w-4 text-muted-foreground" /> },
          { label: 'Check-ins Today', value: stats.todayCheckIns, icon: <CheckCircle className="h-4 w-4 text-green-500" /> },
          { label: 'Check-outs Today', value: stats.todayCheckOuts, icon: <XCircle className="h-4 w-4 text-blue-500" /> },
          { label: 'Total Revenue', value: formatCurrency(stats.totalRevenue), sub: 'From completed payments', icon: <CreditCard className="h-4 w-4 text-muted-foreground" /> },
        ].map(s => (
          <Card key={s.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{s.label}</CardTitle>{s.icon}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{s.value}</div>
              {(s as any).sub && <p className="text-xs text-muted-foreground mt-1">{(s as any).sub}</p>}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Filters</CardTitle>
            {hasActiveFilters && (
              <button onClick={clearFilters} className="text-xs text-primary hover:underline">Clear all</button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search + Status row */}
          <form onSubmit={handleSearch} className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs font-medium mb-1 text-gray-600">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Name, phone, email or booking ID..."
                  value={searchInput}
                  onChange={e => setSearchInput(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="w-48">
              <label className="block text-xs font-medium mb-1 text-gray-600">Status</label>
              <Select value={statusFilter} onValueChange={v => { setStatusFilter(v); setPage(1); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                  <SelectItem value="CHECKED_IN">Checked In</SelectItem>
                  <SelectItem value="CHECKED_OUT">Checked Out</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                  <SelectItem value="CANCELLATION_REQUESTED">Cancellation Requested</SelectItem>
                  <SelectItem value="NO_SHOW">No Show</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" size="sm"><Search className="h-4 w-4 mr-1" />Search</Button>
          </form>

          {/* Date range filter */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium mb-1 text-gray-600">Date From</label>
              <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1 text-gray-600">Date To</label>
              <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} min={dateFrom} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bookings list */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base">
            Bookings {!loading && <span className="text-sm font-normal text-gray-500">({total} total)</span>}
          </CardTitle>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span>Rows:</span>
            <Select value={String(pageSize)} onValueChange={v => { setPageSize(Number(v)); setPage(1); }}>
              <SelectTrigger className="w-20 h-8"><SelectValue /></SelectTrigger>
              <SelectContent>{PAGE_SIZES.map(n => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12">
              <AlertCircle className="h-10 w-10 text-red-500 mb-3" />
              <p className="text-gray-500 mb-3">{error}</p>
              <Button variant="outline" size="sm" onClick={() => fetchBookings()}>Try Again</Button>
            </div>
          ) : bookings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <Bed className="h-12 w-12 mb-3 text-gray-300" />
              <p className="font-medium text-gray-500">No bookings found</p>
              <p className="text-sm mt-1">{hasActiveFilters ? 'Try adjusting your filters' : 'No bookings yet'}</p>
              {!hasActiveFilters && (
                <Link href="/staff/bookings/new" className="mt-4">
                  <Button size="sm"><Plus className="h-4 w-4 mr-1" />Create Booking</Button>
                </Link>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {bookings.map(b => (
                <div key={b.id} className="rounded-lg border border-gray-200 p-4 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className="font-medium text-gray-900 dark:text-white">{b.customer?.name || 'Guest'}</span>
                        <Badge className={STATUS_COLORS[b.status] || 'bg-gray-100 text-gray-600'}>{b.status.replace(/_/g, ' ')}</Badge>
                        <Badge className={PAYMENT_COLORS[b.paymentStatus] || 'bg-gray-100 text-gray-600'}>{b.paymentStatus}</Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm text-gray-600 dark:text-gray-400 sm:grid-cols-4">
                        <div><span className="font-medium">Room:</span> {b.room?.name || '—'}</div>
                        <div><span className="font-medium">Guests:</span> {b.numberOfGuests}</div>
                        <div><span className="font-medium">Check-in:</span> {formatDate(b.checkInDate)}</div>
                        <div><span className="font-medium">Check-out:</span> {formatDate(b.checkOutDate)}</div>
                      </div>
                      <div className="mt-1.5 text-sm font-medium text-primary">{formatCurrency(b.totalAmount)}</div>
                    </div>
                    <Link href={`/staff/bookings/${b.id}`} className="shrink-0">
                      <Button variant="outline" size="sm"><Eye className="h-4 w-4 mr-1" />View</Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {!loading && total > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-gray-600 dark:text-gray-400">
          <span>Page {page} of {totalPages} · {total} bookings</span>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" onClick={() => setPage(1)} disabled={page <= 1}><ChevronsLeft className="h-4 w-4" /></Button>
            <Button variant="outline" size="sm" onClick={() => setPage(p => p - 1)} disabled={page <= 1}><ChevronLeft className="h-4 w-4" /></Button>
            <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={page >= totalPages}><ChevronRight className="h-4 w-4" /></Button>
            <Button variant="outline" size="sm" onClick={() => setPage(totalPages)} disabled={page >= totalPages}><ChevronsRight className="h-4 w-4" /></Button>
          </div>
        </div>
      )}
    </div>
  );
}
