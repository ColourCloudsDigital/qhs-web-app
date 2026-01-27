import { Metadata } from 'next'
import { StaffRoomsClient } from './components/StaffRoomsClient'

export const metadata: Metadata = {
  title: 'Rooms Management | Staff Dashboard',
  description: 'Manage hotel rooms and availability',
}

export default function StaffRoomsPage() {
  return <StaffRoomsClient />
}