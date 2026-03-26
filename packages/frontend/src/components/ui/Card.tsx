import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  elevated?: boolean;
  interactive?: boolean;
}

export default function Card({
  children,
  elevated = false,
  interactive = false,
  className = '',
  ...props
}: CardProps) {
  const baseClasses = 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg transition-all';

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
