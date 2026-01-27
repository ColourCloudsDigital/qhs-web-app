"use client";

import React, { useState } from 'react';
import { Search, Filter, Edit2, Trash2, UserCheck, UserX } from 'lucide-react';
import Pagination, { PaginationInfo } from '@/components/ui/pagination';

// Mock permissions data
const mockPermissions = [
  { id: '1', name: 'Manage Bookings', key: 'bookings', description: 'Can manage bookings', module: 'Bookings' },
  { id: '2', name: 'Manage Rooms', key: 'rooms', description: 'Can manage rooms', module: 'Rooms' },
  { id: '3', name: 'View Reports', key: 'reports', description: 'Can view reports', module: 'Reports' },
  { id: '4', name: 'Modify Settings', key: 'settings', description: 'Can modify settings', module: 'Settings' },
  { id: '5', name: 'Manage Staff', key: 'staff', description: 'Can manage staff', module: 'Staff' },
  { id: '6', name: 'View Logs', key: 'logs', description: 'Can view system logs', module: 'Reports' },
  { id: '7', name: 'Export Data', key: 'export', description: 'Can export data', module: 'Reports' },
];

const modules = ['All', 'Bookings', 'Rooms', 'Reports', 'Settings', 'Staff'];

export default function PermissionsTab() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedModule, setSelectedModule] = useState('All');
  const [page, setPage] = useState(1);
  const pageSize = 4;
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);

  const filteredPermissions = mockPermissions.filter(permission => {
    const matchesModule = selectedModule === 'All' || permission.module === selectedModule;
    const matchesSearch =
      permission.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      permission.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
      permission.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      permission.module.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesModule && matchesSearch;
  });

  const totalPages = Math.ceil(filteredPermissions.length / pageSize) || 1;
  const paginatedPermissions = filteredPermissions.slice((page - 1) * pageSize, page * pageSize);

  // Reset to page 1 when search/module changes
  React.useEffect(() => { setPage(1); }, [searchTerm, selectedModule]);

  // Select all logic
  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedIds([]);
    } else {
      setSelectedIds(paginatedPermissions.map(p => p.id));
    }
    setSelectAll(!selectAll);
  };

  // Select one row
  const toggleSelectPermission = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(selectedId => selectedId !== id));
      setSelectAll(false);
    } else {
      const newSelected = [...selectedIds, id];
      setSelectedIds(newSelected);
      if (newSelected.length === paginatedPermissions.length) {
        setSelectAll(true);
      }
    }
  };

  // Bulk actions (stub)
  const handleBulkAction = (action: 'activate' | 'deactivate' | 'delete') => {
    alert(`Bulk action: ${action} on permissions: ${selectedIds.join(', ')}`);
    setSelectedIds([]);
    setSelectAll(false);
  };

  return (
    <div className="space-y-4">
      {/* Search, Filter, and Bulk Actions Box */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 rounded-lg bg-white p-4 shadow dark:bg-gray-800">
        {/* Search and Filter Bar */}
        <div className="flex flex-row items-center w-full">
          <form onSubmit={e => e.preventDefault()} className="relative max-w-xs w-full sm:w-auto">
            <input
              type="text"
              placeholder="Search permissions..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full rounded-md border border-gray-300 py-2 pl-10 pr-4 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            />
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          </form>
          <div className="flex items-center space-x-2 ml-auto mr-4">
            <Filter className="h-5 w-5 text-gray-500" />
            <select
              value={selectedModule}
              onChange={e => setSelectedModule(e.target.value)}
              className="block rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            >
              {modules.map(module => (
                <option key={module} value={module}>{module}</option>
              ))}
            </select>
          </div>
        </div>
        {/* Bulk actions and Add Permission */}
        <div className="flex items-center space-x-2 ml-auto">
          {selectedIds.length > 0 && (
            <>
              <button
                onClick={() => handleBulkAction('activate')}
                className="inline-flex items-center rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-xs font-medium text-green-700 shadow-sm hover:bg-green-50 focus:outline-none focus:ring-2 focus:ring-green-500 dark:border-green-700 dark:bg-green-900 dark:text-green-100 dark:hover:bg-green-800"
              >
                <UserCheck className="mr-1 h-3.5 w-3.5" /> Activate
              </button>
              <button
                onClick={() => handleBulkAction('deactivate')}
                className="inline-flex items-center rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-xs font-medium text-yellow-700 shadow-sm hover:bg-yellow-50 focus:outline-none focus:ring-2 focus:ring-yellow-500 dark:border-yellow-700 dark:bg-yellow-900 dark:text-yellow-100 dark:hover:bg-yellow-800"
              >
                <UserX className="mr-1 h-3.5 w-3.5" /> Deactivate
              </button>
              <button
                onClick={() => handleBulkAction('delete')}
                className="inline-flex items-center rounded-md border border-red-300 bg-white px-2.5 py-1.5 text-xs font-medium text-red-700 shadow-sm hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 dark:border-red-700 dark:bg-red-900 dark:text-red-100 dark:hover:bg-red-800"
              >
                <Trash2 className="mr-1 h-3.5 w-3.5" /> Delete
              </button>
            </>
          )}
          <button
            className="ml-4 inline-flex items-center rounded-md border border-primary bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary dark:bg-primary dark:hover:bg-primary-dark"
            onClick={() => alert('Add Permission')}
          >
            + Add Permission
          </button>
        </div>
      </div>
      {/* Permissions Table */}
      <div className="rounded-lg bg-white shadow dark:bg-gray-800">
        <div className="overflow-x-auto">
          <table className="w-full table-auto">
            <thead className="bg-gray-50 text-xs uppercase text-gray-700 dark:bg-gray-700 dark:text-gray-300">
              <tr>
                <th className="w-10 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selectAll}
                    onChange={toggleSelectAll}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary dark:border-gray-600 dark:focus:ring-primary-dark"
                  />
                </th>
                <th className="px-4 py-3 text-left">Name</th>
                <th className="px-4 py-3 text-left">Key</th>
                <th className="px-4 py-3 text-left">Description</th>
                <th className="px-4 py-3 text-left">Module</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {paginatedPermissions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-gray-500 dark:text-gray-400">
                    No permissions found.
                  </td>
                </tr>
              ) : (
                paginatedPermissions.map(permission => (
                  <tr key={permission.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-4 py-4">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(permission.id)}
                        onChange={() => toggleSelectPermission(permission.id)}
                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary dark:border-gray-600 dark:focus:ring-primary-dark"
                      />
                    </td>
                    <td className="px-4 py-4 font-medium">{permission.name}</td>
                    <td className="px-4 py-4">{permission.key}</td>
                    <td className="px-4 py-4">{permission.description}</td>
                    <td className="px-4 py-4">{permission.module}</td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => alert(`Edit permission ${permission.id}`)}
                          className="rounded p-1 text-blue-500 hover:bg-blue-50 hover:text-blue-700 dark:text-blue-400 dark:hover:bg-blue-900/20 dark:hover:text-blue-300"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => alert(`Delete permission ${permission.id}`)}
                          className="rounded p-1 text-red-500 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-900/20 dark:hover:text-red-300"
                        >
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
        {/* Pagination controls */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 p-4 border-t border-gray-100 dark:border-gray-700">
          <PaginationInfo
            currentPage={page}
            pageSize={pageSize}
            totalItems={filteredPermissions.length}
          />
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </div>
      </div>
    </div>
  );
} 