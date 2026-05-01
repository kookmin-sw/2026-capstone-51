import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Calendar,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  X as XIcon,
} from 'lucide-react';
import { cn } from '../lib/cn';

/**
 * 커스텀 날짜 선택기 (캘린더 popover) — day / month / year 3 view drill-down.
 *
 * 기본 흐름 (react-datepicker / MUI 표준 패턴):
 *  - 'day' view 에서 헤더 (예: "2026년 05월") 클릭 → 'month' view (해당 연도의 12개월)
 *  - 'month' view 에서 헤더 (예: "2026년") 클릭 → 'year' view (12년 페이지)
 *  - 'year' view 에서 연도 클릭 → 'month' view 로 복귀 (그 연도)
 *  - 'month' view 에서 월 클릭 → 'day' view 로 복귀 (그 연·월)
 *  - 'day' view 에서 날짜 클릭 → 선택 + 닫힘
 *
 * Props:
 *  - value: 'YYYY-MM-DD' 또는 '' (없음)
 *  - onChange(v): 날짜 선택 시 'YYYY-MM-DD' 호출, allowClear 시 '' 호출
 *  - placeholder?: 미선택 시 트리거 텍스트
 *  - hasError?, disabled?, allowClear?
 *  - min?, max?: 선택 가능 범위 ('YYYY-MM-DD'). 범위 밖은 disabled — 모든 view 에 적용.
 *  - forceDirection?: 'down' | 'up'  — 강제 펼침 방향. 미지정 시 viewport 잔여 공간 기반 자동.
 *
 * 동작:
 *  - 트리거 클릭 → 'day' view 로 캘린더 열림. 외부 클릭 / Esc 로 닫힘.
 *  - 백엔드는 'YYYY-MM-DD' 받음 (HTML5 date input 과 호환). 화면 표시는 'YYYY.MM.DD'.
 */
export default function DatePicker({
  value,
  onChange,
  placeholder = '날짜 선택',
  hasError = false,
  disabled = false,
  allowClear = false,
  min,
  max,
  forceDirection,
}) {
  const [open, setOpen] = useState(false);
  const [direction, setDirection] = useState('down');
  const [mode, setMode] = useState('day'); // 'day' | 'month' | 'year'
  const containerRef = useRef(null);

  // 캘린더가 보고 있는 월·연 (사용자가 화살표로 이동, 외부 value 와 별개).
  const initialView = useMemo(() => {
    if (value) {
      const [y, m] = value.split('-').map(Number);
      if (Number.isFinite(y) && Number.isFinite(m)) {
        return { year: y, month: m - 1 };
      }
    }
    const today = new Date();
    return { year: today.getFullYear(), month: today.getMonth() };
  }, [value]);

  const [view, setView] = useState(initialView);

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

  const trigger = () => {
    if (disabled) return;
    if (!open) {
      // 열 때 view 를 현재 value(또는 today) 의 월로 동기화 + 'day' 모드로 시작
      setView(initialView);
      setMode('day');
      if (forceDirection) {
        setDirection(forceDirection);
      } else {
        const rect = containerRef.current?.getBoundingClientRect();
        if (rect) {
          const DROPDOWN_H = 360;
          const below = window.innerHeight - rect.bottom;
          const above = rect.top;
          setDirection(below < DROPDOWN_H && above > below ? 'up' : 'down');
        }
      }
    }
    setOpen((o) => !o);
  };

  const selectDay = (y, m, d) => {
    onChange(fmtIso(y, m, d));
    setOpen(false);
    setMode('day');
  };

  const selectMonth = (m) => {
    setView((v) => ({ ...v, month: m }));
    setMode('day');
  };

  const selectYear = (y) => {
    setView((v) => ({ ...v, year: y }));
    setMode('month');
  };

  // day-view 화살표
  const goPrevMonth = () =>
    setView(({ year, month }) =>
      month === 0 ? { year: year - 1, month: 11 } : { year, month: month - 1 }
    );
  const goNextMonth = () =>
    setView(({ year, month }) =>
      month === 11 ? { year: year + 1, month: 0 } : { year, month: month + 1 }
    );
  // month-view 화살표 (1년 단위)
  const goPrevYear = () => setView((v) => ({ ...v, year: v.year - 1 }));
  const goNextYear = () => setView((v) => ({ ...v, year: v.year + 1 }));
  // year-view 화살표 (12년 페이지 단위)
  const yearBlockStart = useMemo(
    () => Math.floor(view.year / 12) * 12,
    [view.year]
  );
  const goPrevBlock = () => setView((v) => ({ ...v, year: v.year - 12 }));
  const goNextBlock = () => setView((v) => ({ ...v, year: v.year + 12 }));

  const todayIso = useMemo(() => {
    const t = new Date();
    return fmtIso(t.getFullYear(), t.getMonth(), t.getDate());
  }, []);

  // min/max 의 연·월 분해 → nav 비활성화 조건 계산용 (모든 view 의 ◀▶ 에 적용해 미래/과거 진입 자체 차단).
  const minYM = useMemo(
    () =>
      min
        ? { year: Number(min.slice(0, 4)), month: Number(min.slice(5, 7)) - 1 }
        : null,
    [min]
  );
  const maxYM = useMemo(
    () =>
      max
        ? { year: Number(max.slice(0, 4)), month: Number(max.slice(5, 7)) - 1 }
        : null,
    [max]
  );

  // day view ◀▶: 다음/이전 달이 max/min 범위 밖이면 비활성
  const dayNextDisabled =
    !!maxYM &&
    (view.year > maxYM.year ||
      (view.year === maxYM.year && view.month >= maxYM.month));
  const dayPrevDisabled =
    !!minYM &&
    (view.year < minYM.year ||
      (view.year === minYM.year && view.month <= minYM.month));

  // month view ◀▶: 다음/이전 연도가 max/min 범위 밖이면 비활성
  const monthNextDisabled = !!maxYM && view.year >= maxYM.year;
  const monthPrevDisabled = !!minYM && view.year <= minYM.year;

  // year view ◀▶: 다음/이전 12년 페이지가 범위 밖이면 비활성
  const yearNextDisabled = !!maxYM && yearBlockStart + 12 > maxYM.year;
  const yearPrevDisabled = !!minYM && yearBlockStart <= minYM.year;

  const display = value ? value.slice(0, 10).replaceAll('-', '.') : '';

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={trigger}
        disabled={disabled}
        aria-haspopup="dialog"
        aria-expanded={open}
        className={cn(
          'field text-[14px] py-2.5 pr-9 text-left flex items-center justify-between',
          hasError && 'border-red-500 focus:border-red-500',
          disabled && 'opacity-60 cursor-not-allowed',
          !disabled && 'cursor-pointer',
          !value && 'text-ink-400'
        )}
      >
        <span className="truncate tabular-nums">{display || placeholder}</span>
        {allowClear && value && !disabled ? (
          <span
            role="button"
            tabIndex={-1}
            onClick={(e) => {
              e.stopPropagation();
              onChange('');
            }}
            className="absolute right-8 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-700 p-0.5"
            aria-label="날짜 지우기"
          >
            <XIcon size={13} strokeWidth={2.2} />
          </span>
        ) : null}
        <Calendar
          size={15}
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink-400"
        />
      </button>

      {open && (
        <div
          className={cn(
            'absolute z-30 w-[280px] bg-paper border border-ink-200 rounded-md shadow-lg overflow-hidden',
            direction === 'up' ? 'bottom-full mb-1' : 'top-full mt-1'
          )}
          role="dialog"
        >
          {mode === 'day' && (
            <DayView
              view={view}
              value={value}
              todayIso={todayIso}
              min={min}
              max={max}
              onPrev={goPrevMonth}
              onNext={goNextMonth}
              onHeaderClick={() => setMode('month')}
              onPick={selectDay}
              disablePrev={dayPrevDisabled}
              disableNext={dayNextDisabled}
            />
          )}
          {mode === 'month' && (
            <MonthView
              view={view}
              value={value}
              min={min}
              max={max}
              onPrev={goPrevYear}
              onNext={goNextYear}
              onHeaderClick={() => setMode('year')}
              onPick={selectMonth}
              disablePrev={monthPrevDisabled}
              disableNext={monthNextDisabled}
            />
          )}
          {mode === 'year' && (
            <YearView
              view={view}
              blockStart={yearBlockStart}
              value={value}
              todayIso={todayIso}
              min={min}
              max={max}
              onPrev={goPrevBlock}
              onNext={goNextBlock}
              onPick={selectYear}
              disablePrev={yearPrevDisabled}
              disableNext={yearNextDisabled}
            />
          )}

          {/* 푸터: today / clear (모든 view 공통) */}
          <div className="flex items-center justify-between px-2 py-2 border-t border-ink-150 bg-paper">
            <button
              type="button"
              onClick={() => {
                const t = new Date();
                if ((!min || todayIso >= min) && (!max || todayIso <= max)) {
                  selectDay(t.getFullYear(), t.getMonth(), t.getDate());
                }
              }}
              className="text-[12px] font-semibold text-primary-700 hover:text-primary-900 px-2 py-1 rounded"
            >
              오늘
            </button>
            {allowClear && value ? (
              <button
                type="button"
                onClick={() => {
