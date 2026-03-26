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
        <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
          {label}
        </label>
      )}
      <input
        className={`w-full px-4 py-2 border rounded-md text-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-900 ${
          error
            ? 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-600 text-red-900 dark:text-red-200 placeholder-red-400 dark:placeholder-red-500 focus:ring-red-500'
            : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500 dark:focus:border-blue-500'
        } ${className}`}
        {...props}
      />
      {error ? (
        <p className="text-sm text-red-600 dark:text-red-400 mt-1.5">{error}</p>
      ) : helperText ? (
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1.5">{helperText}</p>
      ) : null}
    </div>
  );
}
