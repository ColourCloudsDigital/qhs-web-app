'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Pagination } from '@/components/ui/pagination';
import { EllipsisVerticalIcon, QrCodeIcon } from '@heroicons/react/24/outline';
import { formatDate } from '@/lib/utils';
import toast from '@/lib/services/toast.service';


type MenusListProps = {
  menus: any[];
  loading: boolean;
  onRefresh: () => void;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
};

export default function MenusList({
  menus,
  loading,
  onRefresh,
  page,
  totalPages,
  onPageChange,
}: MenusListProps) {
  const router = useRouter();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  const [menuToDelete, setMenuToDelete] = useState<any>(null);
  const [qrDialogOpen, setQrDialogOpen] = useState<boolean>(false);
  const [selectedMenu, setSelectedMenu] = useState<any>(null);
  const [qrCodeImage, setQrCodeImage] = useState<string>('');
  const [regeneratingQr, setRegeneratingQr] = useState<boolean>(false);

  const handleEdit = (menuId: string) => {
    router.push(`/vendor/menus/${menuId}`);
  };

  const handleView = (menuId: string) => {
    router.push(`/vendor/menus/${menuId}/preview`);
  };

  const handleDelete = (menu: any) => {
    setMenuToDelete(menu);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    try {
      const res = await fetch(`/api/menus/${menuToDelete.id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        throw new Error('Failed to delete menu');
      }

      toast.success('Menu deleted successfully');
      onRefresh();
    } catch (error) {
      console.error('Error deleting menu:', error);
      toast.error('Failed to delete menu');
    } finally {
      setDeleteDialogOpen(false);
      setMenuToDelete(null);
    }
  };

  const handleShowQrCode = async (menu: any) => {
    setSelectedMenu(menu);

    try {
      const res = await fetch(`/api/menus/${menu.id}`);
      if (res.ok) {
        const data = await res.json();
        // Generate QR code client-side
        const qrUrl = `${window.location.origin}/menu/${data.qrCodeUrl.split('/').pop()}`;
        
        // Fetch QR code as data URL
        const qrCodeRes = await fetch(`/api/qrcode?data=${encodeURIComponent(qrUrl)}`);
        if (qrCodeRes.ok) {
          const qrData = await qrCodeRes.json();
          setQrCodeImage(qrData.qrCode);
        }
      }
    } catch (error) {
      console.error('Error fetching QR code:', error);
    }

    setQrDialogOpen(true);
  };

  const regenerateQrCode = async () => {
    if (!selectedMenu) return;

    setRegeneratingQr(true);
    try {
      const res = await fetch(`/api/menus/${selectedMenu.id}/qrcode`, {
        method: 'POST',
      });

      if (!res.ok) {
        throw new Error('Failed to regenerate QR code');
      }

      const data = await res.json();
      setQrCodeImage(data.qrCodeDataUrl);
      toast.success('QR code regenerated successfully');
      toast.info('Note: This will invalidate any previously printed QR codes', { duration: 5000 });
    } catch (error) {
      console.error('Error regenerating QR code:', error);
      toast.error('Failed to regenerate QR code');
    } finally {
      setRegeneratingQr(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (menus.length === 0) {
    return (
      <div className="rounded-md bg-gray-50 py-10 text-center">
        <p className="text-gray-500">No menus found. Create your first menu to get started.</p>
      </div>
    );
  }

  return (
    <div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Hotel</TableHead>
            <TableHead>Categories</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Last Updated</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {menus.map((menu) => (
            <TableRow key={menu.id}>
              <TableCell className="font-medium">{menu.name}</TableCell>
              <TableCell>{menu.hotel.name}</TableCell>
              <TableCell>{menu.categories.length} categories</TableCell>
              <TableCell>
                <Badge variant={menu.isActive ? 'success' : 'secondary'}>
                  {menu.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </TableCell>
              <TableCell>{formatDate(menu.updatedAt)}</TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <EllipsisVerticalIcon className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleView(menu.id)}>
                      View
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleEdit(menu.id)}>
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleShowQrCode(menu)}>
                      QR Code
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => handleDelete(menu)}
                      className="text-red-600"
                    >
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {totalPages > 1 && (
        <div className="mt-4 flex justify-center">
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={onPageChange}
          />
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Menu</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {menuToDelete?.name}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={confirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* QR Code Dialog */}
      <Dialog open={qrDialogOpen} onOpenChange={setQrDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Menu QR Code</DialogTitle>
            <DialogDescription>
              Scan this QR code to view the menu. You can print it or share it with your customers.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center space-y-4 py-4">
            {qrCodeImage ? (
              <div className="rounded-md border p-2">
                <img src={qrCodeImage} alt="Menu QR Code" className="h-64 w-64" />
              </div>
            ) : (
              <div className="flex h-64 w-64 items-center justify-center rounded-md border">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
              </div>
            )}
            <p className="text-sm text-gray-500">
              Menu: {selectedMenu?.name}
            </p>
          </div>
          <DialogFooter className="flex flex-col sm:flex-row sm:justify-between">
            <Button
              variant="outline"
              onClick={() => {
                if (qrCodeImage) {
                  const link = document.createElement('a');
                  link.download = `menu-qr-${selectedMenu?.id}.png`;
                  link.href = qrCodeImage;
                  link.click();
                }
              }}
            >
              Download
            </Button>
            <div className="flex space-x-2">
              <Button
                variant="secondary"
                onClick={regenerateQrCode}
                disabled={regeneratingQr}
              >
                {regeneratingQr ? 'Regenerating...' : 'Regenerate QR Code'}
              </Button>
              <Button variant="outline" onClick={() => setQrDialogOpen(false)}>
                Close
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}