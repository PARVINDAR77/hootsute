import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import * as cookieParser from 'cookie-parser';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { WorkspaceRole, SocialPlatform, CampaignObjective } from '@prisma/client';

describe('Stage 4: Content Generation, Drafts & Approval Workflows (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const timestamp = Date.now();
  const ownerUser = {
    name: 'Workspace Owner',
    email: `owner_${timestamp}@test.com`,
    password: 'Password123!',
  };
  const editorUser = {
    name: 'Workspace Editor',
    email: `editor_${timestamp}@test.com`,
    password: 'Password123!',
  };
  const foreignUser = {
    name: 'Foreign User',
    email: `foreign_${timestamp}@test.com`,
    password: 'Password123!',
  };

  let ownerToken: string;
  let editorToken: string;
  let foreignToken: string;

  let workspaceId: string;
  let foreignWorkspaceId: string;
  let testDraftId: string;
  let testVariantId: string;

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

    // Register & Login Owner
    await request(app.getHttpServer()).post('/api/v1/auth/register').send(ownerUser);
    const ownerRes = await request(app.getHttpServer()).post('/api/v1/auth/login').send({
      email: ownerUser.email,
      password: ownerUser.password,
    });
    ownerToken = ownerRes.body.data.accessToken;

    // Register & Login Editor
    await request(app.getHttpServer()).post('/api/v1/auth/register').send(editorUser);
    const editorRes = await request(app.getHttpServer()).post('/api/v1/auth/login').send({
      email: editorUser.email,
      password: editorUser.password,
    });
    editorToken = editorRes.body.data.accessToken;

    // Register & Login Foreign User
    await request(app.getHttpServer()).post('/api/v1/auth/register').send(foreignUser);
    const foreignRes = await request(app.getHttpServer()).post('/api/v1/auth/login').send({
      email: foreignUser.email,
      password: foreignUser.password,
    });
    foreignToken = foreignRes.body.data.accessToken;

    // Create primary workspace with Owner
    const wsRes = await request(app.getHttpServer())
      .post('/api/v1/workspaces')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        name: 'Om Retailers',
        slug: `om-retail-${timestamp}`,
        industry: 'Fashion & Handloom',
      });
    workspaceId = wsRes.body.data.id;

    // Create foreign workspace with Foreign User
    const foreignWsRes = await request(app.getHttpServer())
      .post('/api/v1/workspaces')
      .set('Authorization', `Bearer ${foreignToken}`)
      .send({
        name: 'Foreign Enterprises',
        slug: `foreign-corp-${timestamp}`,
      });
    foreignWorkspaceId = foreignWsRes.body.data.id;

    // Add Editor user to primary workspace as EDITOR
    const editorDbUser = await prisma.user.findUnique({ where: { email: editorUser.email } });
    await prisma.workspaceMember.create({
      data: {
        workspaceId,
        userId: editorDbUser!.id,
        role: WorkspaceRole.EDITOR,
      },
    });
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Brand Profile Management', () => {
    it('should upsert workspace brand profile by Owner', async () => {
      const res = await request(app.getHttpServer())
        .put(`/api/v1/workspaces/${workspaceId}/brand-profile`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          businessName: 'Om Artisanal Silks',
          industry: 'Handloom & Textiles',
          businessDescription: 'Authentic pure silk Patola and Bandhani heritage brand',
          targetAudience: 'Traditional wedding shoppers and ethnic fashion collectors',
          productsAndServices: 'Handwoven double Ikkat sarees, dupattas, stoles',
          brandVoice: 'Graceful, culturally rooted, respectful, authentic',
          primaryColor: '#800020',
          secondaryColor: '#FFD700',
          websiteUrl: 'https://omartisanal.com',
          preferredLanguage: 'en',
          supportedLanguages: ['en', 'gu', 'hi'],
          contactDetails: {
            email: 'contact@omartisanal.com',
            phone: '+91 9876543210',
            address: 'Patan, Gujarat, India',
          },
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.businessName).toBe('Om Artisanal Silks');
      expect(res.body.data.primaryColor).toBe('#800020');
      expect(res.body.data.contactDetails.email).toBe('contact@omartisanal.com');
    });

    it('should allow Editor to read brand profile', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/workspaces/${workspaceId}/brand-profile`)
        .set('Authorization', `Bearer ${editorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.businessName).toBe('Om Artisanal Silks');
    });

    it('should reject invalid primary color hex codes', async () => {
      const res = await request(app.getHttpServer())
        .put(`/api/v1/workspaces/${workspaceId}/brand-profile`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          businessName: 'Om Silks',
          primaryColor: 'not-a-color',
        });

      expect(res.status).toBe(400);
    });

    it('should reject Foreign User from reading brand profile (tenant isolation)', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/workspaces/${workspaceId}/brand-profile`)
        .set('Authorization', `Bearer ${foreignToken}`);

      expect(res.status).toBe(403);
    });
  });

  describe('Curated Occasions Catalog', () => {
    it('should return curated festival catalog with cultural context', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/occasions')
        .query({ limit: 15 });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(12);

      const diwali = res.body.data.find((o: any) => o.slug === 'diwali');
      expect(diwali).toBeDefined();
      expect(diwali.dateType).toBe('LUNAR_CALENDAR');
      expect(diwali.culturalContext).toContain('Lakshmi Puja');
    });

    it('should retrieve individual occasion by slug', async () => {
      const res = await request(app.getHttpServer()).get('/api/v1/occasions/navratri');

      expect(res.status).toBe(200);
      expect(res.body.data.slug).toBe('navratri');
      expect(res.body.data.name).toBe('Navratri');
      expect(res.body.data.promptGuidance).toContain('Garba');
    });

    it('should return 404 for nonexistent festival slug', async () => {
      const res = await request(app.getHttpServer()).get('/api/v1/occasions/unknown-slug');
      expect(res.status).toBe(404);
    });
  });

  describe('AI Content Generation & Draft Lifecycle', () => {
    it('should generate multi-platform copy via AI provider and persist draft', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/workspaces/${workspaceId}/content-generation/generate`)
        .set('Authorization', `Bearer ${editorToken}`)
        .send({
          objective: CampaignObjective.FESTIVAL_WISHES,
          platforms: [SocialPlatform.INSTAGRAM, SocialPlatform.FACEBOOK],
          occasionSlug: 'navratri',
          title: 'Navratri Garba Festive Launch',
          userInstructions: 'Highlight handcrafted Chaniya Cholis',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe('Navratri Garba Festive Launch');
      expect(res.body.data.variants).toHaveLength(2);

      testDraftId = res.body.data.id;
      testVariantId = res.body.data.variants[0].id;
    });

    it('should retrieve created draft with variants and revision history', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/workspaces/${workspaceId}/content-drafts/${testDraftId}`)
        .set('Authorization', `Bearer ${editorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(testDraftId);
      expect(res.body.data.status).toBe('DRAFT');
      expect(res.body.data.revisions).toHaveLength(1);
      expect(res.body.data.revisions[0].revisionNumber).toBe(1);
    });

    it('should prevent cross-workspace access to draft (IDOR defense)', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/workspaces/${foreignWorkspaceId}/content-drafts/${testDraftId}`)
        .set('Authorization', `Bearer ${foreignToken}`);

      expect(res.status).toBe(404);
    });

    it('should regenerate a single field while preserving all other fields', async () => {
      const initialDraft = await request(app.getHttpServer())
        .get(`/api/v1/workspaces/${workspaceId}/content-drafts/${testDraftId}`)
        .set('Authorization', `Bearer ${editorToken}`);

      const originalBody = initialDraft.body.data.variants[0].body;

      const res = await request(app.getHttpServer())
        .post(`/api/v1/workspaces/${workspaceId}/content-drafts/${testDraftId}/variants/${testVariantId}/regenerate`)
        .set('Authorization', `Bearer ${editorToken}`)
        .send({
          field: 'headline',
          instructions: 'Make the headline shorter and punchier',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.headline).toBeDefined();
      // Body must be preserved unchanged
      expect(res.body.data.body).toBe(originalBody);

      // Verify revision was appended
      const revRes = await request(app.getHttpServer())
        .get(`/api/v1/workspaces/${workspaceId}/content-drafts/${testDraftId}/revisions`)
        .set('Authorization', `Bearer ${editorToken}`);

      expect(revRes.body.data.length).toBe(2);
      expect(revRes.body.data[0].revisionNumber).toBe(2);
      expect(revRes.body.data[0].action).toBe('TARGETED_REGENERATION');
    });

    it('should translate variant into another language and record revision', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/workspaces/${workspaceId}/content-drafts/${testDraftId}/variants/${testVariantId}/translate`)
        .set('Authorization', `Bearer ${editorToken}`)
        .send({ targetLanguage: 'Gujarati' });

      expect(res.status).toBe(200);
      expect(res.body.data.body).toBeDefined();

      const revRes = await request(app.getHttpServer())
        .get(`/api/v1/workspaces/${workspaceId}/content-drafts/${testDraftId}/revisions`)
        .set('Authorization', `Bearer ${editorToken}`);

      expect(revRes.body.data[0].action).toBe('TRANSLATION');
    });

    it('should adapt variant for another platform (e.g. LinkedIn)', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/workspaces/${workspaceId}/content-drafts/${testDraftId}/variants/${testVariantId}/adapt`)
        .set('Authorization', `Bearer ${editorToken}`)
        .send({ targetPlatform: SocialPlatform.LINKEDIN });

      expect(res.status).toBe(200);
      expect(res.body.data.platform).toBe(SocialPlatform.LINKEDIN);
    });

    it('should generate structured visual creative brief', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/workspaces/${workspaceId}/content-drafts/${testDraftId}/variants/${testVariantId}/creative-brief`)
        .set('Authorization', `Bearer ${editorToken}`)
        .send({ visualPreferences: 'Studio lighting with traditional earthen diyas' });

      expect(res.status).toBe(200);
      expect(res.body.data.mediaBrief).toContain('Visual Direction');
    });
  });

  describe('Approval Workflows & RBAC Rules', () => {
    it('should allow Editor to submit draft for review (DRAFT -> IN_REVIEW)', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/workspaces/${workspaceId}/content-drafts/${testDraftId}/submit-review`)
        .set('Authorization', `Bearer ${editorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('IN_REVIEW');
    });

    it('should forbid Editor from approving the draft', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/workspaces/${workspaceId}/content-drafts/${testDraftId}/approve`)
        .set('Authorization', `Bearer ${editorToken}`);

      expect(res.status).toBe(403);
    });

    it('should allow Owner to reject draft with mandatory reason (IN_REVIEW -> REJECTED)', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/workspaces/${workspaceId}/content-drafts/${testDraftId}/reject`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ rejectionReason: 'Please refine the CTA and verify discount validity.' });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('REJECTED');
      expect(res.body.data.rejectionReason).toBe('Please refine the CTA and verify discount validity.');
    });

    it('should reset REJECTED draft back to DRAFT when modified by Editor', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/workspaces/${workspaceId}/content-drafts/${testDraftId}`)
        .set('Authorization', `Bearer ${editorToken}`)
        .send({ title: 'Navratri Garba Festive Launch - Revised' });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('DRAFT');
      expect(res.body.data.rejectionReason).toBeNull();
    });

    it('should allow Owner to approve after re-submission (IN_REVIEW -> APPROVED)', async () => {
      // Re-submit
      await request(app.getHttpServer())
        .post(`/api/v1/workspaces/${workspaceId}/content-drafts/${testDraftId}/submit-review`)
        .set('Authorization', `Bearer ${editorToken}`);

      // Owner approves
      const res = await request(app.getHttpServer())
        .post(`/api/v1/workspaces/${workspaceId}/content-drafts/${testDraftId}/approve`)
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('APPROVED');
      expect(res.body.data.approvedAt).toBeDefined();
    });

    it('should prevent editing an APPROVED draft directly', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/workspaces/${workspaceId}/content-drafts/${testDraftId}`)
        .set('Authorization', `Bearer ${editorToken}`)
        .send({ title: 'Illegal Modification of Approved Post' });

      expect(res.status).toBe(400);
    });

    it('should duplicate approved draft into a fresh DRAFT', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/workspaces/${workspaceId}/content-drafts/${testDraftId}/duplicate`)
        .set('Authorization', `Bearer ${editorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('DRAFT');
      expect(res.body.data.title).toContain('(Copy)');
      expect(res.body.data.variants.length).toBeGreaterThan(0);
    });

    it('should prevent modifying APPROVED draft via alternate routes (regenerate, translate, adapt, creative-brief)', async () => {
      // 1. Regenerate
      const regenRes = await request(app.getHttpServer())
        .post(`/api/v1/workspaces/${workspaceId}/content-drafts/${testDraftId}/variants/${testVariantId}/regenerate`)
        .set('Authorization', `Bearer ${editorToken}`)
        .send({ field: 'headline' });
      expect(regenRes.status).toBe(400);

      // 2. Translate
      const transRes = await request(app.getHttpServer())
        .post(`/api/v1/workspaces/${workspaceId}/content-drafts/${testDraftId}/variants/${testVariantId}/translate`)
        .set('Authorization', `Bearer ${editorToken}`)
        .send({ targetLanguage: 'Hindi' });
      expect(transRes.status).toBe(400);

      // 3. Adapt
      const adaptRes = await request(app.getHttpServer())
        .post(`/api/v1/workspaces/${workspaceId}/content-drafts/${testDraftId}/variants/${testVariantId}/adapt`)
        .set('Authorization', `Bearer ${editorToken}`)
        .send({ targetPlatform: SocialPlatform.LINKEDIN });
      expect(adaptRes.status).toBe(400);

      // 4. Creative Brief
      const briefRes = await request(app.getHttpServer())
        .post(`/api/v1/workspaces/${workspaceId}/content-drafts/${testDraftId}/variants/${testVariantId}/creative-brief`)
        .set('Authorization', `Bearer ${editorToken}`)
        .send({ visualPreferences: 'Festive lights' });
      expect(briefRes.status).toBe(400);
    });

    it('should reject cross-variant IDOR when variant does not belong to draft', async () => {
      const fakeVariantId = '00000000-0000-0000-0000-000000000000';
      const res = await request(app.getHttpServer())
        .post(`/api/v1/workspaces/${workspaceId}/content-drafts/${testDraftId}/variants/${fakeVariantId}/regenerate`)
        .set('Authorization', `Bearer ${editorToken}`)
        .send({ field: 'headline' });

      // Draft is approved so it checks approval first (400), or for a draft in DRAFT returns 404
      expect([400, 404]).toContain(res.status);
    });

    it('should reject unsafe URL schemes in Brand Profile (websiteUrl)', async () => {
      const resJs = await request(app.getHttpServer())
        .put(`/api/v1/workspaces/${workspaceId}/brand-profile`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          businessName: 'Unsafe Test',
          websiteUrl: 'javascript:alert(1)',
        });
      expect(resJs.status).toBe(400);

      const resFtp = await request(app.getHttpServer())
        .put(`/api/v1/workspaces/${workspaceId}/brand-profile`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          businessName: 'Unsafe Test',
          websiteUrl: 'ftp://unsafe-internal-server.local',
        });
      expect(resFtp.status).toBe(400);
    });

    it('should prevent self-approval by Admin who created the draft (four-eyes principle)', async () => {
      // 1. Create and login an Admin user
      const adminUser = {
        name: 'Workspace Admin Audit',
        email: `admin_audit_${timestamp}@test.com`,
        password: 'Password123!',
      };
      await request(app.getHttpServer()).post('/api/v1/auth/register').send(adminUser);
      const adminLoginRes = await request(app.getHttpServer()).post('/api/v1/auth/login').send({
        email: adminUser.email,
        password: adminUser.password,
      });
      const adminToken = adminLoginRes.body.data.accessToken;

      const adminDbUser = await prisma.user.findUnique({ where: { email: adminUser.email } });
      await prisma.workspaceMember.create({
        data: {
          workspaceId,
          userId: adminDbUser!.id,
          role: WorkspaceRole.ADMIN,
        },
      });

      // 2. Admin creates a draft
      const draftRes = await request(app.getHttpServer())
        .post(`/api/v1/workspaces/${workspaceId}/content-drafts`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Admin Created Draft for Approval Audit',
          variants: [
            {
              platform: SocialPlatform.INSTAGRAM,
              body: 'Admin created content for verification',
            },
          ],
        });
      expect(draftRes.status).toBe(201);
      const adminDraftId = draftRes.body.data.id;

      // 3. Admin submits for review (DRAFT -> IN_REVIEW)
      const submitRes = await request(app.getHttpServer())
        .post(`/api/v1/workspaces/${workspaceId}/content-drafts/${adminDraftId}/submit-review`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(submitRes.status).toBe(200);
      expect(submitRes.body.data.status).toBe('IN_REVIEW');

      // 4. Admin tries to approve their own draft -> MUST BE REJECTED (403 Forbidden)
      const selfApproveRes = await request(app.getHttpServer())
        .post(`/api/v1/workspaces/${workspaceId}/content-drafts/${adminDraftId}/approve`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(selfApproveRes.status).toBe(403);
      expect(selfApproveRes.body.message).toContain('cannot approve your own content draft');

      // 5. Owner can approve the Admin-created draft -> 200 OK
      const ownerApproveRes = await request(app.getHttpServer())
        .post(`/api/v1/workspaces/${workspaceId}/content-drafts/${adminDraftId}/approve`)
        .set('Authorization', `Bearer ${ownerToken}`);
      expect(ownerApproveRes.status).toBe(200);
      expect(ownerApproveRes.body.data.status).toBe('APPROVED');
    });
  });
});
