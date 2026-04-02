import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export default function Input({
  label,
  error,
  helperText,
  className = '',
  ...props
}: InputProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-[#A0A0A0] mb-1.5">
          {label}
        </label>
      )}
      <input
        className={`w-full px-3.5 py-2 border rounded-lg text-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-offset-[#111111] ${
          error
            ? 'bg-[#EF4444]/5 border-[#EF4444]/50 text-white placeholder-[#6B7280] focus:ring-[#EF4444]/40'
            : 'bg-[#1C1C1E] border-[#2D2D2D] text-white placeholder-[#4B5563] focus:ring-[#F97316]/40 focus:border-[#F97316]/50'
        } ${className}`}
        {...props}
      />
      {error ? (
        <p className="text-xs text-[#EF4444] mt-1.5">{error}</p>
      ) : helperText ? (
        <p className="text-xs text-[#6B7280] mt-1.5">{helperText}</p>
      ) : null}
    </div>
  );
}
