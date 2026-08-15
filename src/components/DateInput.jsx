import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from '../i18n/useTranslation.js';
import { formatDateInputDisplay } from '../utils/dateFormatUtils.js';

const localeByLanguage = {
  ar: 'ar', de: 'de-DE', en: 'en-GB', es: 'es-ES', fr: 'fr-FR', hi: 'hi-IN',
  id: 'id-ID', it: 'it-IT', ja: 'ja-JP', ko: 'ko-KR', ms: 'ms-MY', ru: 'ru-RU',
  th: 'th-TH', vi: 'vi-VN', zh: 'zh-CN', 'zh-TW': 'zh-TW',
};

const todayLabelByLanguage = {
  de: 'Heute', en: 'Today', es: 'Hoy', fr: "Aujourd’hui", id: 'Hari ini', it: 'Oggi',
  ja: '今日', ko: '오늘', ms: 'Hari ini', ru: 'Сегодня', th: 'วันนี้', vi: 'Hôm nay',
  zh: '今天', 'zh-TW': '今天',
};

function parseDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return null;
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day, 12);
}

function toDateValue(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function monthStart(value, fallback) {
  const date = parseDate(value) || parseDate(fallback) || new Date();
  return new Date(date.getFullYear(), date.getMonth(), 1, 12);
}

export default function DateInput({
  value,
  onChange,
  className = 'input-field',
  placeholder = 'dd/mm/yyyy',
  min,
  max,
  name,
  disabled = false,
  id,
  ...props
}) {
  const { currentLanguage } = useTranslation();
  const locale = localeByLanguage[currentLanguage] || currentLanguage || 'en-GB';
  const displayValue = formatDateInputDisplay(value);
  const [open, setOpen] = useState(false);
  const [viewMonth, setViewMonth] = useState(() => monthStart(value, min));
  const [position, setPosition] = useState({ left: 12, top: 12, width: 352 });
  const triggerRef = useRef(null);
  const dialogRef = useRef(null);

  const updatePosition = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();
    const viewportWidth = document.documentElement.clientWidth;
    const viewportHeight = document.documentElement.clientHeight;
    const width = Math.min(352, viewportWidth - 24);
    const isMobile = viewportWidth < 640;
    const left = isMobile ? 12 : Math.min(Math.max(12, rect.left), viewportWidth - width - 12);
    const calendarHeight = 510;
    const fitsBelow = rect.bottom + calendarHeight + 12 <= window.innerHeight;
    const top = isMobile
      ? Math.max(12, viewportHeight - calendarHeight - 12)
      : fitsBelow ? rect.bottom + 10 : Math.max(12, rect.top - calendarHeight - 10);
    setPosition({ left, top, width });
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    setViewMonth(monthStart(value, min));
    updatePosition();
    const closeOnOutsideClick = (event) => {
      if (!triggerRef.current?.contains(event.target) && !dialogRef.current?.contains(event.target)) setOpen(false);
    };
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    const reposition = () => updatePosition();
    document.addEventListener('pointerdown', closeOnOutsideClick);
    document.addEventListener('keydown', closeOnEscape);
    window.addEventListener('resize', reposition);
    window.addEventListener('scroll', reposition, true);
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsideClick);
      document.removeEventListener('keydown', closeOnEscape);
      window.removeEventListener('resize', reposition);
      window.removeEventListener('scroll', reposition, true);
    };
  }, [min, open, updatePosition, value]);

  const weekDays = useMemo(() => {
    const monday = new Date(2024, 0, 1, 12);
    return Array.from({ length: 7 }, (_, index) =>
      new Intl.DateTimeFormat(locale, { weekday: 'narrow' }).format(new Date(2024, 0, 1 + index, 12))
    );
  }, [locale]);

  const days = useMemo(() => {
    const year = viewMonth.getFullYear();
    const month = viewMonth.getMonth();
    const firstWeekday = (new Date(year, month, 1, 12).getDay() + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0, 12).getDate();
    return [
      ...Array.from({ length: firstWeekday }, () => null),
      ...Array.from({ length: daysInMonth }, (_, index) => new Date(year, month, index + 1, 12)),
    ];
  }, [viewMonth]);

  const selectedValue = value || '';
  const todayValue = toDateValue(new Date());
  const monthLabel = new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(viewMonth);
  const minMonth = min ? monthStart(min) : null;
  const maxMonth = max ? monthStart(max) : null;
  const canGoPrevious = !minMonth || viewMonth > minMonth;
  const canGoNext = !maxMonth || viewMonth < maxMonth;

  const chooseDate = (nextValue) => {
    onChange?.({ target: { name, value: nextValue }, currentTarget: { name, value: nextValue } });
    setOpen(false);
    window.requestAnimationFrame(() => triggerRef.current?.focus());
  };

  const calendar = open ? createPortal(
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label={monthLabel}
      className="lune-calendar-popover fixed z-[9999] max-h-[calc(100dvh-24px)] overflow-y-auto overflow-x-hidden rounded-3xl border border-[#d8c8ad] bg-[#fffdf8] shadow-[0_28px_80px_rgba(40,29,20,0.28)]"
      style={{ left: position.left, top: position.top, width: position.width }}
    >
      <div className="bg-gradient-to-br from-[#30251d] to-[#4b382a] px-5 pb-5 pt-4 text-white">
        <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#d8b77a]">Lune Boutique</p>
        <div className="mt-3 flex items-center justify-between gap-3">
          <button
            type="button"
            className="grid h-10 w-10 place-items-center rounded-full border border-white/20 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-25"
            disabled={!canGoPrevious}
            aria-label="Previous month"
            onClick={() => setViewMonth((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1, 12))}
          >
            <ChevronLeft className="h-5 w-5" aria-hidden="true" />
          </button>
          <strong className="font-display text-xl capitalize tracking-wide">{monthLabel}</strong>
          <button
            type="button"
            className="grid h-10 w-10 place-items-center rounded-full border border-white/20 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-25"
            disabled={!canGoNext}
            aria-label="Next month"
            onClick={() => setViewMonth((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1, 12))}
          >
            <ChevronRight className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className="p-4">
        <div className="grid grid-cols-7 pb-2" aria-hidden="true">
          {weekDays.map((day, index) => (
            <span key={`${day}-${index}`} className="grid h-8 place-items-center text-[10px] font-extrabold uppercase text-stone-400">{day}</span>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-y-1">
          {days.map((date, index) => {
            if (!date) return <span key={`empty-${index}`} className="h-10" aria-hidden="true" />;
            const dateValue = toDateValue(date);
            const isSelected = dateValue === selectedValue;
            const isToday = dateValue === todayValue;
            const isDisabled = (min && dateValue < min) || (max && dateValue > max);
            return (
              <button
                key={dateValue}
                type="button"
                disabled={isDisabled}
                aria-pressed={isSelected}
                aria-label={new Intl.DateTimeFormat(locale, { dateStyle: 'full' }).format(date)}
                className={`mx-auto grid h-10 w-10 place-items-center rounded-full text-sm font-semibold transition ${
                  isSelected
                    ? 'bg-[#8b6834] text-white shadow-[0_8px_18px_rgba(139,104,52,0.35)]'
                    : isToday
                      ? 'border border-[#b08a4b] bg-[#f5ede0] text-[#6d4f25] hover:bg-[#e9dcc6]'
                      : 'text-stone-700 hover:bg-[#f1e7d8] hover:text-[#6d4f25]'
                } disabled:cursor-not-allowed disabled:text-stone-300 disabled:hover:bg-transparent`}
                onClick={() => chooseDate(dateValue)}
              >
                {date.getDate()}
              </button>
            );
          })}
        </div>
        {(!min || todayValue >= min) && (!max || todayValue <= max) ? (
          <div className="mt-3 border-t border-stone-200 pt-3 text-center">
            <button type="button" className="rounded-full px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] text-[#8b6834] transition hover:bg-[#f1e7d8]" onClick={() => chooseDate(todayValue)}>
              {todayLabelByLanguage[currentLanguage] || 'Today'}
            </button>
          </div>
        ) : null}
      </div>
    </div>,
    document.body,
  ) : null;

  return (
    <>
      <button
        {...props}
        ref={triggerRef}
        id={id}
        type="button"
        disabled={disabled}
        aria-haspopup="dialog"
        aria-expanded={open}
        className={`relative flex items-center text-left ${className}`}
        onClick={() => !disabled && setOpen((current) => !current)}
      >
        <span className={`block min-w-0 flex-1 truncate ${displayValue ? 'text-lune-ink' : 'text-stone-400'}`}>
          {displayValue || placeholder}
        </span>
        <ChevronDown className={`ml-2 h-4 w-4 shrink-0 text-[#8b6834] transition ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
      </button>
      <input type="hidden" name={name} value={value || ''} />
      {calendar}
    </>
  );
}
