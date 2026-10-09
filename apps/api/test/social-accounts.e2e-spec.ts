import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import * as cookieParser from 'cookie-parser';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { TokenVaultService } from '../src/social-accounts/token-vault/token-vault.service';
import {
  SocialProvider,
  SocialAccountType,
  SocialConnectionStatus,
  WorkspaceRole,
} from '@packages/shared';
import * as crypto from 'crypto';

describe('Social Media Account Connections & OAuth (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let tokenVault: TokenVaultService;

  const timestamp = Date.now();
  const userA = {
    name: 'Alice Owner',
    email: `alice_social_${timestamp}@test.com`,
    password: 'Password123!',
  };
  const userB = {
    name: 'Bob Outsider',
    email: `bob_social_${timestamp}@test.com`,
    password: 'Password123!',
  };
  const userC = {
    name: 'Charlie Viewer',
    email: `charlie_social_${timestamp}@test.com`,
    password: 'Password123!',
  };

  let tokenA: string; // Owner of Workspace A
  let tokenB: string; // Foreign User
  let tokenC: string; // Viewer in Workspace A

  let workspaceAId: string;
  let workspaceBId: string;

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
    tokenVault = app.get<TokenVaultService>(TokenVaultService);

    // 1. Register & Login User A
    await request(app.getHttpServer()).post('/api/v1/auth/register').send(userA);
    const loginA = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: userA.email, password: userA.password });
    tokenA = loginA.body.data.accessToken;

    // 2. Register & Login User B
    await request(app.getHttpServer()).post('/api/v1/auth/register').send(userB);
    const loginB = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: userB.email, password: userB.password });
    tokenB = loginB.body.data.accessToken;

    // 3. Register & Login User C
    await request(app.getHttpServer()).post('/api/v1/auth/register').send(userC);
    const loginC = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: userC.email, password: userC.password });
    tokenC = loginC.body.data.accessToken;

    // 4. Create Workspace A (owned by User A)
    const wsARes = await request(app.getHttpServer())
      .post('/api/v1/workspaces')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ name: `Workspace A ${timestamp}` });
    workspaceAId = wsARes.body.data ? wsARes.body.data.id : wsARes.body.id;

    // 5. Create Workspace B (owned by User B)
    const wsBRes = await request(app.getHttpServer())
      .post('/api/v1/workspaces')
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ name: `Workspace B ${timestamp}` });
    workspaceBId = wsBRes.body.data ? wsBRes.body.data.id : wsBRes.body.id;

    // 6. Add User C as a VIEWER to Workspace A
    const userCRecord = await prisma.user.findUnique({ where: { email: userC.email } });
    await prisma.workspaceMember.create({
      data: {
        workspaceId: workspaceAId,
        userId: userCRecord!.id,
        role: WorkspaceRole.VIEWER,
      },
    });
  });

  afterAll(async () => {
    if (prisma) {
      // Cascades delete social accounts, oauth states, and sessions
      await prisma.workspace.deleteMany({
        where: {
          createdBy: { email: { in: [userA.email, userB.email, userC.email] } },
        },
      });
      await prisma.user.deleteMany({
        where: {
          email: { in: [userA.email, userB.email, userC.email] } },
      });
      await prisma.$disconnect();
    }
    if (app) {
      await app.close();
    }
  });

  describe('Security & Tenant Isolation Checks', () => {
    it('should reject unauthenticated request to list social accounts', async () => {
      await request(app.getHttpServer())
        .get(`/api/v1/workspaces/${workspaceAId}/social-accounts`)
        .expect(401);
    });

    it('should reject foreign user (User B) accessing Workspace A accounts (403 Forbidden)', async () => {
      await request(app.getHttpServer())
        .get(`/api/v1/workspaces/${workspaceAId}/social-accounts`)
        .set('Authorization', `Bearer ${tokenB}`)
        .expect(403);
    });

    it('should reject VIEWER (User C) attempting to initiate social connection (403 Forbidden)', async () => {
      await request(app.getHttpServer())
        .post(`/api/v1/workspaces/${workspaceAId}/social-accounts/meta/connect`)
        .set('Authorization', `Bearer ${tokenC}`)
        .send({})
        .expect(403);
    });
  });

  describe('OAuth State Validation & Replay Protection', () => {
    it('should reject OAuth callback with unknown state parameter', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/oauth/meta/callback?code=mock_code&state=non_existent_state')
        .expect(302) // Redirects with error query parameter
        .expect((res) => {
          expect(res.headers.location).toContain('error=');
        });
    });

    it('should reject reused OAuth state', async () => {
      const userARecord = await prisma.user.findUnique({ where: { email: userA.email } });
      const testState = `test_reused_state_${Date.now()}`;

      await prisma.oAuthState.create({
        data: {
          state: testState,
          workspaceId: workspaceAId,
          userId: userARecord!.id,
          provider: SocialProvider.META_FACEBOOK,
          redirectUri: 'http://localhost:4000/api/v1/oauth/meta/callback',
          expiresAt: new Date(Date.now() + 60000),
          usedAt: new Date(), // Already used!
        },
      });

      await request(app.getHttpServer())
        .get(`/api/v1/oauth/meta/callback?code=mock_code&state=${testState}`)
        .expect(302)
        .expect((res) => {
          expect(res.headers.location).toContain('already%20been%20used');
        });
    });
  });

  describe('Account Selection, Encryption At Rest & Tenant Isolation', () => {
    let sessionToken: string;
    let createdAccountId: string;

    beforeEach(async () => {
      const userARecord = await prisma.user.findUnique({ where: { email: userA.email } });
      sessionToken = crypto.randomBytes(32).toString('hex');
      const sessionTokenHash = crypto.createHash('sha256').update(sessionToken).digest('hex');

      const candidatePayload = JSON.stringify({
        pages: [
          {
            id: 'page-e2e-101',
            name: 'Acme Official Store',
            username: 'acme_official',
            category: 'Retail',
            tasks: ['MANAGE', 'CREATE_CONTENT'],
            pageAccessToken: 'EAA_secret_page_access_token_super_confidential',
            instagramBusinessAccount: {
              id: 'ig-e2e-202',
              name: 'Acme Instagram Business',
              username: 'acme.store.ig',
              profilePictureUrl: 'https://example.com/acme.jpg',
            },
          },
        ],
        grantedScopes: ['pages_show_list', 'pages_read_engagement', 'pages_manage_posts'],
        expiresAt: null,
      });

      const encryptedPayload = tokenVault.encrypt(candidatePayload);

      await prisma.oAuthSession.create({
        data: {
          sessionTokenHash,
          workspaceId: workspaceAId,
          userId: userARecord!.id,
          provider: SocialProvider.META_FACEBOOK,
          encryptedPayload,
          expiresAt: new Date(Date.now() + 15 * 60 * 1000),
        },
      });
    });

    it('should retrieve candidate accounts without exposing raw access tokens', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/workspaces/${workspaceAId}/social-accounts/meta/candidates?sessionToken=${sessionToken}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);

      const body = res.body.data || res.body;
      expect(body.accounts).toBeDefined();
      expect(body.accounts.length).toBe(2); // 1 Facebook Page + 1 connected Instagram account

      const pageCandidate = body.accounts.find((a: any) => a.accountType === SocialAccountType.FACEBOOK_PAGE);
      expect(pageCandidate).toBeDefined();
      expect(pageCandidate.name).toBe('Acme Official Store');
      // Verify RAW access token is NOT exposed in response!
      expect(pageCandidate.pageAccessToken).toBeUndefined();
      expect(pageCandidate.accessToken).toBeUndefined();
    });

    it('should reject foreign user (User B) inspecting Workspace A candidate accounts (403 Forbidden)', async () => {
      await request(app.getHttpServer())
        .get(`/api/v1/workspaces/${workspaceAId}/social-accounts/meta/candidates?sessionToken=${sessionToken}`)
        .set('Authorization', `Bearer ${tokenB}`)
        .expect(403);
    });

    it('should connect selected Facebook Page and encrypt credentials in PostgreSQL', async () => {
      const selectRes = await request(app.getHttpServer())
        .post(`/api/v1/workspaces/${workspaceAId}/social-accounts/meta/select`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          sessionToken,
          selectedAccounts: [
            {
              providerAccountId: 'page-e2e-101',
              provider: SocialProvider.META_FACEBOOK,
              accountType: SocialAccountType.FACEBOOK_PAGE,
            },
          ],
        })
        .expect(201);

      const body = selectRes.body.data || selectRes.body;
      expect(body.success).toBe(true);
      expect(body.accounts.length).toBe(1);
      const connected = body.accounts[0];
      createdAccountId = connected.id;
      expect(connected.accountName).toBe('Acme Official Store');
      // Credential must NOT be in the API response
      expect(connected.encryptedAccessToken).toBeUndefined();

      // Direct Database inspection: verify token is stored encrypted
      const dbRecord = await prisma.socialAccount.findUnique({
        where: { id: createdAccountId },
      });
      expect(dbRecord).toBeDefined();
      expect(dbRecord!.encryptedAccessToken).not.toBe('EAA_secret_page_access_token_super_confidential');
      // Format must be v1:iv:authTag:ciphertext
      expect(dbRecord!.encryptedAccessToken.startsWith('v1:')).toBe(true);
      expect(dbRecord!.encryptedAccessToken.split(':').length).toBe(4);

      // Verify decrypt yields original secret
      const decrypted = tokenVault.decrypt(dbRecord!.encryptedAccessToken);
      expect(decrypted).toBe('EAA_secret_page_access_token_super_confidential');

      // Audit log inspection
      const audit = await prisma.auditLog.findFirst({
        where: {
          workspaceId: workspaceAId,
          action: 'SOCIAL_ACCOUNT_CONNECT',
          entityId: createdAccountId,
        },
      });
      expect(audit).toBeDefined();
    });

    it('should list connected accounts for authorized members', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/workspaces/${workspaceAId}/social-accounts`)
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);

      const accounts = Array.isArray(res.body) ? res.body : res.body.data;
      expect(accounts.length).toBeGreaterThanOrEqual(1);
      const found = accounts.find((a: any) => a.id === createdAccountId);
      expect(found).toBeDefined();
      expect(found.encryptedAccessToken).toBeUndefined();
    });

    it('should reject deleting account from another workspace', async () => {
      await request(app.getHttpServer())
        .delete(`/api/v1/workspaces/${workspaceBId}/social-accounts/${createdAccountId}`)
        .set('Authorization', `Bearer ${tokenB}`)
        .expect(404);
    });

    it('should disconnect social account and remove credentials', async () => {
      const res = await request(app.getHttpServer())
        .delete(`/api/v1/workspaces/${workspaceAId}/social-accounts/${createdAccountId}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);

      const body = res.body.data || res.body;
      expect(body.success).toBe(true);

      const dbCheck = await prisma.socialAccount.findUnique({
        where: { id: createdAccountId },
      });
      expect(dbCheck).toBeNull();

      // Audit log inspection
      const audit = await prisma.auditLog.findFirst({
        where: {
          workspaceId: workspaceAId,
          action: 'SOCIAL_ACCOUNT_DISCONNECT',
          entityId: createdAccountId,
        },
      });
      expect(audit).toBeDefined();
    });
  });
});
