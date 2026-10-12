import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import * as cookieParser from 'cookie-parser';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { WorkspaceRole } from '@prisma/client';

describe('Phase 18: Multi-Level Approval Matrix & Collaborative Review (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const timestamp = Date.now();
  const ownerUser = {
    name: 'Approval Owner',
    email: `approval_owner_${timestamp}@test.com`,
    password: 'Password123!',
  };
  const editorUser = {
    name: 'Editorial Reviewer',
    email: `approval_editor_${timestamp}@test.com`,
    password: 'Password123!',
  };
  const viewerUser = {
    name: 'Approval Viewer',
    email: `approval_viewer_${timestamp}@test.com`,
    password: 'Password123!',
  };

  let ownerToken: string;
  let editorToken: string;
  let viewerToken: string;
  let workspaceId: string;
  let createdWorkflowId: string;
  let createdDraftId: string;
  let step1Id: string;
  let step2Id: string;
  let createdCommentId: string;

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
        name: `Approval Workspace ${timestamp}`,
        industry: 'AGENCY_MEDIA',
      });
    workspaceId = wsRes.body.data.id;

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

    // 6. Create a Content Draft in workspace
    const ownerRecord = await prisma.user.findUnique({ where: { email: ownerUser.email } });
    const draft = await prisma.contentDraft.create({
      data: {
        workspaceId,
        createdByUserId: ownerRecord!.id,
        title: 'Q4 Product Showcase Launch',
      },
    });
    createdDraftId = draft.id;
  });

  afterAll(async () => {
    if (workspaceId) {
      await prisma.draftComment.deleteMany({ where: { workspaceId } });
      await prisma.draftStepReview.deleteMany({ where: { draft: { workspaceId } } });
      await prisma.contentDraft.deleteMany({ where: { workspaceId } });
      await prisma.approvalWorkflowStep.deleteMany({ where: { workflow: { workspaceId } } });
      await prisma.approvalWorkflow.deleteMany({ where: { workspaceId } });
      await prisma.workspaceMember.deleteMany({ where: { workspaceId } });
      await prisma.workspace.deleteMany({ where: { id: workspaceId } });
    }
    await prisma.user.deleteMany({
      where: { email: { in: [ownerUser.email, editorUser.email, viewerUser.email] } },
    });
    await app.close();
  });

  describe('1. Approval Workflow Management', () => {
    it('should allow ADMIN/OWNER to create a two-stage approval workflow', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/workspaces/${workspaceId}/approval-workflows`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          name: 'Two-Tier Editorial & Client Approval',
          description: 'Step 1: Editor verifies copy, Step 2: Client signs off',
          isDefault: true,
          steps: [
            {
              stepOrder: 1,
              name: 'Internal Editorial Review',
              requiredRole: WorkspaceRole.EDITOR,
              isMandatory: true,
            },
            {
              stepOrder: 2,
              name: 'Client Final Sign-Off',
              requiredRole: WorkspaceRole.ADMIN,
              isMandatory: true,
            },
          ],
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Two-Tier Editorial & Client Approval');
      expect(res.body.data.steps).toHaveLength(2);
      createdWorkflowId = res.body.data.id;
    });

    it('should reject workflow creation if steps are empty with 400', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/workspaces/${workspaceId}/approval-workflows`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          name: 'Empty Workflow',
          steps: [],
        });

      expect(res.status).toBe(400);
    });

    it('should prevent VIEWER from creating workflows with 403', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/workspaces/${workspaceId}/approval-workflows`)
        .set('Authorization', `Bearer ${viewerToken}`)
        .send({
          name: 'Unauthorized Workflow',
          steps: [{ stepOrder: 1, name: 'Review', requiredRole: WorkspaceRole.EDITOR }],
        });

      expect(res.status).toBe(403);
    });

    it('should list approval workflows for workspace members', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/workspaces/${workspaceId}/approval-workflows`)
        .set('Authorization', `Bearer ${viewerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].id).toBe(createdWorkflowId);
    });
  });

  describe('2. Draft Approval Matrix & Lifecycle Transitions', () => {
    it('should initialize approval workflow steps on a draft', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/workspaces/${workspaceId}/drafts/${createdDraftId}/approval/init`)
        .set('Authorization', `Bearer ${editorToken}`)
        .send({ workflowId: createdWorkflowId });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.draftId).toBe(createdDraftId);
      expect(res.body.data.steps).toHaveLength(2);
      expect(res.body.data.isFullyApproved).toBe(false);

      step1Id = res.body.data.steps[0].stepId;
      step2Id = res.body.data.steps[1].stepId;
    });

    it('should fetch current approval progress matrix', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/workspaces/${workspaceId}/drafts/${createdDraftId}/approval/progress`)
        .set('Authorization', `Bearer ${viewerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.totalSteps).toBe(2);
      expect(res.body.data.steps[0].status).toBe('PENDING');
    });

    it('should allow EDITOR to approve Step 1', async () => {
      const res = await request(app.getHttpServer())
        .post(
          `/api/v1/workspaces/${workspaceId}/drafts/${createdDraftId}/approval/steps/${step1Id}/decision`,
        )
        .set('Authorization', `Bearer ${editorToken}`)
        .send({
          decision: 'APPROVE',
          notes: 'Tone and copy look on point!',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.steps[0].status).toBe('APPROVED');
      expect(res.body.data.steps[0].decisionNotes).toBe('Tone and copy look on point!');
      expect(res.body.data.isFullyApproved).toBe(false); // Step 2 still pending
    });

    it('should request changes on Step 2 by ADMIN/OWNER and transition draft status to CHANGES_REQUESTED', async () => {
      const res = await request(app.getHttpServer())
        .post(
          `/api/v1/workspaces/${workspaceId}/drafts/${createdDraftId}/approval/steps/${step2Id}/decision`,
        )
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          decision: 'REQUEST_CHANGES',
          notes: 'Please add 2026 branding badge to creative asset.',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.steps[1].status).toBe('CHANGES_REQUESTED');
      expect(res.body.data.isChangesRequested).toBe(true);

      const draftCheck = await prisma.contentDraft.findUnique({ where: { id: createdDraftId } });
      expect(draftCheck!.status).toBe('CHANGES_REQUESTED');
    });

    it('should approve Step 2 by ADMIN/OWNER and transition draft status to APPROVED', async () => {
      const res = await request(app.getHttpServer())
        .post(
          `/api/v1/workspaces/${workspaceId}/drafts/${createdDraftId}/approval/steps/${step2Id}/decision`,
        )
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          decision: 'APPROVE',
          notes: 'Asset updated, approved for publishing!',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.isFullyApproved).toBe(true);

      const draftCheck = await prisma.contentDraft.findUnique({ where: { id: createdDraftId } });
      expect(draftCheck!.status).toBe('APPROVED');
      expect(draftCheck!.approvedAt).toBeDefined();
    });
  });

  describe('3. In-Line Collaborative Comment Threads', () => {
    it('should allow members to add a comment to the draft', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/workspaces/${workspaceId}/drafts/${createdDraftId}/comments`)
        .set('Authorization', `Bearer ${editorToken}`)
        .send({
          content: 'Do we have client consent for the customer quote on line 2?',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.content).toContain('client consent');
      createdCommentId = res.body.data.id;
    });

    it('should allow threaded reply to a comment', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/workspaces/${workspaceId}/drafts/${createdDraftId}/comments`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          content: 'Yes, verified via signed consent form yesterday.',
          parentCommentId: createdCommentId,
        });

      expect(res.status).toBe(201);
      expect(res.body.data.parentCommentId).toBe(createdCommentId);
    });

    it('should retrieve hierarchical comments with replies', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/workspaces/${workspaceId}/drafts/${createdDraftId}/comments`)
        .set('Authorization', `Bearer ${viewerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1); // 1 root comment
      expect(res.body.data[0].id).toBe(createdCommentId);
      expect(res.body.data[0].replies).toHaveLength(1); // 1 reply
      expect(res.body.data[0].replies[0].content).toContain('verified via signed consent');
    });

    it('should toggle resolved status of a comment thread', async () => {
      const res = await request(app.getHttpServer())
        .patch(
          `/api/v1/workspaces/${workspaceId}/drafts/${createdDraftId}/comments/${createdCommentId}/resolve`,
        )
        .set('Authorization', `Bearer ${editorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.isResolved).toBe(true);
      expect(res.body.data.resolvedByName).toBe('Editorial Reviewer');
    });

    it('should allow comment author to delete comment', async () => {
      const res = await request(app.getHttpServer())
        .delete(
          `/api/v1/workspaces/${workspaceId}/drafts/${createdDraftId}/comments/${createdCommentId}`,
        )
        .set('Authorization', `Bearer ${editorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});
