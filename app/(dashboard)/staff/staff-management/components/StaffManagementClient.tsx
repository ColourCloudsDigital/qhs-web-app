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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Search, 
  Eye, 
  Edit, 
  Plus, 
  X, 
  Loader2, 
  Users, 
  UserCheck, 
  UserX, 
  ClipboardList,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign,
  Mail,
  Phone,
  MapPin,
  Shield,
  Settings
} from 'lucide-react'
import toast from '@/lib/services/toast.service'

interface StaffMember {
  id: string
  userId: string
  name: string
  firstName: string
  lastName: string
  email: string
  position: string
  permissions: string[]
  isActive: boolean
  lastLoginAt?: string
  createdAt: string
  updatedAt: string
  stats: {
    totalTasks: number
    completedTasks: number
    pendingTasks: number
    inProgressTasks: number
    totalBookings: number
    totalRevenue: number
  }
}

interface StaffStats {
  totalStaff: number
  activeStaff: number
  inactiveStaff: number
  totalPositions: number
  totalTasks: number
  completedTasks: number
  pendingTasks: number
}

interface StaffDetails extends StaffMember {
  tasks: Array<{
    taskId: string
    title: string
    description: string
    category: string
    priority: string
    dueDate: string
    status: string
    createdAt: string
    roomNumber?: string
    roomName?: string
  }>
  bookings: Array<{
    id: string
    checkInDate: string
    checkOutDate: string
    totalAmount: number
    status: string
    createdAt: string
    customerName: string
    roomName: string
    roomNumber: string
  }>
}

interface Task {
  title: string
  description: string
  category: string
  priority: string
  dueDate: string
  roomUnitId?: string
  maintenanceType: string
  estimatedHours?: number
  costEstimate?: number
  isRecurring: boolean
}

export function StaffManagementClient() {
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [stats, setStats] = useState<StaffStats>({
    totalStaff: 0,
    activeStaff: 0,
    inactiveStaff: 0,
    totalPositions: 0,
    totalTasks: 0,
    completedTasks: 0,
    pendingTasks: 0
  })
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [positionFilter, setPositionFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedStaff, setSelectedStaff] = useState<StaffDetails | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showTaskModal, setShowTaskModal] = useState(false)
  const [loadingStaffDetails, setLoadingStaffDetails] = useState(false)
  const [addingStaff, setAddingStaff] = useState(false)
  const [assigningTask, setAssigningTask] = useState(false)

  // Add staff form state
  const [newStaff, setNewStaff] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    position: '',
    selectedPermissions: [] as string[]
  })

  // Task assignment form state
  const [newTask, setNewTask] = useState<Task>({
    title: '',
    description: '',
    category: 'General',
    priority: 'MEDIUM',
    dueDate: '',
    roomUnitId: '',
    maintenanceType: 'CORRECTIVE',
    estimatedHours: undefined,
    costEstimate: undefined,
    isRecurring: false
  })

  const availablePermissions = [
    'bookings', 'rooms', 'customers', 'payments', 'reports', 'staff', 'tasks', 'settings'
  ]

  const positions = [
    'Manager', 'Supervisor', 'Receptionist', 'Housekeeper', 'Maintenance', 
    'Security', 'Concierge', 'Accountant', 'Chef', 'Waiter', 'Other'
  ]

  useEffect(() => {
    fetchStaff()
  }, [searchTerm, positionFilter, statusFilter])

  const fetchStaff = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (searchTerm) params.append('search', searchTerm)
      if (positionFilter !== 'all') params.append('position', positionFilter)
      if (statusFilter !== 'all') params.append('status', statusFilter)
      
      const response = await fetch(`/api/staff/staff-management?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setStaff(data.staff || [])
        setStats(data.stats || stats)
      } else {
        toast.error('Failed to fetch staff', { title: 'Error' })
      }
    } catch (error) {
      toast.error('Failed to fetch staff', { title: 'Error' })
    } finally {
      setLoading(false)
    }
  }

  const fetchStaffDetails = async (staffId: string) => {
    try {
      setLoadingStaffDetails(true)
      const response = await fetch(`/api/staff/staff-management/${staffId}`)
      if (response.ok) {
        const data = await response.json()
        setSelectedStaff(data.staff)
      } else {
        toast.error('Failed to fetch staff details', { title: 'Error' })
      }
    } catch (error) {
      toast.error('Failed to fetch staff details', { title: 'Error' })
    } finally {
      setLoadingStaffDetails(false)
    }
  }

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!newStaff.firstName || !newStaff.email || !newStaff.password || !newStaff.position) {
      toast.error('Please fill in all required fields', { title: 'Validation Error' })
      return
    }

    try {
      setAddingStaff(true)
      const response = await fetch('/api/staff/staff-management', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newStaff),
      })

      if (response.ok) {
        toast.success('Staff member added successfully', { title: 'Success' })
        setShowAddModal(false)
        setNewStaff({
          firstName: '',
          lastName: '',
          email: '',
          password: '',
          position: '',
          selectedPermissions: []
        })
        fetchStaff()
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || 'Failed to add staff member', { title: 'Error' })
      }
    } catch (error) {
      toast.error('Failed to add staff member', { title: 'Error' })
    } finally {
      setAddingStaff(false)
    }
  }

  const handleAssignTask = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!newTask.title || !newTask.dueDate || !selectedStaff) {
      toast.error('Please fill in all required fields', { title: 'Validation Error' })
      return
    }

    try {
      setAssigningTask(true)
      const response = await fetch(`/api/staff/staff-management/${selectedStaff.id}/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newTask),
      })

      if (response.ok) {
        toast.success('Task assigned successfully', { title: 'Success' })
        setShowTaskModal(false)
        setNewTask({
          title: '',
          description: '',
          category: 'General',
          priority: 'MEDIUM',
          dueDate: '',
          roomUnitId: '',
          maintenanceType: 'CORRECTIVE',
          estimatedHours: undefined,
          costEstimate: undefined,
          isRecurring: false
        })
        // Refresh staff details
        fetchStaffDetails(selectedStaff.id)
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || 'Failed to assign task', { title: 'Error' })
      }
    } catch (error) {
      toast.error('Failed to assign task', { title: 'Error' })
    } finally {
      setAssigningTask(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'CANCELLED':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT':
      case 'EMERGENCY':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'HIGH':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'LOW':
        return 'bg-green-100 text-green-800 border-green-200'
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
        <h1 className="text-3xl font-bold">Staff Management</h1>
        <Button onClick={() => setShowAddModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Staff Member
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Staff</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalStaff}</div>
            <p className="text-xs text-muted-foreground">
              {stats.activeStaff} active, {stats.inactiveStaff} inactive
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Staff</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.activeStaff}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalStaff > 0 ? ((stats.activeStaff / stats.totalStaff) * 100).toFixed(1) : 0}% of total
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTasks}</div>
            <p className="text-xs text-muted-foreground">
              {stats.completedTasks} completed, {stats.pendingTasks} pending
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Positions</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPositions}</div>
            <p className="text-xs text-muted-foreground">
              Different roles
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="flex gap-4 items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search staff..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={positionFilter} onValueChange={setPositionFilter}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Positions</SelectItem>
            {positions.map(position => (
              <SelectItem key={position} value={position}>{position}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Staff Table */}
      <Card>
        <CardHeader>
          <CardTitle>Staff Members ({staff.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Staff Member</TableHead>
                <TableHead>Position</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Tasks</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Login</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {staff.map((member) => (
                <TableRow key={member.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{member.name}</div>
                      <div className="text-sm text-gray-500">
                        ID: {member.id.slice(0, 8)}...
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{member.position}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center gap-1 text-sm">
                        <Mail className="h-3 w-3" />
                        {member.email}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-center">
                      <div className="font-medium">{member.stats.totalTasks}</div>
                      <div className="text-xs text-gray-500">
                        {member.stats.completedTasks} completed
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={member.isActive ? 'bg-green-100 text-green-800 border-green-200' : 'bg-red-100 text-red-800 border-red-200'}>
                      {member.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {member.lastLoginAt ? 
                      new Date(member.lastLoginAt).toLocaleDateString() : 
                      'Never'
                    }
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => fetchStaffDetails(member.id)}
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
          
          {staff.length === 0 && (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No staff members found</h3>
              <p className="text-gray-500 mb-4">
                {searchTerm || positionFilter !== 'all' || statusFilter !== 'all'
                  ? 'Try adjusting your search or filters' 
                  : 'Get started by adding your first staff member'
                }
              </p>
              {!searchTerm && positionFilter === 'all' && statusFilter === 'all' && (
                <Button onClick={() => setShowAddModal(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Staff Member
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Staff Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Add Staff Member</h2>
              <Button variant="ghost" size="sm" onClick={() => setShowAddModal(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <form onSubmit={handleAddStaff} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    value={newStaff.firstName}
                    onChange={(e) => setNewStaff({...newStaff, firstName: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={newStaff.lastName}
                    onChange={(e) => setNewStaff({...newStaff, lastName: e.target.value})}
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={newStaff.email}
                  onChange={(e) => setNewStaff({...newStaff, email: e.target.value})}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="password">Password *</Label>
                <Input
                  id="password"
                  type="password"
                  value={newStaff.password}
                  onChange={(e) => setNewStaff({...newStaff, password: e.target.value})}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="position">Position *</Label>
                <Select value={newStaff.position} onValueChange={(value) => setNewStaff({...newStaff, position: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select position" />
                  </SelectTrigger>
                  <SelectContent>
                    {positions.map(position => (
                      <SelectItem key={position} value={position}>{position}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>Permissions</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {availablePermissions.map(permission => (
                    <label key={permission} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={newStaff.selectedPermissions.includes(permission)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setNewStaff({
                              ...newStaff,
                              selectedPermissions: [...newStaff.selectedPermissions, permission]
                            })
                          } else {
                            setNewStaff({
                              ...newStaff,
                              selectedPermissions: newStaff.selectedPermissions.filter(p => p !== permission)
                            })
                          }
                        }}
                        className="rounded"
                      />
                      <span className="text-sm capitalize">{permission}</span>
                    </label>
                  ))}
                </div>
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setShowAddModal(false)} className="flex-1">
                  Cancel
                </Button>
                <Button type="submit" disabled={addingStaff} className="flex-1">
                  {addingStaff ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    'Add Staff Member'
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Staff Details Modal */}
      {selectedStaff && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Staff Details - {selectedStaff.name}</h2>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowTaskModal(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Assign Task
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setSelectedStaff(null)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            {loadingStaffDetails ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Staff Info */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Contact Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-gray-500" />
                        <span className="text-sm">{selectedStaff.email}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-gray-500" />
                        <span className="text-sm">{selectedStaff.position}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <span className="text-sm">
                          Joined {new Date(selectedStaff.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Task Statistics</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Total Tasks:</span>
                        <span className="font-medium">{selectedStaff.stats.totalTasks}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Completed:</span>
                        <span className="font-medium text-green-600">{selectedStaff.stats.completedTasks}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">In Progress:</span>
                        <span className="font-medium text-blue-600">{selectedStaff.stats.inProgressTasks}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Pending:</span>
                        <span className="font-medium text-yellow-600">{selectedStaff.stats.pendingTasks}</span>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Performance</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Task Completion:</span>
                        <span className="font-medium">
                          {selectedStaff.stats.totalTasks > 0 
                            ? `${Math.round((selectedStaff.stats.completedTasks / selectedStaff.stats.totalTasks) * 100)}%`
                            : '0%'
                          }
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Status:</span>
                        <Badge className={selectedStaff.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                          {selectedStaff.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Permissions */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Permissions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {selectedStaff.permissions.map(permission => (
                        <Badge key={permission} variant="outline" className="capitalize">
                          {permission}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Tabs for Tasks and Bookings */}
                <Tabs defaultValue="tasks" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="tasks">Tasks ({selectedStaff.tasks.length})</TabsTrigger>
                    <TabsTrigger value="bookings">Recent Hotel Bookings ({selectedStaff.bookings.length})</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="tasks" className="space-y-4">
                    <div className="space-y-2">
                      {selectedStaff.tasks.map((task) => (
                        <Card key={task.taskId}>
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <h4 className="font-medium">{task.title}</h4>
                                <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                                <div className="flex items-center gap-4 mt-2">
                                  <Badge className={getStatusColor(task.status)}>
                                    {task.status.replace('_', ' ')}
                                  </Badge>
                                  <Badge className={getPriorityColor(task.priority)}>
                                    {task.priority}
                                  </Badge>
                                  <span className="text-sm text-gray-500">
                                    Due: {new Date(task.dueDate).toLocaleDateString()}
                                  </span>
                                  {task.roomNumber && (
                                    <span className="text-sm text-gray-500">
                                      Room: {task.roomNumber}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                      
                      {selectedStaff.tasks.length === 0 && (
                        <div className="text-center py-8">
                          <ClipboardList className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                          <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks assigned</h3>
                          <p className="text-gray-500 mb-4">This staff member has no tasks assigned yet.</p>
                          <Button onClick={() => setShowTaskModal(true)}>
                            <Plus className="h-4 w-4 mr-2" />
                            Assign Task
                          </Button>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="bookings" className="space-y-4">
                    <div className="space-y-2">
                      {selectedStaff.bookings.map((booking) => (
                        <Card key={booking.id}>
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <h4 className="font-medium">Booking #{booking.id.slice(0, 8)}</h4>
                                <p className="text-sm text-gray-600 mt-1">
                                  Customer: {booking.customerName}
                                </p>
                                <div className="flex items-center gap-4 mt-2">
                                  <span className="text-sm text-gray-500">
                                    {new Date(booking.checkInDate).toLocaleDateString()} - {new Date(booking.checkOutDate).toLocaleDateString()}
                                  </span>
                                  <span className="text-sm text-gray-500">
                                    {booking.roomName} ({booking.roomNumber})
                                  </span>
                                  <Badge className={getStatusColor(booking.status)}>
                                    {booking.status.replace('_', ' ')}
                                  </Badge>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="font-medium">${booking.totalAmount.toLocaleString()}</div>
                                <div className="text-sm text-gray-500">
                                  {new Date(booking.createdAt).toLocaleDateString()}
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                      
                      {selectedStaff.bookings.length === 0 && (
                        <div className="text-center py-8">
                          <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                          <h3 className="text-lg font-medium text-gray-900 mb-2">No recent bookings</h3>
                          <p className="text-gray-500">No recent bookings found for this hotel.</p>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Task Assignment Modal */}
      {showTaskModal && selectedStaff && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Assign Task to {selectedStaff.name}</h2>
              <Button variant="ghost" size="sm" onClick={() => setShowTaskModal(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <form onSubmit={handleAssignTask} className="space-y-4">
              <div>
                <Label htmlFor="taskTitle">Task Title *</Label>
                <Input
                  id="taskTitle"
                  value={newTask.title}
                  onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="taskDescription">Description</Label>
                <Textarea
                  id="taskDescription"
                  value={newTask.description}
                  onChange={(e) => setNewTask({...newTask, description: e.target.value})}
                  rows={3}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select value={newTask.category} onValueChange={(value) => setNewTask({...newTask, category: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="General">General</SelectItem>
                      <SelectItem value="Housekeeping">Housekeeping</SelectItem>
                      <SelectItem value="Maintenance">Maintenance</SelectItem>
                      <SelectItem value="Front Desk">Front Desk</SelectItem>
                      <SelectItem value="Security">Security</SelectItem>
                      <SelectItem value="Food & Beverage">Food & Beverage</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="priority">Priority</Label>
                  <Select value={newTask.priority} onValueChange={(value) => setNewTask({...newTask, priority: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LOW">Low</SelectItem>
                      <SelectItem value="MEDIUM">Medium</SelectItem>
                      <SelectItem value="HIGH">High</SelectItem>
                      <SelectItem value="URGENT">Urgent</SelectItem>
                      <SelectItem value="EMERGENCY">Emergency</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <Label htmlFor="dueDate">Due Date *</Label>
                <Input
                  id="dueDate"
                  type="datetime-local"
                  value={newTask.dueDate}
                  onChange={(e) => setNewTask({...newTask, dueDate: e.target.value})}
                  required
                />
              </div>
              
              {newTask.category === 'Maintenance' && (
                <>
                  <div>
                    <Label htmlFor="maintenanceType">Maintenance Type</Label>
                    <Select value={newTask.maintenanceType} onValueChange={(value) => setNewTask({...newTask, maintenanceType: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CORRECTIVE">Corrective</SelectItem>
                        <SelectItem value="PREVENTIVE">Preventive</SelectItem>
                        <SelectItem value="EMERGENCY">Emergency</SelectItem>
                        <SelectItem value="ROUTINE">Routine</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="estimatedHours">Estimated Hours</Label>
                      <Input
                        id="estimatedHours"
                        type="number"
                        step="0.5"
                        value={newTask.estimatedHours || ''}
                        onChange={(e) => setNewTask({...newTask, estimatedHours: e.target.value ? parseFloat(e.target.value) : undefined})}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="costEstimate">Cost Estimate ($)</Label>
                      <Input
                        id="costEstimate"
                        type="number"
                        step="0.01"
                        value={newTask.costEstimate || ''}
                        onChange={(e) => setNewTask({...newTask, costEstimate: e.target.value ? parseFloat(e.target.value) : undefined})}
                      />
                    </div>
                  </div>
                </>
              )}
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isRecurring"
                  checked={newTask.isRecurring}
                  onChange={(e) => setNewTask({...newTask, isRecurring: e.target.checked})}
                  className="rounded"
                />
                <Label htmlFor="isRecurring">Recurring Task</Label>
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setShowTaskModal(false)} className="flex-1">
                  Cancel
                </Button>
                <Button type="submit" disabled={assigningTask} className="flex-1">
                  {assigningTask ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Assigning...
                    </>
                  ) : (
                    'Assign Task'
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}