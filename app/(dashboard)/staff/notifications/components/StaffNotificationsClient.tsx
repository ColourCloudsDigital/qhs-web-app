'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Bell, 
  Search, 
  Filter, 
  Check, 
  CheckCheck, 
  Archive, 
  Trash2, 
  Calendar,
  User,
  AlertCircle,
  Info,
  CheckCircle,
  XCircle,
  Clock,
  Settings,
  RefreshCw
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { NotificationType, NotificationStatus } from '@/lib/types/enums'
import toast from '@/lib/services/toast.service'

interface Notification {
  id: string
  title: string
  content: string
  type: NotificationType
  status: NotificationStatus
  createdAt: string
  updatedAt: string
  metadata?: any
  senderName?: string
  senderEmail?: string
}

interface NotificationStats {
  total: number
  unread: number
  read: number
  archived: number
}

export function StaffNotificationsClient() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [stats, setStats] = useState<NotificationStats>({
    total: 0,
    unread: 0,
    read: 0,
    archived: 0
  })
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [selectedNotifications, setSelectedNotifications] = useState<string[]>([])

  const notificationTypes = [
    { value: 'all', label: 'All Types' },
    { value: NotificationType.SYSTEM, label: 'System' },
    { value: NotificationType.BOOKING, label: 'Booking' },
    { value: NotificationType.MAINTENANCE, label: 'Maintenance' },
    { value: NotificationType.MESSAGE, label: 'Message' },
    { value: NotificationType.ANNOUNCEMENT, label: 'Announcement' },
    { value: NotificationType.OTHER, label: 'Other' }
  ]

  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: NotificationStatus.UNREAD, label: 'Unread' },
    { value: NotificationStatus.READ, label: 'Read' },
    { value: NotificationStatus.ARCHIVED, label: 'Archived' }
  ]

  useEffect(() => {
    fetchNotifications()
    fetchStats()
  }, [currentPage, statusFilter, typeFilter, searchTerm])

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      params.append('page', currentPage.toString())
      params.append('limit', '10')
      
      if (statusFilter !== 'all') params.append('status', statusFilter)
      if (typeFilter !== 'all') params.append('type', typeFilter)
      if (searchTerm) params.append('search', searchTerm)
      
      const response = await fetch(`/api/notifications?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setNotifications(data.notifications || [])
        setTotalPages(data.pagination?.totalPages || 1)
      } else {
        toast.error('Failed to fetch notifications', { title: 'Error' })
      }
    } catch (error) {
      toast.error('Failed to fetch notifications', { title: 'Error' })
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/notifications/stats')
      if (response.ok) {
        const data = await response.json()
        setStats(data.stats || stats)
      }
    } catch (error) {
      console.error('Failed to fetch notification stats:', error)
    }
  }

  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'mark_read' }),
      })

      if (response.ok) {
        setNotifications(prev =>
          prev.map(notification =>
            notification.id === notificationId
              ? { ...notification, status: NotificationStatus.READ }
              : notification
          )
        )
        fetchStats()
        toast.success('Notification marked as read', { title: 'Success' })
      } else {
        toast.error('Failed to mark notification as read', { title: 'Error' })
      }
    } catch (error) {
      toast.error('Failed to mark notification as read', { title: 'Error' })
    }
  }

  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/notifications/mark-all-read', {
        method: 'POST',
      })

      if (response.ok) {
        setNotifications(prev =>
          prev.map(notification => ({
            ...notification,
            status: NotificationStatus.READ,
          }))
        )
        fetchStats()
        toast.success('All notifications marked as read', { title: 'Success' })
      } else {
        toast.error('Failed to mark all notifications as read', { title: 'Error' })
      }
    } catch (error) {
      toast.error('Failed to mark all notifications as read', { title: 'Error' })
    }
  }

  const archiveNotification = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'archive' }),
      })

      if (response.ok) {
        setNotifications(prev =>
          prev.map(notification =>
            notification.id === notificationId
              ? { ...notification, status: NotificationStatus.ARCHIVED }
              : notification
          )
        )
        fetchStats()
        toast.success('Notification archived', { title: 'Success' })
      } else {
        toast.error('Failed to archive notification', { title: 'Error' })
      }
    } catch (error) {
      toast.error('Failed to archive notification', { title: 'Error' })
    }
  }

  const deleteNotification = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setNotifications(prev => prev.filter(n => n.id !== notificationId))
        fetchStats()
        toast.success('Notification deleted', { title: 'Success' })
      } else {
        toast.error('Failed to delete notification', { title: 'Error' })
      }
    } catch (error) {
      toast.error('Failed to delete notification', { title: 'Error' })
    }
  }

  const handleBulkAction = async (action: string) => {
    if (selectedNotifications.length === 0) {
      toast.error('Please select notifications first', { title: 'Error' })
      return
    }

    try {
      const promises = selectedNotifications.map(id => {
        switch (action) {
          case 'mark_read':
            return markAsRead(id)
          case 'archive':
            return archiveNotification(id)
          case 'delete':
            return deleteNotification(id)
          default:
            return Promise.resolve()
        }
      })

      await Promise.all(promises)
      setSelectedNotifications([])
    } catch (error) {
      toast.error('Failed to perform bulk action', { title: 'Error' })
    }
  }

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case NotificationType.SYSTEM:
        return <Settings className="h-4 w-4 text-blue-500" />
      case NotificationType.BOOKING:
        return <Calendar className="h-4 w-4 text-green-500" />
      case NotificationType.MAINTENANCE:
        return <AlertCircle className="h-4 w-4 text-orange-500" />
      case NotificationType.MESSAGE:
        return <User className="h-4 w-4 text-purple-500" />
      case NotificationType.ANNOUNCEMENT:
        return <Info className="h-4 w-4 text-red-500" />
      default:
        return <Bell className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusIcon = (status: NotificationStatus) => {
    switch (status) {
      case NotificationStatus.UNREAD:
        return <Clock className="h-4 w-4 text-blue-500" />
      case NotificationStatus.READ:
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case NotificationStatus.ARCHIVED:
        return <Archive className="h-4 w-4 text-gray-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const formatNotificationTime = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true })
    } catch (error) {
      return 'recently'
    }
  }

  if (loading && notifications.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Notifications</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchNotifications}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          {stats.unread > 0 && (
            <Button onClick={markAllAsRead}>
              <CheckCheck className="h-4 w-4 mr-2" />
              Mark All Read
            </Button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">All notifications</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unread</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.unread}</div>
            <p className="text-xs text-muted-foreground">Need attention</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Read</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.read}</div>
            <p className="text-xs text-muted-foreground">Already viewed</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Archived</CardTitle>
            <Archive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">{stats.archived}</div>
            <p className="text-xs text-muted-foreground">Stored away</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search notifications..."
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
            {statusOptions.map(option => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {notificationTypes.map(type => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Bulk Actions */}
      {selectedNotifications.length > 0 && (
        <div className="flex gap-2 p-4 bg-blue-50 rounded-lg">
          <span className="text-sm font-medium">
            {selectedNotifications.length} selected
          </span>
          <Button size="sm" variant="outline" onClick={() => handleBulkAction('mark_read')}>
            <Check className="h-4 w-4 mr-1" />
            Mark Read
          </Button>
          <Button size="sm" variant="outline" onClick={() => handleBulkAction('archive')}>
            <Archive className="h-4 w-4 mr-1" />
            Archive
          </Button>
          <Button size="sm" variant="outline" onClick={() => handleBulkAction('delete')}>
            <Trash2 className="h-4 w-4 mr-1" />
            Delete
          </Button>
        </div>
      )}

      {/* Notifications List */}
      <Card>
        <CardHeader>
          <CardTitle>Notifications ({notifications.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {notifications.length === 0 ? (
            <div className="text-center py-8">
              <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications found</h3>
              <p className="text-gray-500">
                {searchTerm || statusFilter !== 'all' || typeFilter !== 'all'
                  ? 'Try adjusting your search or filters'
                  : 'You have no notifications at the moment'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 border rounded-lg transition-colors ${
                    notification.status === NotificationStatus.UNREAD
                      ? 'bg-blue-50 border-blue-200'
                      : 'bg-white border-gray-200'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <input
                      type="checkbox"
                      checked={selectedNotifications.includes(notification.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedNotifications(prev => [...prev, notification.id])
                        } else {
                          setSelectedNotifications(prev => prev.filter(id => id !== notification.id))
                        }
                      }}
                      className="mt-1"
                    />
                    
                    <div className="mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-medium text-gray-900">{notification.title}</h4>
                          <p className="text-sm text-gray-600 mt-1">{notification.content}</p>
                          {notification.senderName && (
                            <p className="text-xs text-gray-500 mt-1">
                              From: {notification.senderName}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          <div className="flex items-center gap-1">
                            {getStatusIcon(notification.status)}
                            <Badge variant="outline" className="text-xs">
                              {notification.type}
                            </Badge>
                          </div>
                          <span className="text-xs text-gray-500">
                            {formatNotificationTime(notification.createdAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-1">
                      {notification.status === NotificationStatus.UNREAD && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => markAsRead(notification.id)}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => archiveNotification(notification.id)}
                      >
                        <Archive className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteNotification(notification.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
          >
            Previous
          </Button>
          <span className="flex items-center px-4">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  )
}