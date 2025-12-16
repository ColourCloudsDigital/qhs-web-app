'use client';

import { useState } from 'react';
import { useImpersonation } from '@/contexts/ImpersonationContext';
import ConfirmationModal from '@/components/ui/ConfirmationModal';

interface ImpersonationBannerProps {
  adminName: string;
  userName: string;
}

export default function ImpersonationBanner({ adminName, userName }: ImpersonationBannerProps) {
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const { endImpersonation } = useImpersonation();

  return (
    <>
      <div className="bg-amber-500 p-2 text-amber-900">
        <div className="container mx-auto flex flex-col items-center justify-between space-y-2 px-4 sm:flex-row sm:space-y-0">
          <div className="text-sm font-medium">
            <span className="mr-1">You are impersonating</span>
            <span className="font-bold">{userName}</span>
            <span className="ml-1">as admin</span>
            <span className="ml-1 font-bold">{adminName}</span>
          </div>
          <button
            onClick={() => setShowConfirmModal(true)}
            className="rounded-md bg-white px-3 py-1 text-xs font-medium text-amber-700 hover:bg-amber-50"
          >
            Return to Admin Account
          </button>
        </div>
      </div>
      
      <ConfirmationModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={endImpersonation}
        title="End Impersonation"
        message={`Are you sure you want to end impersonation and return to your admin account?`}
        confirmText="End Impersonation"
        cancelText="Cancel"
        confirmButtonClass="bg-amber-600 hover:bg-amber-700 text-white"
      />
    </>
  );
} 