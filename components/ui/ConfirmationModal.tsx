import React from 'react';
import Modal from './Modal';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isLoading?: boolean;
  confirmButtonClass?: string;
}

export default function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isLoading = false,
  confirmButtonClass = 'bg-primary hover:bg-primary-dark text-white',
}: ConfirmationModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="sm">
      <div className="mt-2">
        <p className="text-sm text-gray-600 dark:text-gray-400">{message}</p>
      </div>

      <div className="mt-6 flex justify-end space-x-3">
        <button
          type="button"
          className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
          onClick={onClose}
          disabled={isLoading}
        >
          {cancelText}
        </button>
        <button
          type="button"
          className={`rounded-md px-4 py-2 text-sm font-medium shadow-sm ${confirmButtonClass} ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
          onClick={onConfirm}
          disabled={isLoading}
        >
          {isLoading ? (
            <span className="flex items-center">
              <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-r-transparent"></span>
              Processing...
            </span>
          ) : (
            confirmText
          )}
        </button>
      </div>
    </Modal>
  );
} 