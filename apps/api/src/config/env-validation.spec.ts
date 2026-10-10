import { validateEnvironment } from './env-validation';

describe('validateEnvironment', () => {
  const validDevConfig = {
    NODE_ENV: 'development',
    DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/hootsute_db',
    JWT_ACCESS_SECRET: 'dev-jwt-access-secret-minimum-32-characters-required',
    JWT_REFRESH_SECRET: 'dev-jwt-refresh-secret-minimum-32-characters-required',
    TOKEN_ENCRYPTION_KEY: 'a'.repeat(64),
  };

  const validProdConfig = {
    NODE_ENV: 'production',
    DATABASE_URL: 'postgresql://app_user:strong_prod_pass@db-cluster.internal:5432/omnisocial_prod',
    JWT_ACCESS_SECRET: 'prod-jwt-access-secret-very-strong-entropy-32-chars-min',
    JWT_REFRESH_SECRET: 'prod-jwt-refresh-secret-very-strong-entropy-32-chars-min',
    TOKEN_ENCRYPTION_KEY: '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
    TOKEN_ENCRYPTION_KEY_FALLBACK: 'fedcba9876543210fedcba9876543210fedcba9876543210fedcba9876543210',
    META_APP_ID: '1234567890',
    META_APP_SECRET: 'prod_meta_secret_abcdef123456',
    META_WEBHOOK_VERIFY_TOKEN: 'prod_meta_webhook_secret_entropy_token',
    CORS_ORIGIN: 'https://app.omnisocial.ai',
  };

  it('passes for a valid development configuration', () => {
    expect(() => validateEnvironment(validDevConfig)).not.toThrow();
  });

  it('passes for a valid production configuration', () => {
    expect(() => validateEnvironment(validProdConfig)).not.toThrow();
  });

  it('fails in production if JWT_ACCESS_SECRET uses known insecure development default', () => {
    const config = {
      ...validProdConfig,
      JWT_ACCESS_SECRET: 'dev-jwt-access-secret-minimum-32-characters-required',
    };
    expect(() => validateEnvironment(config)).toThrow(
      /JWT_ACCESS_SECRET cannot use an insecure development default/,
    );
  });

  it('fails in production if JWT_ACCESS_SECRET is under 32 characters', () => {
    const config = {
      ...validProdConfig,
      JWT_ACCESS_SECRET: 'short-secret-under-32',
    };
    expect(() => validateEnvironment(config)).toThrow(
      /JWT_ACCESS_SECRET must be at least 32 characters long/,
    );
  });

  it('fails in production if JWT_REFRESH_SECRET equals JWT_ACCESS_SECRET', () => {
    const config = {
      ...validProdConfig,
      JWT_REFRESH_SECRET: validProdConfig.JWT_ACCESS_SECRET,
    };
    expect(() => validateEnvironment(config)).toThrow(
      /JWT_REFRESH_SECRET must be distinct from JWT_ACCESS_SECRET/,
    );
  });

  it('fails in production if TOKEN_ENCRYPTION_KEY is missing', () => {
    const config = {
      ...validProdConfig,
      TOKEN_ENCRYPTION_KEY: '',
    };
    expect(() => validateEnvironment(config)).toThrow(
      /TOKEN_ENCRYPTION_KEY is required in production/,
    );
  });

  it('fails in production if TOKEN_ENCRYPTION_KEY uses placeholder default', () => {
    const config = {
      ...validProdConfig,
      TOKEN_ENCRYPTION_KEY: 'replace-with-64-character-hex-string-for-aes-256-gcm-encryption',
    };
    expect(() => validateEnvironment(config)).toThrow(
      /TOKEN_ENCRYPTION_KEY cannot use the placeholder default/,
    );
  });

  it('fails if 64-character TOKEN_ENCRYPTION_KEY is not valid hex', () => {
    const config = {
      ...validDevConfig,
      TOKEN_ENCRYPTION_KEY: 'z'.repeat(64),
    };
    expect(() => validateEnvironment(config)).toThrow(
      /TOKEN_ENCRYPTION_KEY must be a valid hexadecimal string/,
    );
  });

  it('fails if TOKEN_ENCRYPTION_KEY_FALLBACK matches primary TOKEN_ENCRYPTION_KEY', () => {
    const config = {
      ...validProdConfig,
      TOKEN_ENCRYPTION_KEY_FALLBACK: validProdConfig.TOKEN_ENCRYPTION_KEY,
    };
    expect(() => validateEnvironment(config)).toThrow(
      /TOKEN_ENCRYPTION_KEY_FALLBACK must be distinct from the primary TOKEN_ENCRYPTION_KEY/,
    );
  });

  it('fails in production if META_APP_SECRET is missing when META_APP_ID is provided', () => {
    const config = {
      ...validProdConfig,
      META_APP_SECRET: '',
    };
    expect(() => validateEnvironment(config)).toThrow(
      /META_APP_SECRET must be configured in production when META_APP_ID is set/,
    );
  });

  it('fails in production if META_WEBHOOK_VERIFY_TOKEN is the default development token', () => {
    const config = {
      ...validProdConfig,
      META_WEBHOOK_VERIFY_TOKEN: 'omnisocial_meta_social_verify_token',
    };
    expect(() => validateEnvironment(config)).toThrow(
      /META_WEBHOOK_VERIFY_TOKEN cannot use default development token/,
    );
  });

  it('fails in production if CORS_ORIGIN is wildcard or contains localhost', () => {
    const config = {
      ...validProdConfig,
      CORS_ORIGIN: 'http://localhost:3000',
    };
    expect(() => validateEnvironment(config)).toThrow(
      /CORS_ORIGIN must not be wildcard "\*" or reference "localhost"/,
    );
  });

  it('fails if DATABASE_URL is empty', () => {
    const config = {
      ...validDevConfig,
      DATABASE_URL: '',
    };
    expect(() => validateEnvironment(config)).toThrow(
      /DATABASE_URL is required and must not be empty/,
    );
  });
});
