import { Injectable, LoggerService } from '@nestjs/common';
import { redactSensitiveData, sanitizeString } from './log-redactor.util';

export type LogSeverity = 'INFO' | 'WARN' | 'ERROR' | 'DEBUG' | 'VERBOSE';

export interface StructuredLogEntry {
  timestamp: string;
  severity: LogSeverity;
  service: string;
  environment: string;
  context?: string;
  correlationId?: string;
  message: string;
  metadata?: Record<string, any>;
  stack?: string;
}

@Injectable()
export class StructuredLoggerService implements LoggerService {
  private readonly serviceName = 'omnisocial-api';
  private readonly environment: string;
  private readonly isProduction: boolean;
  private readonly isJsonFormat: boolean;

  constructor() {
    this.environment = (process.env.NODE_ENV || 'development').toLowerCase();
    this.isProduction = this.environment === 'production';
    this.isJsonFormat =
      this.isProduction || (process.env.LOG_FORMAT || '').toLowerCase() === 'json';
  }

  log(message: any, ...optionalParams: any[]) {
    this.writeLog('INFO', message, optionalParams);
  }

  error(message: any, ...optionalParams: any[]) {
    this.writeLog('ERROR', message, optionalParams);
  }

  warn(message: any, ...optionalParams: any[]) {
    this.writeLog('WARN', message, optionalParams);
  }

  debug(message: any, ...optionalParams: any[]) {
    this.writeLog('DEBUG', message, optionalParams);
  }

  verbose(message: any, ...optionalParams: any[]) {
    this.writeLog('VERBOSE', message, optionalParams);
  }

  private writeLog(severity: LogSeverity, message: any, optionalParams: any[]) {
    const entry = this.formatEntry(severity, message, optionalParams);

    if (this.isJsonFormat) {
      const jsonLine = JSON.stringify(entry);
      if (severity === 'ERROR') {
        process.stderr.write(`${jsonLine}\n`);
      } else {
        process.stdout.write(`${jsonLine}\n`);
      }
    } else {
      // Developer-friendly human-readable format for development/testing
      const ctx = entry.context ? `[${entry.context}] ` : '';
      const corr = entry.correlationId ? `{${entry.correlationId}} ` : '';
      const metaStr =
        entry.metadata && Object.keys(entry.metadata).length > 0
          ? ` ${JSON.stringify(entry.metadata)}`
          : '';

      const line = `[${entry.timestamp}] ${severity.padEnd(5)} ${ctx}${corr}${entry.message}${metaStr}`;

      if (severity === 'ERROR') {
        process.stderr.write(`${line}\n`);
        if (entry.stack) {
          process.stderr.write(`${entry.stack}\n`);
        }
      } else {
        process.stdout.write(`${line}\n`);
      }
    }
  }

  formatEntry(severity: LogSeverity, message: any, optionalParams: any[]): StructuredLogEntry {
    let context: string | undefined;
    let stack: string | undefined;
    let correlationId: string | undefined;
    let metadata: Record<string, any> | undefined;

    // Process optionalParams (in NestJS, last string param is often context, or error stack)
    if (optionalParams && optionalParams.length > 0) {
      for (const param of optionalParams) {
        if (typeof param === 'string') {
          if (param.includes('\n    at ') || param.startsWith('Error:')) {
            stack = sanitizeString(param);
          } else if (!context) {
            context = param;
          }
        } else if (param instanceof Error) {
          stack = sanitizeString(param.stack || '');
          if (!message || message === '') {
            message = param.message;
          }
        } else if (typeof param === 'object' && param !== null) {
          if (param.correlationId) {
            correlationId = param.correlationId;
          }
          if (param.context && !context) {
            context = param.context;
          }
          const sanitizedMeta = redactSensitiveData(param);
          metadata = { ...(metadata || {}), ...sanitizedMeta };
        }
      }
    }

    // Extract correlationId from message if formatted as "[req-xyz] ..."
    let cleanMessage = typeof message === 'string' ? message : JSON.stringify(redactSensitiveData(message));
    if (typeof cleanMessage === 'string') {
      const matchCorr = cleanMessage.match(/^\[(req-[a-zA-Z0-9_-]+)\]\s*(.*)$/);
      if (matchCorr) {
        if (!correlationId) correlationId = matchCorr[1];
        cleanMessage = matchCorr[2];
      }
    }

    cleanMessage = sanitizeString(cleanMessage);

    const entry: StructuredLogEntry = {
      timestamp: new Date().toISOString(),
      severity,
      service: this.serviceName,
      environment: this.environment,
      message: cleanMessage,
    };

    if (context) entry.context = context;
    if (correlationId) entry.correlationId = correlationId;
    if (metadata && Object.keys(metadata).length > 0) entry.metadata = metadata;
    if (stack) entry.stack = stack;

    return entry;
  }
}
