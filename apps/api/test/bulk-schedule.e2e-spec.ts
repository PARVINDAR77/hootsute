import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import * as cookieParser from 'cookie-parser';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import {
  WorkspaceRole,
  SocialPlatform,
  SocialProvider,
  SocialAccountType,
  ScheduledPostStatus,
  SocialConnectionStatus,
} from '@prisma/client';
import { TokenVaultService } from '../src/social-accounts/token-vault/token-vault.service';

describe('Phase 15: Bulk CSV / Batch Calendar Importer (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const timestamp = Date.now();
  const ownerUser = {
    name: 'Bulk Schedule Owner',
    email: `bulk_owner_${timestamp}@test.com`,
    password: 'Password123!',
  };
  const viewerUser = {
    name: 'Bulk Schedule Viewer',
    email: `bulk_viewer_${timestamp}@test.com`,
    password: 'Password123!',
  };

  let ownerToken: string;
  let viewerToken: string;
  let workspaceId: string;
  let fbAccountId: string;
  let twAccountId: string;

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
      .send({ name: `Bulk CSV Workspace ${timestamp}` });
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

    const tokenVault = app.get<TokenVaultService>(TokenVaultService);
    const ownerUserRecord = await prisma.user.findUnique({
      where: { email: ownerUser.email },
    });

    // 5. Create active connected accounts for testing
    const fbAccount = await prisma.socialAccount.create({
      data: {
        workspaceId,
        provider: SocialProvider.META_FACEBOOK,
        accountType: SocialAccountType.FACEBOOK_PAGE,
        providerAccountId: `fb-bulk-${timestamp}`,
        accountName: 'Acme Official FB',
        accountUsername: 'acme_official',
        connectionStatus: SocialConnectionStatus.CONNECTED,
        tokenExpiresAt: new Date(Date.now() + 86400000),
        encryptedAccessToken: tokenVault.encrypt('mock_fb_access_token'),
        grantedScopes: ['pages_manage_posts'],
        connectedByUserId: ownerUserRecord!.id,
      },
    });
    fbAccountId = fbAccount.id;

    const twAccount = await prisma.socialAccount.create({
      data: {
        workspaceId,
        provider: SocialProvider.TWITTER_X,
        accountType: SocialAccountType.TWITTER_PROFILE,
        providerAccountId: `tw-bulk-${timestamp}`,
        accountName: 'Acme Official X',
        accountUsername: 'acme_x',
        connectionStatus: SocialConnectionStatus.CONNECTED,
        tokenExpiresAt: new Date(Date.now() + 86400000),
        encryptedAccessToken: tokenVault.encrypt('mock_tw_access_token'),
        grantedScopes: ['tweet.read', 'tweet.write', 'users.read'],
        connectedByUserId: ownerUserRecord!.id,
      },
    });
    twAccountId = twAccount.id;
  });

  afterAll(async () => {
    // Cleanup workspace
    if (workspaceId) {
      await prisma.scheduledPost.deleteMany({ where: { workspaceId } });
      await prisma.contentDraft.deleteMany({ where: { workspaceId } });
      await prisma.socialAccount.deleteMany({ where: { workspaceId } });
      await prisma.workspaceMember.deleteMany({ where: { workspaceId } });
      await prisma.workspace.deleteMany({ where: { id: workspaceId } });
    }
    await app.close();
  });

  describe('GET /api/v1/workspaces/:workspaceId/bulk-schedule/template', () => {
    it('should download a ready-to-use CSV template with headers and sample rows', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/workspaces/${workspaceId}/bulk-schedule/template`)
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('text/csv');
      expect(res.headers['content-disposition']).toContain('omnisocial_bulk_schedule_template.csv');
      expect(res.text).toContain('Scheduled Date');
      expect(res.text).toContain('Caption');
      expect(res.text).toContain('Platforms');
      expect(res.text).toContain('Product Launch Teaser');
    });
  });

  describe('POST /api/v1/workspaces/:workspaceId/bulk-schedule/validate', () => {
    it('should validate CSV rows and report accurate pre-flight diagnostics', async () => {
      const futureDate1 = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();
      const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

      const csvContent = `Scheduled Date,Timezone,Title,Caption,Platforms,Accounts,Media URLs,Hashtags
"${futureDate1}","UTC","Valid Post","Super excited for our new batch importer!","FACEBOOK","acme_official","https://images.unsplash.com/photo-1.jpg","#AI #SaaS"
"${pastDate}","UTC","Invalid Past Post","This post is scheduled in the past!","FACEBOOK","acme_official","",""
"${futureDate1}","UTC","Invalid Character Limit","${'X'.repeat(300)}","TWITTER_X","acme_x","",""`;

      const res = await request(app.getHttpServer())
        .post(`/api/v1/workspaces/${workspaceId}/bulk-schedule/validate`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ csvContent });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const data = res.body.data;
      expect(data.totalRows).toBe(3);
      expect(data.validCount).toBe(1);
      expect(data.invalidCount).toBe(2);

      // Row 1: Valid
      expect(data.rows[0].isValid).toBe(true);
      expect(data.rows[0].data.platforms).toContain(SocialPlatform.FACEBOOK);
      expect(data.rows[0].targetAccounts[0].id).toBe(fbAccountId);

      // Row 2: Past date error
      expect(data.rows[1].isValid).toBe(false);
      expect(data.rows[1].errors.some((e: string) => e.includes('future'))).toBe(true);

      // Row 3: Twitter 280 length error
      expect(data.rows[2].isValid).toBe(false);
      expect(data.rows[2].errors.some((e: string) => e.includes('280 characters'))).toBe(true);
    });

    it('should reject empty CSV content with 400 Bad Request', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/workspaces/${workspaceId}/bulk-schedule/validate`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ csvContent: '' });

      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/v1/workspaces/:workspaceId/bulk-schedule/import', () => {
    it('should reject viewer role from importing posts', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/workspaces/${workspaceId}/bulk-schedule/import`)
        .set('Authorization', `Bearer ${viewerToken}`)
        .send({
          rows: [
            {
              rowNumber: 2,
              scheduledAt: new Date(Date.now() + 86400000).toISOString(),
              caption: 'Viewer unauthorized attempt',
              platforms: [SocialPlatform.FACEBOOK],
              socialAccountIds: [fbAccountId],
            },
          ],
        });

      expect(res.status).toBe(403);
    });

    it('should successfully import valid rows into drafts and scheduled posts', async () => {
      const futureDate = new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString();
      const res = await request(app.getHttpServer())
        .post(`/api/v1/workspaces/${workspaceId}/bulk-schedule/import`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          rows: [
            {
              rowNumber: 2,
              scheduledAt: futureDate,
              timezone: 'UTC',
              title: 'E2E Bulk Imported Post',
              caption: 'Seamless multi-platform scheduled delivery!',
              platforms: [SocialPlatform.FACEBOOK, SocialPlatform.TWITTER_X],
              socialAccountIds: [fbAccountId, twAccountId],
              hashtags: ['#OmniSocial', '#Productivity'],
              mediaUrls: ['https://images.unsplash.com/photo-demo.jpg'],
            },
          ],
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.importedCount).toBe(1);
      expect(res.body.data.failedCount).toBe(0);

      const importedPost = res.body.data.scheduledPosts[0];
      expect(importedPost.scheduledPostId).toBeDefined();
      expect(importedPost.targetCount).toBe(2);

      // Verify in DB
      const dbPost = await prisma.scheduledPost.findUnique({
        where: { id: importedPost.scheduledPostId },
        include: { targets: true, draft: { include: { variants: true } } },
      });

      expect(dbPost).toBeDefined();
      expect(dbPost!.status).toBe(ScheduledPostStatus.SCHEDULED);
      expect(dbPost!.targets).toHaveLength(2);
      expect(dbPost!.draft.variants).toHaveLength(2);
      expect(dbPost!.snapshotHash).toBeDefined();
    });
  });
});
