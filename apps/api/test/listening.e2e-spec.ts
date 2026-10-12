import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import * as cookieParser from 'cookie-parser';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { WorkspaceRole } from '@prisma/client';
import { SocialPlatform } from '@packages/shared';

describe('Phase 17: Social Listening, Brand Mentions & Sentiment Engine (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const timestamp = Date.now();
  const ownerUser = {
    name: 'Listening Admin Owner',
    email: `listening_owner_${timestamp}@test.com`,
    password: 'Password123!',
  };
  const viewerUser = {
    name: 'Listening Viewer',
    email: `listening_viewer_${timestamp}@test.com`,
    password: 'Password123!',
  };

  let ownerToken: string;
  let viewerToken: string;
  let workspaceId: string;
  let createdQueryId: string;
  let sampleMentionId: string;

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

    // 3. Create Workspace
    const wsRes = await request(app.getHttpServer())
      .post('/api/v1/workspaces')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        name: `Listening Test Workspace ${timestamp}`,
        industry: 'MARKETING_AGENCY',
      });
    workspaceId = wsRes.body.data.id;

    // 4. Add Viewer as VIEWER to Workspace
    const viewerRecord = await prisma.user.findUnique({ where: { email: viewerUser.email } });
    await prisma.workspaceMember.create({
      data: {
        workspaceId,
        userId: viewerRecord!.id,
        role: WorkspaceRole.VIEWER,
      },
    });
  });

  afterAll(async () => {
    if (workspaceId) {
      await prisma.listeningMention.deleteMany({ where: { workspaceId } });
      await prisma.listeningQuery.deleteMany({ where: { workspaceId } });
      await prisma.workspaceMember.deleteMany({ where: { workspaceId } });
      await prisma.workspace.deleteMany({ where: { id: workspaceId } });
    }
    await prisma.user.deleteMany({
      where: { email: { in: [ownerUser.email, viewerUser.email] } },
    });
    await app.close();
  });

  describe('1. Query Creation & Seeding Lifecycle', () => {
    it('should create a listening query and automatically seed sample mentions', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/workspaces/${workspaceId}/listening/queries`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          name: 'OmniBrand & Competitors',
          keywords: ['OmniSocial', 'Hootsuite', 'SproutSocial'],
          excludedKeywords: ['internship', 'careers'],
          platforms: [SocialPlatform.TWITTER_X, SocialPlatform.LINKEDIN, SocialPlatform.INSTAGRAM],
          languages: ['en'],
          sentimentFilter: 'ALL',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('OmniBrand & Competitors');
      expect(res.body.data.keywords).toContain('OmniSocial');
      createdQueryId = res.body.data.id;
    });

    it('should reject duplicate query name in same workspace with 400', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/workspaces/${workspaceId}/listening/queries`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          name: 'OmniBrand & Competitors',
          keywords: ['OmniSocial'],
          platforms: [SocialPlatform.TWITTER_X],
        });

      expect(res.status).toBe(400);
    });

    it('should prevent VIEWER from creating listening queries with 403', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/workspaces/${workspaceId}/listening/queries`)
        .set('Authorization', `Bearer ${viewerToken}`)
        .send({
          name: 'Unauthorized Query',
          keywords: ['test'],
          platforms: [SocialPlatform.TWITTER_X],
        });

      expect(res.status).toBe(403);
    });
  });

  describe('2. Query Retrieval & Updates', () => {
    it('should allow members to list listening queries with mention counts', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/workspaces/${workspaceId}/listening/queries`)
        .set('Authorization', `Bearer ${viewerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body.data[0].id).toBe(createdQueryId);
      expect(res.body.data[0].totalMentions).toBeGreaterThan(0);
    });

    it('should allow getting a single query by ID', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/workspaces/${workspaceId}/listening/queries/${createdQueryId}`)
        .set('Authorization', `Bearer ${viewerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe('OmniBrand & Competitors');
    });

    it('should allow EDITOR/OWNER to update query keywords', async () => {
      const res = await request(app.getHttpServer())
        .put(`/api/v1/workspaces/${workspaceId}/listening/queries/${createdQueryId}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          name: 'OmniBrand & Competitors (Global)',
          keywords: ['OmniSocial', 'Hootsuite', 'Buffer'],
        });

      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe('OmniBrand & Competitors (Global)');
      expect(res.body.data.keywords).toContain('Buffer');
    });
  });

  describe('3. Mention Stream & Filters', () => {
    it('should retrieve seeded mentions in the feed', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/workspaces/${workspaceId}/listening/feed`)
        .set('Authorization', `Bearer ${viewerToken}`)
        .query({ queryId: createdQueryId, page: 1, limit: 10 });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.data.length).toBeGreaterThan(0);
      expect(res.body.data.total).toBeGreaterThan(0);

      sampleMentionId = res.body.data.data[0].id;
      expect(res.body.data.data[0].sentiment).toBeDefined();
      expect(typeof res.body.data.data[0].sentimentScore).toBe('number');
    });

    it('should filter stream by sentiment correctly', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/workspaces/${workspaceId}/listening/feed`)
        .set('Authorization', `Bearer ${viewerToken}`)
        .query({ queryId: createdQueryId, sentiment: 'POSITIVE' });

      expect(res.status).toBe(200);
      res.body.data.data.forEach((m: any) => {
        expect(m.sentiment).toBe('POSITIVE');
      });
    });

    it('should toggle star status on a mention', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/workspaces/${workspaceId}/listening/mentions/${sampleMentionId}/star`)
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(sampleMentionId);
    });

    it('should mark mention as read', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/workspaces/${workspaceId}/listening/mentions/${sampleMentionId}/read`)
        .set('Authorization', `Bearer ${viewerToken}`)
        .send({ isRead: true });

      expect(res.status).toBe(200);
      expect(res.body.data.isRead).toBe(true);
    });
  });

  describe('4. Brand Sentiment Analytics & Aggregation', () => {
    it('should calculate sentiment metrics, reach, and platform breakdown', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/workspaces/${workspaceId}/listening/analytics`)
        .set('Authorization', `Bearer ${viewerToken}`)
        .query({ queryId: createdQueryId });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.totalMentions).toBeGreaterThan(0);
      expect(res.body.data.estimatedTotalReach).toBeGreaterThan(0);
      expect(res.body.data.sentimentBreakdown).toHaveLength(3);
      expect(Array.isArray(res.body.data.topAuthors)).toBe(true);
      expect(Array.isArray(res.body.data.platformBreakdown)).toBe(true);
    });
  });

  describe('5. Query Deletion', () => {
    it('should allow ADMIN/OWNER to delete query', async () => {
      const res = await request(app.getHttpServer())
        .delete(`/api/v1/workspaces/${workspaceId}/listening/queries/${createdQueryId}`)
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const check = await prisma.listeningQuery.findUnique({
        where: { id: createdQueryId },
      });
      expect(check).toBeNull();
    });
  });
});
