import { redactSensitiveData, sanitizeString, isSensitiveKey } from './log-redactor.util';

describe('LogRedactorUtil', () => {
  describe('isSensitiveKey', () => {
    it('identifies sensitive keys accurately', () => {
      expect(isSensitiveKey('authorization')).toBe(true);
      expect(isSensitiveKey('Authorization')).toBe(true);
      expect(isSensitiveKey('password')).toBe(true);
      expect(isSensitiveKey('oldPassword')).toBe(true);
      expect(isSensitiveKey('accessToken')).toBe(true);
      expect(isSensitiveKey('refreshToken')).toBe(true);
      expect(isSensitiveKey('jwtToken')).toBe(true);
      expect(isSensitiveKey('encryptionKey')).toBe(true);
      expect(isSensitiveKey('webhookVerifyToken')).toBe(true);
      expect(isSensitiveKey('cookie')).toBe(true);
      expect(isSensitiveKey('set-cookie')).toBe(true);

      expect(isSensitiveKey('username')).toBe(false);
      expect(isSensitiveKey('workspaceId')).toBe(false);
      expect(isSensitiveKey('status')).toBe(false);
      expect(isSensitiveKey('email')).toBe(false);
    });
  });

  describe('sanitizeString', () => {
    it('redacts Bearer tokens in headers and strings', () => {
      const input = 'Authorization: Bearer secret-oauth-token-value-xyz123';
      const output = sanitizeString(input);
      expect(output).toBe('Authorization: Bearer [REDACTED]');
      expect(output).not.toContain('secret-oauth-token-value-xyz123');
    });

    it('redacts raw JWT tokens embedded in strings', () => {
      const jwt = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
      const input = `Failed login for token: ${jwt} with error`;
      const output = sanitizeString(input);
      expect(output).toBe('Failed login for token: [REDACTED_JWT] with error');
    });

    it('redacts credentials embedded in database or redis URLs', () => {
      const input = 'Connected to postgresql://postgres:superSecretPass123@db-host:5432/hootsute_db';
      const output = sanitizeString(input);
      expect(output).toBe('Connected to postgresql://***:***@db-host:5432/hootsute_db');
      expect(output).not.toContain('superSecretPass123');
    });
  });

  describe('redactSensitiveData', () => {
    it('redacts sensitive fields in nested objects and arrays', () => {
      const payload = {
        userId: 'user-123',
        workspaceId: 'ws-456',
        password: 'PlainTextPassword!',
        auth: {
          accessToken: 'meta-graph-token-xyz',
          refreshToken: 'refresh-jwt-999',
          cookie: 'session_id=abcdef',
          encryptionKey: '0123456789abcdef0123456789abcdef',
        },
        items: [
          { token: 'secret-token-1', label: 'Item 1' },
          { token: 'secret-token-2', label: 'Item 2' },
        ],
      };

      const redacted = redactSensitiveData(payload);

      expect(redacted.userId).toBe('user-123');
      expect(redacted.password).toBe('[REDACTED]');
      expect(redacted.auth.accessToken).toBe('[REDACTED]');
      expect(redacted.auth.refreshToken).toBe('[REDACTED]');
      expect(redacted.auth.cookie).toBe('[REDACTED]');
      expect(redacted.auth.encryptionKey).toBe('[REDACTED]');
      expect(redacted.items[0].token).toBe('[REDACTED]');
      expect(redacted.items[0].label).toBe('Item 1');
    });

    it('safely handles circular references without infinite loops', () => {
      const objA: any = { name: 'Node A' };
      const objB: any = { name: 'Node B', ref: objA };
      objA.ref = objB;

      const result = redactSensitiveData(objA);
      expect(result.name).toBe('Node A');
      expect(result.ref.name).toBe('Node B');
      expect(result.ref.ref).toBe('[CIRCULAR]');
    });

    it('redacts sensitive data inside Error objects', () => {
      const error = new Error('Database connection failed for postgresql://admin:secretPass@localhost:5432/db');
      const redacted = redactSensitiveData(error);

      expect(redacted.name).toBe('Error');
      expect(redacted.message).toContain('postgresql://***:***@localhost:5432/db');
      expect(redacted.message).not.toContain('secretPass');
    });
  });
});
