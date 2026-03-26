import React from 'react';

/**
 * Heading Component
 */
export function H1({
  children,
  className = '',
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h1 className={`text-3xl font-bold text-gray-900 dark:text-white ${className}`} {...props}>
      {children}
    </h1>
  );
}

export function H2({
  children,
  className = '',
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2 className={`text-2xl font-bold text-gray-900 dark:text-white ${className}`} {...props}>
      {children}
    </h2>
  );
}

export function H3({
  children,
  className = '',
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 className={`text-xl font-semibold text-gray-900 dark:text-white ${className}`} {...props}>
      {children}
    </h3>
  );
}

export function H4({
  children,
  className = '',
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h4 className={`text-lg font-semibold text-gray-900 dark:text-white ${className}`} {...props}>
      {children}
    </h4>
  );
}

/**
 * Body Text Components
 */
export function Body({
  children,
  size = 'md',
  color = 'primary',
  className = '',
  ...props
}: React.HTMLAttributes<HTMLParagraphElement> & {
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'secondary' | 'light' | 'muted';
}) {
  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
  };

  const colorClasses = {
    primary: 'text-gray-900 dark:text-gray-100',
    secondary: 'text-gray-700 dark:text-gray-300',
    light: 'text-gray-600 dark:text-gray-400',
    muted: 'text-gray-500 dark:text-gray-500',
  };

  return (
    <p
      className={`${sizeClasses[size]} ${colorClasses[color]} leading-relaxed ${className}`}
      {...props}
    >
      {children}
    </p>
  );
}

/**
 * Caption / Small Text
 */
export function Caption({
  children,
  color = 'light',
  className = '',
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & {
  color?: 'primary' | 'secondary' | 'light' | 'muted';
}) {
  const colorClasses = {
    primary: 'text-gray-900 dark:text-gray-100',
    secondary: 'text-gray-700 dark:text-gray-300',
    light: 'text-gray-600 dark:text-gray-400',
    muted: 'text-gray-500 dark:text-gray-500',
  };

  return (
    <span
      className={`text-xs ${colorClasses[color]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}

/**
 * Code Component
 */
export function Code({
  children,
  className = '',
  ...props
}: React.HTMLAttributes<HTMLElement>) {
  return (
    <code
      className={`bg-gray-100 dark:bg-gray-800 text-red-600 dark:text-red-400 px-2 py-1 rounded-md text-sm font-mono ${className}`}
      {...props}
    >
      {children}
    </code>
  );
}

/**
 * Code Block Component
 */
export function CodeBlock({
  children,
  language = 'text',
  className = '',
  ...props
}: React.HTMLAttributes<HTMLPreElement> & {
  language?: string;
}) {
  return (
    <pre
      className={`bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 p-4 rounded-md overflow-x-auto text-sm font-mono ${className}`}
      {...props}
    >
      <code>{children}</code>
    </pre>
  );
}

/**
 * Link Component
 */
export function Link({
  children,
  className = '',
  ...props
}: React.AnchorHTMLAttributes<HTMLAnchorElement>) {
  return (
    <a
      className={`text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline transition-colors ${className}`}
      {...props}
    >
      {children}
    </a>
  );
}
