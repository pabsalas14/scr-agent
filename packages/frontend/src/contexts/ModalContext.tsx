/**
 * ModalContext - Manages modal/panel stacking and lifecycle
 * Prevents overlapping modals and manages z-index automatically
 */

import React, { createContext, useContext, useState, useCallback } from 'react';

export interface ModalConfig {
  id: string;
  type: 'modal' | 'panel' | 'dialog';
  level: number; // z-index = 1000 + (level * 100)
}

interface ModalContextType {
  openModals: ModalConfig[];
  openModal: (id: string, type?: 'modal' | 'panel' | 'dialog') => void;
  closeModal: (id: string) => void;
  closeAllModals: () => void;
  getModalZIndex: (id: string) => number;
  isModalOpen: (id: string) => boolean;
  getTopModalId: () => string | null;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export function ModalProvider({ children }: { children: React.ReactNode }) {
  const [openModals, setOpenModals] = useState<ModalConfig[]>([]);

  const openModal = useCallback((id: string, type: 'modal' | 'panel' | 'dialog' = 'modal') => {
    setOpenModals((prev) => {
      // Don't open duplicate modals
      if (prev.some((m) => m.id === id)) return prev;

      const newLevel = prev.length;
      return [...prev, { id, type, level: newLevel }];
    });
  }, []);

  const closeModal = useCallback((id: string) => {
    setOpenModals((prev) => prev.filter((m) => m.id !== id));
  }, []);

  const closeAllModals = useCallback(() => {
    setOpenModals([]);
  }, []);

  const getModalZIndex = useCallback((id: string) => {
    const modal = openModals.find((m) => m.id === id);
    if (!modal) return 0;
    return 1000 + modal.level * 100;
  }, [openModals]);

  const isModalOpen = useCallback((id: string) => {
    return openModals.some((m) => m.id === id);
  }, [openModals]);

  const getTopModalId = useCallback(() => {
    if (openModals.length === 0) return null;
    return openModals[openModals.length - 1].id;
  }, [openModals]);

  return (
    <ModalContext.Provider
      value={{
        openModals,
        openModal,
        closeModal,
        closeAllModals,
        getModalZIndex,
        isModalOpen,
        getTopModalId,
      }}
    >
      {children}
    </ModalContext.Provider>
  );
}

export function useModal() {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModal must be used within ModalProvider');
  }
  return context;
}
