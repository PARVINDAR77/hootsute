import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import * as cookieParser from 'cookie-parser';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import {
  AutomationTriggerType,
  AutomationActionType,
  WorkspaceRole,
} from '@packages/shared';

describe('Stage 13: Smart Automations & Workflows (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const timestamp = Date.now();
  let workspaceId: string;
  let ownerUserId: string;
  let viewerUserId: string;
  let ownerToken: string;
  let viewerToken: string;
  let createdRuleId: string;

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

    // 1. Create Workspace Owner User
    const ownerEmail = `auto_owner_${timestamp}@test.com`;
    await request(app.getHttpServer()).post('/api/v1/auth/register').send({
      name: 'Automations Owner',
      email: ownerEmail,
      password: 'Password123!',
    });
    const ownerLoginRes = await request(app.getHttpServer()).post('/api/v1/auth/login').send({
      email: ownerEmail,
      password: 'Password123!',
    });
    ownerToken = ownerLoginRes.body.data.accessToken;
    ownerUserId = ownerLoginRes.body.data.user.id;

    // 2. Create Workspace
    const wsRes = await request(app.getHttpServer())
      .post('/api/v1/workspaces')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        name: `Automations WS ${timestamp}`,
      });
    workspaceId = wsRes.body.data.id;

    // 3. Create Viewer User & Add to Workspace
    const viewerEmail = `auto_viewer_${timestamp}@test.com`;
    await request(app.getHttpServer()).post('/api/v1/auth/register').send({
      name: 'Automations Viewer',
      email: viewerEmail,
      password: 'Password123!',
    });
    const viewerLoginRes = await request(app.getHttpServer()).post('/api/v1/auth/login').send({
      email: viewerEmail,
      password: 'Password123!',
    });
    viewerToken = viewerLoginRes.body.data.accessToken;
    viewerUserId = viewerLoginRes.body.data.user.id;

    await prisma.workspaceMember.create({
      data: {
        workspaceId,
        userId: viewerUserId,
        role: WorkspaceRole.VIEWER,
      },
    });
  });

  afterAll(async () => {
    await prisma.automationExecutionLog.deleteMany({
      where: { workspaceId },
    });
    await prisma.automationRule.deleteMany({
      where: { workspaceId },
    });
    await prisma.workspaceMember.deleteMany({
      where: { workspaceId },
    });
    await prisma.workspace.deleteMany({
      where: { id: workspaceId },
    });
    await prisma.user.deleteMany({
      where: { id: { in: [ownerUserId, viewerUserId] } },
    });
    await app.close();
  });

  describe('GET /api/v1/workspaces/:workspaceId/automations/templates', () => {
    it('should return pre-built automation recipes', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/workspaces/${workspaceId}/automations/templates`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(4);
    });
  });

  describe('POST /api/v1/workspaces/:workspaceId/automations', () => {
    it('should reject unauthenticated requests', async () => {
      await request(app.getHttpServer())
        .post(`/api/v1/workspaces/${workspaceId}/automations`)
        .send({
          name: 'Spam Shield',
          triggerType: AutomationTriggerType.INBOX_NEW_MESSAGE,
          conditions: { keywords: ['crypto'] },
          actionType: AutomationActionType.AUTO_HIDE_SPAM,
          actionConfig: {},
        })
        .expect(401);
    });

    it('should reject VIEWER from creating automation rules (requires ADMIN/OWNER)', async () => {
      await request(app.getHttpServer())
        .post(`/api/v1/workspaces/${workspaceId}/automations`)
        .set('Authorization', `Bearer ${viewerToken}`)
        .send({
          name: 'Spam Shield',
          triggerType: AutomationTriggerType.INBOX_NEW_MESSAGE,
          conditions: { keywords: ['crypto'] },
          actionType: AutomationActionType.AUTO_HIDE_SPAM,
          actionConfig: {},
        })
        .expect(403);
    });

    it('should create automation rule for OWNER', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/workspaces/${workspaceId}/automations`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          name: 'Auto-Moderation Spam Shield',
          description: 'Hides spam keywords automatically',
          triggerType: AutomationTriggerType.INBOX_NEW_MESSAGE,
          conditions: { keywords: ['crypto', 'telegram', 'whatsapp me'], platform: 'INSTAGRAM' },
          actionType: AutomationActionType.AUTO_HIDE_SPAM,
          actionConfig: {},
          isEnabled: true,
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Auto-Moderation Spam Shield');
      expect(res.body.data.isEnabled).toBe(true);
      createdRuleId = res.body.data.id;
    });
  });

  describe('GET /api/v1/workspaces/:workspaceId/automations', () => {
    it('should return list of workspace rules', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/workspaces/${workspaceId}/automations`)
        .set('Authorization', `Bearer ${viewerToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('GET /api/v1/workspaces/:workspaceId/automations/:ruleId', () => {
    it('should return single rule by ID', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/workspaces/${workspaceId}/automations/${createdRuleId}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(createdRuleId);
    });
  });

  describe('PUT /api/v1/workspaces/:workspaceId/automations/:ruleId', () => {
    it('should update rule name and configuration', async () => {
      const res = await request(app.getHttpServer())
        .put(`/api/v1/workspaces/${workspaceId}/automations/${createdRuleId}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          name: 'Updated Spam Shield v2',
        })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Updated Spam Shield v2');
    });
  });

  describe('POST /api/v1/workspaces/:workspaceId/automations/:ruleId/test', () => {
    it('should dry-run test the rule against matched input', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/workspaces/${workspaceId}/automations/${createdRuleId}/test`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          sampleText: 'Earn $1000 today on telegram!',
          platform: 'INSTAGRAM',
        })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.matched).toBe(true);
      expect(res.body.data.actionType).toBe(AutomationActionType.AUTO_HIDE_SPAM);
    });

    it('should dry-run test the rule against unmatched input', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/workspaces/${workspaceId}/automations/${createdRuleId}/test`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          sampleText: 'Loved your post, truly inspiring work!',
          platform: 'INSTAGRAM',
        })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.matched).toBe(false);
    });
  });

  describe('PATCH /api/v1/workspaces/:workspaceId/automations/:ruleId/toggle', () => {
    it('should toggle rule enabled state', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/workspaces/${workspaceId}/automations/${createdRuleId}/toggle`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ enabled: false })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.isEnabled).toBe(false);
    });
  });

  describe('GET /api/v1/workspaces/:workspaceId/automations/logs', () => {
    it('should return past execution logs', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/workspaces/${workspaceId}/automations/logs`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('DELETE /api/v1/workspaces/:workspaceId/automations/:ruleId', () => {
    it('should delete the rule', async () => {
      const res = await request(app.getHttpServer())
        .delete(`/api/v1/workspaces/${workspaceId}/automations/${createdRuleId}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(createdRuleId);
    });
  });
});
