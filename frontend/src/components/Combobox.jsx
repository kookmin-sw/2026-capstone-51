import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, Search, X as XIcon } from 'lucide-react';
import { cn } from '../lib/cn';

/**
 * 커스텀 드롭다운 — 검색·키보드 nav 지원, viewport 공간에 따라 위/아래 자동 펼침.
 *
 * Props:
 *  - value: 선택된 option.value (없으면 '')
 *  - onChange(v): 선택 콜백
 *  - options: [{ value, label }] — 단일 평면 리스트. group 분리는 호출부 책임.
 *  - placeholder?: 미선택 시 표시 텍스트
 *  - searchPlaceholder?: 검색창 placeholder
 *  - emptyText?: 검색 결과 없을 때 메시지
 *  - disabled?, hasError?
 *  - allowClear?: 우측에 X 표시 → onChange('') (옵션)
 *  - searchable?: 검색바 노출 여부 (default true). false 면 단순 옵션 리스트만.
 *  - forceDirection?: 'down' | 'up' — viewport 자동 감지 무시하고 강제 방향.
 *
 * 키보드: ↑/↓ navigate, Enter 선택, Esc 닫기.
 * 외부 클릭 시 닫힘. searchable 일 때 열릴 때 검색 input 자동 focus.
 */
export default function Combobox({
  value,
  onChange,
  options,
  placeholder = '선택',
  searchPlaceholder = '검색',
  emptyText = '검색 결과가 없어요',
  disabled = false,
  hasError = false,
  allowClear = false,
  searchable = true,
  forceDirection,
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0); // keyboard highlight idx
  const [direction, setDirection] = useState('down'); // 'down' | 'up' — viewport 공간에 따라 자동 결정
  const containerRef = useRef(null);
  const searchRef = useRef(null);
  const listRef = useRef(null);

  const selected = useMemo(
    () => options.find((o) => String(o.value) === String(value ?? '')),
    [options, value]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [options, query]);

  // 열릴 때 검색창 포커스 (DOM side-effect 만 effect 에 둠 — setState 는 trigger 핸들러에서)
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => searchRef.current?.focus(), 0);
    return () => clearTimeout(t);
  }, [open]);

  // 외부 클릭 / Esc 로 닫기
  useEffect(() => {
    if (!open) return;
    const onDocClick = (e) => {
      if (!containerRef.current?.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  // active 변경 시 해당 항목 가시 영역으로 스크롤
  useEffect(() => {
    if (!open || !listRef.current) return;
    const el = listRef.current.querySelector(`[data-idx="${active}"]`);
    el?.scrollIntoView({ block: 'nearest' });
  }, [active, open]);

  const trigger = () => {
    if (disabled) return;
    if (!open) {
      // 열기 직전: 초기화 + 방향 결정 (forceDirection 우선, 아니면 viewport 잔여 공간 기반 자동)
      setActive(0);
      setQuery('');
      if (forceDirection) {
        setDirection(forceDirection);
      } else {
        const rect = containerRef.current?.getBoundingClientRect();
        if (rect) {
          // 검색바(~52) + 옵션 영역 max-h-48(192) ≈ 약 244px 필요
          const DROPDOWN_H = searchable ? 244 : 192;
          const below = window.innerHeight - rect.bottom;
          const above = rect.top;
          setDirection(below < DROPDOWN_H && above > below ? 'up' : 'down');
        }
      }
    }
    setOpen((o) => !o);
  };

  const select = (v) => {
    onChange(v);
    setOpen(false);
  };

  const onSearchKey = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const it = filtered[active];
      if (it) select(it.value);
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={trigger}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={cn(
          'field text-[14px] py-2.5 pr-9 text-left flex items-center justify-between',
          hasError && 'border-red-500 focus:border-red-500',
          disabled && 'opacity-60 cursor-not-allowed',
          !disabled && 'cursor-pointer',
          !selected && 'text-ink-400'
        )}
      >
        <span className="truncate">{selected?.label || placeholder}</span>
        {allowClear && selected && !disabled ? (
          <span
            role="button"
            tabIndex={-1}
            onClick={(e) => {
              e.stopPropagation();
              onChange('');
            }}
            className="absolute right-8 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-700 p-0.5"
            aria-label="선택 지우기"
          >
            <XIcon size={13} strokeWidth={2.2} />
          </span>
        ) : null}
        <ChevronDown
          size={15}
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink-400"
        />
      </button>

      {open && (
        <div
          className={cn(
            'absolute z-30 w-full bg-paper border border-ink-200 rounded-md shadow-lg overflow-hidden',
            direction === 'up' ? 'bottom-full mb-1' : 'top-full mt-1'
          )}
          role="listbox"
        >
          {searchable && (
            <div className="border-b border-ink-150 p-2 bg-ink-50">
              <div className="relative">
                <Search
                  size={13}
                  strokeWidth={2}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none"
                />
                <input
                  ref={searchRef}
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setActive(0);
                  }}
                  onKeyDown={onSearchKey}
                  placeholder={searchPlaceholder}
                  className="w-full pl-7 pr-2 py-1.5 rounded-md border border-ink-200 bg-paper text-[13px] outline-none focus:border-primary-600"
                />
              </div>
            </div>
          )}
          <ul
            ref={listRef}
            className="max-h-48 overflow-y-auto py-1"
            tabIndex={-1}
          >
            {filtered.length === 0 ? (
              <li className="px-3 py-3 text-[12.5px] text-ink-400 text-center break-keep">
                {emptyText}
              </li>
            ) : (
              filtered.map((o, i) => (
                <li key={String(o.value)} data-idx={i}>
                  <button
                    type="button"
                    onMouseEnter={() => setActive(i)}
                    onClick={() => select(o.value)}
                    className={cn(
                      'w-full text-left px-3 py-1.5 text-[13.5px] cursor-pointer break-keep',
                      i === active && 'bg-ink-100',
                      String(o.value) === String(value ?? '') &&
                        'bg-primary-50 text-primary-800 font-semibold'
                    )}
                  >
                    {o.label}
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
