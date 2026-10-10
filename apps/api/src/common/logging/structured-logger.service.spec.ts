import { StructuredLoggerService } from './structured-logger.service';

describe('StructuredLoggerService', () => {
  let logger: StructuredLoggerService;
  let stdoutSpy: jest.SpyInstance;
  let stderrSpy: jest.SpyInstance;

  beforeEach(() => {
    stdoutSpy = jest.spyOn(process.stdout, 'write').mockImplementation(() => true);
    stderrSpy = jest.spyOn(process.stderr, 'write').mockImplementation(() => true);
    logger = new StructuredLoggerService();
  });

  afterEach(() => {
    stdoutSpy.mockRestore();
    stderrSpy.mockRestore();
  });

  it('formats log entries with timestamp, severity, service, and message', () => {
    const entry = logger.formatEntry('INFO', 'Test info message', ['TestContext']);

    expect(entry.severity).toBe('INFO');
    expect(entry.service).toBe('omnisocial-api');
    expect(entry.context).toBe('TestContext');
    expect(entry.message).toBe('Test info message');
    expect(new Date(entry.timestamp).getTime()).not.toBeNaN();
  });

  it('extracts correlation ID from message or metadata', () => {
    const entryFromMsg = logger.formatEntry('INFO', '[req-abc-123] Processed request', []);
    expect(entryFromMsg.correlationId).toBe('req-abc-123');
    expect(entryFromMsg.message).toBe('Processed request');

    const entryFromMeta = logger.formatEntry('WARN', 'Something warning', [
      { correlationId: 'req-def-456', action: 'RECONCILIATION' },
    ]);
    expect(entryFromMeta.correlationId).toBe('req-def-456');
    expect(entryFromMeta.metadata?.action).toBe('RECONCILIATION');
  });

  it('redacts sensitive fields in metadata and messages', () => {
    const entry = logger.formatEntry('INFO', 'User login attempt', [
      {
        email: 'user@example.com',
        password: 'PlainTextPassword123',
        accessToken: 'oauth-token-secret-val',
        headers: {
          authorization: 'Bearer secret-jwt-abc',
        },
      },
    ]);

    expect(entry.metadata?.email).toBe('user@example.com');
    expect(entry.metadata?.password).toBe('[REDACTED]');
    expect(entry.metadata?.accessToken).toBe('[REDACTED]');
    expect(entry.metadata?.headers.authorization).toBe('[REDACTED]');
  });

  it('extracts error stack and message when Error instance is passed', () => {
    const error = new Error('Database connection failed');
    const entry = logger.formatEntry('ERROR', '', [error]);

    expect(entry.severity).toBe('ERROR');
    expect(entry.message).toBe('Database connection failed');
    expect(entry.stack).toBeDefined();
    expect(entry.stack).toContain('Database connection failed');
  });

  it('writes JSON to stdout in JSON format mode', () => {
    (logger as any).isJsonFormat = true;

    logger.log('Hello structured world', { correlationId: 'req-999' });

    expect(stdoutSpy).toHaveBeenCalled();
    const rawLogged = stdoutSpy.mock.calls[0][0];
    const parsed = JSON.parse(rawLogged);

    expect(parsed.severity).toBe('INFO');
    expect(parsed.message).toBe('Hello structured world');
    expect(parsed.correlationId).toBe('req-999');
    expect(parsed.service).toBe('omnisocial-api');
  });

  it('writes ERROR severity to stderr', () => {
    (logger as any).isJsonFormat = true;

    logger.error('Critical failure', 'Stack trace line 1\n    at test');

    expect(stderrSpy).toHaveBeenCalled();
    const rawLogged = stderrSpy.mock.calls[0][0];
    const parsed = JSON.parse(rawLogged);

    expect(parsed.severity).toBe('ERROR');
    expect(parsed.message).toBe('Critical failure');
    expect(parsed.stack).toContain('Stack trace line 1');
  });
});
