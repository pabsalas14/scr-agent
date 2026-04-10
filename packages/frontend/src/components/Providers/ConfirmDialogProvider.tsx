import React from 'react';
import { useConfirm } from '../../hooks/useConfirm';
import ConfirmDialog from '../ui/ConfirmDialog';

export function ConfirmDialogProvider({ children }: { children: React.ReactNode }) {
  const confirmDialog = useConfirm();

  return (
    <>
      {children}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText={confirmDialog.confirmText}
        cancelText={confirmDialog.cancelText}
        isDangerous={confirmDialog.isDangerous}
        isLoading={confirmDialog.isLoading}
        onConfirm={confirmDialog.handleConfirm}
        onCancel={confirmDialog.handleCancel}
      />
    </>
  );
}
