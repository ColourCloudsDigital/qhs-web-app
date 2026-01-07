"use client";

import React, { useState, useEffect } from 'react';
import { Search, Edit2, Trash2, UserCheck, UserX, RefreshCw } from 'lucide-react';
import Pagination, { PaginationInfo } from '@/components/ui/pagination';
import AddRoleModal from '@/components/admin/hotels/AddRoleModal'; // Adjust path as needed

interface Role {
  id: string;
  name: string;
  slug: string;
  description: string;
}

interface RolesTabProps {
  hotelId: string;
}

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

export default function RolesTab({ hotelId }: RolesTabProps) {
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 3;
  const [total, setTotal] = useState(0);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [isAddModalOpen, setAddModalOpen] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{ open: boolean; action: string; ids: string[]; single: boolean }>({ open: false, action: '', ids: [], single: false });
  const [actionLoading, setActionLoading] = useState(false);

  const fetchRoles = async (search = searchTerm, pageNum = page) => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        search,
        page: pageNum.toString(),
        pageSize: pageSize.toString(),
      });
      const response = await fetch(`/api/hotels/${hotelId}/roles?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch roles');
      }
      const data = await response.json();
      setRoles(data.roles);
      setTotal(data.total);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (hotelId) {
      fetchRoles();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hotelId, page, searchTerm]);

  // Reset to page 1 when search changes
  useEffect(() => { setPage(1); }, [searchTerm]);

  const totalPages = Math.ceil(total / pageSize) || 1;
  const paginatedRoles = roles;

  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedIds([]);
    } else {
      setSelectedIds(paginatedRoles.map(r => r.id));
    }
    setSelectAll(!selectAll);
  };

  const toggleSelectRole = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(selectedId => selectedId !== id));
      setSelectAll(false);
    } else {
      const newSelected = [...selectedIds, id];
      setSelectedIds(newSelected);
      if (newSelected.length === paginatedRoles.length) {
        setSelectAll(true);
      }
    }
  };

  const handleBulkAction = (action: 'delete') => {
    setConfirmModal({ open: true, action, ids: selectedIds, single: false });
  };

  const handleSingleAction = (action: 'delete', id: string) => {
    setConfirmModal({ open: true, action, ids: [id], single: true });
  };

  const doAction = async () => {
    setActionLoading(true);
    const { action, ids, single } = confirmModal;
    try {
      if (single && ids.length === 1) {
        const roleId = ids[0];
        let method = 'DELETE';
        let url = `/api/hotels/${hotelId}/roles/${roleId}`;
        await fetch(url, { method });
      } else {
        await fetch(`/api/hotels/${hotelId}/roles`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids }),
        });
      }
      setConfirmModal({ open: false, action: '', ids: [], single: false });
      setSelectedIds([]);
      setSelectAll(false);
      fetchRoles();
    } catch (err) {
      alert('Action failed.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Search and Bulk Actions Box */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 rounded-lg bg-white p-4 shadow dark:bg-gray-800">
        <form onSubmit={e => e.preventDefault()} className="relative max-w-xs w-full sm:w-auto">
          <input
            type="text"
            placeholder="Search roles..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full rounded-md border border-gray-300 py-2 pl-10 pr-4 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          />
          <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
        </form>
        <div className="flex items-center space-x-2 ml-auto">
          {selectedIds.length > 0 && (
            <>
              <button
                onClick={() => handleBulkAction('delete')}
                className="inline-flex items-center rounded-md border border-red-300 bg-white px-2.5 py-1.5 text-xs font-medium text-red-700 shadow-sm hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 dark:border-red-700 dark:bg-red-900 dark:text-red-100 dark:hover:bg-red-800"
                title="Delete"
                aria-label="Delete"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </>
          )}
          <button
            onClick={() => fetchRoles()}
            disabled={isLoading}
            className="p-2 rounded-md border border-gray-300 bg-white text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            aria-label="Refresh roles"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            className="ml-2 inline-flex items-center rounded-md border border-primary bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary dark:bg-primary dark:hover:bg-primary-dark"
            onClick={() => setAddModalOpen(true)}
          >
            + Add Role
          </button>
        </div>
      </div>
      {/* Roles Table */}
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
                <th className="px-4 py-3 text-left">Slug</th>
                <th className="px-4 py-3 text-left">Description</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-gray-500 dark:text-gray-400">
                    Loading roles...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-red-500">
                    Error: {error}
                  </td>
                </tr>
              ) : paginatedRoles.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-gray-500 dark:text-gray-400">
                    No roles found.
                  </td>
                </tr>
              ) : (
                paginatedRoles.map(role => (
                  <tr key={role.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-4 py-4">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(role.id)}
                        onChange={() => toggleSelectRole(role.id)}
                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary dark:border-gray-600 dark:focus:ring-primary-dark"
                      />
                    </td>
                    <td className="px-4 py-4 font-medium">{role.name}</td>
                    <td className="px-4 py-4">{role.slug}</td>
                    <td className="px-4 py-4">{role.description}</td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleSingleAction('delete', role.id)}
                          className="rounded p-1 text-red-500 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-900/20 dark:hover:text-red-300"
                          title="Delete"
                          aria-label="Delete"
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
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 p-4 border-t border-gray-100 dark:border-gray-700">
          <PaginationInfo
            currentPage={page}
            pageSize={pageSize}
            totalItems={total}
          />
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </div>
      </div>
      <AddRoleModal
        isOpen={isAddModalOpen}
        onClose={() => setAddModalOpen(false)}
        hotelId={hotelId}
        onRoleAdded={() => {
          fetchRoles(); // Re-fetch roles after one is added
          setAddModalOpen(false);
        }}
      />
      <ConfirmModal
        open={confirmModal.open}
        onClose={() => setConfirmModal({ open: false, action: '', ids: [], single: false })}
        onConfirm={doAction}
        title={
          confirmModal.action === 'delete'
            ? `Delete ${confirmModal.single ? 'Role' : 'Roles'}`
            : ''
        }
        description={
          confirmModal.action === 'delete'
            ? `Are you sure you want to delete ${confirmModal.single ? 'this role' : 'these roles'}? This action cannot be undone.`
            : ''
        }
        confirmText={
          confirmModal.action === 'delete'
            ? 'Delete'
            : ''
        }
        loading={actionLoading}
      />
    </div>
  );
}