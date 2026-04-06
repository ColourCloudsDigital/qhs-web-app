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
import { Search, Eye, Edit, Phone, Mail, Calendar, User, CreditCard, Plus, X, Loader2, Users, TrendingUp, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react'
import toast from '@/lib/toast'

type Customer = { id: string; firstName: string; lastName: string; email: string; phone: string; address?: string; nationality?: string; idType?: string; idNumber?: string; totalBookings: number; totalSpent: number; lastBooking?: string; status: 'active'|'inactive'|'blocked'; createdAt: string }
type Stats = { totalCustomers: number; activeCustomers: number; inactiveCustomers: number; blockedCustomers: number; totalRevenue: number; avgBookings: number }
type Details = Customer & { bookings: any[]; payments: any[] }

const EMPTY = { firstName:'', lastName:'', email:'', phone:'', address:'', nationality:'', idType:'', idNumber:'' }
const NATS = ['Nigerian','Ghanaian','Kenyan','South African','Ethiopian','British','American','Canadian','French','German','Chinese','Indian','Brazilian','Other']
const ID_TYPES = [{ value:'NATIONAL_ID', label:'National ID' },{ value:'PASSPORT', label:'Passport' },{ value:'DRIVERS_LICENSE', label:"Driver's License" },{ value:'VOTERS_CARD', label:"Voter's Card" },{ value:'OTHER', label:'Other' }]
const SC: Record<string,string> = { active:'bg-green-100 text-green-800', inactive:'bg-gray-100 text-gray-800', blocked:'bg-red-100 text-red-800' }
const BC: Record<string,string> = { CONFIRMED:'border-blue-200 text-blue-800', CHECKED_IN:'border-green-200 text-green-800', CHECKED_OUT:'border-gray-200 text-gray-800', CANCELLED:'border-red-200 text-red-800' }

export function StaffCustomersClient() {
  const router = useRouter()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [stats, setStats] = useState<Stats>({ totalCustomers:0, activeCustomers:0, inactiveCustomers:0, blockedCustomers:0, totalRevenue:0, avgBookings:0 })
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [search, setSearch] = useState('')
  const [debSearch, setDebSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const limit = 20

  const [detail, setDetail] = useState<Details|null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [loadingDetail, setLoadingDetail] = useState(false)

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Customer|null>(null)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)

  useEffect(() => { const t = setTimeout(() => { setDebSearch(search); setPage(1) }, 400); return () => clearTimeout(t) }, [search])

  const load = useCallback(async (silent=false) => {
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

  useEffect(() => { load() }, [load])

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

  const openAdd = () => { setEditing(null); setForm(EMPTY); setFormOpen(true) }
  const openEdit = (c: Customer) => { setEditing(c); setForm({ firstName:c.firstName, lastName:c.lastName, email:c.email, phone:c.phone, address:c.address||'', nationality:c.nationality||'', idType:c.idType||'', idNumber:c.idNumber||'' }); setFormOpen(true); setDetailOpen(false) }

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.firstName.trim() || !form.phone.trim()) { toast.error('First name and phone are required.'); return }
    setSaving(true)
    try {
      const r = await fetch(editing ? `/api/staff/customers/${editing.id}` : '/api/staff/customers', {
        method: editing ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!r.ok) { const e = await r.json(); throw new Error(e.error || 'Failed') }
      toast.success(editing ? 'Customer updated.' : 'Customer added.')
      setFormOpen(false); setForm(EMPTY); setEditing(null); load(true)
    } catch (err: any) { toast.error(err.message || 'Failed to save.') }
    finally { setSaving(false) }
  }

  const CustomerForm = (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{editing ? 'Edit Customer' : 'Add Customer'}</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => { setFormOpen(false); setForm(EMPTY); setEditing(null) }}><X className="h-4 w-4" /></Button>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={save} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div><Label>First Name *</Label><Input value={form.firstName} onChange={e => setForm({...form, firstName:e.target.value})} required /></div>
              <div><Label>Last Name</Label><Input value={form.lastName} onChange={e => setForm({...form, lastName:e.target.value})} /></div>
              <div><Label>Email</Label><Input type="email" value={form.email} onChange={e => setForm({...form, email:e.target.value})} /></div>
              <div><Label>Phone *</Label><Input value={form.phone} onChange={e => setForm({...form, phone:e.target.value})} required /></div>
            </div>
            <div><Label>Address</Label><Textarea rows={2} value={form.address} onChange={e => setForm({...form, address:e.target.value})} /></div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label>Nationality</Label>
                <Select value={form.nationality} onValueChange={v => setForm({...form, nationality:v})}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent className="max-h-56 overflow-y-auto">{NATS.map(n => <SelectItem key={n} value={n}>{n}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>ID Type</Label>
                <Select value={form.idType} onValueChange={v => setForm({...form, idType:v})}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{ID_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="md:col-span-2"><Label>ID Number</Label><Input value={form.idNumber} onChange={e => setForm({...form, idNumber:e.target.value})} /></div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button type="submit" disabled={saving}>{saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving...</> : (editing ? 'Save Changes' : 'Add Customer')}</Button>
              <Button type="button" variant="outline" onClick={() => { setFormOpen(false); setForm(EMPTY); setEditing(null) }}>Cancel</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Customers</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => load(true)} disabled={refreshing}><RefreshCw className={`h-4 w-4 mr-1 ${refreshing?'animate-spin':''}`} />Refresh</Button>
          <Button size="sm" onClick={openAdd}><Plus className="h-4 w-4 mr-1" />Add Customer</Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {[
          { label:'Total Customers', val:stats.totalCustomers, sub:`${stats.activeCustomers} active`, icon:<Users className="h-4 w-4 text-muted-foreground" /> },
          { label:'Active', val:stats.activeCustomers, sub:`${stats.totalCustomers>0?((stats.activeCustomers/stats.totalCustomers)*100).toFixed(1):0}%`, icon:<User className="h-4 w-4 text-muted-foreground" />, cls:'text-green-600' },
          { label:'Total Revenue', val:`₦${stats.totalRevenue.toLocaleString()}`, sub:`${stats.totalCustomers} customers`, icon:<CreditCard className="h-4 w-4 text-muted-foreground" /> },
          { label:'Avg Bookings', val:stats.avgBookings.toFixed(1), sub:'per customer', icon:<TrendingUp className="h-4 w-4 text-muted-foreground" /> },
        ].map(s => (
          <Card key={s.label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{s.label}</CardTitle>{s.icon}
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${(s as any).cls||''}`}>{s.val}</div>
              <p className="text-xs text-muted-foreground">{s.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

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
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Customer List ({total})</CardTitle>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span>Rows:</span>
            <Select value={String(limit)} onValueChange={v => { setPage(1) }}>
              <SelectTrigger className="w-20 h-8"><SelectValue /></SelectTrigger>
              <SelectContent>{[10,20,50].map(n => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : customers.length === 0 ? (
            <div className="text-center py-12">
              <User className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">No customers found</p>
              <p className="text-sm text-gray-400 mt-1">{search || statusFilter !== 'all' ? 'Try adjusting your search or filters' : 'Add your first customer'}</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Customer</TableHead><TableHead>Contact</TableHead>
                      <TableHead>Bookings</TableHead><TableHead>Total Spent</TableHead>
                      <TableHead>Status</TableHead><TableHead>Last Booking</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customers.map(c => (
                      <TableRow key={c.id}>
                        <TableCell>
                          <div className="font-medium">{c.firstName} {c.lastName}</div>
                          <div className="text-xs text-gray-400">#{c.id.slice(0,8)}</div>
                        </TableCell>
                        <TableCell>
                          {c.email && <div className="flex items-center gap-1 text-sm"><Mail className="h-3 w-3" />{c.email}</div>}
                          <div className="flex items-center gap-1 text-sm"><Phone className="h-3 w-3" />{c.phone}</div>
                        </TableCell>
                        <TableCell className="text-center"><div className="font-medium">{c.totalBookings}</div></TableCell>
                        <TableCell className="font-medium">₦{c.totalSpent.toLocaleString()}</TableCell>
                        <TableCell><Badge className={SC[c.status]||SC.inactive}>{c.status}</Badge></TableCell>
                        <TableCell className="text-sm text-gray-500">{c.lastBooking ? new Date(c.lastBooking).toLocaleDateString() : 'Never'}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="outline" size="sm" onClick={() => openDetail(c.id)} title="View"><Eye className="h-4 w-4" /></Button>
                            <Button variant="outline" size="sm" onClick={() => openEdit(c)} title="Edit"><Edit className="h-4 w-4" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-4 text-sm text-gray-600">
                <span>Page {page} of {totalPages} · {total} total</span>
                <div className="flex gap-1">
                  <Button variant="outline" size="sm" onClick={() => setPage(1)} disabled={page<=1}><ChevronLeft className="h-3 w-3" /><ChevronLeft className="h-3 w-3 -ml-2" /></Button>
                  <Button variant="outline" size="sm" onClick={() => setPage(p=>p-1)} disabled={page<=1}><ChevronLeft className="h-4 w-4" /></Button>
                  <Button variant="outline" size="sm" onClick={() => setPage(p=>p+1)} disabled={page>=totalPages}><ChevronRight className="h-4 w-4" /></Button>
                  <Button variant="outline" size="sm" onClick={() => setPage(totalPages)} disabled={page>=totalPages}><ChevronRight className="h-3 w-3" /><ChevronRight className="h-3 w-3 -ml-2" /></Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {formOpen && CustomerForm}

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
                        {detail.idType && <div><span className="font-medium">ID Type: </span>{ID_TYPES.find(t=>t.value===detail.idType)?.label||detail.idType}</div>}
                        {detail.idNumber && <div><span className="font-medium">ID Number: </span>{detail.idNumber}</div>}
                        <div><span className="font-medium">Member Since: </span>{new Date(detail.createdAt).toLocaleDateString()}</div>
                      </dl>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-3">Statistics</h3>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="text-center p-3 bg-blue-50 rounded-lg"><div className="text-2xl font-bold text-blue-600">{detail.totalBookings}</div><div className="text-xs text-blue-600">Bookings</div></div>
                        <div className="text-center p-3 bg-green-50 rounded-lg"><div className="text-xl font-bold text-green-600">₦{detail.totalSpent.toLocaleString()}</div><div className="text-xs text-green-600">Total Spent</div></div>
                        <div className="text-center p-3 bg-gray-50 rounded-lg"><Badge className={SC[detail.status]||SC.inactive}>{detail.status}</Badge><div className="text-xs text-gray-500 mt-1">Status</div></div>
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
                            {detail.bookings.slice(0,5).map(b => (
                              <TableRow key={b.id}>
                                <TableCell className="font-mono text-xs">#{b.bookingReference.slice(0,8).toUpperCase()}</TableCell>
                                <TableCell><div className="text-sm font-medium">{b.roomName}</div><div className="text-xs text-gray-400">Room {b.roomNumber}</div></TableCell>
                                <TableCell className="text-sm"><div>{new Date(b.checkInDate).toLocaleDateString()}</div><div className="text-gray-400">→ {new Date(b.checkOutDate).toLocaleDateString()}</div></TableCell>
                                <TableCell>₦{b.totalAmount.toLocaleString()}</TableCell>
                                <TableCell><Badge variant="outline" className={BC[b.status]||'border-gray-200 text-gray-600'}>{b.status}</Badge></TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  )}

                  {detail.payments?.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-3">Recent Payments</h3>
                      <div className="border rounded-lg overflow-hidden">
                        <Table>
                          <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Booking</TableHead><TableHead>Amount</TableHead><TableHead>Method</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                          <TableBody>
                            {detail.payments.slice(0,5).map(p => (
                              <TableRow key={p.id}>
                                <TableCell className="text-sm">{new Date(p.createdAt).toLocaleDateString()}</TableCell>
                                <TableCell className="font-mono text-xs">#{p.bookingReference.slice(0,8).toUpperCase()}</TableCell>
                                <TableCell>₦{p.amount.toLocaleString()}</TableCell>
                                <TableCell className="capitalize text-sm">{p.paymentMethod?.toLowerCase()}</TableCell>
                                <TableCell><Badge variant="outline" className={p.status==='COMPLETED'?'border-green-200 text-green-800':p.status==='PENDING'?'border-yellow-200 text-yellow-800':'border-red-200 text-red-800'}>{p.status}</Badge></TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2 pt-2 border-t">
                    <Button variant="outline" size="sm" onClick={() => openEdit(detail)}>
                      <Edit className="h-4 w-4 mr-1" />Edit Customer
                    </Button>
                    <Button size="sm" onClick={() => router.push(`/staff/bookings/new?customerId=${detail.id}`)}>
                      <Calendar className="h-4 w-4 mr-1" />New Booking
                    </Button>
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
