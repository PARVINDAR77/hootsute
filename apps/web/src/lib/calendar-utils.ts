export interface CalendarDay {
  date: Date;
  dateKey: string; // YYYY-MM-DD
  isCurrentMonth: boolean;
  isToday: boolean;
  dayNumber: number;
}

export function formatDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function isSameDay(d1: Date | string, d2: Date | string): boolean {
  const date1 = typeof d1 === 'string' ? new Date(d1) : d1;
  const date2 = typeof d2 === 'string' ? new Date(d2) : d2;
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

export function isToday(d: Date | string): boolean {
  return isSameDay(d, new Date());
}

export function getMonthMatrix(year: number, month: number): CalendarDay[] {
  // month is 0-indexed (0 = Jan, 11 = Dec)
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);

  // Day of week: 0 = Sun, 1 = Mon, ..., 6 = Sat
  const startDayOfWeek = firstDayOfMonth.getDay();
  const totalDaysInMonth = lastDayOfMonth.getDate();

  const days: CalendarDay[] = [];

  // Previous month trailing days
  const prevMonthLastDay = new Date(year, month, 0).getDate();
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    const d = new Date(year, month - 1, prevMonthLastDay - i);
    days.push({
      date: d,
      dateKey: formatDateKey(d),
      isCurrentMonth: false,
      isToday: isToday(d),
      dayNumber: d.getDate(),
    });
  }

  // Current month days
  for (let day = 1; day <= totalDaysInMonth; day++) {
    const d = new Date(year, month, day);
    days.push({
      date: d,
      dateKey: formatDateKey(d),
      isCurrentMonth: true,
      isToday: isToday(d),
      dayNumber: day,
    });
  }

  // Next month leading days to complete full grid (multiple of 7: 35 or 42)
  const remaining = (7 - (days.length % 7)) % 7;
  for (let i = 1; i <= remaining; i++) {
    const d = new Date(year, month + 1, i);
    days.push({
      date: d,
      dateKey: formatDateKey(d),
      isCurrentMonth: false,
      isToday: isToday(d),
      dayNumber: i,
    });
  }

  // If grid is 35 and month ends early, keep 35 or 42
  while (days.length < 35) {
    const nextDayNum = days.length - totalDaysInMonth - startDayOfWeek + 1;
    const d = new Date(year, month + 1, nextDayNum);
    days.push({
      date: d,
      dateKey: formatDateKey(d),
      isCurrentMonth: false,
      isToday: isToday(d),
      dayNumber: nextDayNum,
    });
  }

  return days;
}

export function getWeekDays(baseDate: Date): CalendarDay[] {
  const current = new Date(baseDate);
  const dayOfWeek = current.getDay(); // 0 = Sun
  const startOfWeek = new Date(current);
  startOfWeek.setDate(current.getDate() - dayOfWeek);

  const days: CalendarDay[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    days.push({
      date: d,
      dateKey: formatDateKey(d),
      isCurrentMonth: d.getMonth() === baseDate.getMonth(),
      isToday: isToday(d),
      dayNumber: d.getDate(),
    });
  }

  return days;
}

export function formatTime(dateStr: string, timezone?: string): string {
  try {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat(undefined, {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: timezone || undefined,
    }).format(date);
  } catch {
    return dateStr;
  }
}

export function formatShortDate(dateStr: string, timezone?: string): string {
  try {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat(undefined, {
      month: 'short',
      day: 'numeric',
      timeZone: timezone || undefined,
    }).format(date);
  } catch {
    return dateStr;
  }
}

export function formatFullDateTime(dateStr: string, timezone?: string): string {
  try {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: timezone || undefined,
    }).format(date);
  } catch {
    return dateStr;
  }
}

export const STATUS_UI_CONFIG: Record<
  string,
  { label: string; bg: string; text: string; border: string; dot: string }
> = {
  SCHEDULED: {
    label: 'Scheduled',
    bg: 'bg-indigo-50',
    text: 'text-indigo-700',
    border: 'border-indigo-200',
    dot: 'bg-indigo-500',
  },
  PROCESSING: {
    label: 'Processing',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
    dot: 'bg-amber-500 animate-pulse',
  },
  PUBLISHING: {
    label: 'Publishing',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
    dot: 'bg-amber-500 animate-pulse',
  },
  PUBLISHED: {
    label: 'Published',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    dot: 'bg-emerald-500',
  },
  PARTIALLY_PUBLISHED: {
    label: 'Partial',
    bg: 'bg-orange-50',
    text: 'text-orange-700',
    border: 'border-orange-200',
    dot: 'bg-orange-500',
  },
  FAILED: {
    label: 'Failed',
    bg: 'bg-rose-50',
    text: 'text-rose-700',
    border: 'border-rose-200',
    dot: 'bg-rose-500',
  },
  NEEDS_REAPPROVAL: {
    label: 'Needs Re-approval',
    bg: 'bg-purple-50',
    text: 'text-purple-700',
    border: 'border-purple-200',
    dot: 'bg-purple-500',
  },
  CANCELLED: {
    label: 'Cancelled',
    bg: 'bg-slate-100',
    text: 'text-slate-600',
    border: 'border-slate-200',
    dot: 'bg-slate-400',
  },
};

export const TARGET_STATUS_UI_CONFIG: Record<
  string,
  { label: string; bg: string; text: string; border: string }
> = {
  PENDING: {
    label: 'Pending',
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    border: 'border-slate-200',
  },
  DISPATCHING: {
    label: 'Dispatching',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
  },
  PUBLISHED: {
    label: 'Published',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
  },
  FAILED: {
    label: 'Failed',
    bg: 'bg-rose-50',
    text: 'text-rose-700',
    border: 'border-rose-200',
  },
  AMBIGUOUS_TIMEOUT: {
    label: 'Reconciliation Needed',
    bg: 'bg-amber-100',
    text: 'text-amber-800',
    border: 'border-amber-300',
  },
};
