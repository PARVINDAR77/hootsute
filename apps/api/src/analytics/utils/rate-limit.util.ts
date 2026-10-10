/**
 * Utility for parsing Meta Graph API rate-limit headers and computing exponential backoff with jitter.
 */

export interface RateLimitStatus {
  usagePercent: number;
  isThrottled: boolean;
  estimatedWaitMs: number;
}

/**
 * Parses Meta's X-Business-Use-Case-Usage or X-App-Usage header to determine max resource utilization.
 */
export function parseMetaRateLimitHeader(
  headers: Headers | Record<string, string | string[] | undefined>,
): RateLimitStatus {
  let usageHeader: string | null = null;

  if (typeof (headers as any).get === 'function') {
    usageHeader =
      (headers as Headers).get('x-business-use-case-usage') ||
      (headers as Headers).get('x-app-usage') ||
      null;
  } else {
    const raw =
      (headers as any)['x-business-use-case-usage'] ||
      (headers as any)['x-app-usage'];
    if (Array.isArray(raw)) usageHeader = raw[0];
    else if (typeof raw === 'string') usageHeader = raw;
  }

  if (!usageHeader) {
    return { usagePercent: 0, isThrottled: false, estimatedWaitMs: 0 };
  }

  try {
    const parsed = JSON.parse(usageHeader);
    let maxPercent = 0;
    let waitMinutes = 0;

    // Structure 1: Object with account ID keys mapping to array of metrics
    // e.g. {"123456":[{"call_count":82,"cpu_time":45,"total_time":60,"estimated_time_to_regain_access":5}]}
    if (typeof parsed === 'object' && parsed !== null) {
      for (const key of Object.keys(parsed)) {
        const item = parsed[key];
        if (Array.isArray(item)) {
          for (const metric of item) {
            maxPercent = Math.max(
              maxPercent,
              metric.call_count || 0,
              metric.cpu_time || 0,
              metric.total_time || 0,
            );
            if (metric.estimated_time_to_regain_access) {
              waitMinutes = Math.max(waitMinutes, metric.estimated_time_to_regain_access);
            }
          }
        } else if (typeof item === 'number') {
          maxPercent = Math.max(maxPercent, item);
        }
      }
    }

    const isThrottled = maxPercent >= 80;
    const estimatedWaitMs = waitMinutes > 0 ? waitMinutes * 60 * 1000 : isThrottled ? 5000 : 0;

    return {
      usagePercent: maxPercent,
      isThrottled,
      estimatedWaitMs,
    };
  } catch {
    return { usagePercent: 0, isThrottled: false, estimatedWaitMs: 0 };
  }
}

/**
 * Computes exponential backoff with randomized jitter to prevent thundering herds.
 */
export function calculateBackoffMs(
  attempt: number,
  baseMs: number = 1000,
  maxMs: number = 30000,
  jitterMs: number = 1000,
): number {
  const exponential = baseMs * Math.pow(2, attempt);
  const jitter = Math.floor(Math.random() * jitterMs);
  return Math.min(maxMs, exponential + jitter);
}
