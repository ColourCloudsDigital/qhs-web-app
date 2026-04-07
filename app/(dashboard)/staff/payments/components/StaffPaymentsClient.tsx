'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Search, Eye, CreditCard, TrendingUp, CheckCircle, XCircle, Clock, RefreshCw, Loader2, X } from 'lucide-react'
import toast from '@/lib/toast'

interface Payment {
  id: string
  bookingId?: string
  amount: number
  status: string
  paymentMethod: string
  transactionId?: string
  createdAt: string
  updatedAt: string
  customerName?: string
  bookingReference?: string
}

const statusColor: Record<string, string> = {
  COMPLETED: 'bg-green-100 text-green-800',
  completed: 'bg-green-100 text-green-800',
  PENDING: 'bg-yellow-100 text-yellow-800',
  pending: 'bg-yellow-100 text-yellow-800',
  FAILED: 'bg-red-100 text-red-800',
  failed: 'bg-red-100 text-red-800',
  REFUNDED: 'bg-blue-100 text-blue-800',
  refunded: 'bg-blue-100 text-blue-800',
}

const StatusIcon = ({ status }: { status: string }) => {
  const s = status?.toLowerCase()
  if (s === 'completed') return <CheckCircle className="h-4 w-4 text-green-600" />
  if (s === 'pending') return <Clock className="h-4 w-4 text-yellow-600" />
  if (s === 'failed') return <XCircle className="h-4 w-4 text-red-600" />
  if (s === 'refunded') return <RefreshCw className="h-4 w-4 text-blue-600" />
  return <Clock className="h-4 w-4 text-gray-400" />
}

export function StaffPaymentsClient() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('all')
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null)

  const fetchPayments = useCallback(async (silent = false) => {
    silent ? setRefreshing(true) : setLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter !== 'all') params.append('status', statusFilter)
      const res = await fetch(`/api/staff/payments?${params}`)
      if (!res.ok) throw new Error()
      const data = await res.json()
      setPayments(data.payments || [])
    } catch {
      toast.error('Failed to fetch payments.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [statusFilter])

  useEffect(() => { fetchPayments() }, [fetchPayments])

  const filtered = payments.filter(p => {
    const q = searchTerm.toLowerCase()
    const matchSearch = !q ||
      p.transactionId?.toLowerCase().includes(q) ||
      p.bookingReference?.toLowerCase().includes(q) ||
      p.customerName?.toLowerCase().includes(q) ||
      p.paymentMethod?.toLowerCase().includes(q)

    let matchDate = true
    if (dateFilter !== 'all') {
      const d = new Date(p.createdAt)
      const now = new Date()
      if (dateFilter === 'today') matchDate = d.toDateString() === now.toDateString()
      else if (dateFilter === 'week') matchDate = d >= new Date(now.getTime() - 7 * 86400000)
      else if (dateFilter === 'month') matchDate = d >= new Date(now.getTime() - 30 * 86400000)
    }
    return matchSearch && matchDate
  })

  const totalRevenue = payments.filter(p => p.status?.toLowerCase() === 'completed').reduce((s, p) => s + p.amount, 0)
  const pendingAmt = payments.filter(p => p.status?.toLowerCase() === 'pending').reduce((s, p) => s + p.amount, 0)
  const completed = payments.filter(p => p.status?.toLowerCase() === 'completed').length
  const failed = payments.filter(p => p.status?.toLowerCase() === 'failed').length

  const PaymentRow = ({ p }: { p: Payment }) => (
    <TableRow key={p.id}>
      <TableCell>
        <div className="font-mono text-xs text-gray-600">#{p.id.slice(0, 8).toUpperCase()}</div>
        {p.transactionId && <div className="text-xs text-gray-400">{p.transactionId}</div>}
        {p.bookingReference && <div className="text-xs text-gray-400">Booking: #{p.bookingReference.slice(0, 8).toUpperCase()}</div>}
      </TableCell>
      <TableCell className="text-sm">{p.customerName || 'Guest'}</TableCell>
      <TableCell className="font-medium">₦{p.amount.toLocaleString()}</TableCell>
      <TableCell>
        <div className="flex items-center gap-1 text-sm"><CreditCard className="h-3.5 w-3.5" />{p.paymentMethod}</div>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1.5">
          <StatusIcon status={p.status} />
          <Badge className={statusColor[p.status] || 'bg-gray-100 text-gray-600'}>{p.status}</Badge>
        </div>
      </TableCell>
      <TableCell className="text-sm text-gray-500">{new Date(p.createdAt).toLocaleDateString()}</TableCell>
      <TableCell>
        <Button variant="outline" size="sm" onClick={() => setSelectedPayment(p)}><Eye className="h-4 w-4" /></Button>
      </TableCell>
    </TableRow>
  )

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Payments</h1>
        <Button variant="outline" size="sm" onClick={() => fetchPayments(true)} disabled={refreshing}>
          <RefreshCw className={`h-4 w-4 mr-1 ${refreshing ? 'animate-spin' : ''}`} />Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        {[
          { label: 'Total Revenue', value: `₦${totalRevenue.toLocaleString()}`, sub: `${completed} completed`, icon: <TrendingUp className="h-4 w-4 text-muted-foreground" />, cls: 'text-green-600' },
          { label: 'Pending Amount', value: `₦${pendingAmt.toLocaleString()}`, sub: `${payments.filter(p => p.status?.toLowerCase() === 'pending').length} pending`, icon: <Clock className="h-4 w-4 text-muted-foreground" />, cls: 'text-yellow-600' },
          { label: 'Success Rate', value: `${payments.length > 0 ? ((completed / payments.length) * 100).toFixed(1) : 0}%`, sub: `${failed} failed`, icon: <CheckCircle className="h-4 w-4 text-muted-foreground" /> },
          { label: 'Total Transactions', value: payments.length, sub: 'All time', icon: <CreditCard className="h-4 w-4 text-muted-foreground" /> },
        ].map(s => (
          <Card key={s.label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{s.label}</CardTitle>{s.icon}
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${(s as any).cls || ''}`}>{s.value}</div>
              <p className="text-xs text-muted-foreground">{s.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input placeholder="Search by transaction, booking, customer..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="rounded border px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white">
          <option value="all">All Status</option>
          <option value="COMPLETED">Completed</option>
          <option value="PENDING">Pending</option>
          <option value="FAILED">Failed</option>
          <option value="REFUNDED">Refunded</option>
        </select>
        <select value={dateFilter} onChange={e => setDateFilter(e.target.value)} className="rounded border px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white">
          <option value="all">All Time</option>
          <option value="today">Today</option>
          <option value="week">This Week</option>
          <option value="month">This Month</option>
        </select>
      </div>

      {/* Table */}
      <Card>
        <CardHeader><CardTitle>Payment Transactions ({filtered.length})</CardTitle></CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <CreditCard className="h-12 w-12 mb-3 text-gray-300" />
              <p className="font-medium">No payments found</p>
              <p className="text-sm mt-1">{searchTerm || statusFilter !== 'all' || dateFilter !== 'all' ? 'Try adjusting your filters' : 'No payment records yet'}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Transaction</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(p => <PaymentRow key={p.id} p={p} />)}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail modal */}
      {selectedPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Payment Details</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setSelectedPayment(null)}><X className="h-4 w-4" /></Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <h3 className="font-medium mb-2 text-sm text-gray-500 uppercase tracking-wide">Transaction</h3>
                  <dl className="space-y-1.5 text-sm">
                    <div><span className="font-medium">ID: </span><span className="font-mono text-xs">{selectedPayment.id}</span></div>
                    <div><span className="font-medium">Ref: </span>{selectedPayment.transactionId || 'N/A'}</div>
                    {selectedPayment.bookingReference && <div><span className="font-medium">Booking: </span><span className="font-mono text-xs">#{selectedPayment.bookingReference.slice(0, 8).toUpperCase()}</span></div>}
                    <div><span className="font-medium">Customer: </span>{selectedPayment.customerName || 'Guest'}</div>
                  </dl>
                </div>
                <div>
                  <h3 className="font-medium mb-2 text-sm text-gray-500 uppercase tracking-wide">Payment</h3>
                  <dl className="space-y-1.5 text-sm">
                    <div><span className="font-medium">Amount: </span><span className="text-lg font-bold text-primary">₦{selectedPayment.amount.toLocaleString()}</span></div>
                    <div><span className="font-medium">Method: </span>{selectedPayment.paymentMethod}</div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-medium">Status: </span>
                      <StatusIcon status={selectedPayment.status} />
                      <Badge className={statusColor[selectedPayment.status] || 'bg-gray-100 text-gray-600'}>{selectedPayment.status}</Badge>
                    </div>
                  </dl>
                </div>
              </div>
              <div>
                <h3 className="font-medium mb-2 text-sm text-gray-500 uppercase tracking-wide">Timestamps</h3>
                <dl className="space-y-1 text-sm">
                  <div><span className="font-medium">Created: </span>{new Date(selectedPayment.createdAt).toLocaleString()}</div>
                  <div><span className="font-medium">Updated: </span>{new Date(selectedPayment.updatedAt).toLocaleString()}</div>
                </dl>
              </div>
              <Button className="w-full" onClick={() => setSelectedPayment(null)}>Close</Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
