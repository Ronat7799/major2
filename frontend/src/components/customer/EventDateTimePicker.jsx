import { useEffect, useRef, useState } from 'react';

const WEEKDAYS = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];

function buildTimeOptions() {
  const options = [];
  for (let hour = 0; hour < 24; hour += 1) {
    for (const minute of [0, 30]) {
      const period = hour < 12 ? 'AM' : 'PM';
      const displayHour = hour % 12 === 0 ? 12 : hour % 12;
      options.push(`${String(displayHour).padStart(2, '0')}:${String(minute).padStart(2, '0')} ${period}`);
    }
  }
  return options;
}

const TIME_OPTIONS = buildTimeOptions();

function isSameDay(a, b) {
  return Boolean(a) && Boolean(b) && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function startOfToday() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function buildCalendarDays(viewYear, viewMonth) {
  const startWeekday = new Date(viewYear, viewMonth, 1).getDay();
  const days = [];
  for (let i = 0; i < 42; i += 1) {
    days.push(new Date(viewYear, viewMonth, i - startWeekday + 1));
  }
  return days;
}

function formatMonthYear(date) {
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

function formatShortDate(date) {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function ChevronLeftIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" aria-hidden="true">
      <path d="M12 4.5 6.5 10l5.5 5.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" aria-hidden="true">
      <path d="M8 4.5 13.5 10 8 15.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ChevronDownIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4 shrink-0" fill="none" aria-hidden="true">
      <path d="M5 8l5 5 5-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CalendarIcon({ className = 'h-4 w-4' }) {
  return (
    <svg viewBox="0 0 20 20" className={className} fill="none" aria-hidden="true">
      <rect x="3" y="4.5" width="14" height="12.5" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M3 8h14M6.5 2.5v3M13.5 2.5v3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function TimeSelect({ label, value, onChange }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-black/40">{label}</span>
      <div className="relative">
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="ui-yellow-border w-full appearance-none rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 pr-9 text-sm font-semibold text-black outline-none transition-colors duration-200"
        >
          {TIME_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-black/40">
          <ChevronDownIcon />
        </span>
      </div>
    </label>
  );
}

function toDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function EventDateTimePicker({
  value,
  onChange,
  placeholder = 'Select event date & time',
  minDate,
  unavailableDates,
}) {
  const wrapperRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [viewDate, setViewDate] = useState(() => value.date || minDate || startOfToday());
  const [tempDate, setTempDate] = useState(value.date);
  const [tempStart, setTempStart] = useState(value.startTime);
  const [tempEnd, setTempEnd] = useState(value.endTime);

  const today = startOfToday();
  const earliestSelectable = minDate || today;
  const unavailableSet = unavailableDates instanceof Set ? unavailableDates : new Set(unavailableDates || []);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    function handlePointerDown(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setOpen(false);
      }
    }

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    }

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  function openPicker() {
    setTempDate(value.date);
    setTempStart(value.startTime);
    setTempEnd(value.endTime);
    setViewDate(value.date || startOfToday());
    setOpen(true);
  }

  function changeMonth(delta) {
    setViewDate((current) => new Date(current.getFullYear(), current.getMonth() + delta, 1));
  }

  function handleConfirm() {
    onChange({ date: tempDate, startTime: tempStart, endTime: tempEnd });
    setOpen(false);
  }

  const days = buildCalendarDays(viewDate.getFullYear(), viewDate.getMonth());
  const hasValue = Boolean(value.date);

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        onClick={openPicker}
        className={`ui-yellow-border flex w-full items-center justify-between rounded-xl border px-4 py-3.5 text-left text-sm outline-none transition-colors duration-200 ${
          open ? 'border-[#F5C400]' : 'border-gray-200'
        } bg-white`}
      >
        <span className={hasValue ? 'font-semibold text-black' : 'text-black/35'}>
          {hasValue ? `${formatShortDate(value.date)} · ${value.startTime} – ${value.endTime}` : placeholder}
        </span>
        <CalendarIcon className="h-4 w-4 shrink-0 text-black/35" />
      </button>

      {open ? (
        <div className="absolute left-0 top-full z-30 mt-2 w-[340px] max-w-[92vw] rounded-2xl border border-gray-100 bg-white p-5 shadow-xl sm:w-[380px] sm:p-6">
          <div className="flex items-center justify-between">
            <p className="text-base font-bold text-black">{formatMonthYear(viewDate)}</p>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => changeMonth(-1)}
                aria-label="Previous month"
                className="flex h-8 w-8 items-center justify-center rounded-full text-black/60 transition-colors duration-150 hover:bg-gray-100 hover:text-black"
              >
                <ChevronLeftIcon />
              </button>
              <button
                type="button"
                onClick={() => changeMonth(1)}
                aria-label="Next month"
                className="flex h-8 w-8 items-center justify-center rounded-full text-black/60 transition-colors duration-150 hover:bg-gray-100 hover:text-black"
              >
                <ChevronRightIcon />
              </button>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-7 gap-y-1 text-center">
            {WEEKDAYS.map((day) => (
              <span key={day} className="text-[11px] font-semibold uppercase tracking-wide text-black/35">
                {day}
              </span>
            ))}
          </div>

          <div className="mt-1 grid grid-cols-7 gap-y-1 text-center">
            {days.map((date) => {
              const inMonth = date.getMonth() === viewDate.getMonth();
              const isSelected = isSameDay(date, tempDate);
              const isToday = isSameDay(date, today);
              const isTooSoon = date < earliestSelectable;
              const isBooked = !isTooSoon && unavailableSet.has(toDateKey(date));
              const isDisabled = isTooSoon || isBooked;

              return (
                <div key={date.toISOString()} className="flex items-center justify-center py-0.5">
                  <button
                    type="button"
                    disabled={isDisabled}
                    title={isBooked ? 'This vendor is already booked on this date' : undefined}
                    onClick={() => setTempDate(date)}
                    className={`relative flex h-9 w-9 items-center justify-center rounded-full text-sm transition-colors duration-150 ${
                      isSelected
                        ? 'ui-yellow font-bold text-black'
                        : isDisabled
                          ? 'cursor-not-allowed text-black/20 line-through decoration-black/15'
                          : inMonth
                            ? `text-black hover:bg-gray-100 ${isToday ? 'font-bold' : 'font-medium'}`
                            : 'text-black/25 hover:bg-gray-50'
                    }`}
                  >
                    {date.getDate()}
                  </button>
                </div>
              );
            })}
          </div>

          <div className="mt-5 grid grid-cols-2 gap-4 border-t border-gray-100 pt-5">
            <TimeSelect label="Start Time" value={tempStart} onChange={setTempStart} />
            <TimeSelect label="End Time" value={tempEnd} onChange={setTempEnd} />
          </div>

          <button
            type="button"
            onClick={handleConfirm}
            disabled={!tempDate}
            className="ui-yellow ui-yellow-hover mt-6 w-full rounded-full py-3.5 text-sm font-bold text-black transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none"
          >
            Confirm Date &amp; Time
          </button>
        </div>
      ) : null}
    </div>
  );
}
