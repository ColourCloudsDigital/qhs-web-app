'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  Search, Eye, Edit, Phone, Mail, Calendar, User, CreditCard,
  Plus, X, Loader2, Users, TrendingUp, RefreshCw, ChevronLeft,
  ChevronRight, Building2, Receipt, ToggleLeft, ToggleRight,
} from 'lucide-react'
import toast from '@/lib/toast'

// ─── Types ───────────────────────────────────────────────────────────────────

type CustomerType = 'individual' | 'corporate'
type PageTab = 'individuals' | 'corporations' | 'bills'

type Customer = {
  id: string; firstName: string; lastName: string; email: string; phone: string
  address?: string; nationality?: string; idType?: string; idNumber?: string
  customerType: CustomerType; corporationId?: string; corporationName?: string
  companyName?: string; contactPerson?: string; taxId?: string
  totalBookings: number; totalSpent: number; lastBooking?: string
  status: 'active' | 'inactive' | 'blocked'; createdAt: string
}

type Corporation = {
  id: string; name: string; contactPerson?: string; email?: string; phone?: string
  address?: string; taxId?: string; billType?: string; status: string
  memberCount: number; billCount: number; createdAt: string
}

type Bill = {
  id: string; customerId?: string; corporationId?: string
  customerName?: string; corporationName?: string
  hotelId: string; billType: string; isActive: boolean
  totalAmount: number; paidAmount: number; notes?: string
  paymentCount: number; createdAt: string
}

type Stats = {
  totalCustomers: number; activeCustomers: number
  inactiveCustomers: number; blockedCustomers: number
  totalRevenue: number; avgBookings: number
}

// ─── Constants ───────────────────────────────────────────────────────────────

const EMPTY_IND = {
  firstName: '', lastName: '', email: '', phone: '', address: '',
  nationality: '', idType: '', idNumber: '', corporationId: '',
  billType: '', billActive: true,
}

const EMPTY_CORP = {
  name: '', contactPerson: '', email: '', phone: '',
  address: '', taxId: '', billType: 'none', status: 'active',
}

const NATS = [
  'Nigerian','Ghanaian','Kenyan','South African','Ethiopian',
  'British','American','Canadian','French','German','Chinese','Indian','Brazilian','Other',
]
const ID_TYPES = [
  { value: 'NATIONAL_ID', label: 'National ID' },
  { value: 'PASSPORT', label: 'Passport' },
  { value: 'DRIVERS_LICENSE', label: "Driver's License" },
  { value: 'VOTERS_CARD', label: "Voter's Card" },
  { value: 'OTHER', label: 'Other' },
]
const BILL_TYPES = [
  { value: 'none', label: 'No Bill' },
  { value: 'hotel_only', label: 'Hotel Only' },
  { value: 'hotel_and_orders', label: 'Hotel + Orders (POS)' },
]
const SC: Record<string, string> = {
  active: 'bg-green-100 text-green-800',
  inactive: 'bg-gray-100 text-gray-800',
  blocked: 'bg-red-100 text-red-800',
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function StaffCustomersClient() {
  const router = useRouter()
  const [pageTab, setPageTab] = useState<PageTab>('individuals')

  // ── Individuals state ──
  const [customers, setCustomers] = useState<Customer[]>([])
  const [stats, setStats] = useState<Stats>({
    totalCustomers: 0, activeCustomers: 0, inactiveCustomers: 0,
    blockedCustomers: 0, totalRevenue: 0, avgBookings: 0,
  })
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [search, setSearch] = useState('')
  const [debSearch, setDebSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const limit = 20

  // ── Corporations state ──
  const [corps, setCorps] = useState<Corporation[]>([])
  const [corpsLoading, setCorpsLoading] = useState(false)
  const [corpSearch, setCorpSearch] = useState('')
  const [corpPage, setCorpPage] = useState(1)
  const [corpTotal, setCorpTotal] = useState(0)
  const [corpTotalPages, setCorpTotalPages] = useState(1)

  // ── Bills state ──
  const [bills, setBills] = useState<Bill[]>([])
  const [billsLoading, setBillsLoading] = useState(false)

  // ── Detail panel ──
  const [detailOpen, setDetailOpen] = useState(false)
  const [detail, setDetail] = useState<any>(null)
  const [loadingDetail, setLoadingDetail] = useState(false)

  // ── Corp detail panel ──
  const [corpDetailOpen, setCorpDetailOpen] = useState(false)
  const [corpDetail, setCorpDetail] = useState<any>(null)
  const [loadingCorpDetail, setLoadingCorpDetail] = useState(false)

  // ── Individual form ──
  const [indFormOpen, setIndFormOpen] = useState(false)
  const [editingInd, setEditingInd] = useState<Customer | null>(null)
  const [indForm, setIndForm] = useState(EMPTY_IND)
  const [savingInd, setSavingInd] = useState(false)
  const [corpOptions, setCorpOptions] = useState<{ id: string; name: string }[]>([])

  // ── Corporation form ──
  const [corpFormOpen, setCorpFormOpen] = useState(false)
  const [editingCorp, setEditingCorp] = useState<Corporation | null>(null)
  const [corpForm, setCorpForm] = useState(EMPTY_CORP)
  const [savingCorp, setSavingCorp] = useState(false)

  // ── Bill form ──
  const [billFormOpen, setBillFormOpen] = useState(false)
  const [billTarget, setBillTarget] = useState<{ type: 'customer' | 'corporation'; id: string; name: string } | null>(null)
  const [billForm, setBillForm] = useState({ billType: 'hotel_only', isActive: true, notes: '' })
  const [savingBill, setSavingBill] = useState(false)

  // ─── Debounce search ─────────────────────────────────────────────────────
  useEffect(() => {
    const t = setTimeout(() => { setDebSearch(search); setPage(1) }, 400)
    return () => clearTimeout(t)
  }, [search])

  // ─── Load individuals ─────────────────────────────────────────────────────
  const loadCustomers = useCallback(async (silent = false) => {
    silent ? setRefreshing(true) : setLoading(true)
    try {
      const p = new URLSearchParams({ page: String(page), limit: String(limit) })
      if (debSearch) p.append('search', debSearch)
      if (statusFilter !== 'all') p.append('status', statusFilter)
      const r = await fetch(`/api/staff/customers?${p}`)
      if (!r.ok) throw new Error()
      const d = await r.json()
      setCustomers(d.customers || [])
      setStats(d.stats || stats)
      setTotalPages(d.pagination?.totalPages || 1)
      setTotal(d.pagination?.total || 0)
    } catch { toast.error('Failed to load customers.') }
    finally { setLoading(false); setRefreshing(false) }
  }, [debSearch, statusFilter, page])

  useEffect(() => { if (pageTab === 'individuals') loadCustomers() }, [loadCustomers, pageTab])

  // ─── Load corporations ────────────────────────────────────────────────────
  const loadCorps = useCallback(async (silent = false) => {
    silent ? setRefreshing(true) : setCorpsLoading(true)
    try {
      const p = new URLSearchParams({ page: String(corpPage), limit: String(limit) })
      if (corpSearch) p.append('search', corpSearch)
      const r = await fetch(`/api/staff/corporations?${p}`)
      if (!r.ok) throw new Error()
      const d = await r.json()
      setCorps(d.corporations || [])
      setCorpTotal(d.pagination?.total || 0)
      setCorpTotalPages(d.pagination?.totalPages || 1)
    } catch { toast.error('Failed to load corporations.') }
    finally { setCorpsLoading(false); setRefreshing(false) }
  }, [corpSearch, corpPage])

  useEffect(() => { if (pageTab === 'corporations') loadCorps() }, [loadCorps, pageTab])

  // ─── Load bills ───────────────────────────────────────────────────────────
  const loadBills = useCallback(async () => {
    setBillsLoading(true)
    try {
      const r = await fetch('/api/staff/bills')
      if (!r.ok) throw new Error()
      const d = await r.json()
      setBills(d.bills || [])
    } catch { toast.error('Failed to load bills.') }
    finally { setBillsLoading(false) }
  }, [])

  useEffect(() => { if (pageTab === 'bills') loadBills() }, [loadBills, pageTab])

  // ─── Load corp options for individual form ────────────────────────────────
  useEffect(() => {
    if (indFormOpen) {
      fetch('/api/staff/corporations?limit=100')
        .then(r => r.json())
        .then(d => setCorpOptions((d.corporations || []).map((c: any) => ({ id: c.id, name: c.name }))))
        .catch(() => {})
    }
  }, [indFormOpen])

  // ─── Individual detail ────────────────────────────────────────────────────
  const openDetail = async (id: string) => {
    setDetailOpen(true); setDetail(null); setLoadingDetail(true)
    try {
      const r = await fetch(`/api/staff/customers/${id}`)
      if (!r.ok) throw new Error()
      const d = await r.json()
      setDetail(d.customer)
    } catch { toast.error('Failed to load details.'); setDetailOpen(false) }
    finally { setLoadingDetail(false) }
  }

  // ─── Corp detail ──────────────────────────────────────────────────────────
  const openCorpDetail = async (id: string) => {
    setCorpDetailOpen(true); setCorpDetail(null); setLoadingCorpDetail(true)
    try {
      const r = await fetch(`/api/staff/corporations/${id}`)
      if (!r.ok) throw new Error()
      const d = await r.json()
      setCorpDetail(d.corporation)
    } catch { toast.error('Failed to load corporation details.'); setCorpDetailOpen(false) }
    finally { setLoadingCorpDetail(false) }
  }

  // ─── Individual form handlers ─────────────────────────────────────────────
  const openAddInd = () => { setEditingInd(null); setIndForm(EMPTY_IND); setIndFormOpen(true) }
  const openEditInd = (c: Customer) => {
    setEditingInd(c)
    setIndForm({
      firstName: c.firstName, lastName: c.lastName, email: c.email, phone: c.phone,
      address: c.address || '', nationality: c.nationality || '', idType: c.idType || '',
      idNumber: c.idNumber || '', corporationId: c.corporationId || '',
      billType: '', billActive: true,
    })
    setIndFormOpen(true); setDetailOpen(false)
  }

  const saveInd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!indForm.firstName.trim() || !indForm.phone.trim()) {
      toast.error('First name and phone are required.'); return
    }
    setSavingInd(true)
    try {
      const payload = { ...indForm, customerType: 'individual' }
      const r = await fetch(editingInd ? `/api/staff/customers/${editingInd.id}` : '/api/staff/customers', {
        method: editingInd ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!r.ok) { const e = await r.json(); throw new Error(e.error || 'Failed') }
      toast.success(editingInd ? 'Customer updated.' : 'Customer added.')
      setIndFormOpen(false); setIndForm(EMPTY_IND); setEditingInd(null)
      loadCustomers(true)
    } catch (err: any) { toast.error(err.message || 'Failed to save.') }
    finally { setSavingInd(false) }
  }

  // ─── Corporation form handlers ────────────────────────────────────────────
  const openAddCorp = () => { setEditingCorp(null); setCorpForm(EMPTY_CORP); setCorpFormOpen(true) }
  const openEditCorp = (c: Corporation) => {
    setEditingCorp(c)
    setCorpForm({
      name: c.name, contactPerson: c.contactPerson || '', email: c.email || '',
      phone: c.phone || '', address: c.address || '', taxId: c.taxId || '',
      billType: c.billType || 'none', status: c.status,
    })
    setCorpFormOpen(true); setCorpDetailOpen(false)
  }

  const saveCorp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!corpForm.name.trim()) { toast.error('Corporation name is required.'); return }
    setSavingCorp(true)
    try {
      const r = await fetch(editingCorp ? `/api/staff/corporations/${editingCorp.id}` : '/api/staff/corporations', {
        method: editingCorp ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(corpForm),
      })
      if (!r.ok) { const e = await r.json(); throw new Error(e.error || 'Failed') }
      toast.success(editingCorp ? 'Corporation updated.' : 'Corporation added.')
      setCorpFormOpen(false); setCorpForm(EMPTY_CORP); setEditingCorp(null)
      loadCorps(true)
    } catch (err: any) { toast.error(err.message || 'Failed to save.') }
    finally { setSavingCorp(false) }
  }

  // ─── Bill handlers ────────────────────────────────────────────────────────
  const openBillForm = (type: 'customer' | 'corporation', id: string, name: string) => {
    setBillTarget({ type, id, name })
    setBillForm({ billType: 'hotel_only', isActive: true, notes: '' })
    setBillFormOpen(true)
  }

  const saveBill = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!billTarget) return
    setSavingBill(true)
    try {
      const payload = {
        ...(billTarget.type === 'customer' ? { customerId: billTarget.id } : { corporationId: billTarget.id }),
        ...billForm,
      }
      const r = await fetch('/api/staff/bills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!r.ok) { const e = await r.json(); throw new Error(e.error || 'Failed') }
      toast.success('Bill created.')
      setBillFormOpen(false); setBillTarget(null)
      if (pageTab === 'bills') loadBills()
    } catch (err: any) { toast.error(err.message || 'Failed to create bill.') }
    finally { setSavingBill(false) }
  }

  const toggleBill = async (billId: string, bill: Bill) => {
    try {
      const r = await fetch(`/api/staff/bills/${billId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !bill.isActive, billType: bill.billType, notes: bill.notes }),
      })
      if (!r.ok) throw new Error()
      toast.success(`Bill ${bill.isActive ? 'deactivated' : 'activated'}.`)
      loadBills()
    } catch { toast.error('Failed to update bill.') }
  }

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Customers</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => {
            if (pageTab === 'individuals') loadCustomers(true)
            else if (pageTab === 'corporations') loadCorps(true)
            else loadBills()
          }} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 mr-1 ${refreshing ? 'animate-spin' : ''}`} />Refresh
          </Button>
          {pageTab === 'individuals' && (
            <Button size="sm" onClick={openAddInd}><Plus className="h-4 w-4 mr-1" />Add Individual</Button>
          )}
          {pageTab === 'corporations' && (
            <Button size="sm" onClick={openAddCorp}><Plus className="h-4 w-4 mr-1" />Add Corporation</Button>
          )}
        </div>
      </div>

      {/* Stats (individuals only) */}
      {pageTab === 'individuals' && (
        <div className="grid gap-4 md:grid-cols-4">
          {[
            { label: 'Total Customers', val: stats.totalCustomers, sub: `${stats.activeCustomers} active`, icon: <Users className="h-4 w-4 text-muted-foreground" /> },
            { label: 'Active', val: stats.activeCustomers, sub: `${stats.totalCustomers > 0 ? ((stats.activeCustomers / stats.totalCustomers) * 100).toFixed(1) : 0}%`, icon: <User className="h-4 w-4 text-muted-foreground" />, cls: 'text-green-600' },
            { label: 'Total Revenue', val: `₦${stats.totalRevenue.toLocaleString()}`, sub: `${stats.totalCustomers} customers`, icon: <CreditCard className="h-4 w-4 text-muted-foreground" /> },
            { label: 'Avg Bookings', val: stats.avgBookings.toFixed(1), sub: 'per customer', icon: <TrendingUp className="h-4 w-4 text-muted-foreground" /> },
          ].map(s => (
            <Card key={s.label}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{s.label}</CardTitle>{s.icon}
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${(s as any).cls || ''}`}>{s.val}</div>
                <p className="text-xs text-muted-foreground">{s.sub}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Page tabs */}
      <div className="flex gap-1 border-b border-gray-200 dark:border-gray-700">
        {([
          { key: 'individuals', label: 'Individuals', icon: <User className="h-4 w-4" /> },
          { key: 'corporations', label: 'Corporations', icon: <Building2 className="h-4 w-4" /> },
          { key: 'bills', label: 'Bills', icon: <Receipt className="h-4 w-4" /> },
        ] as { key: PageTab; label: string; icon: React.ReactNode }[]).map(t => (
          <button
            key={t.key}
            onClick={() => setPageTab(t.key)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${pageTab === t.key ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}
          >
            {t.icon}{t.label}
          </button>
        ))}
      </div>

      {/* ── INDIVIDUALS TAB ── */}
      {pageTab === 'individuals' && (
        <>
          <div className="flex gap-3 items-center">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input placeholder="Search by name, phone or email..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
            </div>
            <Select value={statusFilter} onValueChange={v => { setStatusFilter(v); setPage(1) }}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="blocked">Blocked</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Card>
            <CardHeader><CardTitle>Individual Customers ({total})</CardTitle></CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
              ) : customers.length === 0 ? (
                <div className="text-center py-12">
                  <User className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 font-medium">No customers found</p>
                  <p className="text-sm text-gray-400 mt-1">{search || statusFilter !== 'all' ? 'Try adjusting your filters' : 'Add your first customer'}</p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Customer</TableHead>
                          <TableHead>Contact</TableHead>
                          <TableHead>Corporation</TableHead>
                          <TableHead>Bookings</TableHead>
                          <TableHead>Total Spent</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {customers.map(c => (
                          <TableRow key={c.id}>
                            <TableCell>
                              <div className="font-medium">{c.firstName} {c.lastName}</div>
                              <div className="text-xs text-gray-400">#{c.id.slice(0, 8)}</div>
                            </TableCell>
                            <TableCell>
                              {c.email && <div className="flex items-center gap-1 text-sm"><Mail className="h-3 w-3" />{c.email}</div>}
                              <div className="flex items-center gap-1 text-sm"><Phone className="h-3 w-3" />{c.phone}</div>
                            </TableCell>
                            <TableCell>
                              {c.corporationName
                                ? <Badge variant="outline" className="text-xs border-blue-200 text-blue-700"><Building2 className="h-3 w-3 mr-1" />{c.corporationName}</Badge>
                                : <span className="text-xs text-gray-400">—</span>}
                            </TableCell>
                            <TableCell className="text-center"><div className="font-medium">{c.totalBookings}</div></TableCell>
                            <TableCell className="font-medium">₦{c.totalSpent.toLocaleString()}</TableCell>
                            <TableCell><Badge className={SC[c.status] || SC.inactive}>{c.status}</Badge></TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                <Button variant="outline" size="sm" onClick={() => openDetail(c.id)} title="View"><Eye className="h-4 w-4" /></Button>
                                <Button variant="outline" size="sm" onClick={() => openEditInd(c)} title="Edit"><Edit className="h-4 w-4" /></Button>
                                <Button variant="outline" size="sm" onClick={() => openBillForm('customer', c.id, `${c.firstName} ${c.lastName}`)} title="Add Bill"><Receipt className="h-4 w-4" /></Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  <div className="flex items-center justify-between mt-4 text-sm text-gray-600">
                    <span>Page {page} of {totalPages} · {total} total</span>
                    <div className="flex gap-1">
                      <Button variant="outline" size="sm" onClick={() => setPage(1)} disabled={page <= 1}><ChevronLeft className="h-3 w-3" /><ChevronLeft className="h-3 w-3 -ml-2" /></Button>
                      <Button variant="outline" size="sm" onClick={() => setPage(p => p - 1)} disabled={page <= 1}><ChevronLeft className="h-4 w-4" /></Button>
                      <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={page >= totalPages}><ChevronRight className="h-4 w-4" /></Button>
                      <Button variant="outline" size="sm" onClick={() => setPage(totalPages)} disabled={page >= totalPages}><ChevronRight className="h-3 w-3" /><ChevronRight className="h-3 w-3 -ml-2" /></Button>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* ── CORPORATIONS TAB ── */}
      {pageTab === 'corporations' && (
        <>
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input placeholder="Search corporations..." value={corpSearch} onChange={e => { setCorpSearch(e.target.value); setCorpPage(1) }} className="pl-10" />
          </div>
          <Card>
            <CardHeader><CardTitle>Corporations ({corpTotal})</CardTitle></CardHeader>
            <CardContent>
              {corpsLoading ? (
                <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
              ) : corps.length === 0 ? (
                <div className="text-center py-12">
                  <Building2 className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 font-medium">No corporations found</p>
                  <p className="text-sm text-gray-400 mt-1">Add your first corporation</p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Corporation</TableHead>
                          <TableHead>Contact</TableHead>
                          <TableHead>Bill Type</TableHead>
                          <TableHead>Members</TableHead>
                          <TableHead>Bills</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {corps.map(c => (
                          <TableRow key={c.id}>
                            <TableCell>
                              <div className="font-medium">{c.name}</div>
                              <div className="text-xs text-gray-400">#{c.id.slice(0, 8)}</div>
                            </TableCell>
                            <TableCell>
                              {c.email && <div className="flex items-center gap-1 text-sm"><Mail className="h-3 w-3" />{c.email}</div>}
                              {c.phone && <div className="flex items-center gap-1 text-sm"><Phone className="h-3 w-3" />{c.phone}</div>}
                              {c.contactPerson && <div className="text-xs text-gray-500">{c.contactPerson}</div>}
                            </TableCell>
                            <TableCell>
                              {c.billType && c.billType !== 'none'
                                ? <Badge variant="outline" className="text-xs border-purple-200 text-purple-700">{BILL_TYPES.find(b => b.value === c.billType)?.label || c.billType}</Badge>
                                : <span className="text-xs text-gray-400">No bill</span>}
                            </TableCell>
                            <TableCell className="text-center">{c.memberCount}</TableCell>
                            <TableCell className="text-center">{c.billCount}</TableCell>
                            <TableCell><Badge className={c.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>{c.status}</Badge></TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                <Button variant="outline" size="sm" onClick={() => openCorpDetail(c.id)} title="View"><Eye className="h-4 w-4" /></Button>
                                <Button variant="outline" size="sm" onClick={() => openEditCorp(c)} title="Edit"><Edit className="h-4 w-4" /></Button>
                                <Button variant="outline" size="sm" onClick={() => openBillForm('corporation', c.id, c.name)} title="Add Bill"><Receipt className="h-4 w-4" /></Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  <div className="flex items-center justify-between mt-4 text-sm text-gray-600">
                    <span>Page {corpPage} of {corpTotalPages} · {corpTotal} total</span>
                    <div className="flex gap-1">
                      <Button variant="outline" size="sm" onClick={() => setCorpPage(1)} disabled={corpPage <= 1}><ChevronLeft className="h-3 w-3" /><ChevronLeft className="h-3 w-3 -ml-2" /></Button>
                      <Button variant="outline" size="sm" onClick={() => setCorpPage(p => p - 1)} disabled={corpPage <= 1}><ChevronLeft className="h-4 w-4" /></Button>
                      <Button variant="outline" size="sm" onClick={() => setCorpPage(p => p + 1)} disabled={corpPage >= corpTotalPages}><ChevronRight className="h-4 w-4" /></Button>
                      <Button variant="outline" size="sm" onClick={() => setCorpPage(corpTotalPages)} disabled={corpPage >= corpTotalPages}><ChevronRight className="h-3 w-3" /><ChevronRight className="h-3 w-3 -ml-2" /></Button>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* ── BILLS TAB ── */}
      {pageTab === 'bills' && (
        <Card>
          <CardHeader><CardTitle>Bills ({bills.length})</CardTitle></CardHeader>
          <CardContent>
            {billsLoading ? (
              <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
            ) : bills.length === 0 ? (
              <div className="text-center py-12">
                <Receipt className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">No bills yet</p>
                <p className="text-sm text-gray-400 mt-1">Bills are created from the Individuals or Corporations tab</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Customer / Corporation</TableHead>
                      <TableHead>Bill Type</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Paid</TableHead>
                      <TableHead>Balance</TableHead>
                      <TableHead>Payments</TableHead>
                      <TableHead>Active</TableHead>
                      <TableHead>Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bills.map(b => (
                      <TableRow key={b.id}>
                        <TableCell>
                          <div className="font-medium">
                            {b.corporationName
                              ? <span className="flex items-center gap-1"><Building2 className="h-3 w-3 text-blue-500" />{b.corporationName}</span>
                              : b.customerName?.trim() || '—'}
                          </div>
                          <div className="text-xs text-gray-400">#{b.id.slice(0, 8)}</div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {BILL_TYPES.find(t => t.value === b.billType)?.label || b.billType}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">₦{Number(b.totalAmount).toLocaleString()}</TableCell>
                        <TableCell className="text-green-600">₦{Number(b.paidAmount).toLocaleString()}</TableCell>
                        <TableCell className="text-red-600">₦{Math.max(0, Number(b.totalAmount) - Number(b.paidAmount)).toLocaleString()}</TableCell>
                        <TableCell className="text-center">{b.paymentCount}</TableCell>
                        <TableCell>
                          <button onClick={() => toggleBill(b.id, b)} className="flex items-center gap-1 text-sm">
                            {b.isActive
                              ? <><ToggleRight className="h-5 w-5 text-green-500" /><span className="text-green-600">Active</span></>
                              : <><ToggleLeft className="h-5 w-5 text-gray-400" /><span className="text-gray-500">Inactive</span></>}
                          </button>
                        </TableCell>
                        <TableCell className="text-sm text-gray-500">{new Date(b.createdAt).toLocaleDateString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── INDIVIDUAL FORM MODAL ── */}
      {indFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{editingInd ? 'Edit Individual Customer' : 'Add Individual Customer'}</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => { setIndFormOpen(false); setIndForm(EMPTY_IND); setEditingInd(null) }}><X className="h-4 w-4" /></Button>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={saveInd} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div><Label>First Name *</Label><Input value={indForm.firstName} onChange={e => setIndForm({ ...indForm, firstName: e.target.value })} required /></div>
                  <div><Label>Last Name</Label><Input value={indForm.lastName} onChange={e => setIndForm({ ...indForm, lastName: e.target.value })} /></div>
                  <div><Label>Email</Label><Input type="email" value={indForm.email} onChange={e => setIndForm({ ...indForm, email: e.target.value })} /></div>
                  <div><Label>Phone *</Label><Input value={indForm.phone} onChange={e => setIndForm({ ...indForm, phone: e.target.value })} required /></div>
                </div>
                <div><Label>Address</Label><Textarea rows={2} value={indForm.address} onChange={e => setIndForm({ ...indForm, address: e.target.value })} /></div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label>Nationality</Label>
                    <Select value={indForm.nationality} onValueChange={v => setIndForm({ ...indForm, nationality: v })}>
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent className="max-h-56 overflow-y-auto">{NATS.map(n => <SelectItem key={n} value={n}>{n}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>ID Type</Label>
                    <Select value={indForm.idType} onValueChange={v => setIndForm({ ...indForm, idType: v })}>
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>{ID_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="md:col-span-2"><Label>ID Number</Label><Input value={indForm.idNumber} onChange={e => setIndForm({ ...indForm, idNumber: e.target.value })} /></div>
                </div>

                {/* Corporation affiliation */}
                <div className="border-t pt-4">
                  <Label className="text-sm font-semibold text-gray-700">Corporation Affiliation (Optional)</Label>
                  <p className="text-xs text-gray-500 mb-2">Assign this customer to a corporation — their hotel bill can be charged to the corporation.</p>
                  <Select value={indForm.corporationId || 'none'} onValueChange={v => setIndForm({ ...indForm, corporationId: v === 'none' ? '' : v })}>
                    <SelectTrigger><SelectValue placeholder="No corporation" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No corporation</SelectItem>
                      {corpOptions.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                {/* Bill section — only for new customers */}
                {!editingInd && (
                  <div className="border-t pt-4 space-y-3">
                    <Label className="text-sm font-semibold text-gray-700">Bill Setup (Optional)</Label>
                    <p className="text-xs text-gray-500">A bill tracks debit/accrued charges for this customer. It can be activated or deactivated at any time.</p>
                    <div>
                      <Label>Bill Type</Label>
                      <Select value={indForm.billType || 'none'} onValueChange={v => setIndForm({ ...indForm, billType: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>{BILL_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    {indForm.billType && indForm.billType !== 'none' && (
                      <div className="flex items-center gap-3">
                        <Label>Activate bill immediately?</Label>
                        <button type="button" onClick={() => setIndForm({ ...indForm, billActive: !indForm.billActive })}>
                          {indForm.billActive
                            ? <ToggleRight className="h-6 w-6 text-green-500" />
                            : <ToggleLeft className="h-6 w-6 text-gray-400" />}
                        </button>
                        <span className="text-sm text-gray-600">{indForm.billActive ? 'Active' : 'Inactive'}</span>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <Button type="submit" disabled={savingInd}>
                    {savingInd ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving...</> : (editingInd ? 'Save Changes' : 'Add Customer')}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => { setIndFormOpen(false); setIndForm(EMPTY_IND); setEditingInd(null) }}>Cancel</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── CORPORATION FORM MODAL ── */}
      {corpFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{editingCorp ? 'Edit Corporation' : 'Add Corporation'}</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => { setCorpFormOpen(false); setCorpForm(EMPTY_CORP); setEditingCorp(null) }}><X className="h-4 w-4" /></Button>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={saveCorp} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="md:col-span-2"><Label>Corporation Name *</Label><Input value={corpForm.name} onChange={e => setCorpForm({ ...corpForm, name: e.target.value })} required /></div>
                  <div><Label>Contact Person</Label><Input value={corpForm.contactPerson} onChange={e => setCorpForm({ ...corpForm, contactPerson: e.target.value })} /></div>
                  <div><Label>Email</Label><Input type="email" value={corpForm.email} onChange={e => setCorpForm({ ...corpForm, email: e.target.value })} /></div>
                  <div><Label>Phone</Label><Input value={corpForm.phone} onChange={e => setCorpForm({ ...corpForm, phone: e.target.value })} /></div>
                  <div><Label>Tax ID / RC Number</Label><Input value={corpForm.taxId} onChange={e => setCorpForm({ ...corpForm, taxId: e.target.value })} /></div>
                </div>
                <div><Label>Address</Label><Textarea rows={2} value={corpForm.address} onChange={e => setCorpForm({ ...corpForm, address: e.target.value })} /></div>

                {/* Bill section */}
                <div className="border-t pt-4 space-y-3">
                  <Label className="text-sm font-semibold text-gray-700">Bill Setup</Label>
                  <p className="text-xs text-gray-500">Choose what type of charges this corporation's bill will cover. A bill row is auto-created when a type is selected.</p>
                  <div>
                    <Label>Bill Type</Label>
                    <Select value={corpForm.billType} onValueChange={v => setCorpForm({ ...corpForm, billType: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{BILL_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  {editingCorp && (
                    <div>
                      <Label>Status</Label>
                      <Select value={corpForm.status} onValueChange={v => setCorpForm({ ...corpForm, status: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 pt-2">
                  <Button type="submit" disabled={savingCorp}>
                    {savingCorp ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving...</> : (editingCorp ? 'Save Changes' : 'Add Corporation')}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => { setCorpFormOpen(false); setCorpForm(EMPTY_CORP); setEditingCorp(null) }}>Cancel</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── BILL FORM MODAL ── */}
      {billFormOpen && billTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Create Bill — {billTarget.name}</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => { setBillFormOpen(false); setBillTarget(null) }}><X className="h-4 w-4" /></Button>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={saveBill} className="space-y-4">
                <p className="text-sm text-gray-600">A bill tracks debit/accrued charges linked to payments (bookings or POS orders). It can be activated or deactivated at any time.</p>
                <div>
                  <Label>Bill Type *</Label>
                  <Select value={billForm.billType} onValueChange={v => setBillForm({ ...billForm, billType: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hotel_only">Hotel Only</SelectItem>
                      <SelectItem value="hotel_and_orders">Hotel + Orders (POS)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-3">
                  <Label>Activate immediately?</Label>
                  <button type="button" onClick={() => setBillForm({ ...billForm, isActive: !billForm.isActive })}>
                    {billForm.isActive
                      ? <ToggleRight className="h-6 w-6 text-green-500" />
                      : <ToggleLeft className="h-6 w-6 text-gray-400" />}
                  </button>
                  <span className="text-sm text-gray-600">{billForm.isActive ? 'Active' : 'Inactive'}</span>
                </div>
                <div><Label>Notes</Label><Textarea rows={2} value={billForm.notes} onChange={e => setBillForm({ ...billForm, notes: e.target.value })} placeholder="Optional notes..." /></div>
                <div className="flex gap-2 pt-2">
                  <Button type="submit" disabled={savingBill}>
                    {savingBill ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Creating...</> : 'Create Bill'}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => { setBillFormOpen(false); setBillTarget(null) }}>Cancel</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── INDIVIDUAL DETAIL MODAL ── */}
      {detailOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Customer Details</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => { setDetailOpen(false); setDetail(null) }}><X className="h-4 w-4" /></Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {loadingDetail ? (
                <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
              ) : detail ? (
                <>
                  <div className="grid gap-6 md:grid-cols-2">
                    <div>
                      <h3 className="font-semibold mb-3">Personal Information</h3>
                      <dl className="space-y-1.5 text-sm">
                        <div><span className="font-medium">Name: </span>{detail.firstName} {detail.lastName}</div>
                        {detail.email && <div><span className="font-medium">Email: </span>{detail.email}</div>}
                        <div><span className="font-medium">Phone: </span>{detail.phone}</div>
                        {detail.address && <div><span className="font-medium">Address: </span>{detail.address}</div>}
                        {detail.nationality && <div><span className="font-medium">Nationality: </span>{detail.nationality}</div>}
                        {detail.idType && <div><span className="font-medium">ID: </span>{ID_TYPES.find(t => t.value === detail.idType)?.label || detail.idType} {detail.idNumber && `— ${detail.idNumber}`}</div>}
                        {detail.corporationName && <div><span className="font-medium">Corporation: </span><Badge variant="outline" className="text-xs border-blue-200 text-blue-700"><Building2 className="h-3 w-3 mr-1" />{detail.corporationName}</Badge></div>}
                        <div><span className="font-medium">Member Since: </span>{new Date(detail.createdAt).toLocaleDateString()}</div>
                      </dl>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-3">Statistics</h3>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="text-center p-3 bg-blue-50 rounded-lg"><div className="text-2xl font-bold text-blue-600">{detail.totalBookings}</div><div className="text-xs text-blue-600">Bookings</div></div>
                        <div className="text-center p-3 bg-green-50 rounded-lg"><div className="text-xl font-bold text-green-600">₦{detail.totalSpent.toLocaleString()}</div><div className="text-xs text-green-600">Total Spent</div></div>
                        <div className="text-center p-3 bg-gray-50 rounded-lg"><Badge className={SC[detail.status] || SC.inactive}>{detail.status}</Badge><div className="text-xs text-gray-500 mt-1">Status</div></div>
                        <div className="text-center p-3 bg-purple-50 rounded-lg"><div className="text-sm font-bold text-purple-600">{detail.lastBooking ? new Date(detail.lastBooking).toLocaleDateString() : 'Never'}</div><div className="text-xs text-purple-600">Last Booking</div></div>
                      </div>
                    </div>
                  </div>

                  {detail.bookings?.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-3">Recent Bookings</h3>
                      <div className="border rounded-lg overflow-hidden">
                        <Table>
                          <TableHeader><TableRow><TableHead>Ref</TableHead><TableHead>Room</TableHead><TableHead>Dates</TableHead><TableHead>Amount</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                          <TableBody>
                            {detail.bookings.slice(0, 5).map((b: any) => (
                              <TableRow key={b.id}>
                                <TableCell className="font-mono text-xs">#{b.bookingReference.slice(0, 8).toUpperCase()}</TableCell>
                                <TableCell><div className="text-sm font-medium">{b.roomName}</div><div className="text-xs text-gray-400">Room {b.roomNumber}</div></TableCell>
                                <TableCell className="text-sm"><div>{new Date(b.checkInDate).toLocaleDateString()}</div><div className="text-gray-400">→ {new Date(b.checkOutDate).toLocaleDateString()}</div></TableCell>
                                <TableCell>₦{b.totalAmount.toLocaleString()}</TableCell>
                                <TableCell><Badge variant="outline">{b.status}</Badge></TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2 pt-2 border-t">
                    <Button variant="outline" size="sm" onClick={() => openEditInd(detail)}><Edit className="h-4 w-4 mr-1" />Edit</Button>
                    <Button variant="outline" size="sm" onClick={() => openBillForm('customer', detail.id, `${detail.firstName} ${detail.lastName}`)}><Receipt className="h-4 w-4 mr-1" />Add Bill</Button>
                    <Button size="sm" onClick={() => router.push(`/staff/bookings/new?customerId=${detail.id}`)}><Calendar className="h-4 w-4 mr-1" />New Booking</Button>
                  </div>
                </>
              ) : null}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── CORPORATION DETAIL MODAL ── */}
      {corpDetailOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Corporation Details</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => { setCorpDetailOpen(false); setCorpDetail(null) }}><X className="h-4 w-4" /></Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {loadingCorpDetail ? (
                <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
              ) : corpDetail ? (
                <>
                  <div className="grid gap-6 md:grid-cols-2">
                    <div>
                      <h3 className="font-semibold mb-3">Corporation Information</h3>
                      <dl className="space-y-1.5 text-sm">
                        <div><span className="font-medium">Name: </span>{corpDetail.name}</div>
                        {corpDetail.contactPerson && <div><span className="font-medium">Contact: </span>{corpDetail.contactPerson}</div>}
                        {corpDetail.email && <div><span className="font-medium">Email: </span>{corpDetail.email}</div>}
                        {corpDetail.phone && <div><span className="font-medium">Phone: </span>{corpDetail.phone}</div>}
                        {corpDetail.taxId && <div><span className="font-medium">Tax ID: </span>{corpDetail.taxId}</div>}
                        {corpDetail.address && <div><span className="font-medium">Address: </span>{corpDetail.address}</div>}
                        <div><span className="font-medium">Bill Type: </span>{BILL_TYPES.find(b => b.value === corpDetail.billType)?.label || 'None'}</div>
                        <div><span className="font-medium">Status: </span><Badge className={corpDetail.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>{corpDetail.status}</Badge></div>
                      </dl>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-3">Members ({corpDetail.memberCount})</h3>
                      {corpDetail.members?.length > 0 ? (
                        <div className="space-y-2">
                          {corpDetail.members.map((m: any) => (
                            <div key={m.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded text-sm">
                              <User className="h-4 w-4 text-gray-400" />
                              <span>{m.firstName} {m.lastName}</span>
                              {m.phone && <span className="text-gray-400">· {m.phone}</span>}
                            </div>
                          ))}
                        </div>
                      ) : <p className="text-sm text-gray-400">No members yet</p>}
                    </div>
                  </div>

                  {corpDetail.bills?.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-3">Bills</h3>
                      <div className="border rounded-lg overflow-hidden">
                        <Table>
                          <TableHeader><TableRow><TableHead>Type</TableHead><TableHead>Total</TableHead><TableHead>Paid</TableHead><TableHead>Balance</TableHead><TableHead>Active</TableHead></TableRow></TableHeader>
                          <TableBody>
                            {corpDetail.bills.map((b: any) => (
                              <TableRow key={b.id}>
                                <TableCell><Badge variant="outline" className="text-xs">{BILL_TYPES.find(t => t.value === b.billType)?.label || b.billType}</Badge></TableCell>
                                <TableCell>₦{Number(b.totalAmount).toLocaleString()}</TableCell>
                                <TableCell className="text-green-600">₦{Number(b.paidAmount).toLocaleString()}</TableCell>
                                <TableCell className="text-red-600">₦{Math.max(0, Number(b.totalAmount) - Number(b.paidAmount)).toLocaleString()}</TableCell>
                                <TableCell><Badge className={b.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>{b.isActive ? 'Active' : 'Inactive'}</Badge></TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2 pt-2 border-t">
                    <Button variant="outline" size="sm" onClick={() => openEditCorp(corpDetail)}><Edit className="h-4 w-4 mr-1" />Edit</Button>
                    <Button variant="outline" size="sm" onClick={() => openBillForm('corporation', corpDetail.id, corpDetail.name)}><Receipt className="h-4 w-4 mr-1" />Add Bill</Button>
                  </div>
                </>
              ) : null}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
