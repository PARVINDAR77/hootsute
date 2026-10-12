import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import * as cookieParser from 'cookie-parser';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { WorkspaceRole } from '@prisma/client';
import { CompetitorCategory, SocialPlatform, AnalyticsMetricPeriod } from '@packages/shared';

describe('Phase 21: Competitor Benchmarking & Public Intelligence Hub (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const timestamp = Date.now();
  const ownerUser = {
    name: 'Intelligence Lead',
    email: `comp_owner_${timestamp}@test.com`,
    password: 'Password123!',
  };
  const viewerUser = {
    name: 'Competitor Analyst',
    email: `comp_viewer_${timestamp}@test.com`,
    password: 'Password123!',
  };

  let ownerToken: string;
  let viewerToken: string;
  let workspaceId: string;
  let createdCompetitorId: string;
  let createdAccountId: string;

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
        name: `Competitor Hub WS ${timestamp}`,
        slug: `comp-hub-${timestamp}`,
      });
    workspaceId = wsRes.body.data.id;

    // 4. Add viewer as VIEWER member
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
      await prisma.competitorBenchmarkSnapshot.deleteMany({
        where: { competitorProfile: { workspaceId } },
      });
      await prisma.competitorSocialAccount.deleteMany({
        where: { competitorProfile: { workspaceId } },
      });
      await prisma.competitorProfile.deleteMany({ where: { workspaceId } });
      await prisma.workspaceMember.deleteMany({ where: { workspaceId } });
      await prisma.workspace.delete({ where: { id: workspaceId } });
    }
    await prisma.user.deleteMany({
      where: { email: { in: [ownerUser.email, viewerUser.email] } },
    });
    await app.close();
  });

  describe('RBAC & Profile Creation', () => {
    it('should reject competitor creation from VIEWER (403 Forbidden)', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/workspaces/${workspaceId}/competitors`)
        .set('Authorization', `Bearer ${viewerToken}`)
        .send({
          name: 'Unauthorized Competitor',
          category: CompetitorCategory.DIRECT,
        });

      expect(res.status).toBe(403);
    });

    it('should allow OWNER to create a competitor profile with initial social account and seeded snapshots', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/workspaces/${workspaceId}/competitors`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          name: 'Buffer Corp Rival',
          websiteUrl: 'https://buffer-rival.com',
          avatarUrl: 'https://buffer-rival.com/logo.png',
          category: CompetitorCategory.DIRECT,
          notes: 'Primary direct SaaS competitor',
          accounts: [
            {
              platform: SocialPlatform.TWITTER_X,
              handle: 'buffer_rival',
              followersCount: 45000,
            },
          ],
        });

      expect(res.status).toBe(201);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.name).toBe('Buffer Corp Rival');
      expect(res.body.data.socialAccounts).toHaveLength(1);
      expect(res.body.data.socialAccounts[0].handle).toBe('buffer_rival');
      expect(res.body.data.latestSnapshot).toBeDefined();

      createdCompetitorId = res.body.data.id;
      createdAccountId = res.body.data.socialAccounts[0].id;
    });
  });

  describe('Listing & Details Endpoints', () => {
    it('should allow VIEWER to list competitor profiles', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/workspaces/${workspaceId}/competitors`)
        .set('Authorization', `Bearer ${viewerToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data[0].id).toBe(createdCompetitorId);
    });

    it('should allow VIEWER to get single competitor profile details', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/workspaces/${workspaceId}/competitors/${createdCompetitorId}`)
        .set('Authorization', `Bearer ${viewerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(createdCompetitorId);
      expect(res.body.data.name).toBe('Buffer Corp Rival');
    });

    it('should allow OWNER to update competitor profile metadata', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/workspaces/${workspaceId}/competitors/${createdCompetitorId}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          notes: 'Updated competitive intelligence notes - High growth in video',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.notes).toBe('Updated competitive intelligence notes - High growth in video');
    });
  });

  describe('Social Account Channels & Snapshots Management', () => {
    it('should allow OWNER to add a second social channel to competitor', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/workspaces/${workspaceId}/competitors/${createdCompetitorId}/accounts`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          platform: SocialPlatform.LINKEDIN,
          handle: 'buffer-rival-inc',
          followersCount: 22000,
        });

      expect(res.status).toBe(201);
      expect(res.body.data.handle).toBe('buffer-rival-inc');
    });

    it('should allow OWNER to trigger benchmark snapshot sync', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/workspaces/${workspaceId}/competitors/benchmark/sync`)
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.syncedCount).toBeGreaterThanOrEqual(1);
    });

    it('should return side-by-side comparative benchmarking analytics summary with leaderboard and AI insights', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/workspaces/${workspaceId}/competitors/benchmark/summary?period=DAY`)
        .set('Authorization', `Bearer ${viewerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.brandSummary).toBeDefined();
      expect(res.body.data.competitorBenchmarkAvg).toBeDefined();
      expect(res.body.data.leaderboard).toBeDefined();
      expect(res.body.data.leaderboard.length).toBeGreaterThanOrEqual(2);
      expect(res.body.data.keyInsights.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data.topPerformingPosts.length).toBeGreaterThanOrEqual(1);
    });

    it('should allow OWNER to remove a competitor social account', async () => {
      const res = await request(app.getHttpServer())
        .delete(`/api/v1/workspaces/${workspaceId}/competitors/${createdCompetitorId}/accounts/${createdAccountId}`)
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.deleted).toBe(true);
    });
  });

  describe('Profile Cleanup & Deletion', () => {
    it('should allow OWNER to delete competitor profile', async () => {
      const res = await request(app.getHttpServer())
        .delete(`/api/v1/workspaces/${workspaceId}/competitors/${createdCompetitorId}`)
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.deleted).toBe(true);

      // Verify deletion in database
      const deletedCheck = await prisma.competitorProfile.findUnique({
        where: { id: createdCompetitorId },
      });
      expect(deletedCheck).toBeNull();
    });
  });
});
