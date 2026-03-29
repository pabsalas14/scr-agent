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
    ? 'bg-[#0A0B10]/95 backdrop-blur-2xl border border-white/5 shadow-2xl rounded-[2rem] transition-all'
    : 'bg-[#0A0B10] border border-[#1F2937] rounded-[2rem] transition-all';

  const hoverClasses = interactive
    ? 'hover:border-[#00D1FF]/50 hover:shadow-[0_0_30px_rgba(0,209,255,0.1)] cursor-pointer'
    : '';

  const shadowClass = elevated ? 'shadow-2xl' : '';

  return (
    <div
      className={`${baseClasses} ${shadowClass} ${hoverClasses} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
