import { useMemo } from 'react';
import { useModal } from '../contexts/ModalContext';
import { calculateModalZIndex } from '../constants/zIndex';

/**
 * Hook to get the correct z-index for a modal/panel
 * Integrates with ModalContext for automatic layering
 *
 * Usage:
 * const zIndex = useZIndex('my-modal-id');
 * <div style={{ zIndex }}>Modal content</div>
 */
export function useZIndex(modalId: string): number {
  const { getModalZIndex } = useModal();

  return useMemo(() => {
    return getModalZIndex(modalId);
  }, [modalId, getModalZIndex]);
}

/**
 * Hook to check if a modal is the topmost one
 * Useful for keyboard event handling, focus management
 *
 * Usage:
 * const isTopModal = useIsTopModal('my-modal-id');
 */
export function useIsTopModal(modalId: string): boolean {
  const { getTopModalId } = useModal();

  return useMemo(() => {
    return getTopModalId() === modalId;
  }, [modalId, getTopModalId]);
}

/**
 * Hook to manage a modal's open/close state
 * Automatically handles context updates
 *
 * Usage:
 * const { isOpen, open, close, closeAll } = useModalState('my-modal-id', 'modal');
 */
export function useModalState(modalId: string, type: 'modal' | 'panel' | 'dialog' = 'modal') {
  const { openModal, closeModal, closeAllModals, isModalOpen } = useModal();

  return useMemo(() => ({
    isOpen: isModalOpen(modalId),
    open: () => openModal(modalId, type),
    close: () => closeModal(modalId),
    closeAll: closeAllModals,
  }), [modalId, type, openModal, closeModal, closeAllModals, isModalOpen]);
}
