import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';
import { randomUUID } from 'crypto';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    const correlationId = (request.headers['x-correlation-id'] as string) || `req-${randomUUID()}`;
    (request as any).correlationId = correlationId;
    response.setHeader('x-correlation-id', correlationId);

    const { method, originalUrl, ip } = request;
    const userAgent = request.get('user-agent') || '';
    const now = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const { statusCode } = response;
          const delay = Date.now() - now;
          this.logger.log(
            `[${correlationId}] ${method} ${originalUrl} ${statusCode} - ${delay}ms`,
            {
              correlationId,
              method,
              path: originalUrl,
              statusCode,
              durationMs: delay,
              ip,
              userAgent,
            },
          );
        },
        error: (error) => {
          const delay = Date.now() - now;
          const statusCode = error?.status || 500;
          this.logger.warn(
            `[${correlationId}] ${method} ${originalUrl} ${statusCode} - ${delay}ms`,
            {
              correlationId,
              method,
              path: originalUrl,
              statusCode,
              durationMs: delay,
              ip,
              userAgent,
              errorMessage: error?.message,
            },
          );
        },
      }),
    );
  }
}
