import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import * as cookieParser from 'cookie-parser';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { WorkspaceRole } from '@prisma/client';
import { ReportFrequency } from '@packages/shared';

describe('Phase 19: White-Label Agency Portals & Automated Executive Reports (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const timestamp = Date.now();
  const ownerUser = {
    name: 'Agency Executive',
    email: `agency_owner_${timestamp}@test.com`,
    password: 'Password123!',
  };
  const editorUser = {
    name: 'Report Specialist',
    email: `report_editor_${timestamp}@test.com`,
    password: 'Password123!',
  };
  const viewerUser = {
    name: 'Client Stakeholder',
    email: `client_viewer_${timestamp}@test.com`,
    password: 'Password123!',
  };

  let ownerToken: string;
  let editorToken: string;
  let viewerToken: string;
  let workspaceId: string;
  let workspaceSlug: string;
  let createdScheduleId: string;
  let generatedReportId: string;

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
        name: `Horizon Agency ${timestamp}`,
        industry: 'MARKETING_AGENCY',
      });
    workspaceId = wsRes.body.data.id;
    workspaceSlug = wsRes.body.data.slug;

    // 5. Add Editor & Viewer to Workspace
    const editorRecord = await prisma.user.findUnique({ where: { email: editorUser.email } });
    const viewerRecord = await prisma.user.findUnique({ where: { email: viewerUser.email } });

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
  // 1. White-Label Agency Branding
  // ==========================================
  describe('White-Label Agency Branding', () => {
    it('should return null or empty when no white-label config configured yet', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/workspaces/${workspaceId}/white-label`)
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toBeNull();
    });

    it('should prevent VIEWER from updating white-label settings (403)', async () => {
      const res = await request(app.getHttpServer())
        .put(`/api/v1/workspaces/${workspaceId}/white-label`)
        .set('Authorization', `Bearer ${viewerToken}`)
        .send({
          brandName: 'Unauthorized Brand',
        });

      expect(res.status).toBe(403);
    });

    it('should allow OWNER to configure white-label portal branding', async () => {
      const res = await request(app.getHttpServer())
        .put(`/api/v1/workspaces/${workspaceId}/white-label`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          brandName: 'Horizon Creative Partners',
          customDomain: `clients-${timestamp}.horizon.com`,
          logoUrl: 'https://horizon.com/assets/logo.png',
          faviconUrl: 'https://horizon.com/assets/favicon.ico',
          primaryColor: '#8b5cf6',
          secondaryColor: '#6d28d9',
          accentColor: '#14b8a6',
          supportEmail: 'client-desk@horizon.com',
          portalTitle: 'Horizon Client Intelligence Portal',
          hidePoweredBy: true,
          clientAccessUrl: `https://clients-${timestamp}.horizon.com/login`,
          isEnabled: true,
        });

      expect(res.status).toBe(200);
      expect(res.body.data.brandName).toBe('Horizon Creative Partners');
      expect(res.body.data.customDomain).toBe(`clients-${timestamp}.horizon.com`);
      expect(res.body.data.primaryColor).toBe('#8b5cf6');
      expect(res.body.data.hidePoweredBy).toBe(true);
    });

    it('should allow VIEWER to read configured white-label branding', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/workspaces/${workspaceId}/white-label`)
        .set('Authorization', `Bearer ${viewerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.brandName).toBe('Horizon Creative Partners');
      expect(res.body.data.accentColor).toBe('#14b8a6');
    });

    it('should allow unauthenticated client to resolve portal branding by custom domain', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/white-label/public/clients-${timestamp}.horizon.com`);

      expect(res.status).toBe(200);
      expect(res.body.data.brandName).toBe('Horizon Creative Partners');
      expect(res.body.data.primaryColor).toBe('#8b5cf6');
      expect(res.body.data.hidePoweredBy).toBe(true);
    });

    it('should allow unauthenticated client to resolve portal branding by workspace slug', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/white-label/public/${workspaceSlug}`);

      expect(res.status).toBe(200);
      expect(res.body.data.brandName).toBe('Horizon Creative Partners');
      expect(res.body.data.portalTitle).toBe('Horizon Client Intelligence Portal');
    });
  });

  // ==========================================
  // 2. Executive Report Schedules
  // ==========================================
  describe('Executive Report Schedules', () => {
    it('should reject schedule creation by VIEWER (403)', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/workspaces/${workspaceId}/reports/schedules`)
        .set('Authorization', `Bearer ${viewerToken}`)
        .send({
          name: 'Unauthorized Schedule',
          frequency: ReportFrequency.WEEKLY,
          recipients: ['exec@client.com'],
        });

      expect(res.status).toBe(403);
    });

    it('should allow OWNER to configure an automated executive report schedule', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/workspaces/${workspaceId}/reports/schedules`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          name: 'Weekly C-Level Performance Brief',
          frequency: ReportFrequency.WEEKLY,
          recipients: ['ceo@client.com', 'cmo@client.com'],
          includeSocial: true,
          includeLinks: true,
          includeListening: true,
        });

      expect(res.status).toBe(201);
      expect(res.body.data.name).toBe('Weekly C-Level Performance Brief');
      expect(res.body.data.frequency).toBe(ReportFrequency.WEEKLY);
      expect(res.body.data.recipients).toEqual(['ceo@client.com', 'cmo@client.com']);
      expect(res.body.data.nextRunAt).toBeDefined();

      createdScheduleId = res.body.data.id;
    });

    it('should allow VIEWER to list schedules', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/workspaces/${workspaceId}/reports/schedules`)
        .set('Authorization', `Bearer ${viewerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].id).toBe(createdScheduleId);
    });

    it('should allow OWNER to update schedule parameters', async () => {
      const res = await request(app.getHttpServer())
        .put(`/api/v1/workspaces/${workspaceId}/reports/schedules/${createdScheduleId}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          name: 'Weekly C-Level Performance & ROI Digest',
          recipients: ['ceo@client.com', 'cmo@client.com', 'cfo@client.com'],
        });

      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe('Weekly C-Level Performance & ROI Digest');
      expect(res.body.data.recipients).toHaveLength(3);
    });
  });

  // ==========================================
  // 3. Report Synthesis & History
  // ==========================================
  describe('Executive Report Synthesis & Viewer', () => {
    it('should allow EDITOR to generate an executive report on demand', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/workspaces/${workspaceId}/reports/generate`)
        .set('Authorization', `Bearer ${editorToken}`)
        .send({
          title: 'Q2 Executive Growth Audit',
          scheduleId: createdScheduleId,
          periodDays: 14,
          recipients: ['cmo@client.com'],
          includeSocial: true,
          includeLinks: true,
          includeListening: true,
        });

      expect(res.status).toBe(201);
      expect(res.body.data.title).toBe('Q2 Executive Growth Audit');
      expect(res.body.data.status).toBe('READY');
      expect(res.body.data.metricsSummary).toBeDefined();
      expect(res.body.data.metricsSummary.sentimentBreakdown).toBeDefined();

      // Check that HTML content incorporates white-label branding tokens
      expect(res.body.data.htmlContent).toContain('Horizon Creative Partners');
      expect(res.body.data.htmlContent).toContain('#8b5cf6');
      expect(res.body.data.htmlContent).toContain('Impressions');

      generatedReportId = res.body.data.id;
    });

    it('should allow VIEWER to list generated report history', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/workspaces/${workspaceId}/reports/history`)
        .set('Authorization', `Bearer ${viewerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data[0].id).toBe(generatedReportId);
    });

    it('should allow VIEWER to view specific report payload and HTML content', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/workspaces/${workspaceId}/reports/history/${generatedReportId}`)
        .set('Authorization', `Bearer ${viewerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(generatedReportId);
      expect(res.body.data.htmlContent).toContain('<!DOCTYPE html>');
    });

    it('should allow OWNER to delete a generated report', async () => {
      const res = await request(app.getHttpServer())
        .delete(`/api/v1/workspaces/${workspaceId}/reports/history/${generatedReportId}`)
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should allow OWNER to delete a report schedule', async () => {
      const res = await request(app.getHttpServer())
        .delete(`/api/v1/workspaces/${workspaceId}/reports/schedules/${createdScheduleId}`)
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});
