import React from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  children: React.ReactNode;
}

export default function Button({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  className = '',
  disabled,
  children,
  ...props
}: ButtonProps) {
  /* Clases base */
  const baseClasses =
    'inline-flex items-center justify-center gap-2 font-medium transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-900';

  /* Tamaños */
  const sizes = {
    sm: 'px-3 py-1.5 text-xs rounded-md',
    md: 'px-4 py-2 text-sm rounded-md',
    lg: 'px-6 py-2.5 text-base rounded-lg',
  };

  /* Variantes */
  const variants = {
    primary:
      'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 shadow-sm hover:shadow-md focus:ring-blue-500 dark:bg-blue-600 dark:hover:bg-blue-700',
    secondary:
      'bg-gray-100 text-gray-900 hover:bg-gray-200 active:bg-gray-300 border border-gray-200 focus:ring-gray-400 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600 dark:border-gray-600',
    tertiary:
      'bg-transparent text-gray-700 hover:bg-gray-50 active:bg-gray-100 border border-gray-300 focus:ring-gray-400 dark:text-gray-200 dark:hover:bg-gray-800 dark:border-gray-600',
    ghost:
      'bg-transparent text-gray-700 hover:bg-gray-50 active:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 dark:active:bg-gray-700 focus:ring-gray-400',
    danger:
      'bg-red-600 text-white hover:bg-red-700 active:bg-red-800 shadow-sm hover:shadow-md focus:ring-red-500 dark:bg-red-600 dark:hover:bg-red-700',
  };

  return (
    <button
      className={`${baseClasses} ${sizes[size]} ${variants[variant]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && <span className="animate-spin">⏳</span>}
      {children}
    </button>
  );
}
