import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  elevated?: boolean;
  interactive?: boolean;
  glass?: boolean;
}

export default function Card({
  children,
  elevated = false,
  interactive = false,
  glass = false,
  className = '',
  ...props
}: CardProps) {
  const baseClasses = glass
    ? 'bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border border-white/20 dark:border-gray-700/50 rounded-lg transition-all'
    : 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg transition-all';

  const hoverClasses = interactive
    ? 'hover:shadow-md hover:border-gray-300 dark:hover:border-gray-700 cursor-pointer'
    : 'hover:shadow-md hover:border-gray-300 dark:hover:border-gray-700';

  const shadowClass = elevated ? 'shadow-md' : 'shadow-sm';

  return (
    <div
      className={`${baseClasses} ${shadowClass} ${hoverClasses} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
