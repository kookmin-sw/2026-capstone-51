import React from 'react';
import { cn } from '../lib/cn';

/**
 * 일관된 버튼.
 * variant: 'default' | 'primary' | 'ghost'
 * size:    'md' | 'sm'
 */
export default function Button({
  variant = 'default',
  size = 'md',
  className,
  children,
  ...rest
}) {
  const base =
    'inline-flex items-center gap-1.5 rounded-md font-semibold whitespace-nowrap transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer';
  const sizes = {
    md: 'px-3 py-1.5 text-[12.5px]',
    sm: 'px-2.5 py-1 text-[11.5px]',
  };
  const variants = {
    default: 'bg-paper border border-ink-200 text-ink-700 hover:bg-ink-50',
    primary:
      'bg-primary-900 border border-primary-900 text-white hover:bg-primary-800',
    ghost:
      'bg-transparent border border-transparent text-ink-700 hover:bg-ink-100',
    danger: 'bg-paper border border-ink-200 text-red-600 hover:bg-red-50',
  };
  return (
    <button
      className={cn(base, sizes[size], variants[variant], className)}
      {...rest}
    >
      {children}
    </button>
  );
}
