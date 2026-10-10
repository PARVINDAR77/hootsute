import {
  getMonthMatrix,
  getWeekDays,
  formatDateKey,
  isSameDay,
  isToday,
  formatTime,
  STATUS_UI_CONFIG,
  TARGET_STATUS_UI_CONFIG,
} from '../lib/calendar-utils';

describe('Calendar Utilities', () => {
  describe('formatDateKey', () => {
    it('formats dates as YYYY-MM-DD', () => {
      const d = new Date(2026, 9, 15); // October 15, 2026
      expect(formatDateKey(d)).toBe('2026-10-15');
    });

    it('zero-pads single-digit month and day', () => {
      const d = new Date(2026, 0, 5); // January 5, 2026
      expect(formatDateKey(d)).toBe('2026-01-05');
    });
  });

  describe('isSameDay & isToday', () => {
    it('correctly compares two dates on the same day', () => {
      const d1 = new Date(2026, 9, 15, 10, 30);
      const d2 = new Date(2026, 9, 15, 18, 45);
      expect(isSameDay(d1, d2)).toBe(true);
    });

    it('returns false for different days', () => {
      const d1 = new Date(2026, 9, 15);
      const d2 = new Date(2026, 9, 16);
      expect(isSameDay(d1, d2)).toBe(false);
    });

    it('identifies today accurately', () => {
      const now = new Date();
      expect(isToday(now)).toBe(true);

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      expect(isToday(yesterday)).toBe(false);
    });
  });

  describe('getMonthMatrix', () => {
    it('generates a full calendar grid (multiple of 7: 35 or 42 days) for October 2026', () => {
      const days = getMonthMatrix(2026, 9); // October 2026 (0-indexed: 9 = Oct)

      expect(days.length % 7).toBe(0);
      expect(days.length).toBeGreaterThanOrEqual(35);

      // October has 31 days
      const currentMonthDays = days.filter((d) => d.isCurrentMonth);
      expect(currentMonthDays.length).toBe(31);

      // Check first day of month is Oct 1
      const oct1 = currentMonthDays[0];
      expect(oct1.dayNumber).toBe(1);
      expect(oct1.dateKey).toBe('2026-10-01');

      // Check last day of month is Oct 31
      const oct31 = currentMonthDays[30];
      expect(oct31.dayNumber).toBe(31);
      expect(oct31.dateKey).toBe('2026-10-31');
    });

    it('correctly pads leading days from previous month', () => {
      const days = getMonthMatrix(2026, 9);
      // Oct 1, 2026 is a Thursday (index 4 in Sun-Sat)
      // So there should be 4 leading days from September (Sep 27, 28, 29, 30)
      const leadingDays = days.filter((d, idx) => !d.isCurrentMonth && idx < 7);
      expect(leadingDays.length).toBe(4);
      expect(leadingDays[leadingDays.length - 1].dateKey).toBe('2026-09-30');
    });
  });

  describe('getWeekDays', () => {
    it('generates 7 days for any given date within the week', () => {
      const testDate = new Date(2026, 9, 15); // Thursday Oct 15, 2026
      const week = getWeekDays(testDate);

      expect(week.length).toBe(7);
      // First day should be Sunday Oct 11, 2026
      expect(week[0].dateKey).toBe('2026-10-11');
      // Thursday should be index 4
      expect(week[4].dateKey).toBe('2026-10-15');
      // Last day should be Saturday Oct 17, 2026
      expect(week[6].dateKey).toBe('2026-10-17');
    });
  });

  describe('UI Status Config Mapping', () => {
    it('contains styles for all scheduled post lifecycle statuses', () => {
      const expectedStatuses = [
        'SCHEDULED',
        'PUBLISHING',
        'PUBLISHED',
        'PARTIALLY_PUBLISHED',
        'FAILED',
        'NEEDS_REAPPROVAL',
        'CANCELLED',
      ];

      expectedStatuses.forEach((status) => {
        const config = STATUS_UI_CONFIG[status];
        expect(config).toBeDefined();
        expect(config.label).toBeTruthy();
        expect(config.bg).toBeTruthy();
        expect(config.text).toBeTruthy();
      });
    });

    it('contains styles for all target statuses including AMBIGUOUS_TIMEOUT', () => {
      const targetStatuses = [
        'PENDING',
        'DISPATCHING',
        'PUBLISHED',
        'FAILED',
        'AMBIGUOUS_TIMEOUT',
      ];

      targetStatuses.forEach((status) => {
        const config = TARGET_STATUS_UI_CONFIG[status];
        expect(config).toBeDefined();
        expect(config.label).toBeTruthy();
      });

      expect(TARGET_STATUS_UI_CONFIG['AMBIGUOUS_TIMEOUT'].label).toBe('Reconciliation Needed');
    });
  });
});
