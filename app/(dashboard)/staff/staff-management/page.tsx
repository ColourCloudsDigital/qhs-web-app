import { Metadata } from 'next'
import { StaffManagementClient } from './components/StaffManagementClient'

export const metadata: Metadata = {
  title: 'Staff Management',
  description: 'Manage hotel staff, assign tasks, and monitor performance',
}

export default function StaffManagementPage() {
  return <StaffManagementClient />
}