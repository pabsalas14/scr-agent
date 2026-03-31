import React from 'react';
import { Loader2 } from 'lucide-react';

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
  const baseClasses =
    'inline-flex items-center justify-center gap-2 font-medium transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-offset-[#111111]';

  const sizes = {
    sm: 'px-3 py-1.5 text-xs rounded-lg',
    md: 'px-4 py-2 text-sm rounded-lg',
    lg: 'px-5 py-2.5 text-sm rounded-lg',
  };

  const variants = {
    primary:
      'bg-[#F97316] text-white hover:bg-[#EA6D00] active:bg-[#D96200] shadow-sm hover:shadow-[0_4px_12px_rgba(249,115,22,0.3)] focus:ring-[#F97316]',
    secondary:
      'bg-[#242424] text-[#A0A0A0] hover:bg-[#2D2D2F] hover:text-white border border-[#2D2D2D] hover:border-[#404040] focus:ring-[#404040]',
    tertiary:
      'bg-transparent text-[#A0A0A0] hover:bg-[#242424] hover:text-white border border-[#2D2D2D] hover:border-[#404040] focus:ring-[#404040]',
    ghost:
      'bg-transparent text-[#A0A0A0] hover:bg-[#242424] hover:text-white focus:ring-[#404040]',
    danger:
      'bg-[#EF4444] text-white hover:bg-[#DC2626] active:bg-[#B91C1C] shadow-sm hover:shadow-[0_4px_12px_rgba(239,68,68,0.3)] focus:ring-[#EF4444]',
  };

  return (
    <button
      className={`${baseClasses} ${sizes[size]} ${variants[variant]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
      {children}
    </button>
  );
}
