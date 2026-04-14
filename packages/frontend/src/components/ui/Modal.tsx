import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useModal } from '../../contexts/ModalContext';
import { useZIndex, useIsTopModal } from '../../hooks/useZIndex';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  modalId?: string;
}

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  modalId = 'default-modal',
}: ModalProps) {
  const { openModal, closeModal } = useModal();
  const modalZIndex = useZIndex(modalId);
  const isTopModal = useIsTopModal(modalId);

  // Sync with ModalContext
  useEffect(() => {
    if (isOpen) {
      openModal(modalId, 'modal');
    } else {
      closeModal(modalId);
    }
  }, [isOpen, modalId, openModal, closeModal]);

  // Handle ESC key to close (only if this is the top modal)
  useEffect(() => {
    if (!isOpen || !isTopModal) return;

    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscapeKey);
    return () => document.removeEventListener('keydown', handleEscapeKey);
  }, [isOpen, isTopModal, onClose]);
  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50"
            style={{ zIndex: modalZIndex - 10 }}
          />

          {/* Modal - Professional Design */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 flex items-center justify-center p-4 sm:p-6"
            style={{ zIndex: modalZIndex }}
          >
            <div className={`bg-[#1E1E20] rounded-xl shadow-2xl border border-[#2D2D2D] overflow-hidden flex flex-col w-full max-h-full ${sizeClasses[size]}`}>
              {/* Header */}
              {title && (
                <div className="flex items-center justify-between px-6 py-4 border-b border-[#2D2D2D] flex-shrink-0">
                  <h2 className="text-lg font-semibold text-white">
                    {title}
                  </h2>
                  <button
                    onClick={onClose}
                    className="text-[#6B7280] hover:text-[#A0A0A0] transition-colors p-1 hover:bg-[#242424] rounded-md"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              )}

              {/* Body */}
              <div className="p-6 overflow-y-auto flex-1">
                {children}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
