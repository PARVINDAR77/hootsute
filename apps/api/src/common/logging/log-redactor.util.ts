/**
 * Log Redactor Utility
 * Recursively redacts secrets, credentials, tokens, passwords, and sensitive keys
 * from logs, exception metadata, and request objects.
 */

const SENSITIVE_KEY_PATTERNS = [
  /password/i,
  /secret/i,
  /token/i,
  /authorization/i,
  /bearer/i,
  /jwt/i,
  /cookie/i,
  /session/i,
  /encryption.*key/i,
  /private.*key/i,
  /client.*secret/i,
  /webhook.*verify/i,
  /api.*key/i,
  /credit.*card/i,
];

const JWT_REGEX = /eyJ[A-Za-z0-9-_]+\.eyJ[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+/g;
const BEARER_REGEX = /Bearer\s+[A-Za-z0-9\-._~+/]+=*/gi;
const URL_CREDENTIALS_REGEX = /:\/\/[^:]+:([^@]+)@/g;

export function isSensitiveKey(key: string): boolean {
  return SENSITIVE_KEY_PATTERNS.some((pattern) => pattern.test(key));
}

export function sanitizeString(val: string): string {
  if (!val || typeof val !== 'string') return val;

  let sanitized = val.replace(BEARER_REGEX, 'Bearer [REDACTED]');
  sanitized = sanitized.replace(JWT_REGEX, '[REDACTED_JWT]');
  sanitized = sanitized.replace(URL_CREDENTIALS_REGEX, '://***:***@');

  return sanitized;
}

export function redactSensitiveData(data: any, depth = 0, seen = new WeakSet()): any {
  if (data === null || data === undefined) {
    return data;
  }

  // Primitive types
  if (typeof data === 'string') {
    return sanitizeString(data);
  }

  if (typeof data !== 'object') {
    return data;
  }

  // Guard against excessive recursion
  if (depth > 8) {
    return '[TRUNCATED_DEPTH]';
  }

  // Guard against circular references
  if (seen.has(data)) {
    return '[CIRCULAR]';
  }
  seen.add(data);

  // Error instances
  if (data instanceof Error) {
    return {
      name: data.name,
      message: sanitizeString(data.message),
      stack: sanitizeString(data.stack || ''),
    };
  }

  // Arrays
  if (Array.isArray(data)) {
    return data.map((item) => redactSensitiveData(item, depth + 1, seen));
  }

  // Plain objects
  const output: Record<string, any> = {};

  for (const [key, value] of Object.entries(data)) {
    if (isSensitiveKey(key)) {
      output[key] = '[REDACTED]';
    } else if (typeof value === 'string') {
      output[key] = sanitizeString(value);
    } else if (typeof value === 'object' && value !== null) {
      output[key] = redactSensitiveData(value, depth + 1, seen);
    } else {
      output[key] = value;
    }
  }

  return output;
}
