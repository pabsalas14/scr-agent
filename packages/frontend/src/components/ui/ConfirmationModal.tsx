import { useState } from 'react';
import { AlertTriangle, CheckCircle, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from './Button';

export type ConfirmationType = 'danger' | 'warning' | 'info';

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  type?: ConfirmationType;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  additionalInfo?: string;
  showComment?: boolean;
  defaultComment?: string;
  onCommentChange?: (comment: string) => void;
}

export default function ConfirmationModal({
  isOpen,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'warning',
  onConfirm,
  onCancel,
  isLoading = false,
  additionalInfo,
  showComment = false,
  defaultComment = '',
  onCommentChange,
}: ConfirmationModalProps) {
  const [comment, setComment] = useState(defaultComment);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleConfirm = async () => {
    setIsProcessing(true);
    try {
      await onConfirm();
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCommentChange = (value: string) => {
    setComment(value);
    onCommentChange?.(value);
  };

  const getIcon = () => {
    switch (type) {
      case 'danger':
        return <AlertTriangle size={24} className="text-red-400" />;
      case 'warning':
        return <AlertCircle size={24} className="text-yellow-400" />;
      case 'info':
      default:
        return <CheckCircle size={24} className="text-blue-400" />;
    }
  };

  const getStyles = () => {
    switch (type) {
      case 'danger':
        return {
          border: 'border-red-500/30',
          button: 'bg-red-500 hover:bg-red-600',
        };
      case 'warning':
        return {
          border: 'border-yellow-500/30',
          button: 'bg-yellow-500 hover:bg-yellow-600',
        };
      case 'info':
      default:
        return {
          border: 'border-blue-500/30',
          button: 'bg-blue-500 hover:bg-blue-600',
        };
    }
  };

  const styles = getStyles();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40"
            onClick={onCancel}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className={`bg-[#1A1A1A] border ${styles.border} rounded-lg max-w-md w-full space-y-4 p-6 animate-in`}
            >
              {/* Header */}
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">{getIcon()}</div>
                <div className="flex-1">
                  <h2 className="text-lg font-semibold text-white">{title}</h2>
                </div>
              </div>

              {/* Description */}
              <div>
                <p className="text-sm text-[#A0A0A0]">{description}</p>

                {additionalInfo && (
                  <div className="mt-3 p-3 bg-[#0F0F0F] rounded border border-[#2D2D2D]">
                    <p className="text-xs text-[#666666]">{additionalInfo}</p>
                  </div>
                )}
              </div>

              {/* Comment Input (Optional) */}
              {showComment && (
                <div className="space-y-2">
                  <label className="block text-xs text-[#6B7280] font-medium">
                    Add a comment (optional)
                  </label>
                  <textarea
                    value={comment}
                    onChange={(e) => handleCommentChange(e.target.value)}
                    placeholder="Describe why you're confirming this action..."
                    className="w-full px-3 py-2 bg-[#111111] border border-[#2D2D2D] rounded text-white text-sm focus:outline-none focus:border-blue-500 resize-none h-16"
                    disabled={isProcessing}
                  />
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 justify-end pt-4 border-t border-[#2D2D2D]">
                <Button
                  onClick={onCancel}
                  variant="secondary"
                  size="sm"
                  disabled={isProcessing}
                >
                  {cancelText}
                </Button>
                <Button
                  onClick={handleConfirm}
                  size="sm"
                  disabled={isProcessing}
                  className={`${styles.button} text-white`}
                >
                  {isProcessing ? 'Processing...' : confirmText}
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
