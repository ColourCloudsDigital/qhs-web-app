'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { 
  Search, 
  Filter, 
  Eye, 
  Edit, 
  Phone, 
  Mail, 
  Calendar,
  User,
  MapPin,
  CreditCard,
  Plus,
  X,
  Loader2,
  Users,
  TrendingUp
} from 'lucide-react'
import toast from '@/lib/services/toast.service'

interface Customer {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  address?: string
  nationality?: string
  idType?: string
  idNumber?: string
  totalBookings: number
  totalSpent: number
  lastBooking?: string
  status: 'active' | 'inactive' | 'blocked'
  createdAt: string
  lastLoginAt?: string
}

interface CustomerStats {
  totalCustomers: number
  activeCustomers: number
  inactiveCustomers: number
  blockedCustomers: number
  totalRevenue: number
  avgBookings: number
}

interface CustomerDetails extends Customer {
  firstBooking?: string
  bookings: Array<{
    id: string
    bookingReference: string
    checkInDate: string
    checkOutDate: string
    totalAmount: number
    status: string
    roomName: string
    roomType: string
    roomNumber: string
  }>
  payments: Array<{
    id: string
    amount: number
    paymentMethod: string
    status: string
    transactionId: string
    createdAt: string
    bookingReference: string
  }>
}

export function StaffCustomersClient() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [stats, setStats] = useState<CustomerStats>({
    totalCustomers: 0,
    activeCustomers: 0,
    inactiveCustomers: 0,
    blockedCustomers: 0,
    totalRevenue: 0,
    avgBookings: 0
  })
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerDetails | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [loadingCustomerDetails, setLoadingCustomerDetails] = useState(false)
  const [addingCustomer, setAddingCustomer] = useState(false)

  // Add customer form state
  const [newCustomer, setNewCustomer] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    nationality: '',
    idType: '',
    idNumber: ''
  })

  useEffect(() => {
    fetchCustomers()
  }, [searchTerm, statusFilter])

  const fetchCustomers = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (searchTerm) params.append('search', searchTerm)
      if (statusFilter !== 'all') params.append('status', statusFilter)
      
      const response = await fetch(`/api/staff/customers?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setCustomers(data.customers || [])
        setStats(data.stats || stats)
      } else {
        toast.error('Failed to fetch customers', { title: 'Error' })
      }
    } catch (error) {
      toast.error('Failed to fetch customers', { title: 'Error' })
    } finally {
      setLoading(false)
    }
  }

  const fetchCustomerDetails = async (customerId: string) => {
    try {
      setLoadingCustomerDetails(true)
      const response = await fetch(`/api/staff/customers/${customerId}`)
      if (response.ok) {
        const data = await response.json()
        setSelectedCustomer(data.customer)
      } else {
        toast.error('Failed to fetch customer details', { title: 'Error' })
      }
    } catch (error) {
      toast.error('Failed to fetch customer details', { title: 'Error' })
    } finally {
      setLoadingCustomerDetails(false)
    }
  }

  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!newCustomer.firstName || !newCustomer.phone) {
      toast.error('First name and phone are required', { title: 'Validation Error' })
      return
    }

    try {
      setAddingCustomer(true)
      const response = await fetch('/api/staff/customers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newCustomer),
      })

      if (response.ok) {
        toast.success('Customer added successfully', { title: 'Success' })
        setShowAddModal(false)
        setNewCustomer({
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          address: '',
          nationality: '',
          idType: '',
          idNumber: ''
        })
        fetchCustomers()
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || 'Failed to add customer', { title: 'Error' })
      }
    } catch (error) {
      toast.error('Failed to add customer', { title: 'Error' })
    } finally {
      setAddingCustomer(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'inactive':
        return 'bg-gray-100 text-gray-800 border-gray-200'
      case 'blocked':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Customers</h1>
        <Button onClick={() => setShowAddModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Customer
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCustomers}</div>
            <p className="text-xs text-muted-foreground">
              {stats.activeCustomers} active, {stats.inactiveCustomers} inactive
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Customers</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.activeCustomers}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalCustomers > 0 ? ((stats.activeCustomers / stats.totalCustomers) * 100).toFixed(1) : 0}% of total
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₦{stats.totalRevenue.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              From {stats.totalCustomers} customers
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Bookings</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.avgBookings.toFixed(1)}
            </div>
            <p className="text-xs text-muted-foreground">
              Per customer
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="flex gap-4 items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search customers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="blocked">Blocked</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Customers Table */}
      <Card>
        <CardHeader>
          <CardTitle>Customer List ({customers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Bookings</TableHead>
                <TableHead>Total Spent</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Booking</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">
                        {customer.firstName} {customer.lastName}
                      </div>
                      <div className="text-sm text-gray-500">
                        ID: {customer.id.slice(0, 8)}...
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {customer.email && (
                        <div className="flex items-center gap-1 text-sm">
                          <Mail className="h-3 w-3" />
                          {customer.email}
                        </div>
                      )}
                      <div className="flex items-center gap-1 text-sm">
                        <Phone className="h-3 w-3" />
                        {customer.phone}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-center">
                      <div className="font-medium">{customer.totalBookings}</div>
                      <div className="text-xs text-gray-500">bookings</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">₦{customer.totalSpent.toLocaleString()}</div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(customer.status)}>
                      {customer.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {customer.lastBooking ? 
                      new Date(customer.lastBooking).toLocaleDateString() : 
                      'Never'
                    }
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => fetchCustomerDetails(customer.id)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {customers.length === 0 && (
            <div className="text-center py-8">
              <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No customers found</h3>
              <p className="text-gray-500 mb-4">
                {searchTerm || statusFilter !== 'all' 
                  ? 'Try adjusting your search or filters' 
                  : 'Get started by adding your first customer'
                }
              </p>
              {!searchTerm && statusFilter === 'all' && (
                <Button onClick={() => setShowAddModal(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Customer
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Customer Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Add New Customer</CardTitle>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowAddModal(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddCustomer} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="firstName">First Name *</Label>
                    <Input
                      id="firstName"
                      value={newCustomer.firstName}
                      onChange={(e) => setNewCustomer({...newCustomer, firstName: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      value={newCustomer.lastName}
                      onChange={(e) => setNewCustomer({...newCustomer, lastName: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newCustomer.email}
                      onChange={(e) => setNewCustomer({...newCustomer, email: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone *</Label>
                    <Input
                      id="phone"
                      value={newCustomer.phone}
                      onChange={(e) => setNewCustomer({...newCustomer, phone: e.target.value})}
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="address">Address</Label>
                  <Textarea
                    id="address"
                    value={newCustomer.address}
                    onChange={(e) => setNewCustomer({...newCustomer, address: e.target.value})}
                    rows={3}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="nationality">Nationality</Label>
                    <Input
                      id="nationality"
                      value={newCustomer.nationality}
                      onChange={(e) => setNewCustomer({...newCustomer, nationality: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="idType">ID Type</Label>
                    <Select 
                      value={newCustomer.idType} 
                      onValueChange={(value) => setNewCustomer({...newCustomer, idType: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select ID type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="passport">Passport</SelectItem>
                        <SelectItem value="national_id">National ID</SelectItem>
                        <SelectItem value="drivers_license">Driver's License</SelectItem>
                        <SelectItem value="voters_card">Voter's Card</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="idNumber">ID Number</Label>
                    <Input
                      id="idNumber"
                      value={newCustomer.idNumber}
                      onChange={(e) => setNewCustomer({...newCustomer, idNumber: e.target.value})}
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button type="submit" disabled={addingCustomer}>
                    {addingCustomer ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Adding...
                      </>
                    ) : (
                      'Add Customer'
                    )}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setShowAddModal(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Customer Detail Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Customer Details</CardTitle>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setSelectedCustomer(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {loadingCustomerDetails ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : (
                <>
                  {/* Customer Info */}
                  <div className="grid gap-6 md:grid-cols-2">
                    <div>
                      <h3 className="font-medium mb-3">Personal Information</h3>
                      <div className="space-y-2 text-sm">
                        <div><span className="font-medium">Name:</span> {selectedCustomer.firstName} {selectedCustomer.lastName}</div>
                        {selectedCustomer.email && (
                          <div><span className="font-medium">Email:</span> {selectedCustomer.email}</div>
                        )}
                        <div><span className="font-medium">Phone:</span> {selectedCustomer.phone}</div>
                        {selectedCustomer.address && (
                          <div><span className="font-medium">Address:</span> {selectedCustomer.address}</div>
                        )}
                        {selectedCustomer.nationality && (
                          <div><span className="font-medium">Nationality:</span> {selectedCustomer.nationality}</div>
                        )}
                        {selectedCustomer.idType && selectedCustomer.idNumber && (
                          <>
                            <div><span className="font-medium">ID Type:</span> {selectedCustomer.idType}</div>
                            <div><span className="font-medium">ID Number:</span> {selectedCustomer.idNumber}</div>
                          </>
                        )}
                        <div><span className="font-medium">Member Since:</span> {new Date(selectedCustomer.createdAt).toLocaleDateString()}</div>
                        {selectedCustomer.lastLoginAt && (
                          <div><span className="font-medium">Last Login:</span> {new Date(selectedCustomer.lastLoginAt).toLocaleDateString()}</div>
                        )}
                      </div>
                    </div>
                    <div>
                      <h3 className="font-medium mb-3">Booking Statistics</h3>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="text-center p-3 bg-blue-50 rounded">
                          <div className="text-2xl font-bold text-blue-600">{selectedCustomer.totalBookings}</div>
                          <div className="text-sm text-blue-600">Total Bookings</div>
                        </div>
                        <div className="text-center p-3 bg-green-50 rounded">
                          <div className="text-2xl font-bold text-green-600">₦{selectedCustomer.totalSpent.toLocaleString()}</div>
                          <div className="text-sm text-green-600">Total Spent</div>
                        </div>
                        <div className="text-center p-3 bg-gray-50 rounded">
                          <Badge className={getStatusColor(selectedCustomer.status)}>
                            {selectedCustomer.status}
                          </Badge>
                          <div className="text-sm text-gray-600 mt-1">Status</div>
                        </div>
                        <div className="text-center p-3 bg-purple-50 rounded">
                          <div className="text-lg font-bold text-purple-600">
                            {selectedCustomer.lastBooking ? new Date(selectedCustomer.lastBooking).toLocaleDateString() : 'Never'}
                          </div>
                          <div className="text-sm text-purple-600">Last Booking</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Recent Bookings */}
                  {selectedCustomer.bookings && selectedCustomer.bookings.length > 0 && (
                    <div>
                      <h3 className="font-medium mb-3">Recent Bookings</h3>
                      <div className="border rounded-lg overflow-hidden">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Reference</TableHead>
                              <TableHead>Room</TableHead>
                              <TableHead>Dates</TableHead>
                              <TableHead>Amount</TableHead>
                              <TableHead>Status</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {selectedCustomer.bookings.slice(0, 5).map((booking) => (
                              <TableRow key={booking.id}>
                                <TableCell className="font-medium">{booking.bookingReference}</TableCell>
                                <TableCell>
                                  <div>
                                    <div className="font-medium">{booking.roomName}</div>
                                    <div className="text-sm text-gray-500">Room {booking.roomNumber}</div>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="text-sm">
                                    <div>{new Date(booking.checkInDate).toLocaleDateString()}</div>
                                    <div className="text-gray-500">to {new Date(booking.checkOutDate).toLocaleDateString()}</div>
                                  </div>
                                </TableCell>
                                <TableCell>₦{booking.totalAmount.toLocaleString()}</TableCell>
                                <TableCell>
                                  <Badge variant="outline" className={
                                    booking.status === 'CONFIRMED' ? 'border-blue-200 text-blue-800' :
                                    booking.status === 'CHECKED_IN' ? 'border-green-200 text-green-800' :
                                    booking.status === 'CHECKED_OUT' ? 'border-gray-200 text-gray-800' :
                                    'border-red-200 text-red-800'
                                  }>
                                    {booking.status}
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  )}

                  {/* Recent Payments */}
                  {selectedCustomer.payments && selectedCustomer.payments.length > 0 && (
                    <div>
                      <h3 className="font-medium mb-3">Recent Payments</h3>
                      <div className="border rounded-lg overflow-hidden">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Date</TableHead>
                              <TableHead>Booking</TableHead>
                              <TableHead>Amount</TableHead>
                              <TableHead>Method</TableHead>
                              <TableHead>Status</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {selectedCustomer.payments.slice(0, 5).map((payment) => (
                              <TableRow key={payment.id}>
                                <TableCell>{new Date(payment.createdAt).toLocaleDateString()}</TableCell>
                                <TableCell className="font-medium">{payment.bookingReference}</TableCell>
                                <TableCell>₦{payment.amount.toLocaleString()}</TableCell>
                                <TableCell className="capitalize">{payment.paymentMethod.toLowerCase()}</TableCell>
                                <TableCell>
                                  <Badge variant="outline" className={
                                    payment.status === 'COMPLETED' ? 'border-green-200 text-green-800' :
                                    payment.status === 'PENDING' ? 'border-yellow-200 text-yellow-800' :
                                    'border-red-200 text-red-800'
                                  }>
                                    {payment.status}
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2 pt-4 border-t">
                    <Button variant="outline">
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Customer
                    </Button>
                    <Button variant="outline">
                      <Calendar className="h-4 w-4 mr-2" />
                      New Booking
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}