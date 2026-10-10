import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import * as cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { StructuredLoggerService } from './common/logging/structured-logger.service';

async function bootstrap() {
  const structuredLogger = new StructuredLoggerService();
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule, {
    logger: structuredLogger,
    rawBody: true,
  });

  const configService = app.get(ConfigService);
  const port = configService.get<number>('port', 4000);
  const apiPrefix = configService.get<string>('apiPrefix', '/api/v1');
  const corsOrigin = configService.get<string>('corsOrigin', 'http://localhost:3000');

  // Enable graceful shutdown
  app.enableShutdownHooks();

  // Security Headers via Helmet
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:', 'https:'],
        },
      },
      crossOriginEmbedderPolicy: false,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      hsts:
        process.env.NODE_ENV === 'production'
          ? {
              maxAge: 31536000,
              includeSubDomains: true,
              preload: true,
            }
          : false,
    }),
  );

  // Middleware
  app.use(cookieParser());

  // Global prefix
  app.setGlobalPrefix(apiPrefix.replace(/^\//, ''));

  // Global Validation Pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // CORS Configuration
  app.enableCors({
    origin: [corsOrigin, 'http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-correlation-id'],
  });

  // Swagger OpenAPI Documentation
  const swaggerConfig = new DocumentBuilder()
    .setTitle('OmniSocial AI API')
    .setDescription(
      'Production-grade REST API for AI Social Media Management SaaS. Stage 1: Core Foundation & Enterprise Authentication.',
    )
    .setVersion('1.0.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter your JWT access token',
        in: 'header',
      },
      'JWT-auth',
    )
    .addTag('Health & Monitoring', 'Liveness and database readiness probes')
    .addTag('Authentication', 'Registration, secure login, rotated refresh, and session revocation')
    .addTag('Workspaces', 'Multi-tenant business workspace management and memberships')
    .addTag('Invitations', 'Workspace team member invitations and acceptance flow')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(port);
  logger.log(`OmniSocial AI Backend API is running on: http://localhost:${port}/${apiPrefix.replace(/^\//, '')}`);
  logger.log(`Swagger OpenAPI Documentation available at: http://localhost:${port}/api/docs`);
}

bootstrap();
