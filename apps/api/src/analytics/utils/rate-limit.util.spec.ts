import {
  parseMetaRateLimitHeader,
  calculateBackoffMs,
} from './rate-limit.util';

describe('RateLimitUtil', () => {
  describe('parseMetaRateLimitHeader', () => {
    it('returns zeroes when no rate limit header is present', () => {
      const status = parseMetaRateLimitHeader({});
      expect(status.usagePercent).toBe(0);
      expect(status.isThrottled).toBe(false);
      expect(status.estimatedWaitMs).toBe(0);
    });

    it('parses X-Business-Use-Case-Usage format correctly', () => {
      const headerObj = {
        'x-business-use-case-usage': JSON.stringify({
          '123456789': [
            {
              type: 'pages',
              call_count: 85,
              cpu_time: 40,
              total_time: 60,
              estimated_time_to_regain_access: 2,
            },
          ],
        }),
      };

      const status = parseMetaRateLimitHeader(headerObj);
      expect(status.usagePercent).toBe(85);
      expect(status.isThrottled).toBe(true);
      expect(status.estimatedWaitMs).toBe(120000); // 2 minutes in ms
    });

    it('identifies unthrottled usage below 80%', () => {
      const headerObj = {
        'x-business-use-case-usage': JSON.stringify({
          '123456789': [
            {
              type: 'pages',
              call_count: 35,
              cpu_time: 20,
              total_time: 25,
              estimated_time_to_regain_access: 0,
            },
          ],
        }),
      };

      const status = parseMetaRateLimitHeader(headerObj);
      expect(status.usagePercent).toBe(35);
      expect(status.isThrottled).toBe(false);
      expect(status.estimatedWaitMs).toBe(0);
    });

    it('handles malformed JSON gracefully', () => {
      const status = parseMetaRateLimitHeader({
        'x-business-use-case-usage': 'not-json',
      });
      expect(status.usagePercent).toBe(0);
      expect(status.isThrottled).toBe(false);
    });
  });

  describe('calculateBackoffMs', () => {
    it('computes exponential delay with jitter bounded by maxMs', () => {
      const delay0 = calculateBackoffMs(0, 1000, 10000, 500);
      expect(delay0).toBeGreaterThanOrEqual(1000);
      expect(delay0).toBeLessThanOrEqual(1500);

      const delay2 = calculateBackoffMs(2, 1000, 10000, 500);
      expect(delay2).toBeGreaterThanOrEqual(4000);
      expect(delay2).toBeLessThanOrEqual(4500);

      const delayHuge = calculateBackoffMs(10, 1000, 10000, 500);
      expect(delayHuge).toBe(10000); // Capped at maxMs
    });
  });
});
