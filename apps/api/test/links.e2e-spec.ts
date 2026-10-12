import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import * as cookieParser from 'cookie-parser';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { WorkspaceRole } from '@prisma/client';

describe('Phase 16: Branded Link Shortener & UTM Attribution (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const timestamp = Date.now();
  const ownerUser = {
    name: 'Links Admin Owner',
    email: `links_owner_${timestamp}@test.com`,
    password: 'Password123!',
  };
  const viewerUser = {
    name: 'Links Viewer',
    email: `links_viewer_${timestamp}@test.com`,
    password: 'Password123!',
  };

  let ownerToken: string;
  let viewerToken: string;
  let workspaceId: string;
  let createdLinkId: string;
  const customSlug = `promo-${timestamp}`;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication({ rawBody: true });
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

    // 1. Register & Login Owner
    await request(app.getHttpServer()).post('/api/v1/auth/register').send(ownerUser);
    const ownerRes = await request(app.getHttpServer()).post('/api/v1/auth/login').send({
      email: ownerUser.email,
      password: ownerUser.password,
    });
    ownerToken = ownerRes.body.data.accessToken;

    // 2. Register & Login Viewer
    await request(app.getHttpServer()).post('/api/v1/auth/register').send(viewerUser);
    const viewerRes = await request(app.getHttpServer()).post('/api/v1/auth/login').send({
      email: viewerUser.email,
      password: viewerUser.password,
    });
    viewerToken = viewerRes.body.data.accessToken;

    // 3. Create workspace
    const wsRes = await request(app.getHttpServer())
      .post('/api/v1/workspaces')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ name: `Links Test Workspace ${timestamp}` });
    workspaceId = wsRes.body.data.id;

    // 4. Add viewer to workspace
    const viewerUserRecord = await prisma.user.findUnique({
      where: { email: viewerUser.email },
    });
    await prisma.workspaceMember.create({
      data: {
        workspaceId,
        userId: viewerUserRecord!.id,
        role: WorkspaceRole.VIEWER,
      },
    });
  });

  afterAll(async () => {
    if (workspaceId) {
      await prisma.linkClickEvent.deleteMany({
        where: { shortenedLink: { workspaceId } },
      });
      await prisma.shortenedLink.deleteMany({ where: { workspaceId } });
      await prisma.workspaceMember.deleteMany({ where: { workspaceId } });
      await prisma.workspace.deleteMany({ where: { id: workspaceId } });
    }
    await app.close();
  });

  describe('POST /api/v1/workspaces/:workspaceId/links', () => {
    it('should create a shortened branded link with UTM parameters', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/workspaces/${workspaceId}/links`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          originalUrl: 'https://acmebrand.com/products/summer-sale',
          customCode: customSlug,
          title: 'Summer Sale 2026 Promo',
          utmParameters: {
            utmSource: 'facebook',
            utmMedium: 'social_post',
            utmCampaign: 'summer_promo_2026',
            utmContent: 'carousel_v1',
          },
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      const data = res.body.data;
      expect(data.id).toBeDefined();
      expect(data.shortCode).toBe(customSlug);
      expect(data.destinationUrl).toBe(
        'https://acmebrand.com/products/summer-sale?utm_source=facebook&utm_medium=social_post&utm_campaign=summer_promo_2026&utm_content=carousel_v1',
      );
      expect(data.totalClicks).toBe(0);
      createdLinkId = data.id;
    });

    it('should reject duplicate custom slug with 409 Conflict', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/workspaces/${workspaceId}/links`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          originalUrl: 'https://acmebrand.com/products/another-page',
          customCode: customSlug,
        });

      expect(res.status).toBe(409);
    });

    it('should reject viewer role from creating links with 403 Forbidden', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/workspaces/${workspaceId}/links`)
        .set('Authorization', `Bearer ${viewerToken}`)
        .send({
          originalUrl: 'https://acmebrand.com/products/viewer-test',
        });

      expect(res.status).toBe(403);
    });
  });

  describe('GET /api/v1/workspaces/:workspaceId/links', () => {
    it('should list all shortened links for the workspace', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/workspaces/${workspaceId}/links`)
        .set('Authorization', `Bearer ${viewerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data[0].shortCode).toBe(customSlug);
    });

    it('should filter links using search query parameter', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/workspaces/${workspaceId}/links?search=Summer`)
        .set('Authorization', `Bearer ${viewerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Public Redirect & Telemetry: GET /api/v1/links/r/:code', () => {
    it('should perform 302 redirect to destinationUrl and record telemetry', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/links/r/${customSlug}`)
        .set('User-Agent', 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)')
        .set('Referer', 'https://www.facebook.com/')
        .set('cf-ipcountry', 'US');

      expect(res.status).toBe(302);
      expect(res.headers.location).toBe(
        'https://acmebrand.com/products/summer-sale?utm_source=facebook&utm_medium=social_post&utm_campaign=summer_promo_2026&utm_content=carousel_v1',
      );
    });

    it('should return 404 for nonexistent short link', async () => {
      const res = await request(app.getHttpServer()).get('/api/v1/links/r/nonexistent-slug-xyz');
      expect(res.status).toBe(404);
    });
  });

  describe('GET /api/v1/workspaces/:workspaceId/links/:linkId/analytics', () => {
    it('should report updated click count and telemetry analytics', async () => {
      // Small timeout to allow async telemetry logging to finalize
      await new Promise((r) => setTimeout(r, 200));

      const res = await request(app.getHttpServer())
        .get(`/api/v1/workspaces/${workspaceId}/links/${createdLinkId}/analytics`)
        .set('Authorization', `Bearer ${viewerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const data = res.body.data;
      expect(data.totalClicks).toBeGreaterThanOrEqual(1);
      expect(data.uniqueClicksEstimate).toBeGreaterThanOrEqual(1);
      expect(data.deviceBreakdown).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ deviceType: 'MOBILE' }),
        ]),
      );
      expect(data.topReferrers).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ referrer: 'www.facebook.com' }),
        ]),
      );
    });
  });

  describe('DELETE /api/v1/workspaces/:workspaceId/links/:linkId', () => {
    it('should soft delete the link', async () => {
      const res = await request(app.getHttpServer())
        .delete(`/api/v1/workspaces/${workspaceId}/links/${createdLinkId}`)
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(res.status).toBe(200);

      // Now redirecting to deleted link must return 404
      const redirectRes = await request(app.getHttpServer()).get(`/api/v1/links/r/${customSlug}`);
      expect(redirectRes.status).toBe(404);
    });
  });
});
