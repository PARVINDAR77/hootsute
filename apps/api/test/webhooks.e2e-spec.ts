import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import * as cookieParser from 'cookie-parser';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { WorkspaceRole } from '@prisma/client';

describe('Phase 22: Outbound Webhooks & Developer Integrations (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const timestamp = Date.now();
  const ownerUser = {
    name: 'Integration Architect',
    email: `wh_owner_${timestamp}@test.com`,
    password: 'Password123!',
  };
  const viewerUser = {
    name: 'Webhook Observer',
    email: `wh_viewer_${timestamp}@test.com`,
    password: 'Password123!',
  };

  let ownerToken: string;
  let viewerToken: string;
  let workspaceId: string;
  let createdSubscriptionId: string;
  let recordedDeliveryId: string;

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
        name: `Webhooks WS ${timestamp}`,
        slug: `webhooks-ws-${timestamp}`,
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
      await prisma.webhookDeliveryLog.deleteMany({ where: { workspaceId } });
      await prisma.webhookSubscription.deleteMany({ where: { workspaceId } });
      await prisma.workspaceMember.deleteMany({ where: { workspaceId } });
      await prisma.workspace.delete({ where: { id: workspaceId } });
    }
    await prisma.user.deleteMany({
      where: { email: { in: [ownerUser.email, viewerUser.email] } },
    });
    await app.close();
  });

  describe('RBAC & Subscription Creation', () => {
    it('should reject webhook subscription creation from VIEWER (403 Forbidden)', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/workspaces/${workspaceId}/webhooks`)
        .set('Authorization', `Bearer ${viewerToken}`)
        .send({
          name: 'Unauthorized Webhook',
          targetUrl: 'https://example.com/webhook',
          eventTypes: ['post.published'],
        });

      expect(res.status).toBe(403);
    });

    it('should reject invalid event type (400 Bad Request)', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/workspaces/${workspaceId}/webhooks`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          name: 'Invalid Event Hook',
          targetUrl: 'https://example.com/webhook',
          eventTypes: ['invalid.nonexistent_event'],
        });

      expect(res.status).toBe(400);
    });

    it('should allow OWNER to create a webhook subscription with an auto-generated HMAC secret', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/workspaces/${workspaceId}/webhooks`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          name: 'Discord Marketing Dispatcher',
          targetUrl: 'https://discord.com/api/webhooks/123/abc',
          eventTypes: ['post.published', 'inbox.crisis_flagged'],
          description: 'Production alerts to community channel',
        });

      expect(res.status).toBe(201);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.name).toBe('Discord Marketing Dispatcher');
      expect(res.body.data.targetUrl).toBe('https://discord.com/api/webhooks/123/abc');
      expect(res.body.data.secretKey).toMatch(/^whsec_/);
      expect(res.body.data.eventTypes).toContain('post.published');

      createdSubscriptionId = res.body.data.id;
    });
  });

  describe('Listing & Subscription Management', () => {
    it('should allow VIEWER to list webhook subscriptions', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/workspaces/${workspaceId}/webhooks`)
        .set('Authorization', `Bearer ${viewerToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data[0].id).toBe(createdSubscriptionId);
    });

    it('should allow VIEWER to get single webhook subscription details', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/workspaces/${workspaceId}/webhooks/${createdSubscriptionId}`)
        .set('Authorization', `Bearer ${viewerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(createdSubscriptionId);
      expect(res.body.data.name).toBe('Discord Marketing Dispatcher');
    });

    it('should allow OWNER to update webhook configuration', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/workspaces/${workspaceId}/webhooks/${createdSubscriptionId}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          description: 'Updated production alerts channel description',
          eventTypes: ['post.published', 'inbox.crisis_flagged', 'approval.approved'],
        });

      expect(res.status).toBe(200);
      expect(res.body.data.description).toBe('Updated production alerts channel description');
      expect(res.body.data.eventTypes).toContain('approval.approved');
    });

    it('should allow OWNER to rotate secret key and invalidate old secret', async () => {
      const oldSecret = (
        await prisma.webhookSubscription.findUnique({ where: { id: createdSubscriptionId } })
      )?.secretKey;

      const res = await request(app.getHttpServer())
        .post(`/api/v1/workspaces/${workspaceId}/webhooks/${createdSubscriptionId}/rotate-secret`)
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.newSecretKey).toMatch(/^whsec_/);
      expect(res.body.data.newSecretKey).not.toBe(oldSecret);
    });
  });

  describe('Test Ping, Delivery Logs & Retries', () => {
    it('should allow OWNER to trigger immediate test ping', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/workspaces/${workspaceId}/webhooks/${createdSubscriptionId}/test-ping`)
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.signatureHeader).toMatch(/^sha256=/);
      expect(res.body.data.timestampHeader).toBeDefined();
    });

    it('should allow VIEWER to list delivery logs and inspect recorded payloads', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/workspaces/${workspaceId}/webhooks/deliveries`)
        .set('Authorization', `Bearer ${viewerToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);

      recordedDeliveryId = res.body.data[0].id;
      expect(res.body.data[0].eventType).toBe('webhook.test_ping');
    });

    it('should allow OWNER to manually trigger retry of delivery log', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/workspaces/${workspaceId}/webhooks/deliveries/${recordedDeliveryId}/retry`)
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(recordedDeliveryId);
      expect(res.body.data.attemptNumber).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Subscription Cleanup', () => {
    it('should allow OWNER to delete webhook subscription', async () => {
      const res = await request(app.getHttpServer())
        .delete(`/api/v1/workspaces/${workspaceId}/webhooks/${createdSubscriptionId}`)
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.deleted).toBe(true);

      const check = await prisma.webhookSubscription.findUnique({
        where: { id: createdSubscriptionId },
      });
      expect(check).toBeNull();
    });
  });
});
