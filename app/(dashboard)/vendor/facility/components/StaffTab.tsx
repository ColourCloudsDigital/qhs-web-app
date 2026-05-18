"use client";

import React, { useState, useEffect } from 'react';
import { Check, Trash2, Edit2, UserX, UserCheck, RefreshCw } from 'lucide-react';
import Pagination, { PaginationInfo } from '@/components/ui/pagination';
import CreateStaffModal from '@/components/CreateStaffModal';
import toast from '@/lib/toast';

interface User {
  id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  email: string;
  position: string;
  permissions: string[];
  isActive: boolean;
  userId: string;
  vendorId: string;
  hotelId?: string;
  hotelName?: string;
  vendorName?: string;
  createdAt: string;
}

interface StaffTabProps {
  hotelId: string;
  vendorId?: string;
}

const statusOptions = ['All', 'Active', 'Inactive'];

function ConfirmModal({ open, onClose, onConfirm, title, description, confirmText, loading }: any) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-sm">
        <h2 className="text-lg font-semibold mb-2">{title}</h2>
        <p className="mb-4 text-gray-600">{description}</p>
        <div className="flex justify-end space-x-2">
          <button onClick={onClose} className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300">Cancel</button>
          <button onClick={onConfirm} disabled={loading} className="px-4 py-2 rounded bg-primary text-white hover:bg-primary-dark disabled:opacity-50">
            {loading ? 'Processing...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

function EditStaffModal({ open, onClose, staff, onSave, loading, vendorId }: any) {
  const [position, setPosition] = useState('');
  const [permissions, setPermissions] = useState<string[]>([]);
  const [hotelId, setHotelId] = useState('');
  const [hotels, setHotels] = useState<{id: string, name: string}[]>([]);
  const [loadingHotels, setLoadingHotels] = useState(false);
  
  const availablePermissions = [
    { id: 'bookings', label: 'Manage Bookings' },
    { id: 'rooms', label: 'Manage Rooms' },
    { id: 'customers', label: 'Manage Customers' },
    { id: 'payments', label: 'Process Payments' },
    { id: 'settings', label: 'Modify Settings' },
    { id: 'staff', label: 'Manage Staff' },
    { id: 'tasks', label: 'Manage Tasks' },
    { id: 'pos', label: 'Manage Orders (POS)' },
  ];

  // Fetch hotels when modal opens
  useEffect(() => {
    if (open && vendorId) {
      const fetchHotels = async () => {
        setLoadingHotels(true);
        try {
          const response = await fetch(`/api/vendor/${vendorId}/hotels`);
          if (response.ok) {
            const data = await response.json();
            setHotels(data.hotels || []);
          } else {
            console.error('Failed to fetch hotels');
          }
        } catch (error) {
          console.error('Error fetching hotels:', error);
        } finally {
          setLoadingHotels(false);
        }
      };

      fetchHotels();
    }
  }, [open, vendorId]);

  useEffect(() => {
    if (staff) {
      setPosition(staff.position || '');
      setPermissions(staff.permissions || []);
      setHotelId(staff.hotelId || '');
    }
  }, [staff]);

  const handlePermissionChange = (permission: string, checked: boolean) => {
    if (checked) {
      setPermissions(prev => [...prev, permission]);
    } else {
      setPermissions(prev => prev.filter(p => p !== permission));
    }
  };

  if (!open || !staff) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-lg max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Edit Staff Member</h2>
          <div className="text-sm text-gray-500">
            {staff.name} ({staff.email})
          </div>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Position</label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              value={position}
              onChange={e => setPosition(e.target.value)}
              placeholder="e.g., Front Desk Manager, Housekeeper"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Assigned Hotel</label>
            {loadingHotels ? (
              <div className="flex items-center space-x-2 p-3 border border-gray-300 rounded-md bg-gray-50">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                <span className="text-sm text-gray-500">Loading hotels...</span>
              </div>
            ) : (
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                value={hotelId}
                onChange={e => setHotelId(e.target.value)}
              >
                <option value="">Not Assigned</option>
                {hotels.map((hotel) => (
                  <option key={hotel.id} value={hotel.id}>
                    {hotel.name}
                  </option>
                ))}
              </select>
            )}
            <p className="text-xs text-gray-500 mt-1">
              Staff can be assigned to a specific hotel or left unassigned to work across all hotels
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Permissions</label>
            <div className="border border-gray-300 rounded-md p-3 bg-gray-50">
              <div className="grid gap-2 sm:grid-cols-2">
                {availablePermissions.map((perm) => (
                  <div key={perm.id} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={`edit-perm-${perm.id}`}
                      checked={permissions.includes(perm.id)}
                      onChange={(e) => handlePermissionChange(perm.id, e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <label htmlFor={`edit-perm-${perm.id}`} className="text-sm">
                      {perm.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Select the permissions this staff member should have
            </p>
          </div>
        </div>

        <div className="flex justify-end space-x-2 mt-6 pt-4 border-t border-gray-200">
          <button 
            onClick={onClose} 
            className="px-4 py-2 rounded-md bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={() => onSave({ position, permissions, hotelId: hotelId || null })}
            disabled={loading || !position.trim()}
            className="px-4 py-2 rounded-md bg-primary text-white hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Saving...</span>
              </div>
            ) : (
              'Save Changes'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function StaffTab({ hotelId, vendorId }: StaffTabProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10); // Remove setPageSize since it's not used
  const [totalItems, setTotalItems] = useState(0);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{ open: boolean; action: string; ids: string[]; single: boolean }>({ open: false, action: '', ids: [], single: false });
  const [actionLoading, setActionLoading] = useState(false);
  const [editModal, setEditModal] = useState<{ open: boolean; staff: any }>({ open: false, staff: null });
  const [editLoading, setEditLoading] = useState(false);

  const fetchStaff = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
        status: selectedStatus.toLowerCase(),
      });

      // Prioritize vendorId over hotelId for broader staff view
      if (vendorId) {
        params.append('vendorId', vendorId);
      } else if (hotelId) {
        params.append('hotelId', hotelId);
      } else {
        throw new Error('Either vendor ID or hotel ID is required');
      }

      console.log('Fetching staff with params:', params.toString());
      const response = await fetch(`/api/staff?${params.toString()}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch staff');
      }
      
      const data = await response.json();
      console.log('Staff data received:', data);
      setUsers(data.data || []);
      setTotalItems(data.pagination?.totalItems || 0);
    } catch (err: any) {
      console.error('Error fetching staff:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (hotelId || vendorId) {
      fetchStaff();
    }
  }, [hotelId, vendorId, page, pageSize, selectedStatus]);

  const totalPages = Math.ceil(totalItems / pageSize) || 1;

  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedIds([]);
    } else {
      setSelectedIds(users.map(u => u.id));
    }
    setSelectAll(!selectAll);
  };

  const toggleSelectUser = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(selectedId => selectedId !== id));
      setSelectAll(false);
    } else {
      setSelectedIds([...selectedIds, id]);
      if (selectedIds.length + 1 === users.length) {
        setSelectAll(true);
      }
    }
  };

  const handleBulkAction = (action: 'activate' | 'deactivate' | 'delete') => {
    setConfirmModal({ open: true, action, ids: selectedIds, single: false });
  };

  const handleSingleAction = (action: 'activate' | 'deactivate' | 'delete', userId: string) => {
    setConfirmModal({ open: true, action, ids: [userId], single: true });
  };

  const doAction = async () => {
    setActionLoading(true);
    const { action, ids, single } = confirmModal;
    try {
      if (single && ids.length === 1) {
        const userId = ids[0];
        let method = 'PUT';
        let url = `/api/staff/${userId}`;
        if (action === 'delete') method = 'DELETE';
        if (action === 'deactivate') method = 'PATCH';
        const res = await fetch(url, { method });
        if (!res.ok) throw new Error((await res.json()).error || 'Action failed');
      } else {
        const res = await fetch(`/api/staff`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action, ids }),
        });
        if (!res.ok) throw new Error((await res.json()).error || 'Action failed');
      }

      const actionLabel =
        action === 'delete' ? 'deleted' :
        action === 'activate' ? 'activated' : 'deactivated';
      const count = ids.length;
      toast.success(`${count} staff member${count > 1 ? 's' : ''} ${actionLabel} successfully.`);

      setConfirmModal({ open: false, action: '', ids: [], single: false });
      setSelectedIds([]);
      setSelectAll(false);
      fetchStaff();
    } catch (err: any) {
      toast.error(err.message || 'Action failed. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditStaff = (staff: any) => {
    setEditModal({ open: true, staff });
  };

  const saveEditStaff = async (updateData: { position: string; permissions: string[]; hotelId: string | null }) => {
    setEditLoading(true);
    try {
      const res = await fetch(`/api/staff/${editModal.staff.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Failed to update staff member');
      toast.success('Staff member updated successfully.');
      setEditModal({ open: false, staff: null });
      fetchStaff();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update staff member.');
    } finally {
      setEditLoading(false);
    }
  };

  const handleCreateSuccess = () => {
    toast.success('Staff member added successfully.');
    fetchStaff();
  };

  return (
    <div className="space-y-4">
      {/* Debug info - remove in production */}
      {/* {process.env.NODE_ENV === 'development' && (
        <div className="bg-gray-100 p-2 rounded text-xs">
          <strong>Debug:</strong> vendorId={vendorId}, hotelId={hotelId}, totalItems={totalItems}
        </div>
      )} */}
      
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0 rounded-lg bg-white p-4 shadow dark:bg-gray-800">
        <div className="flex w-full sm:w-auto justify-start">
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center rounded-md border border-primary bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary dark:bg-primary dark:hover:bg-primary-dark"
          >
            + Add Staff
          </button>
        </div>
        <div className="flex w-full sm:w-auto flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-2 sm:space-y-0 justify-end">
           {selectedIds.length > 0 && (
              <div className="flex items-center space-x-2 ml-2">
                <button
                  onClick={() => handleBulkAction('activate')}
                  className="inline-flex items-center rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-xs font-medium text-green-700 shadow-sm hover:bg-green-50 focus:outline-none focus:ring-2 focus:ring-green-500 dark:border-green-700 dark:bg-green-900 dark:text-green-100 dark:hover:bg-green-800"
                  title="Activate"
                  aria-label="Activate"
                >
                  <UserCheck className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => handleBulkAction('deactivate')}
                  className="inline-flex items-center rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-xs font-medium text-yellow-700 shadow-sm hover:bg-yellow-50 focus:outline-none focus:ring-2 focus:ring-yellow-500 dark:border-yellow-700 dark:bg-yellow-900 dark:text-yellow-100 dark:hover:bg-yellow-800"
                  title="Deactivate"
                  aria-label="Deactivate"
                >
                  <UserX className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => handleBulkAction('delete')}
                  className="inline-flex items-center rounded-md border border-red-300 bg-white px-2.5 py-1.5 text-xs font-medium text-red-700 shadow-sm hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 dark:border-red-700 dark:bg-red-900 dark:text-red-100 dark:hover:bg-red-800"
                  title="Delete"
                  aria-label="Delete"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          <button
            onClick={fetchStaff}
            disabled={isLoading}
            className="p-2 rounded-md border border-gray-300 bg-white text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            aria-label="Refresh staff list"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <div className="flex flex-row space-x-4 items-center">
            <div className="flex items-center space-x-2">
              <span className="text-gray-500">Status:</span>
              <select
                value={selectedStatus}
                onChange={e => setSelectedStatus(e.target.value)}
                className="block rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              >
                {statusOptions.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      <CreateStaffModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        vendorId={vendorId || ''}
        onSuccess={handleCreateSuccess}
      />

      <div className="rounded-lg bg-white shadow dark:bg-gray-800">
        <div className="overflow-x-auto">
          <table className="w-full table-auto">
            <thead className="bg-gray-50 text-xs uppercase text-gray-700 dark:bg-gray-700 dark:text-gray-300">
              <tr>
                <th className="w-10 px-4 py-3">
                  <input type="checkbox" checked={selectAll} onChange={toggleSelectAll} className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary dark:border-gray-600 dark:focus:ring-primary-dark" />
                </th>
                <th className="px-4 py-3 text-left">Name</th>
                <th className="px-4 py-3 text-left">Email</th>
                <th className="px-4 py-3 text-left">Position</th>
                <th className="px-4 py-3 text-left">Hotel</th>
                <th className="px-4 py-3 text-left">Permissions</th>
                <th className="px-4 py-3 text-left">Active</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-6 text-center text-gray-500 dark:text-gray-400">
                    Loading staff...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={8} className="px-4 py-6 text-center text-red-500">
                    Error: {error}
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-6 text-center text-gray-500 dark:text-gray-400">
                    <div className="space-y-2">
                      <p>No staff found.</p>
                      {vendorId && (
                        <p className="text-sm">
                          Searching for staff in vendor: {vendorId}
                          {hotelId && ` and hotel: ${hotelId}`}
                        </p>
                      )}
                      <button
                        onClick={() => setShowCreateModal(true)}
                        className="text-primary hover:text-primary-dark text-sm underline"
                      >
                        Add your first staff member
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-4 py-4">
                      <input type="checkbox" checked={selectedIds.includes(user.id)} onChange={() => toggleSelectUser(user.id)} className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary dark:border-gray-600 dark:focus:ring-primary-dark" />
                    </td>
                    <td className="px-4 py-4 font-medium">{user.name}</td>
                    <td className="px-4 py-4">{user.email}</td>
                    <td className="px-4 py-4">{user.position}</td>
                    <td className="px-4 py-4">{user.hotelName || 'Not Assigned'}</td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-1">
                        {user.permissions.length > 0 ? (
                          user.permissions.slice(0, 2).map((perm) => (
                            <span key={perm} className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                              {perm}
                            </span>
                          ))
                        ) : (
                          <span className="text-gray-500 text-xs">No permissions</span>
                        )}
                        {user.permissions.length > 2 && (
                          <span className="text-xs text-gray-500">+{user.permissions.length - 2} more</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      {user.isActive ? (
                        <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900 dark:text-green-200">
                          <Check className="mr-1 h-3 w-3" /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800 dark:bg-red-900 dark:text-red-200">
                          <UserX className="mr-1 h-3 w-3" /> Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button onClick={() => handleEditStaff(user)} className="rounded p-1 text-blue-500 hover:bg-blue-50 hover:text-blue-700 dark:text-blue-400 dark:hover:bg-blue-900/20 dark:hover:text-blue-300">
                          <Edit2 className="h-4 w-4" />
                        </button>
                        {user.isActive ? (
                          <button onClick={() => handleSingleAction('deactivate', user.id)} className="rounded p-1 text-yellow-500 hover:bg-yellow-50 hover:text-yellow-700 dark:text-yellow-400 dark:hover:bg-yellow-900/20 dark:hover:text-yellow-300">
                            <UserX className="h-4 w-4" />
                          </button>
                        ) : (
                          <button onClick={() => handleSingleAction('activate', user.id)} className="rounded p-1 text-green-500 hover:bg-green-50 hover:text-green-700 dark:text-green-400 dark:hover:bg-green-900/20 dark:hover:text-green-300">
                            <UserCheck className="h-4 w-4" />
                          </button>
                        )}
                        <button onClick={() => handleSingleAction('delete', user.id)} className="rounded p-1 text-red-500 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-900/20 dark:hover:text-red-300">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 p-4 border-t border-gray-100 dark:border-gray-700">
          <PaginationInfo
            currentPage={page}
            pageSize={pageSize}
            totalItems={totalItems}
          />
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </div>
      </div>
      <ConfirmModal
        open={confirmModal.open}
        onClose={() => setConfirmModal({ open: false, action: '', ids: [], single: false })}
        onConfirm={doAction}
        title={
          confirmModal.action === 'delete'
            ? `Delete ${confirmModal.single ? 'Staff' : 'Staff Accounts'}`
            : confirmModal.action === 'activate'
            ? `Activate ${confirmModal.single ? 'Staff' : 'Staff Accounts'}`
            : `Deactivate ${confirmModal.single ? 'Staff' : 'Staff Accounts'}`
        }
        description={
          confirmModal.action === 'delete'
            ? `Are you sure you want to delete ${confirmModal.single ? 'this staff account' : 'these staff accounts'}? This action cannot be undone.`
            : confirmModal.action === 'activate'
            ? `Are you sure you want to activate ${confirmModal.single ? 'this staff account' : 'these staff accounts'}?`
            : `Are you sure you want to deactivate ${confirmModal.single ? 'this staff account' : 'these staff accounts'}?`
        }
        confirmText={
          confirmModal.action === 'delete'
            ? 'Delete'
            : confirmModal.action === 'activate'
            ? 'Activate'
            : 'Deactivate'
        }
        loading={actionLoading}
      />
      <EditStaffModal
        open={editModal.open}
        onClose={() => setEditModal({ open: false, staff: null })}
        staff={editModal.staff}
        onSave={saveEditStaff}
        loading={editLoading}
        vendorId={vendorId}
      />
    </div>
  );
}
