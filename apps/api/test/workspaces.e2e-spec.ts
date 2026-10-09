import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import * as cookieParser from 'cookie-parser';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { WorkspaceRole } from '@prisma/client';

describe('Multi-Tenant Workspaces & RBAC (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const timestamp = Date.now();
  const userA = {
    name: 'Owner Alice',
    email: `alice_${timestamp}@test.com`,
    password: 'Password123!',
  };
  const userB = {
    name: 'Foreign Bob',
    email: `bob_${timestamp}@test.com`,
    password: 'Password123!',
  };
  const userC = {
    name: 'Colleague Charlie',
    email: `charlie_${timestamp}@test.com`,
    password: 'Password123!',
  };

  let tokenA: string;
  let tokenB: string;
  let tokenC: string;

  let workspaceAId: string;
  let workspaceBId: string;
  let memberCId: string;
  let inviteRawToken: string;

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

    // Register User A
    await request(app.getHttpServer()).post('/api/v1/auth/register').send(userA);
    const loginA = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: userA.email, password: userA.password });
    tokenA = loginA.body.data.accessToken;

    // Register User B
    await request(app.getHttpServer()).post('/api/v1/auth/register').send(userB);
    const loginB = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: userB.email, password: userB.password });
    tokenB = loginB.body.data.accessToken;

    // Register User C
    await request(app.getHttpServer()).post('/api/v1/auth/register').send(userC);
    const loginC = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: userC.email, password: userC.password });
    tokenC = loginC.body.data.accessToken;
  });

  afterAll(async () => {
    if (prisma) {
      await prisma.workspace.deleteMany({
        where: {
          createdBy: { email: { in: [userA.email, userB.email, userC.email] } },
        },
      });
      await prisma.user.deleteMany({
        where: { email: { in: [userA.email, userB.email, userC.email] } },
      });
    }
    await app.close();
  });

  describe('Workspace Creation & Membership', () => {
    it('User A creates Workspace A and becomes OWNER', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/workspaces')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          name: 'Alice Media Agency',
          industry: 'Marketing',
        })
        .expect(201);

      expect(res.body.data.id).toBeDefined();
      expect(res.body.data.name).toBe('Alice Media Agency');
      expect(res.body.data.currentUserRole).toBe(WorkspaceRole.OWNER);
      workspaceAId = res.body.data.id;
    });

    it('User B creates Workspace B and becomes OWNER', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/workspaces')
        .set('Authorization', `Bearer ${tokenB}`)
        .send({
          name: 'Bob Retail Corp',
          industry: 'Retail',
        })
        .expect(201);

      expect(res.body.data.id).toBeDefined();
      workspaceBId = res.body.data.id;
    });

    it('GET /api/v1/workspaces returns only authorized workspaces for User A', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/workspaces')
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);

      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].id).toBe(workspaceAId);
    });
  });

  describe('Tenant Isolation Enforcement', () => {
    it('User B CANNOT read Workspace A details (returns 403 Forbidden)', async () => {
      await request(app.getHttpServer())
        .get(`/api/v1/workspaces/${workspaceAId}`)
        .set('Authorization', `Bearer ${tokenB}`)
        .expect(403);
    });

    it('User B CANNOT list Workspace A members (returns 403 Forbidden)', async () => {
      await request(app.getHttpServer())
        .get(`/api/v1/workspaces/${workspaceAId}/members`)
        .set('Authorization', `Bearer ${tokenB}`)
        .expect(403);
    });

    it('User B CANNOT update Workspace A settings (returns 403 Forbidden)', async () => {
      await request(app.getHttpServer())
        .patch(`/api/v1/workspaces/${workspaceAId}`)
        .set('Authorization', `Bearer ${tokenB}`)
        .send({ name: 'Hacked by Bob' })
        .expect(403);
    });
  });

  describe('Invitation Lifecycle & Single-Use Enforcement', () => {
    it('User A invites User C to Workspace A as EDITOR', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/workspaces/${workspaceAId}/invitations`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          email: userC.email,
          role: WorkspaceRole.EDITOR,
        })
        .expect(201);

      expect(res.body.data.id).toBeDefined();
      expect(res.body.data.rawToken).toBeDefined();
      inviteRawToken = res.body.data.rawToken;
    });

    it('Public endpoint returns workspace info for valid invitation token', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/invitations/info?token=${inviteRawToken}`)
        .expect(200);

      expect(res.body.data.workspace.name).toBe('Alice Media Agency');
    });

    it('User C accepts the invitation and joins Workspace A', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/invitations/accept')
        .set('Authorization', `Bearer ${tokenC}`)
        .send({ token: inviteRawToken })
        .expect(200);

      const member = res.body.member || res.body.data?.member;
      const success = res.body.success ?? res.body.data?.success;

      expect(success).toBe(true);
      expect(member.role).toBe(WorkspaceRole.EDITOR);
      memberCId = member.id;
    });

    it('Re-using the same invitation token is rejected with 409 Conflict', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/invitations/accept')
        .set('Authorization', `Bearer ${tokenC}`)
        .send({ token: inviteRawToken })
        .expect(409);
    });
  });

  describe('Workspace Permissions & RBAC Enforcement', () => {
    it('User C (EDITOR) CANNOT update workspace settings (403 Forbidden)', async () => {
      await request(app.getHttpServer())
        .patch(`/api/v1/workspaces/${workspaceAId}`)
        .set('Authorization', `Bearer ${tokenC}`)
        .send({ name: 'New Name By Editor' })
        .expect(403);
    });

    it('User A (OWNER) promotes User C to ADMIN', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/workspaces/${workspaceAId}/members/${memberCId}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ role: WorkspaceRole.ADMIN })
        .expect(200);

      const updatedRole = res.body.role || res.body.data?.role;
      expect(updatedRole).toBe(WorkspaceRole.ADMIN);
    });

    it('User C (now ADMIN) CAN update workspace settings', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/workspaces/${workspaceAId}`)
        .set('Authorization', `Bearer ${tokenC}`)
        .send({ industry: 'Digital Marketing & AI' })
        .expect(200);

      const industry = res.body.industry || res.body.data?.industry;
      expect(industry).toBe('Digital Marketing & AI');
    });

    it('User C (ADMIN) CANNOT transfer ownership (403 Forbidden)', async () => {
      await request(app.getHttpServer())
        .post(`/api/v1/workspaces/${workspaceAId}/transfer-ownership`)
        .set('Authorization', `Bearer ${tokenC}`)
        .send({ targetMemberId: memberCId })
        .expect(403);
    });
  });

  describe('Ownership Transfer & Final Owner Protection', () => {
    it('User A (OWNER) CANNOT remove themselves (final-owner protection 403)', async () => {
      const membersRes = await request(app.getHttpServer())
        .get(`/api/v1/workspaces/${workspaceAId}/members`)
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);

      const membersList = membersRes.body.data || membersRes.body;
      const ownerMember = membersList.find(
        (m: any) => m.role === WorkspaceRole.OWNER,
      );

      await request(app.getHttpServer())
        .delete(`/api/v1/workspaces/${workspaceAId}/members/${ownerMember.id}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(403);
    });

    it('User A transfers ownership to User C successfully', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/workspaces/${workspaceAId}/transfer-ownership`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ targetMemberId: memberCId })
        .expect(200);

      const success = res.body.success ?? res.body.data?.success;
      expect(success).toBe(true);

      // Verify User C is now OWNER and User A is ADMIN
      const membersRes = await request(app.getHttpServer())
        .get(`/api/v1/workspaces/${workspaceAId}/members`)
        .set('Authorization', `Bearer ${tokenC}`)
        .expect(200);

      const membersList = membersRes.body.data || membersRes.body;
      const cMember = membersList.find((m: any) => m.id === memberCId);
      expect(cMember.role).toBe(WorkspaceRole.OWNER);
    });
  });
});
