``# Staff Permissions System

## Overview

The staff dashboard now includes a permission-based navigation system that dynamically shows/hides menu items based on the staff member's assigned permissions. The permissions information is displayed in the staff profile page for easy reference.

## Implementation

### 1. Staff Permissions Context (`contexts/StaffPermissionsContext.tsx`)

- Fetches staff data and permissions from the API using the `staffId` from the session
- Provides a `hasPermission(permission: string)` function to check permissions
- Automatically refetches data when the session changes

### 2. Staff Sidebar (`components/dashboard/StaffSidebar.tsx`)

- Specialized sidebar component for staff users
- Uses the permissions context to dynamically generate menu items
- Shows loading and error states while fetching permissions
- Only displays menu items for which the staff member has permissions

### 3. Staff Layout (`app/(dashboard)/staff/layout.tsx`)

- Updated to use `StaffPermissionsProvider` and `StaffSidebar`
- Provides permission context to all staff pages
- Handles authentication and role checking

### 4. Staff Profile Page (`app/(dashboard)/staff/profile/page.tsx`)

- Comprehensive profile management page
- Displays permissions information with visual indicators
- Allows editing of basic profile information
- Includes password change functionality
- Shows account status and quick stats

### 5. Dashboard Utils (`lib/dashboard-utils.ts`)

- Added `getStaffMenuItems(permissions: string[])` function
- Generates menu items based on available permissions
- Supports expandable menu sections with child items

## Available Permissions

The system supports the following permissions:

- **bookings**: Access to booking management (view, create, edit bookings)
- **rooms**: Access to room management (view rooms, check availability)
- **customers**: Access to customer management (view, create, edit customers)
- **payments**: Access to payment processing (view, process payments)
- **reports**: Access to reports (booking, revenue, occupancy reports)
- **settings**: Access to settings (hotel settings, general settings)
- **staff**: Access to staff management (manage other staff members)
- **tasks**: Access to task management (view, manage assigned tasks)

## Menu Structure by Permission

### Dashboard
- Always available to all staff members

### Tasks (`tasks` permission)
- My Tasks
  - All Tasks

### Bookings (`bookings` permission)
- Bookings
  - All Bookings
  - New Booking

### Rooms (`rooms` permission)
- Rooms
  - All Rooms
  - Available Rooms

### Customers (`customers` permission)
- Customers
  - All Customers
  - Add Customer

### Payments (`payments` permission)
- Payments
  - All Payments
  - Process Payment

### Reports (`reports` permission)
- Reports
  - Booking Reports
  - Revenue Reports
  - Occupancy Reports

### Staff Management (`staff` permission)
- Staff Management
  - All Staff
  - Add Staff

### Settings (`settings` permission)
- Settings
  - General
  - Hotel Settings
  - Notifications

### Profile
- Always available to all staff members

## Usage

### For Staff Members
1. Log in to the staff dashboard
2. The sidebar will automatically show only the menu items you have permission to access
3. The dashboard displays your current permissions for reference

### For Administrators
1. Go to the vendor facility management section
2. Edit a staff member's permissions in the Staff & Roles tab
3. The staff member's sidebar will update automatically on their next login or page refresh

## Testing

The staff dashboard includes a "Your Permissions" section that shows:
- Visual indicators for each permission (green = granted, gray = not granted)
- Staff member's position and assigned hotel
- List of active permissions

## API Integration

The system integrates with existing APIs:
- `GET /api/staff/[id]` - Fetches detailed staff information including permissions
- Staff permissions are stored as JSON array in the `staff.permissions` database column
- Session includes `staffId` for direct API access

## Future Enhancements

1. **Page-level Protection**: Add permission checks to individual pages
2. **Component-level Protection**: Create permission wrapper components
3. **Dynamic Permission Updates**: Real-time permission updates without page refresh
4. **Permission Groups**: Create permission groups for easier management
5. **Audit Logging**: Track permission changes and access attempts