import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import * as cookieParser from 'cookie-parser';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { TokenVaultService } from '../src/social-accounts/token-vault/token-vault.service';
import { InboxAdapterFactory } from '../src/inbox/adapters/inbox-adapter.factory';
import {
  SocialPlatform,
  SocialProvider,
  SocialAccountType,
  SocialConnectionStatus,
  InteractionType,
  InteractionWorkflowStatus,
  WorkspaceRole,
} from '@prisma/client';
import * as crypto from 'crypto';

describe('Stage 8: Unified Social Inbox & Community Management (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let tokenVault: TokenVaultService;
  let adapterFactory: InboxAdapterFactory;

  const timestamp = Date.now();
  let workspaceId: string;
  let foreignWorkspaceId: string;
  let ownerUserId: string;
  let viewerUserId: string;
  let ownerToken: string;
  let viewerToken: string;
  let socialAccountId: string;
  let interactionId: string;

  const mockAdapter = {
    checkPermissionHealth: jest.fn().mockReturnValue({ canRead: true, canReply: true, missingScopes: [] }),
    fetchRecentInteractions: jest.fn().mockResolvedValue({ items: [], nextCursor: null }),
    postReply: jest.fn().mockResolvedValue({
      success: true,
      outcome: 'SUCCESS',
      externalReplyId: 'mock-fb-reply-101',
    }),
  };

  beforeAll(async () => {
    process.env.META_APP_SECRET = 'test_meta_webhook_secret_key';

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
    tokenVault = app.get<TokenVaultService>(TokenVaultService);
    adapterFactory = app.get<InboxAdapterFactory>(InboxAdapterFactory);

    // Mock adapter for provider calls
    jest.spyOn(adapterFactory, 'getAdapter').mockReturnValue(mockAdapter as any);

    // 1. Create Owner User
    const ownerUser = {
      name: 'Inbox Owner',
      email: `inbox_owner_${timestamp}@test.com`,
      password: 'Password123!',
    };
    await request(app.getHttpServer()).post('/api/v1/auth/register').send(ownerUser);
    const ownerLoginRes = await request(app.getHttpServer()).post('/api/v1/auth/login').send({
      email: ownerUser.email,
      password: ownerUser.password,
    });
    ownerToken = ownerLoginRes.body.data.accessToken;
    ownerUserId = ownerLoginRes.body.data.user.id;

    // 2. Create Viewer User
    const viewerUser = {
      name: 'Inbox Viewer',
      email: `inbox_viewer_${timestamp}@test.com`,
      password: 'Password123!',
    };
    await request(app.getHttpServer()).post('/api/v1/auth/register').send(viewerUser);
    const viewerLoginRes = await request(app.getHttpServer()).post('/api/v1/auth/login').send({
      email: viewerUser.email,
      password: viewerUser.password,
    });
    viewerToken = viewerLoginRes.body.data.accessToken;
    viewerUserId = viewerLoginRes.body.data.user.id;

    // 3. Create Main Workspace (with owner and viewer)
    const ws = await prisma.workspace.create({
      data: {
        name: `Inbox Workspace ${timestamp}`,
        slug: `inbox-ws-${timestamp}`,
        createdById: ownerUserId,
        members: {
          create: [
            { userId: ownerUserId, role: WorkspaceRole.OWNER },
            { userId: viewerUserId, role: WorkspaceRole.VIEWER },
          ],
        },
      },
    });
    workspaceId = ws.id;

    // 4. Create Foreign Workspace (to verify IDOR)
    const foreignWs = await prisma.workspace.create({
      data: {
        name: `Foreign Inbox Workspace ${timestamp}`,
        slug: `foreign-inbox-ws-${timestamp}`,
        createdById: ownerUserId,
      },
    });
    foreignWorkspaceId = foreignWs.id;

    // 5. Create Connected Social Account
    const account = await prisma.socialAccount.create({
      data: {
        workspaceId,
        provider: SocialProvider.META_FACEBOOK,
        providerAccountId: `fb_page_${timestamp}`,
        accountName: 'Acme Support Page',
        accountUsername: 'acmesupport',
        accountType: SocialAccountType.FACEBOOK_PAGE,
        connectionStatus: SocialConnectionStatus.CONNECTED,
        encryptedAccessToken: tokenVault.encrypt('mock_page_token'),
        grantedScopes: ['pages_show_list', 'pages_read_engagement', 'pages_manage_engagement'],
        connectedByUserId: ownerUserId,
      },
    });
    socialAccountId = account.id;

    // 6. Create Seed Social Interaction
    const interaction = await prisma.socialInteraction.create({
      data: {
        workspaceId,
        socialAccountId,
        platform: SocialPlatform.FACEBOOK,
        interactionType: InteractionType.COMMENT,
        externalInteractionId: `comm_${timestamp}`,
        authorProviderId: 'fb_user_1',
        authorName: 'Alice Customer',
        content: 'When does the winter sale start?',
        publishedAt: new Date(),
        workflowStatus: InteractionWorkflowStatus.OPEN,
        isRead: false,
      },
    });
    interactionId = interaction.id;
  });

  afterAll(async () => {
    await prisma.inboxNotification.deleteMany({ where: { workspaceId } });
    await prisma.interactionNote.deleteMany({ where: { workspaceId } });
    await prisma.interactionReplyAttempt.deleteMany({ where: { workspaceId } });
    await prisma.socialInteraction.deleteMany({ where: { workspaceId } });
    await prisma.inboxSyncCheckpoint.deleteMany({ where: { workspaceId } });
    await prisma.socialAccount.deleteMany({ where: { workspaceId } });
    await prisma.workspaceMember.deleteMany({ where: { workspaceId } });
    await prisma.workspace.deleteMany({ where: { id: { in: [workspaceId, foreignWorkspaceId] } } });
    await prisma.user.deleteMany({ where: { id: { in: [ownerUserId, viewerUserId] } } });
    await app.close();
  });

  describe('GET /workspaces/:workspaceId/inbox/interactions', () => {
    it('returns paginated interactions for authorized workspace member', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/workspaces/${workspaceId}/inbox/interactions`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
      expect(res.body.counts.unread).toBeGreaterThanOrEqual(1);
      expect(res.body.data[0].content).toContain('winter sale');
    });

    it('rejects access from user not in the workspace (IDOR prevention)', async () => {
      // Create user not in workspace
      const strangerRes = await request(app.getHttpServer()).post('/api/v1/auth/register').send({
        name: 'Stranger',
        email: `stranger_${timestamp}@test.com`,
        password: 'Password123!',
      });
      const strangerLogin = await request(app.getHttpServer()).post('/api/v1/auth/login').send({
        email: `stranger_${timestamp}@test.com`,
        password: 'Password123!',
      });
      const strangerToken = strangerLogin.body.data.accessToken;

      await request(app.getHttpServer())
        .get(`/api/v1/workspaces/${workspaceId}/inbox/interactions`)
        .set('Authorization', `Bearer ${strangerToken}`)
        .expect(403);

      await prisma.user.delete({ where: { id: strangerLogin.body.data.user.id } });
    });
  });

  describe('GET /workspaces/:workspaceId/inbox/interactions/:interactionId', () => {
    it('returns interaction details and conversation thread', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/workspaces/${workspaceId}/inbox/interactions/${interactionId}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(interactionId);
      expect(res.body.data.socialAccount.accountName).toBe('Acme Support Page');
    });

    it('prevents cross-workspace interaction IDOR lookup (404/403)', async () => {
      await request(app.getHttpServer())
        .get(`/api/v1/workspaces/${foreignWorkspaceId}/inbox/interactions/${interactionId}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(403); // Owner is not a member of foreignWorkspaceId
    });
  });

  describe('POST /workspaces/:workspaceId/inbox/interactions/:interactionId/replies', () => {
    it('blocks VIEWER role from posting replies (403 Forbidden)', async () => {
      await request(app.getHttpServer())
        .post(`/api/v1/workspaces/${workspaceId}/inbox/interactions/${interactionId}/replies`)
        .set('Authorization', `Bearer ${viewerToken}`)
        .send({
          content: 'The sale starts Friday!',
          idempotencyKey: '00000000-0000-0000-0000-000000000001',
        })
        .expect(403);
    });

    it('allows OWNER to post reply, updates workflow status to RESOLVED, and marks isRead', async () => {
      const idempotencyKey = '11111111-1111-1111-1111-111111111111';

      const res = await request(app.getHttpServer())
        .post(`/api/v1/workspaces/${workspaceId}/inbox/interactions/${interactionId}/replies`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          content: 'Our winter sale kicks off on Friday at 9 AM EST!',
          idempotencyKey,
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('SENT');
      expect(res.body.data.externalReplyId).toBe('mock-fb-reply-101');

      // Verify interaction state in database
      const updated = await prisma.socialInteraction.findUnique({
        where: { id: interactionId },
      });
      expect(updated.workflowStatus).toBe(InteractionWorkflowStatus.RESOLVED);
      expect(updated.isRead).toBe(true);
    });

    it('enforces idempotency on duplicate reply submission with same key', async () => {
      const idempotencyKey = '11111111-1111-1111-1111-111111111111'; // Same key

      const res = await request(app.getHttpServer())
        .post(`/api/v1/workspaces/${workspaceId}/inbox/interactions/${interactionId}/replies`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          content: 'Our winter sale kicks off on Friday at 9 AM EST!',
          idempotencyKey,
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('idempotent');
    });
  });

  describe('PATCH /workspaces/:workspaceId/inbox/interactions/:interactionId/assignment', () => {
    it('rejects assignment to a user outside the workspace', async () => {
      await request(app.getHttpServer())
        .patch(`/api/v1/workspaces/${workspaceId}/inbox/interactions/${interactionId}/assignment`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ assignedToUserId: 'non-existent-user-id' })
        .expect(400);
    });

    it('assigns interaction to active workspace member and transitions status to ASSIGNED', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/workspaces/${workspaceId}/inbox/interactions/${interactionId}/assignment`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ assignedToUserId: viewerUserId })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.assignedToUserId).toBe(viewerUserId);

      // Verify notification created for viewer
      const notif = await prisma.inboxNotification.findFirst({
        where: { workspaceId, recipientUserId: viewerUserId },
      });
      expect(notif).toBeDefined();
      expect(notif.type).toBe('ASSIGNMENT');
    });
  });

  describe('POST /workspaces/:workspaceId/inbox/interactions/:interactionId/notes', () => {
    it('allows team members to add private internal notes', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/workspaces/${workspaceId}/inbox/interactions/${interactionId}/notes`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ content: 'VIP customer. Handled personally.' })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.content).toBe('VIP customer. Handled personally.');

      const listRes = await request(app.getHttpServer())
        .get(`/api/v1/workspaces/${workspaceId}/inbox/interactions/${interactionId}/notes`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200);

      expect(listRes.body.data.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Meta Social Webhooks (/webhooks/meta)', () => {
    it('GET /api/v1/webhooks/meta returns challenge during handshake', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/webhooks/meta?hub.mode=subscribe&hub.verify_token=omnisocial_meta_social_verify_token&hub.challenge=test_challenge_code_999')
        .expect(200);

      expect(res.text).toBe('test_challenge_code_999');
    });

    it('POST /api/v1/webhooks/meta rejects request with invalid HMAC signature', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/webhooks/meta')
        .set('x-hub-signature-256', 'sha256=invalid000000000000000000000000000000000000000000000000000000000000')
        .send({ object: 'page', entry: [] })
        .expect(401);
    });
  });
});
