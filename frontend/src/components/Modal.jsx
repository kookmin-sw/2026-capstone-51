import { useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '../lib/cn';

/**
 * 모달 셸. 헤더(title/sub) / 본문(children) / 푸터(footer)로 구성.
 *  - 닫기: 부모의 onClose. backdrop click / 우상단 X 버튼 / Esc 키 모두 지원.
 *  - 열린 동안 body 스크롤 잠금.
 *  - width 는 desktop 폭. 모바일에서는 vw - 32px 까지 줄어듦.
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
  hideClose = false,
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[100] grid place-items-center p-4 sm:p-6 bg-[rgba(15,23,42,0.45)]"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ width, maxWidth: '100%' }}
        className={cn(
          'relative flex flex-col max-h-[90vh] sm:max-h-[85vh] bg-paper rounded-lg shadow-xl overflow-hidden',
          className
        )}
      >
        {!hideClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="absolute right-3 top-3 z-10 grid place-items-center w-8 h-8 rounded-md text-ink-500 hover:text-ink-900 hover:bg-ink-100 transition-colors"
          >
            <X size={16} strokeWidth={2} />
          </button>
        )}
        {(title || sub) && (
          <div className="px-6 pt-5 pb-2 pr-12">
            {title && (
              <h2 className="text-[18px] font-bold text-ink-900 tracking-tight">
                {title}
              </h2>
            )}
            {sub && (
              <div className="text-[13px] text-ink-500 mt-1.5 leading-relaxed break-keep">
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
