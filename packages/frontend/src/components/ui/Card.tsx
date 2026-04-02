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
    ? 'bg-[#1C1C1E]/80 backdrop-blur-md border border-[#2D2D2D] rounded-xl transition-all'
    : 'bg-[#1E1E20] border border-[#2D2D2D] rounded-xl transition-all';

  const hoverClasses = interactive
    ? 'hover:border-[#F97316]/40 hover:shadow-[0_0_20px_rgba(249,115,22,0.08)] cursor-pointer'
    : '';

  const shadowClass = elevated ? 'shadow-[0_4px_16px_rgba(0,0,0,0.3)]' : '';

  return (
    <div
      className={`${baseClasses} ${shadowClass} ${hoverClasses} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
