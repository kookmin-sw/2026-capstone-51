import React from 'react';
import { cn } from '../lib/cn';

/**
 * 작은 라운드 라벨.
 * tone: 'gray' | 'navy' | 'green' | 'red' | 'amber'
 */
export default function Badge({ tone = 'gray', children, className, ...rest }) {
  const tones = {
    gray: 'bg-ink-100 text-ink-600',
    navy: 'bg-primary-50 text-primary-800',
    green: 'bg-[#E8F4EE] text-[#1F7A4E]',
    red: 'bg-red-50 text-red-600',
    amber: 'bg-amber-50 text-amber-700',
  };
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold whitespace-nowrap',
        tones[tone] || tones.gray,
        className
      )}
      {...rest}
    >
      {children}
    </span>
  );
}
