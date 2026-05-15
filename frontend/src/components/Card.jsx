import React from 'react';
import { cn } from '../lib/cn';

/**
 * 일반 카드 컨테이너.
 * - tight: 패딩 줄임
 * - 헤더는 children 안에서 직접 마크업 (h2, .sub)
 */
export function Card({ children, className, tight = false, ...rest }) {
  return (
    <section
      className={cn(
        'bg-paper border border-border rounded-md',
        tight ? 'p-3.5' : 'p-4',
        className
      )}
      {...rest}
    >
      {children}
    </section>
  );
}

/**
 * 카드 헤더 (h2 + sub) — 카드 내부에서 사용.
 */
export function CardHeader({ icon: Icon, title, sub, action }) {
  return (
    <div className="flex items-start justify-between gap-3 mb-3">
      <div>
        <h2 className="flex items-center gap-1.5 text-[14px] font-bold text-ink-900 tracking-tight">
          {Icon && <Icon size={15} strokeWidth={1.8} />}
          {title}
        </h2>
        {sub && <div className="text-[12px] text-ink-500 mt-1">{sub}</div>}
      </div>
      {action}
    </div>
  );
}
