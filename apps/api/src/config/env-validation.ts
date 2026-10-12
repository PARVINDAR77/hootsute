const INSECURE_DEFAULT_SECRETS = new Set([
  'dev-jwt-access-secret-minimum-32-characters-required',
  'dev-jwt-refresh-secret-minimum-32-characters-required',
  'dev-jwt-access-secret-minimum-32-characters-required-for-security',
  'dev-jwt-refresh-secret-minimum-32-characters-required-for-security',
  'replace-with-64-character-hex-string-for-aes-256-gcm-encryption',
  'dev-action-secret-minimum-32-characters-required',
  'omnisocial_wa_verify_token',
  'omnisocial_meta_social_verify_token',
  'secret',
  'password',
  'changeme',
]);

const HEX_64_REGEX = /^[0-9a-fA-F]{64}$/;

export interface ValidationIssue {
  variable: string;
  reason: string;
}

/**
 * Validates the environment configuration with fail-closed production rules.
 * Throws a detailed error on invalid or insecure configuration.
 */
export function validateEnvironment(config: Record<string, any>): Record<string, any> {
  const issues: ValidationIssue[] = [];
  const nodeEnv = (config.NODE_ENV || 'development').toLowerCase();
  const isProduction = nodeEnv === 'production';

  // 1. Validate Database URL
  const databaseUrl = config.DATABASE_URL;
  if (!databaseUrl || typeof databaseUrl !== 'string' || databaseUrl.trim().length === 0) {
    if (isProduction || nodeEnv !== 'test') {
      issues.push({
        variable: 'DATABASE_URL',
        reason: 'DATABASE_URL is required and must not be empty.',
      });
    }
  }

  // 2. Validate Token Encryption Key
  const tokenKey = config.TOKEN_ENCRYPTION_KEY;
  if (tokenKey) {
    if (tokenKey.length === 64) {
      if (!HEX_64_REGEX.test(tokenKey)) {
        issues.push({
          variable: 'TOKEN_ENCRYPTION_KEY',
          reason: '64-character TOKEN_ENCRYPTION_KEY must be a valid hexadecimal string.',
        });
      }
    } else if (tokenKey.length < 32) {
      issues.push({
        variable: 'TOKEN_ENCRYPTION_KEY',
        reason: 'TOKEN_ENCRYPTION_KEY must be either 64-character hex or at least 32 characters for key derivation.',
      });
    }

    if (INSECURE_DEFAULT_SECRETS.has(tokenKey)) {
      issues.push({
        variable: 'TOKEN_ENCRYPTION_KEY',
        reason: 'TOKEN_ENCRYPTION_KEY cannot use the placeholder default from .env.example.',
      });
    }
  } else if (isProduction) {
    issues.push({
      variable: 'TOKEN_ENCRYPTION_KEY',
      reason: 'TOKEN_ENCRYPTION_KEY is required in production (ephemeral fallback keys are prohibited).',
    });
  }

  // 2b. Validate Fallback Encryption Key (if provided)
  const fallbackTokenKey = config.TOKEN_ENCRYPTION_KEY_FALLBACK;
  if (fallbackTokenKey && fallbackTokenKey.trim().length > 0) {
    if (fallbackTokenKey === tokenKey) {
      issues.push({
        variable: 'TOKEN_ENCRYPTION_KEY_FALLBACK',
        reason: 'TOKEN_ENCRYPTION_KEY_FALLBACK must be distinct from the primary TOKEN_ENCRYPTION_KEY.',
      });
    }
    if (fallbackTokenKey.length === 64 && !HEX_64_REGEX.test(fallbackTokenKey)) {
      issues.push({
        variable: 'TOKEN_ENCRYPTION_KEY_FALLBACK',
        reason: '64-character TOKEN_ENCRYPTION_KEY_FALLBACK must be a valid hexadecimal string.',
      });
    }
  }

  // 3. Validate JWT Secrets in Production
  const jwtAccessSecret = config.JWT_ACCESS_SECRET;
  const jwtRefreshSecret = config.JWT_REFRESH_SECRET;

  if (isProduction) {
    if (!jwtAccessSecret || jwtAccessSecret.length < 32) {
      issues.push({
        variable: 'JWT_ACCESS_SECRET',
        reason: 'JWT_ACCESS_SECRET must be at least 32 characters long in production.',
      });
    } else if (INSECURE_DEFAULT_SECRETS.has(jwtAccessSecret)) {
      issues.push({
        variable: 'JWT_ACCESS_SECRET',
        reason: 'JWT_ACCESS_SECRET cannot use an insecure development default in production.',
      });
    }

    if (!jwtRefreshSecret || jwtRefreshSecret.length < 32) {
      issues.push({
        variable: 'JWT_REFRESH_SECRET',
        reason: 'JWT_REFRESH_SECRET must be at least 32 characters long in production.',
      });
    } else if (INSECURE_DEFAULT_SECRETS.has(jwtRefreshSecret)) {
      issues.push({
        variable: 'JWT_REFRESH_SECRET',
        reason: 'JWT_REFRESH_SECRET cannot use an insecure development default in production.',
      });
    }

    if (jwtAccessSecret && jwtRefreshSecret && jwtAccessSecret === jwtRefreshSecret) {
      issues.push({
        variable: 'JWT_REFRESH_SECRET',
        reason: 'JWT_REFRESH_SECRET must be distinct from JWT_ACCESS_SECRET.',
      });
    }
  }

  // 4. Validate Webhook Secrets in Production
  if (isProduction) {
    const metaAppId = config.META_APP_ID;
    const metaAppSecret = config.META_APP_SECRET;
    const metaVerifyToken = config.META_WEBHOOK_VERIFY_TOKEN;

    if (metaAppId && (!metaAppSecret || metaAppSecret.trim().length === 0)) {
      issues.push({
        variable: 'META_APP_SECRET',
        reason: 'META_APP_SECRET must be configured in production when META_APP_ID is set.',
      });
    }

    if (metaVerifyToken && INSECURE_DEFAULT_SECRETS.has(metaVerifyToken)) {
      issues.push({
        variable: 'META_WEBHOOK_VERIFY_TOKEN',
        reason: 'META_WEBHOOK_VERIFY_TOKEN cannot use default development token in production.',
      });
    }

    const waProvider = (config.WHATSAPP_PROVIDER || '').toLowerCase();
    if (waProvider === 'meta') {
      const waSecret = config.META_WHATSAPP_APP_SECRET;
      const waVerifyToken = config.META_WHATSAPP_VERIFY_TOKEN;

      if (!waSecret || waSecret.trim().length === 0) {
        issues.push({
          variable: 'META_WHATSAPP_APP_SECRET',
          reason: 'META_WHATSAPP_APP_SECRET is required when WHATSAPP_PROVIDER is "meta" in production.',
        });
      }

      if (waVerifyToken && INSECURE_DEFAULT_SECRETS.has(waVerifyToken)) {
        issues.push({
          variable: 'META_WHATSAPP_VERIFY_TOKEN',
          reason: 'META_WHATSAPP_VERIFY_TOKEN cannot use default development token in production.',
        });
      }
    }

    // 5. Validate CORS & Cookie in Production
    const corsOrigin = config.CORS_ORIGIN;
    if (corsOrigin === '*' || (corsOrigin && corsOrigin.includes('localhost'))) {
      issues.push({
        variable: 'CORS_ORIGIN',
        reason: 'CORS_ORIGIN must not be wildcard "*" or reference "localhost" in production.',
      });
    }

    // 6. Validate Media Storage in Production
    const storageProvider = (config.MEDIA_STORAGE_PROVIDER || 's3').toLowerCase();
    if (storageProvider === 'local_mock' || storageProvider === 'mock') {
      issues.push({
        variable: 'MEDIA_STORAGE_PROVIDER',
        reason: 'Mock storage is strictly prohibited in production. Configure a verified cloud storage provider (e.g., "s3").',
      });
    } else if (storageProvider === 's3') {
      if (!config.AWS_S3_BUCKET || config.AWS_S3_BUCKET.trim().length === 0) {
        issues.push({
          variable: 'AWS_S3_BUCKET',
          reason: 'AWS_S3_BUCKET is required when MEDIA_STORAGE_PROVIDER is "s3" in production.',
        });
      }
      if (!config.AWS_REGION || config.AWS_REGION.trim().length === 0) {
        issues.push({
          variable: 'AWS_REGION',
          reason: 'AWS_REGION is required when MEDIA_STORAGE_PROVIDER is "s3" in production.',
        });
      }
    }
  }

  // General checks across all environments when S3 is explicitly chosen
  const activeProvider = (config.MEDIA_STORAGE_PROVIDER || '').toLowerCase();
  if (activeProvider === 's3' && !isProduction) {
    if (!config.AWS_S3_BUCKET || config.AWS_S3_BUCKET.trim().length === 0) {
      issues.push({
        variable: 'AWS_S3_BUCKET',
        reason: 'AWS_S3_BUCKET must not be empty when MEDIA_STORAGE_PROVIDER is set to "s3".',
      });
    }
  }

  if (issues.length > 0) {
    const errorMessages = issues
      .map((issue) => `  - [${issue.variable}]: ${issue.reason}`)
      .join('\n');
    throw new Error(
      `\n=================================================================\n` +
      `ENVIRONMENT CONFIGURATION VALIDATION FAILED (${issues.length} issue(s)):\n` +
      `=================================================================\n` +
      `${errorMessages}\n` +
      `=================================================================\n`,
    );
  }

  return config;
}
