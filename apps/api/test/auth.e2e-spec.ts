import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import * as cookieParser from 'cookie-parser';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Auth System & Security Endpoints (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const testUser = {
    name: 'E2E Test User',
    email: `e2e_${Date.now()}@example.com`,
    password: 'Password123!',
  };

  let accessToken: string;
  let authCookies: string[];

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.use(cookieParser());
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();
    prisma = app.get<PrismaService>(PrismaService);
  });

  afterAll(async () => {
    // Clean up test user
    if (prisma && testUser.email) {
      await prisma.user.deleteMany({
        where: { email: testUser.email },
      });
    }
    await app.close();
  });

  describe('Health Endpoints', () => {
    it('/api/v1/health (GET) should report alive status', () => {
      return request(app.getHttpServer())
        .get('/api/v1/health')
        .expect(200)
        .expect((res) => {
          expect(res.body.data.status).toBe('ok');
          expect(res.body.data.uptime).toBeDefined();
        });
    });

    it('/api/v1/health/ready (GET) should report database readiness', () => {
      return request(app.getHttpServer())
        .get('/api/v1/health/ready')
        .expect(200)
        .expect((res) => {
          expect(res.body.data.status).toBe('ready');
          expect(res.body.data.database).toBe('connected');
        });
    });
  });

  describe('Registration & RBAC Protection', () => {
    it('/api/v1/auth/register (POST) should register user with role BUSINESS_OWNER', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send(testUser)
        .expect(201)
        .expect((res) => {
          expect(res.body.data.user.email).toBe(testUser.email);
          expect(res.body.data.user.role).toBe('BUSINESS_OWNER');
          expect(res.body.data.user.passwordHash).toBeUndefined();
        });
    });

    it('/api/v1/auth/register (POST) should reject duplicate registration with 409', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send(testUser)
        .expect(409);
    });

    it('/api/v1/auth/register (POST) should reject role injection attempts with 400', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          name: 'Hacker User',
          email: `hacker_${Date.now()}@example.com`,
          password: 'Password123!',
          role: 'SUPER_ADMIN',
        })
        .expect(400);
    });
  });

  describe('Authentication & Token Issuance', () => {
    it('/api/v1/auth/login (POST) should issue HttpOnly cookies and omit refreshToken from body', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.data.accessToken).toBeDefined();
          // Verify that browser client does not receive refreshToken in the response body
          expect(res.body.data.refreshToken).toBeUndefined();
          expect(res.body.data.user.email).toBe(testUser.email);

          accessToken = res.body.data.accessToken;
          authCookies = res.headers['set-cookie'] as any;
          expect(authCookies).toBeDefined();

          // Check HttpOnly and SameSite
          const refreshCookie = authCookies.find((c) => c.startsWith('refreshToken='));
          expect(refreshCookie).toContain('HttpOnly');
          expect(refreshCookie).toContain('SameSite=Lax');
        });
    });

    it('/api/v1/auth/login (POST) should reject invalid password with 401', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: testUser.email,
          password: 'WrongPassword!',
        })
        .expect(401);
    });
  });

  describe('Protected Endpoints & Identity Verification', () => {
    it('/api/v1/auth/me (GET) should succeed with valid Bearer token', () => {
      return request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.data.email).toBe(testUser.email);
          expect(res.body.data.role).toBe('BUSINESS_OWNER');
          expect(res.body.data.passwordHash).toBeUndefined();
        });
    });

    it('/api/v1/auth/me (GET) should reject unauthenticated requests with 401', () => {
      return request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .expect(401);
    });
  });

  describe('Token Refresh Rotation & Logout', () => {
    it('/api/v1/auth/refresh (POST) should rotate tokens using HttpOnly cookie', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .set('Cookie', authCookies)
        .send({})
        .expect(200)
        .expect((res) => {
          expect(res.body.data.accessToken).toBeDefined();
          // Old access token replaced
          expect(res.body.data.accessToken).not.toBe(accessToken);
          accessToken = res.body.data.accessToken;
          authCookies = res.headers['set-cookie'] as any;
        });
    });

    it('/api/v1/auth/logout (POST) should revoke session and clear cookies', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .set('Cookie', authCookies)
        .expect(200)
        .expect((res) => {
          const isSuccess = res.body.success ?? res.body.data?.success;
          expect(isSuccess).toBe(true);
        });
    });
  });
});
