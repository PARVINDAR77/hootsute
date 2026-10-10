import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import * as cookieParser from 'cookie-parser';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import {
  WorkspaceRole,
  DraftStatus,
  SocialPlatform,
  SocialProvider,
  SocialAccountType,
  ScheduledPostStatus,
  PublishTargetStatus,
} from '@prisma/client';
import { TokenVaultService } from '../src/social-accounts/token-vault/token-vault.service';

describe('Stage 6 Phase B: Scheduling Data Layer & Core Repositories (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const timestamp = Date.now();
  const ownerUser = {
    name: 'Schedule Admin Owner',
    email: `sched_owner_${timestamp}@test.com`,
    password: 'Password123!',
  };
  const editorUser = {
    name: 'Schedule Editor',
    email: `sched_editor_${timestamp}@test.com`,
    password: 'Password123!',
  };
  const viewerUser = {
    name: 'Schedule Viewer',
    email: `sched_viewer_${timestamp}@test.com`,
    password: 'Password123!',
  };
  const foreignUser = {
    name: 'Schedule Foreign User',
    email: `sched_foreign_${timestamp}@test.com`,
    password: 'Password123!',
  };

  let ownerToken: string;
  let editorToken: string;
  let viewerToken: string;
  let foreignToken: string;

  let workspaceId: string;
  let foreignWorkspaceId: string;

  let fbAccountId: string;
  let igAccountId: string;
  let foreignAccountId: string;

  let approvedDraftId: string;
  let unapprovedDraftId: string;
  let scheduledPostId: string;

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

    // 2. Register & Login Editor
    await request(app.getHttpServer()).post('/api/v1/auth/register').send(editorUser);
    const editorRes = await request(app.getHttpServer()).post('/api/v1/auth/login').send({
      email: editorUser.email,
      password: editorUser.password,
    });
    editorToken = editorRes.body.data.accessToken;

    // 3. Register & Login Viewer
    await request(app.getHttpServer()).post('/api/v1/auth/register').send(viewerUser);
    const viewerRes = await request(app.getHttpServer()).post('/api/v1/auth/login').send({
      email: viewerUser.email,
      password: viewerUser.password,
    });
    viewerToken = viewerRes.body.data.accessToken;

    // 4. Register & Login Foreign User
    await request(app.getHttpServer()).post('/api/v1/auth/register').send(foreignUser);
    const foreignRes = await request(app.getHttpServer()).post('/api/v1/auth/login').send({
      email: foreignUser.email,
      password: foreignUser.password,
    });
    foreignToken = foreignRes.body.data.accessToken;

    // 5. Create Workspaces
    const wsRes = await request(app.getHttpServer())
      .post('/api/v1/workspaces')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ name: 'Scheduling Main Workspace', timezone: 'UTC' });
    workspaceId = wsRes.body.data.id;

    const fwsRes = await request(app.getHttpServer())
      .post('/api/v1/workspaces')
      .set('Authorization', `Bearer ${foreignToken}`)
      .send({ name: 'Scheduling Foreign Workspace', timezone: 'UTC' });
    foreignWorkspaceId = fwsRes.body.data.id;

    // 6. Add Editor and Viewer to Main Workspace
    const editorDbUser = await prisma.user.findUnique({ where: { email: editorUser.email } });
    await prisma.workspaceMember.create({
      data: {
        workspaceId,
        userId: editorDbUser!.id,
        role: WorkspaceRole.EDITOR,
      },
    });

    const viewerDbUser = await prisma.user.findUnique({ where: { email: viewerUser.email } });
    await prisma.workspaceMember.create({
      data: {
        workspaceId,
        userId: viewerDbUser!.id,
        role: WorkspaceRole.VIEWER,
      },
    });

    // 7. Seed Social Accounts with valid TokenVault encryption
    const tokenVault = app.get<TokenVaultService>(TokenVaultService);
    const ownerDb = await prisma.user.findUnique({ where: { email: ownerUser.email } });
    const foreignDb = await prisma.user.findUnique({ where: { email: foreignUser.email } });

    const fbAccount = await prisma.socialAccount.create({
      data: {
        workspaceId,
        provider: SocialProvider.META_FACEBOOK,
        providerAccountId: `fb_page_${timestamp}`,
        accountName: 'Main Facebook Page',
        accountType: SocialAccountType.FACEBOOK_PAGE,
        encryptedAccessToken: tokenVault.encrypt('mock_fb_access_token'),
        grantedScopes: ['pages_manage_posts'],
        connectedByUserId: ownerDb!.id,
      },
    });
    fbAccountId = fbAccount.id;

    const igAccount = await prisma.socialAccount.create({
      data: {
        workspaceId,
        provider: SocialProvider.META_INSTAGRAM,
        providerAccountId: `ig_biz_${timestamp}`,
        accountName: 'Main Instagram Business',
        accountType: SocialAccountType.INSTAGRAM_BUSINESS,
        encryptedAccessToken: tokenVault.encrypt('mock_ig_access_token'),
        grantedScopes: ['instagram_content_publish'],
        connectedByUserId: ownerDb!.id,
      },
    });
    igAccountId = igAccount.id;

    const fAccount = await prisma.socialAccount.create({
      data: {
        workspaceId: foreignWorkspaceId,
        provider: SocialProvider.META_FACEBOOK,
        providerAccountId: `foreign_fb_${timestamp}`,
        accountName: 'Foreign Facebook Page',
        accountType: SocialAccountType.FACEBOOK_PAGE,
        encryptedAccessToken: tokenVault.encrypt('mock_foreign_access_token'),
        grantedScopes: ['pages_manage_posts'],
        connectedByUserId: foreignDb!.id,
      },
    });
    foreignAccountId = fAccount.id;

    // 8. Seed Drafts
    // A. Approved Draft
    const draftRes = await request(app.getHttpServer())
      .post(`/api/v1/workspaces/${workspaceId}/content-drafts`)
      .set('Authorization', `Bearer ${editorToken}`)
      .send({
        title: 'Festival Product Announcement',
        objective: 'ENGAGEMENT',
        contentType: 'POST',
        language: 'en',
        variants: [
          {
            platform: SocialPlatform.FACEBOOK,
            headline: 'Special Discount Offer',
            body: 'Get 50% discount on all purchases today!',
            hashtags: ['#Sale', '#Offer'],
          },
          {
            platform: SocialPlatform.INSTAGRAM,
            body: 'Special Discount Offer! 50% off! Link in bio.',
            hashtags: ['#InstaSale'],
          },
        ],
      });
    approvedDraftId = draftRes.body.data.id;

    // Submit for review
    await request(app.getHttpServer())
      .post(`/api/v1/workspaces/${workspaceId}/content-drafts/${approvedDraftId}/submit-review`)
      .set('Authorization', `Bearer ${editorToken}`)
      .send();

    // Owner approves draft (Four-eyes policy compliant)
    await request(app.getHttpServer())
      .post(`/api/v1/workspaces/${workspaceId}/content-drafts/${approvedDraftId}/approve`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send();

    // B. Unapproved Draft
    const unapprovedRes = await request(app.getHttpServer())
      .post(`/api/v1/workspaces/${workspaceId}/content-drafts`)
      .set('Authorization', `Bearer ${editorToken}`)
      .send({
        title: 'Draft In Progress',
        objective: 'BRAND_AWARENESS',
        contentType: 'POST',
        variants: [{ platform: SocialPlatform.FACEBOOK, body: 'Not approved draft text' }],
      });
    unapprovedDraftId = unapprovedRes.body.data.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await app.close();
  });

  describe('POST /workspaces/:workspaceId/scheduled-posts', () => {
    it('should reject scheduling an unapproved draft with 400 Bad Request', async () => {
      const scheduledTime = new Date(Date.now() + 3600 * 1000).toISOString();
      const res = await request(app.getHttpServer())
        .post(`/api/v1/workspaces/${workspaceId}/scheduled-posts`)
        .set('Authorization', `Bearer ${editorToken}`)
        .send({
          draftId: unapprovedDraftId,
          scheduledAt: scheduledTime,
          targets: [{ socialAccountId: fbAccountId, platform: SocialPlatform.FACEBOOK }],
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('APPROVED');
    });

    it('should reject VIEWER role with 403 Forbidden', async () => {
      const scheduledTime = new Date(Date.now() + 3600 * 1000).toISOString();
      const res = await request(app.getHttpServer())
        .post(`/api/v1/workspaces/${workspaceId}/scheduled-posts`)
        .set('Authorization', `Bearer ${viewerToken}`)
        .send({
          draftId: approvedDraftId,
          scheduledAt: scheduledTime,
          targets: [{ socialAccountId: fbAccountId, platform: SocialPlatform.FACEBOOK }],
        });

      expect(res.status).toBe(403);
    });

    it('should reject scheduling times less than 5 minutes in future', async () => {
      const tooSoonTime = new Date(Date.now() + 60 * 1000).toISOString(); // 1 minute in future
      const res = await request(app.getHttpServer())
        .post(`/api/v1/workspaces/${workspaceId}/scheduled-posts`)
        .set('Authorization', `Bearer ${editorToken}`)
        .send({
          draftId: approvedDraftId,
          scheduledAt: tooSoonTime,
          targets: [{ socialAccountId: fbAccountId, platform: SocialPlatform.FACEBOOK }],
        });

      expect(res.status).toBe(400);
    });

    it('should reject cross-workspace social account with 403 Forbidden', async () => {
      const scheduledTime = new Date(Date.now() + 3600 * 1000).toISOString();
      const res = await request(app.getHttpServer())
        .post(`/api/v1/workspaces/${workspaceId}/scheduled-posts`)
        .set('Authorization', `Bearer ${editorToken}`)
        .send({
          draftId: approvedDraftId,
          scheduledAt: scheduledTime,
          targets: [{ socialAccountId: foreignAccountId, platform: SocialPlatform.FACEBOOK }],
        });

      expect(res.status).toBe(403);
    });

    it('should reject duplicate target accounts in single schedule request', async () => {
      const scheduledTime = new Date(Date.now() + 3600 * 1000).toISOString();
      const res = await request(app.getHttpServer())
        .post(`/api/v1/workspaces/${workspaceId}/scheduled-posts`)
        .set('Authorization', `Bearer ${editorToken}`)
        .send({
          draftId: approvedDraftId,
          scheduledAt: scheduledTime,
          targets: [
            { socialAccountId: fbAccountId, platform: SocialPlatform.FACEBOOK },
            { socialAccountId: fbAccountId, platform: SocialPlatform.FACEBOOK },
          ],
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Duplicate social accounts');
    });

    it('should successfully schedule an approved draft targeting Facebook and Instagram', async () => {
      const scheduledTime = new Date(Date.now() + 2 * 3600 * 1000).toISOString();
      const res = await request(app.getHttpServer())
        .post(`/api/v1/workspaces/${workspaceId}/scheduled-posts`)
        .set('Authorization', `Bearer ${editorToken}`)
        .send({
          draftId: approvedDraftId,
          scheduledAt: scheduledTime,
          timezone: 'Asia/Kolkata',
          targets: [
            { socialAccountId: fbAccountId, platform: SocialPlatform.FACEBOOK },
            { socialAccountId: igAccountId, platform: SocialPlatform.INSTAGRAM },
          ],
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBeDefined();
      expect(res.body.data.status).toBe(ScheduledPostStatus.SCHEDULED);
      expect(res.body.data.approvedRevisionNumber).toBeGreaterThanOrEqual(1);
      expect(res.body.data.snapshotHash).toHaveLength(64);
      expect(res.body.data.targets).toHaveLength(2);

      scheduledPostId = res.body.data.id;
    });
  });

  describe('GET /workspaces/:workspaceId/scheduled-posts', () => {
    it('should list scheduled posts with pagination', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/workspaces/${workspaceId}/scheduled-posts?page=1&limit=10`)
        .set('Authorization', `Bearer ${editorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
      expect(res.body.pagination.total).toBeGreaterThanOrEqual(1);
    });

    it('should get detailed scheduled post by ID', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/workspaces/${workspaceId}/scheduled-posts/${scheduledPostId}`)
        .set('Authorization', `Bearer ${viewerToken}`); // Viewers can read

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(scheduledPostId);
      expect(res.body.data.targets).toHaveLength(2);
      expect(res.body.data.contentSnapshot).toBeDefined();
    });

    it('should query calendar date range', async () => {
      const startDate = new Date().toISOString();
      const endDate = new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString();

      const res = await request(app.getHttpServer())
        .get(`/api/v1/workspaces/${workspaceId}/scheduled-posts/calendar?startDate=${startDate}&endDate=${endDate}&timezone=UTC`)
        .set('Authorization', `Bearer ${editorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('PATCH /workspaces/:workspaceId/scheduled-posts/:id/reschedule', () => {
    it('should reschedule post to a new timestamp', async () => {
      const newTime = new Date(Date.now() + 4 * 3600 * 1000).toISOString();

      const res = await request(app.getHttpServer())
        .patch(`/api/v1/workspaces/${workspaceId}/scheduled-posts/${scheduledPostId}/reschedule`)
        .set('Authorization', `Bearer ${editorToken}`)
        .send({
          scheduledAt: newTime,
          timezone: 'America/New_York',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(new Date(res.body.data.scheduledAt).getTime()).toBe(new Date(newTime).getTime());
    });
  });

  describe('DELETE /workspaces/:workspaceId/scheduled-posts/:id/cancel', () => {
    it('should cancel a scheduled post and all its pending targets', async () => {
      const res = await request(app.getHttpServer())
        .delete(`/api/v1/workspaces/${workspaceId}/scheduled-posts/${scheduledPostId}/cancel`)
        .set('Authorization', `Bearer ${editorToken}`)
        .send({
          reason: 'Postponed campaign',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe(ScheduledPostStatus.CANCELLED);

      // Verify in DB that targets are marked CANCELLED
      const dbTargets = await prisma.scheduledPostTarget.findMany({
        where: { scheduledPostId },
      });
      for (const t of dbTargets) {
        expect(t.status).toBe(PublishTargetStatus.CANCELLED);
      }
    });
  });

  describe('Relational Integrity & Foreign Key Protection', () => {
    let secondPostId: string;
    let targetToRetryId: string;

    it('should block deletion of a draft referenced by scheduled/published posts (onDelete: RESTRICT)', async () => {
      // Create another scheduled post referencing approvedDraftId
      const scheduledTime = new Date(Date.now() + 5 * 3600 * 1000).toISOString();
      const schedRes = await request(app.getHttpServer())
        .post(`/api/v1/workspaces/${workspaceId}/scheduled-posts`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          draftId: approvedDraftId,
          scheduledAt: scheduledTime,
          targets: [{ socialAccountId: fbAccountId, platform: SocialPlatform.FACEBOOK }],
        });

      secondPostId = schedRes.body.data.id;
      targetToRetryId = schedRes.body.data.targets[0].id;

      // Attempting to delete draft directly from DB must be rejected by foreign key constraint
      await expect(
        prisma.contentDraft.delete({ where: { id: approvedDraftId } }),
      ).rejects.toThrow();
    });

    it('should manually retry an eligible target and publish via mock provider', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/workspaces/${workspaceId}/scheduled-posts/${secondPostId}/targets/${targetToRetryId}/retry`)
        .set('Authorization', `Bearer ${editorToken}`);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      const retriedTarget = res.body.data.targets.find((t: any) => t.id === targetToRetryId);
      expect(retriedTarget.status).toBe(PublishTargetStatus.PUBLISHED);
      expect(retriedTarget.externalPostId).toBeDefined();
    });
  });
});
