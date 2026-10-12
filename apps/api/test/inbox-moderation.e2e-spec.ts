import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import * as cookieParser from 'cookie-parser';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { WorkspaceRole, SocialPlatform } from '@prisma/client';
import { InboxModerationAction } from '@packages/shared';

describe('Phase 20: AI Smart Auto-Moderation & Sentiment-Driven Triage (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const timestamp = Date.now();
  const ownerUser = {
    name: 'Moderation Lead',
    email: `mod_owner_${timestamp}@test.com`,
    password: 'Password123!',
  };
  const editorUser = {
    name: 'Community Specialist',
    email: `mod_editor_${timestamp}@test.com`,
    password: 'Password123!',
  };
  const viewerUser = {
    name: 'Inbox Viewer',
    email: `mod_viewer_${timestamp}@test.com`,
    password: 'Password123!',
  };

  let ownerToken: string;
  let editorToken: string;
  let viewerToken: string;
  let workspaceId: string;
  let socialAccountId: string;
  let createdRuleId: string;
  let createdTemplateId: string;
  let testInteractionId: string;

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

    // 4. Create Workspace
    const wsRes = await request(app.getHttpServer())
      .post('/api/v1/workspaces')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        name: `Moderation Workspace ${timestamp}`,
        industry: 'ECOMMERCE',
      });
    workspaceId = wsRes.body.data.id;

    // 5. Add Editor & Viewer to Workspace
    const editorRecord = await prisma.user.findUnique({ where: { email: editorUser.email } });
    const viewerRecord = await prisma.user.findUnique({ where: { email: viewerUser.email } });
    const ownerRecord = await prisma.user.findUnique({ where: { email: ownerUser.email } });

    await prisma.workspaceMember.createMany({
      data: [
        {
          workspaceId,
          userId: editorRecord!.id,
          role: WorkspaceRole.EDITOR,
        },
        {
          workspaceId,
          userId: viewerRecord!.id,
          role: WorkspaceRole.VIEWER,
        },
      ],
    });

    // 6. Seed a connected social account
    const account = await prisma.socialAccount.create({
      data: {
        workspaceId,
        provider: 'META_FACEBOOK' as any,
        providerAccountId: `fb-act-${timestamp}`,
        accountName: 'Omni Retail Shop',
        accountType: 'FACEBOOK_PAGE' as any,
        connectionStatus: 'CONNECTED' as any,
        encryptedAccessToken: 'mock_encrypted_token',
        connectedByUserId: ownerRecord!.id,
      },
    });
    socialAccountId = account.id;

    // 7. Seed an interaction for triage evaluation
    const interaction = await prisma.socialInteraction.create({
      data: {
        workspaceId,
        socialAccountId,
        platform: SocialPlatform.FACEBOOK,
        externalInteractionId: `ext-comment-${timestamp}`,
        authorProviderId: 'fb-author-123',
        authorName: 'Frustrated Buyer',
        content: 'Your checkout was a total scam and fraudulent charge! Help immediately.',
        publishedAt: new Date(),
        workflowStatus: 'OPEN',
        rawMetadata: { sentiment: 'NEGATIVE' },
      },
    });
    testInteractionId = interaction.id;
  });

  afterAll(async () => {
    if (workspaceId) {
      await prisma.workspace.delete({ where: { id: workspaceId } }).catch(() => {});
    }
    await prisma.user.deleteMany({
      where: {
        email: { in: [ownerUser.email, editorUser.email, viewerUser.email] },
      },
    }).catch(() => {});
    await app.close();
  });

  // ==========================================
  // 1. Auto-Moderation Rules
  // ==========================================
  describe('Auto-Moderation Rules', () => {
    it('should reject rule creation by VIEWER (403)', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/workspaces/${workspaceId}/inbox/moderation-rules`)
        .set('Authorization', `Bearer ${viewerToken}`)
        .send({
          name: 'Unauthorized Rule',
          action: InboxModerationAction.AUTO_FLAG,
        });

      expect(res.status).toBe(403);
    });

    it('should allow OWNER to configure an auto-moderation triage rule', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/workspaces/${workspaceId}/inbox/moderation-rules`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          name: 'Fraud & Escalation Alert',
          description: 'Auto-flags mentions of scam or fraudulent charges',
          triggerSentiment: 'NEGATIVE',
          keywords: ['scam', 'fraudulent', 'chargeback'],
          action: InboxModerationAction.AUTO_FLAG,
          priority: 10,
        });

      expect(res.status).toBe(201);
      expect(res.body.data.name).toBe('Fraud & Escalation Alert');
      expect(res.body.data.action).toBe(InboxModerationAction.AUTO_FLAG);
      expect(res.body.data.keywords).toContain('fraudulent');

      createdRuleId = res.body.data.id;
    });

    it('should allow VIEWER to list moderation rules', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/workspaces/${workspaceId}/inbox/moderation-rules`)
        .set('Authorization', `Bearer ${viewerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].id).toBe(createdRuleId);
    });

    it('should allow OWNER to update rule parameters', async () => {
      const res = await request(app.getHttpServer())
        .put(`/api/v1/workspaces/${workspaceId}/inbox/moderation-rules/${createdRuleId}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          name: 'High Priority Crisis Alert',
          priority: 20,
        });

      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe('High Priority Crisis Alert');
      expect(res.body.data.priority).toBe(20);
    });
  });

  // ==========================================
  // 2. Auto-Reply Templates
  // ==========================================
  describe('Auto-Reply Templates', () => {
    it('should allow EDITOR to create an AI auto-reply template', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/workspaces/${workspaceId}/inbox/reply-templates`)
        .set('Authorization', `Bearer ${editorToken}`)
        .send({
          title: 'Urgent Escalation Apology',
          content: 'We sincerely apologize for this frustration. A senior manager has been paged to resolve your issue.',
          category: 'SUPPORT',
          sentimentMatch: 'NEGATIVE',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.title).toBe('Urgent Escalation Apology');
      expect(res.body.data.category).toBe('SUPPORT');

      createdTemplateId = res.body.data.id;
    });

    it('should allow VIEWER to list templates with category filter', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/workspaces/${workspaceId}/inbox/reply-templates?category=SUPPORT`)
        .set('Authorization', `Bearer ${viewerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].id).toBe(createdTemplateId);
    });
  });

  // ==========================================
  // 3. Triage Evaluation Engine
  // ==========================================
  describe('Triage Evaluation Engine', () => {
    it('should evaluate interaction and trigger AUTO_FLAG rule', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/workspaces/${workspaceId}/inbox/interactions/${testInteractionId}/triage`)
        .set('Authorization', `Bearer ${editorToken}`);

      expect(res.status).toBe(201);
      expect(res.body.data.actionTaken).toBe(InboxModerationAction.AUTO_FLAG);
      expect(res.body.data.matchedRuleId).toBe(createdRuleId);
      expect(res.body.data.flagged).toBe(true);

      // Verify interaction status in database is now IN_PROGRESS
      const updatedInteraction = await prisma.socialInteraction.findUnique({
        where: { id: testInteractionId },
      });
      expect(updatedInteraction?.workflowStatus).toBe('IN_PROGRESS');
      expect((updatedInteraction?.rawMetadata as any)?.isFlagged).toBe(true);
    });

    it('should allow EDITOR to delete an auto-reply template', async () => {
      const res = await request(app.getHttpServer())
        .delete(`/api/v1/workspaces/${workspaceId}/inbox/reply-templates/${createdTemplateId}`)
        .set('Authorization', `Bearer ${editorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should allow OWNER to delete a moderation rule', async () => {
      const res = await request(app.getHttpServer())
        .delete(`/api/v1/workspaces/${workspaceId}/inbox/moderation-rules/${createdRuleId}`)
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});
