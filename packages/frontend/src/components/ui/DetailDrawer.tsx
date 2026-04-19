/**
 * DetailDrawer Component
 * Shared drawer component for editing details across modules
 * Slides in from right side with smooth animation
 */

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import Button from './Button';

interface DetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  width?: 'sm' | 'md' | 'lg'; // sm: 400px, md: 600px, lg: 800px
  onSave?: () => void | Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
  showActions?: boolean;
}

export default function DetailDrawer({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  width = 'md',
  onSave,
  onCancel,
  isLoading = false,
  showActions = true,
}: DetailDrawerProps) {
  const [isSaving, setIsSaving] = useState(false);

  // Handle ESC key to close
  useEffect(() => {
    if (!isOpen) return;

    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isSaving) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscapeKey);
    return () => document.removeEventListener('keydown', handleEscapeKey);
  }, [isOpen, isSaving, onClose]);

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const widthClasses = {
    sm: 'w-96',
    md: 'w-[600px]',
    lg: 'w-[800px]',
  };

  const handleSave = async () => {
    if (!onSave) return;
    setIsSaving(true);
    try {
      await Promise.resolve(onSave());
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      onClose();
    }
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
            onClick={handleCancel}
            className="fixed inset-0 bg-black/50 z-40"
            transition={{ duration: 0.2 }}
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: 600, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 600, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className={`fixed right-0 top-0 h-full bg-[#1A1A1A] border-l border-[#2D2D2D] shadow-2xl flex flex-col z-50 ${widthClasses[width]}`}
          >
            {/* Header */}
            <div className="flex items-start justify-between p-6 border-b border-[#2D2D2D] flex-shrink-0">
              <div className="flex-1">
                <h2 className="text-xl font-semibold text-white">{title}</h2>
                {subtitle && <p className="text-sm text-[#888] mt-1">{subtitle}</p>}
              </div>
              <button
                onClick={handleCancel}
                disabled={isSaving || isLoading}
                className="ml-4 p-1 hover:bg-white/10 rounded transition-colors disabled:opacity-50"
              >
                <X size={20} className="text-[#888]" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {children}
            </div>

            {/* Footer */}
            {footer ? (
              <div className="border-t border-[#2D2D2D] p-6 flex-shrink-0">
                {footer}
              </div>
            ) : showActions ? (
              <div className="border-t border-[#2D2D2D] p-6 flex gap-3 flex-shrink-0">
                {onSave && (
                  <Button
                    onClick={handleSave}
                    disabled={isSaving || isLoading}
                    className="flex-1"
                  >
                    {isSaving ? 'Guardando...' : 'Guardar'}
                  </Button>
                )}
                <Button
                  onClick={handleCancel}
                  variant="secondary"
                  disabled={isSaving || isLoading}
                  className="flex-1"
                >
                  {onSave ? 'Cancelar' : 'Cerrar'}
                </Button>
              </div>
            ) : null}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
