import React from 'react';
import { motion } from 'framer-motion';

interface SkeletonLoaderProps {
  type?: 'card' | 'list' | 'table' | 'text' | 'circle';
  count?: number;
  className?: string;
  height?: string;
  width?: string;
}

export default function SkeletonLoader({
  type = 'card',
  count = 1,
  className = '',
  height = 'h-10',
  width = 'w-full',
}: SkeletonLoaderProps) {
  const baseClasses = 'bg-[#242424] rounded-lg overflow-hidden';
  const shimmerAnimation = {
    initial: { backgroundPosition: '200% center' },
    animate: {
      backgroundPosition: ['-200% center', '200% center'],
    },
  };

  const renderSkeleton = (index: number) => {
    switch (type) {
      case 'card':
        return (
          <motion.div
            key={index}
            {...shimmerAnimation}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            className={`${baseClasses} p-4 space-y-3 ${className}`}
            style={{
              backgroundImage: 'linear-gradient(90deg, #242424 0%, #2D2D2D 50%, #242424 100%)',
              backgroundSize: '200% 100%',
            }}
          >
            <div className="h-4 bg-[#2D2D2D] rounded w-3/4" />
            <div className="space-y-2">
              <div className="h-3 bg-[#2D2D2D] rounded" />
              <div className="h-3 bg-[#2D2D2D] rounded w-5/6" />
            </div>
            <div className="h-8 bg-[#2D2D2D] rounded" />
          </motion.div>
        );

      case 'list':
        return (
          <motion.div
            key={index}
            {...shimmerAnimation}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            className={`${baseClasses} p-4 flex items-center gap-4 ${className}`}
            style={{
              backgroundImage: 'linear-gradient(90deg, #242424 0%, #2D2D2D 50%, #242424 100%)',
              backgroundSize: '200% 100%',
            }}
          >
            <div className="h-10 w-10 bg-[#2D2D2D] rounded-lg flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-[#2D2D2D] rounded w-1/3" />
              <div className="h-3 bg-[#2D2D2D] rounded w-1/2" />
            </div>
          </motion.div>
        );

      case 'table':
        return (
          <motion.div
            key={index}
            {...shimmerAnimation}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            className={`${baseClasses} p-3 flex gap-2 ${className}`}
            style={{
              backgroundImage: 'linear-gradient(90deg, #242424 0%, #2D2D2D 50%, #242424 100%)',
              backgroundSize: '200% 100%',
            }}
          >
            <div className="h-6 bg-[#2D2D2D] rounded flex-1" />
            <div className="h-6 bg-[#2D2D2D] rounded flex-1" />
            <div className="h-6 bg-[#2D2D2D] rounded flex-1" />
          </motion.div>
        );

      case 'circle':
        return (
          <motion.div
            key={index}
            {...shimmerAnimation}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            className={`${baseClasses} rounded-full ${className}`}
            style={{
              backgroundImage: 'linear-gradient(90deg, #242424 0%, #2D2D2D 50%, #242424 100%)',
              backgroundSize: '200% 100%',
              width: width === 'w-full' ? 'auto' : width,
              aspectRatio: '1',
            }}
          />
        );

      case 'text':
        return (
          <motion.div
            key={index}
            {...shimmerAnimation}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            className={`${height} ${width} bg-[#2D2D2D] rounded ${className}`}
            style={{
              backgroundImage: 'linear-gradient(90deg, #242424 0%, #2D2D2D 50%, #242424 100%)',
              backgroundSize: '200% 100%',
            }}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, index) => renderSkeleton(index))}
    </div>
  );
}
