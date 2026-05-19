import { useEffect, useMemo, useRef, useState } from 'react';
import { cn } from '../lib/cn';

/**
 * 자유 입력 허용 자동완성 input.
 *
 * Combobox 와 다른 점: 옵션에 없는 값도 그대로 유지된다. 매칭되는 옵션이 있으면
 * popover 로 보여주고 사용자가 클릭/Enter 로 채울 수 있게 하되, 자유 입력 자체를
 * 막지 않는다. 자격증명처럼 "마스터 목록에 있으면 편하고 없어도 OK" 인 필드용.
 *
 * Props:
 *  - value: string — 현재 입력값
 *  - onChange(v): 입력 변경 콜백 (자유 입력/옵션 선택 둘 다 여기서 처리됨)
 *  - onSelect?(option): 옵션을 명시적으로 클릭/Enter 했을 때만 호출.
 *      자유 입력으로 우연히 옵션 value 와 일치한 경우엔 호출되지 않는다.
 *  - options: [{ value: string, label: string, sub?: string, badge?: { label, tone } }]
 *      value = onChange 로 흘려보낼 문자열, label = 옵션 행 상단 텍스트,
 *      sub = 옵션 행 부제목(예: 발급기관), badge.tone = `.badge-${tone}` 키.
 *  - placeholder?, hasError?, disabled?
 *  - emptyText?: 매칭 결과 0 일 때 표시할 문구. 미지정 시 popover 자체를 안 띄움.
 *  - minChars?: 이 글자 수 이상 입력해야 popover 노출 (기본 0 — 빈 상태에서도 전체 옵션).
 *
 * 키보드: ↑/↓ navigate, Enter 선택, Esc 닫기. 외부 클릭 시 닫힘.
 * Viewport 잔여 공간에 따라 위/아래 자동 펼침 (Combobox 패턴 차용).
 */
export default function Autocomplete({
  value,
  onChange,
  onSelect,
  options,
  placeholder,
  hasError = false,
  disabled = false,
  emptyText,
  minChars = 0,
}) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [direction, setDirection] = useState('down');
  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  const filtered = useMemo(() => {
    const q = (value ?? '').trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [options, value]);

  // 옵션이 진짜로 있을 때 + minChars 충족 시에만 popover 띄움.
  // emptyText 가 주어졌으면 매칭 0 이어도 안내문 표시.
  // 카탈로그 자체가 0 개면 emptyText 와 무관하게 popover 안 띄움 (자유 입력 모드).
  const showPopover =
    open &&
    (value?.length ?? 0) >= minChars &&
    options.length > 0 &&
    (filtered.length > 0 || !!emptyText);

  // 외부 클릭/Esc 로 닫기
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

  // active 변경 시 해당 행 가시영역으로 스크롤
  useEffect(() => {
    if (!showPopover || !listRef.current) return;
    const el = listRef.current.querySelector(`[data-idx="${active}"]`);
    el?.scrollIntoView({ block: 'nearest' });
  }, [active, showPopover]);

  // 옵션 변경 시 active 가 범위를 벗어나지 않게 정리
  useEffect(() => {
    if (active >= filtered.length) setActive(0);
  }, [filtered.length, active]);

  const openAndPosition = () => {
    if (disabled) return;
    setActive(0);
    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) {
      const DROPDOWN_H = 264; // max-h-60(240) + padding
      const below = window.innerHeight - rect.bottom;
      const above = rect.top;
      setDirection(below < DROPDOWN_H && above > below ? 'up' : 'down');
    }
    setOpen(true);
  };

  const select = (opt) => {
    onChange(opt.value);
    onSelect?.(opt);
    setOpen(false);
    // 선택 후에도 input 에 포커스 유지 — 다음 필드로 Tab 이동 자연스럽게.
    inputRef.current?.focus();
  };

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      if (!open) {
        openAndPosition();
        e.preventDefault();
        return;
      }
      e.preventDefault();
      setActive((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      if (!open) return;
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      if (open && filtered[active]) {
        e.preventDefault();
        select(filtered[active]);
      }
    } else if (e.key === 'Escape') {
      if (open) {
        e.preventDefault();
        setOpen(false);
      }
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <input
        ref={inputRef}
        type="text"
        autoComplete="off"
        spellCheck={false}
        disabled={disabled}
        className={cn(
          'field text-[14px] py-2.5 w-full',
          hasError && 'border-red-500 focus:border-red-500',
          disabled && 'opacity-60 cursor-not-allowed'
        )}
        placeholder={placeholder}
        value={value ?? ''}
        onChange={(e) => {
          onChange(e.target.value);
          if (!open) openAndPosition();
        }}
        onFocus={openAndPosition}
        onKeyDown={onKeyDown}
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={showPopover}
        aria-controls="autocomplete-listbox"
      />
      {showPopover && (
        <div
          id="autocomplete-listbox"
          role="listbox"
          className={cn(
            'absolute z-30 w-full bg-paper border border-ink-200 rounded-lg shadow-lg overflow-hidden',
            direction === 'up' ? 'bottom-full mb-1.5' : 'top-full mt-1.5'
          )}
        >
          <ul
            ref={listRef}
            className="overflow-y-auto py-1 max-h-60"
            tabIndex={-1}
          >
            {filtered.length === 0 ? (
              <li className="px-3.5 py-3 text-[12px] text-ink-500 break-keep leading-relaxed">
                {emptyText}
              </li>
            ) : (
              filtered.map((o, i) => (
                <li key={o.value} data-idx={i}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={i === active}
                    // onMouseDown 으로 처리 — onClick 으로 두면 input blur 가 먼저 발생해
                    // popover 가 닫히면서 select 가 호출되지 않을 수 있음. preventDefault 로
                    // input 포커스 유지.
                    onMouseDown={(e) => {
                      e.preventDefault();
                      select(o);
                    }}
                    onMouseEnter={() => setActive(i)}
                    className={cn(
                      'w-full text-left px-3.5 py-2.5 cursor-pointer break-keep flex items-center justify-between gap-3 transition-colors relative border-l-2 border-transparent',
                      i === active && 'bg-primary-50/60 border-l-primary-500'
                    )}
                  >
                    <div className="min-w-0 flex-1">
                      <div
                        className={cn(
                          'text-[13.5px] truncate',
                          i === active
                            ? 'text-primary-900 font-bold'
                            : 'text-ink-900 font-semibold'
                        )}
                      >
                        {renderHighlight(o.label, value)}
                      </div>
                      {o.sub && (
                        <div className="text-[11.5px] text-ink-500 truncate mt-1 leading-snug">
                          {o.sub}
                        </div>
                      )}
                    </div>
                    {o.badge && (
                      <span
                        className={cn(
                          `badge-${o.badge.tone}`,
                          'text-[10.5px] font-semibold shrink-0'
                        )}
                      >
                        {o.badge.label}
                      </span>
                    )}
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

/**
 * 매칭된 검색어 부분을 primary 톤으로 강조. 대소문자 무시 substring 한 곳만 강조.
 * 검색어 빈 문자열이면 그대로 반환.
 */
function renderHighlight(text, query) {
  const q = (query ?? '').trim();
  if (!q) return text;
  const lower = text.toLowerCase();
  const idx = lower.indexOf(q.toLowerCase());
  if (idx < 0) return text;
  return (
    <>
      {text.slice(0, idx)}
      <span className="text-primary-700 font-bold">
        {text.slice(idx, idx + q.length)}
      </span>
      {text.slice(idx + q.length)}
    </>
  );
}
