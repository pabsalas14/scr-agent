import React from 'react';
import { motion } from 'framer-motion';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  message?: string;
  fullScreen?: boolean;
}

export default function LoadingSpinner({
  size = 'md',
  message = 'Cargando...',
  fullScreen = false,
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: { spinner: 'w-8 h-8', text: 'text-sm' },
    md: { spinner: 'w-12 h-12', text: 'text-base' },
    lg: { spinner: 'w-16 h-16', text: 'text-lg' },
  };

  const spinnerVariants = {
    rotate: {
      rotate: 360,
      transition: { duration: 2, repeat: Infinity, ease: 'linear' },
    },
  };

  const containerClasses = fullScreen
    ? 'fixed inset-0 bg-black/50 z-50 flex items-center justify-center'
    : 'flex flex-col items-center justify-center gap-3';

  return (
    <div className={containerClasses}>
      <div className="flex flex-col items-center gap-3">
        {/* Spinner */}
        <motion.div
          variants={spinnerVariants}
          animate="rotate"
          className={`${sizeClasses[size].spinner} border-3 border-[#2D2D2D] border-t-[#F97316] rounded-full`}
        />

        {/* Message */}
        {message && (
          <p className={`${sizeClasses[size].text} text-[#6B7280] font-medium`}>
            {message}
          </p>
        )}
      </div>
    </div>
  );
}
