import React from 'react';
import { cn } from '../lib/cn';

/**
 * 모달 셸. 헤더(title/sub) / 본문(children) / 푸터(footer)로 구성.
 * 닫기 동작은 부모에서 onClose 로 제공.
 */
export default function Modal({
  open,
  onClose,
  title,
  sub,
  children,
  footer,
  width = 560,
  className,
}) {
  if (!open) return null;
  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[100] grid place-items-center p-6 bg-[rgba(15,23,42,0.45)]"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ width, maxWidth: '100%' }}
        className={cn(
          'flex flex-col max-h-[85vh] bg-paper rounded-lg shadow-xl overflow-hidden',
          className
        )}
      >
        {(title || sub) && (
          <div className="px-6 pt-5 pb-2">
            {title && (
              <h2 className="text-[18px] font-bold text-ink-900 tracking-tight">
                {title}
              </h2>
            )}
            {sub && (
              <div className="text-[13px] text-ink-500 mt-1.5 leading-relaxed">
                {sub}
              </div>
            )}
          </div>
        )}
        <div className="flex-1 min-h-0 overflow-y-auto px-6 pt-2 pb-4">
          {children}
        </div>
        {footer && (
          <div className="px-6 py-3 bg-ink-100 border-t border-ink-150 flex justify-end gap-2">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
