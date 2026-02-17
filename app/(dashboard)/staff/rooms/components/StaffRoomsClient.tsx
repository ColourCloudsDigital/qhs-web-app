'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Search, 
  Filter, 
  Eye, 
  Edit, 
  Bed, 
  Users, 
  DollarSign,
  Calendar,
  MapPin,
  Phone,
  Mail,
  User,
  Clock
} from 'lucide-react'
import toast from '@/lib/services/toast.service'
import { useRouter } from 'next/navigation'

interface Room {
  id: string
  name: string
  type: string
  description: string
  capacity: number
  pricePerNight: number
  discountedPrice?: number
  status: string
  images: string[]
  availableUnits: number
  totalUnits: number
  occupiedUnits: RoomUnit[]
}

interface RoomUnit {
  id: string
  roomId: string
  roomNumber: string
  status: 'available' | 'occupied' | 'maintenance' | 'reserved' | 'cleaning'
  currentBookingId?: string
  lastCleanedAt?: string
  notes?: string
  booking?: {
    id: string
    customerId: string
    customerName: string
    checkInDate: string
    checkOutDate: string
    status: string
  }
}

export function StaffRoomsClient() {
  const router = useRouter()
  const [rooms, setRooms] = useState<Room[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [selectedRoomUnit, setSelectedRoomUnit] = useState<string | null>(null)
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null)

  useEffect(() => {
    fetchRooms()
    setSelectedRoomUnit(null) // Reset selected room unit when date changes
  }, [selectedDate])

  const fetchRooms = async () => {
    try {
      const response = await fetch(`/api/staff/rooms?date=${selectedDate}`)
      if (response.ok) {
        const data = await response.json()
        setRooms(data.rooms || [])
      }
    } catch (error) {
      toast.error('Failed to fetch rooms', {
        title: 'Error'
      })
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'occupied':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'maintenance':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'reserved':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'cleaning':
        return 'bg-purple-100 text-purple-800 border-purple-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const handleBookRoom = (room: Room, roomUnitId?: string) => {
    // Navigate to booking form with room pre-selected
    const params = new URLSearchParams({
      roomId: room.id,
      date: selectedDate
    })
    
    if (roomUnitId) {
      params.append('roomUnitId', roomUnitId)
    }
    
    router.push(`/staff/bookings/new?${params.toString()}`)
  }

  const updateRoomUnitStatus = async (unitId: string, newStatus: 'available' | 'maintenance' | 'cleaning') => {
    setUpdatingStatus(unitId)
    try {
      const response = await fetch(`/api/staff/room-units/${unitId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      })

      if (response.ok) {
        toast.success(`Room unit status updated to ${newStatus}`, {
          title: 'Success'
        })
        // Refresh the rooms data
        fetchRooms()
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || 'Failed to update room unit status', {
          title: 'Error'
        })
      }
    } catch (error) {
      console.error('Error updating room unit status:', error)
      toast.error('Failed to update room unit status', {
        title: 'Error'
      })
    } finally {
      setUpdatingStatus(null)
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
        <h1 className="text-3xl font-bold">Rooms Management</h1>
        <div className="flex gap-2">
          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-auto"
          />
        </div>
      </div>

      <Tabs defaultValue="all-rooms" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all-rooms">All Rooms</TabsTrigger>
          <TabsTrigger value="available-rooms">Available Rooms</TabsTrigger>
        </TabsList>

        <TabsContent value="all-rooms" className="space-y-4">
          <div className="grid gap-4">
            {rooms.map((room) => (
              <Card key={room.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-semibold">{room.name}</h3>
                        <Badge variant="outline">{room.type}</Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          <span>Capacity: {room.capacity}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-4 w-4" />
                          <span>₦{room.pricePerNight.toLocaleString()}/night</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Bed className="h-4 w-4" />
                          <span>{room.availableUnits}/{room.totalUnits} available</span>
                        </div>
                      </div>
                      {room.description && (
                        <p className="text-sm text-gray-600 mb-3">{room.description}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setSelectedRoom(room)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View Details
                      </Button>
                      {room.availableUnits > 0 && (
                        <Button 
                          size="sm"
                          onClick={() => handleBookRoom(room)}
                        >
                          Book Room
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Room Units Status */}
                  <div className="border-t pt-4">
                    <h4 className="font-medium mb-2">Room Units Status ({new Date(selectedDate).toLocaleDateString()}):</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
                      {room.occupiedUnits.map((unit) => (
                        <div key={unit.id} className="text-center">
                          {unit.status === 'available' ? (
                            <button
                              onClick={() => handleBookRoom(room, unit.id)}
                              className={`w-full p-2 rounded text-xs font-medium transition-colors cursor-pointer ${getStatusColor(unit.status)} hover:opacity-80 border border-transparent hover:border-green-300`}
                              title={`Click to book Room ${unit.roomNumber}`}
                            >
                              {unit.roomNumber}
                            </button>
                          ) : (
                            <div className={`p-2 rounded text-xs font-medium ${getStatusColor(unit.status)}`}>
                              {unit.roomNumber}
                            </div>
                          )}
                          {unit.booking && (
                            <div className="text-xs text-gray-500 mt-1">
                              {unit.booking.customerName}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    {room.occupiedUnits.filter(unit => unit.status === 'available').length > 0 && (
                      <p className="text-xs text-green-700 mt-2">
                        Click on green room numbers to book that specific unit
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="available-rooms" className="space-y-4">
          <div className="grid gap-4">
            {rooms.filter(room => room.availableUnits > 0).map((room) => (
              <Card key={room.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-semibold">{room.name}</h3>
                        <Badge variant="outline">{room.type}</Badge>
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          {room.availableUnits} Available
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          <span>Capacity: {room.capacity}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-4 w-4" />
                          <span>₦{room.pricePerNight.toLocaleString()}/night</span>
                          {room.discountedPrice && (
                            <span className="text-green-600 font-medium">
                              (₦{room.discountedPrice.toLocaleString()})
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <Bed className="h-4 w-4" />
                          <span>{room.availableUnits}/{room.totalUnits} available</span>
                        </div>
                      </div>
                      {room.description && (
                        <p className="text-sm text-gray-600 mb-3">{room.description}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setSelectedRoom(room)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View Details
                      </Button>
                      <Button 
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => handleBookRoom(room)}
                      >
                        Book Room
                      </Button>
                    </div>
                  </div>

                  {/* Available Room Units Status */}
                  <div className="border-t pt-4">
                    <h4 className="font-medium mb-2">Available Units ({new Date(selectedDate).toLocaleDateString()}):</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
                      {room.occupiedUnits
                        .filter(unit => unit.status === 'available')
                        .map((unit) => (
                          <button
                            key={unit.id}
                            onClick={() => handleBookRoom(room, unit.id)}
                            className="p-2 rounded text-xs font-medium bg-green-100 text-green-800 hover:bg-green-200 transition-colors cursor-pointer border border-transparent hover:border-green-300"
                            title={`Click to book Room ${unit.roomNumber}`}
                          >
                            {unit.roomNumber}
                          </button>
                        ))}
                    </div>
                    <p className="text-xs text-green-700 mt-2">
                      Click on any room number to book that specific unit
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          {rooms.filter(room => room.availableUnits > 0).length === 0 && (
            <div className="text-center py-12">
              <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <Bed className="h-12 w-12 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Available Rooms</h3>
              <p className="text-gray-500 mb-4">
                All rooms are currently occupied for {new Date(selectedDate).toLocaleDateString()}.
              </p>
              <Button 
                variant="outline"
                onClick={() => {
                  const tomorrow = new Date(selectedDate)
                  tomorrow.setDate(tomorrow.getDate() + 1)
                  setSelectedDate(tomorrow.toISOString().split('T')[0])
                }}
              >
                <Calendar className="h-4 w-4 mr-2" />
                Check Next Day
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Room Detail Modal */}
      {selectedRoom && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Room Details - {selectedRoom.name}</CardTitle>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setSelectedRoom(null)
                    setSelectedRoomUnit(null)
                  }}
                >
                  Close
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <h3 className="font-medium mb-3">Room Information</h3>
                  <div className="space-y-2 text-sm">
                    <div><span className="font-medium">Type:</span> {selectedRoom.type}</div>
                    <div><span className="font-medium">Capacity:</span> {selectedRoom.capacity} guests</div>
                    <div><span className="font-medium">Price:</span> ₦{selectedRoom.pricePerNight.toLocaleString()}/night</div>
                    {selectedRoom.discountedPrice && (
                      <div><span className="font-medium">Discounted Price:</span> ₦{selectedRoom.discountedPrice.toLocaleString()}/night</div>
                    )}
                    <div><span className="font-medium">Available Units:</span> {selectedRoom.availableUnits}/{selectedRoom.totalUnits}</div>
                  </div>
                </div>
                <div>
                  <h3 className="font-medium mb-3">Description</h3>
                  <p className="text-sm text-gray-600">{selectedRoom.description}</p>
                </div>
              </div>

              <div>
                <h3 className="font-medium mb-3">Room Units ({new Date(selectedDate).toLocaleDateString()})</h3>
                <div className="grid gap-3">
                  {selectedRoom.occupiedUnits.map((unit) => (
                    <div 
                      key={unit.id} 
                      className={`flex items-center justify-between p-3 border rounded-lg transition-colors ${
                        unit.status === 'available' 
                          ? selectedRoomUnit === unit.id 
                            ? 'border-blue-500 bg-blue-50' 
                            : 'hover:border-green-500 hover:bg-green-50 cursor-pointer'
                          : ''
                      }`}
                      onClick={() => {
                        if (unit.status === 'available') {
                          setSelectedRoomUnit(selectedRoomUnit === unit.id ? null : unit.id)
                        }
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <div className="font-medium">Room {unit.roomNumber}</div>
                        <Badge className={getStatusColor(unit.status)}>
                          {unit.status}
                        </Badge>
                        {unit.status === 'available' && selectedRoomUnit === unit.id && (
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                            Selected
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        {/* Status Toggle - Only show for units without active bookings */}
                        {!unit.booking && (
                          <div className="flex items-center gap-2">
                            <Select
                              value={unit.status === 'occupied' || unit.status === 'reserved' ? 'available' : unit.status}
                              onValueChange={(newStatus) => {
                                if (newStatus === 'available' || newStatus === 'maintenance' || newStatus === 'cleaning') {
                                  updateRoomUnitStatus(unit.id, newStatus)
                                }
                              }}
                              disabled={updatingStatus === unit.id || unit.status === 'occupied' || unit.status === 'reserved'}
                            >
                              <SelectTrigger className="w-32 h-8 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="available">Available</SelectItem>
                                <SelectItem value="maintenance">Maintenance</SelectItem>
                                <SelectItem value="cleaning">Cleaning</SelectItem>
                              </SelectContent>
                            </Select>
                            {updatingStatus === unit.id && (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                            )}
                          </div>
                        )}
                        
                        {/* Show booking info for occupied/reserved units */}
                        {unit.booking && (
                          <div className="text-right">
                            <div className="font-medium">{unit.booking.customerName}</div>
                            <div className="text-gray-500">
                              {new Date(unit.booking.checkInDate).toLocaleDateString()} - {new Date(unit.booking.checkOutDate).toLocaleDateString()}
                            </div>
                            <div className="text-xs text-gray-400 mt-1">
                              Status controlled by booking
                            </div>
                          </div>
                        )}
                        {unit.lastCleanedAt && (
                          <div className="text-gray-500">
                            <Clock className="h-4 w-4 inline mr-1" />
                            Cleaned: {new Date(unit.lastCleanedAt).toLocaleDateString()}
                          </div>
                        )}
                        {unit.status === 'available' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleBookRoom(selectedRoom, unit.id)
                            }}
                          >
                            Book Unit
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                
                {selectedRoom.occupiedUnits.filter(unit => unit.status === 'available').length > 0 && (
                  <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-800 mb-2">
                      <strong>Available Units:</strong> Click on any available room unit above to select it, then click "Book Selected Unit" to proceed with booking.
                    </p>
                    {selectedRoomUnit && (
                      <p className="text-sm text-blue-800">
                        <strong>Selected:</strong> Room {selectedRoom.occupiedUnits.find(u => u.id === selectedRoomUnit)?.roomNumber}
                      </p>
                    )}
                  </div>
                )}
                
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Status Management:</strong> Use the dropdown menus to change room unit status between Available, Maintenance, and Cleaning. 
                    Occupied/Reserved status is automatically determined by active bookings and cannot be manually changed.
                  </p>
                </div>
              </div>

              <div className="flex gap-2 pt-4 border-t">
                {selectedRoom.availableUnits > 0 && (
                  <>
                    <Button 
                      onClick={() => handleBookRoom(selectedRoom)}
                      variant="outline"
                    >
                      Book Any Available Unit
                    </Button>
                    {selectedRoomUnit && (
                      <Button 
                        onClick={() => handleBookRoom(selectedRoom, selectedRoomUnit)}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        Book Selected Unit (Room {selectedRoom.occupiedUnits.find(u => u.id === selectedRoomUnit)?.roomNumber})
                      </Button>
                    )}
                  </>
                )}
                <Button variant="outline">
                  Edit Room
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}