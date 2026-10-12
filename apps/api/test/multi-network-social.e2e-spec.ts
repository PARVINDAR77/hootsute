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

describe('Multi-Network Social Expansion (LinkedIn & Twitter/X) (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let tokenVault: TokenVaultService;

  const timestamp = Date.now();
  const testUser = {
    name: 'Multi Network User',
    email: `multinet_${timestamp}@test.com`,
    password: 'Password123!',
  };

  let authToken: string;
  let workspaceId: string;

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

    // 1. Register & Login
    await request(app.getHttpServer()).post('/api/v1/auth/register').send(testUser);
    const loginRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: testUser.email, password: testUser.password });
    authToken = loginRes.body.data.accessToken;

    // 2. Create Workspace
    const wsRes = await request(app.getHttpServer())
      .post('/api/v1/workspaces')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ name: `Multi-Network WS ${timestamp}` });
    workspaceId = wsRes.body.data ? wsRes.body.data.id : wsRes.body.id;
  });

  afterAll(async () => {
    if (prisma) {
      await prisma.workspace.deleteMany({
        where: { createdBy: { email: testUser.email } },
      });
      await prisma.user.deleteMany({
        where: { email: testUser.email },
      });
      await prisma.$disconnect();
    }
    if (app) {
      await app.close();
    }
  });

  describe('LinkedIn OAuth & Account Connection Flow', () => {
    let linkedInSessionToken: string;

    it('should initiate LinkedIn OAuth flow and return authorization URL with state', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/workspaces/${workspaceId}/social-accounts/linkedin/connect`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({})
        .expect(201);

      const body = res.body.data || res.body;
      expect(body.authorizationUrl).toBeDefined();
      expect(body.state).toBeDefined();
      expect(body.provider).toBe(SocialProvider.LINKEDIN);

      // Verify OAuth state record in DB
      const stateRecord = await prisma.oAuthState.findUnique({
        where: { state: body.state },
      });
      expect(stateRecord).toBeDefined();
      expect(stateRecord!.provider).toBe(SocialProvider.LINKEDIN);
      expect(stateRecord!.workspaceId).toBe(workspaceId);
    });

    it('should process LinkedIn OAuth callback in mock mode and redirect to candidate selection', async () => {
      const state = `li_state_e2e_${Date.now()}`;
      const user = await prisma.user.findUnique({ where: { email: testUser.email } });

      await prisma.oAuthState.create({
        data: {
          state,
          workspaceId,
          userId: user!.id,
          provider: SocialProvider.LINKEDIN,
          redirectUri: 'http://localhost:4000/api/v1/oauth/linkedin/callback',
          expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        },
      });

      const res = await request(app.getHttpServer())
        .get(`/api/v1/oauth/linkedin/callback?code=mock_code_li&state=${state}`)
        .expect(302);

      const location = res.headers.location;
      expect(location).toContain('/settings/social-accounts/connect?session=');
      const url = new URL(location);
      linkedInSessionToken = url.searchParams.get('session')!;
      expect(linkedInSessionToken).toBeDefined();
    });

    it('should discover LinkedIn candidate accounts from ephemeral session', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/workspaces/${workspaceId}/social-accounts/candidates?sessionToken=${linkedInSessionToken}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const body = res.body.data || res.body;
      expect(body.accounts).toBeDefined();
      expect(body.accounts.length).toBeGreaterThanOrEqual(1);

      const profileAcc = body.accounts.find(
        (a: any) => a.accountType === SocialAccountType.LINKEDIN_PROFILE,
      );
      expect(profileAcc).toBeDefined();
      expect(profileAcc.provider).toBe(SocialProvider.LINKEDIN);
      // Ensure no raw token exposed
      expect(profileAcc.accessToken).toBeUndefined();
    });

    it('should connect selected LinkedIn candidate and verify token encryption at rest', async () => {
      // First get candidate id
      const candidatesRes = await request(app.getHttpServer())
        .get(`/api/v1/workspaces/${workspaceId}/social-accounts/candidates?sessionToken=${linkedInSessionToken}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const accounts = (candidatesRes.body.data || candidatesRes.body).accounts;
      const profileAcc = accounts.find((a: any) => a.accountType === SocialAccountType.LINKEDIN_PROFILE);

      const selectRes = await request(app.getHttpServer())
        .post(`/api/v1/workspaces/${workspaceId}/social-accounts/select`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          sessionToken: linkedInSessionToken,
          selectedAccounts: [
            {
              providerAccountId: profileAcc.id,
              provider: SocialProvider.LINKEDIN,
              accountType: SocialAccountType.LINKEDIN_PROFILE,
            },
          ],
        })
        .expect(201);

      const selectBody = selectRes.body.data || selectRes.body;
      expect(selectBody.success).toBe(true);
      expect(selectBody.accounts.length).toBe(1);
      expect(selectBody.accounts[0].encryptedAccessToken).toBeUndefined();

      // Verify DB record directly
      const dbAcc = await prisma.socialAccount.findFirst({
        where: {
          workspaceId,
          provider: SocialProvider.LINKEDIN,
          providerAccountId: profileAcc.id,
        },
      });
      expect(dbAcc).toBeDefined();
      expect(dbAcc!.encryptedAccessToken).toBeDefined();
      // Verify decryption works
      const decrypted = tokenVault.decrypt(dbAcc!.encryptedAccessToken);
      expect(decrypted).toContain('mock_li_token_');
    });
  });

  describe('Twitter / X OAuth & Account Connection Flow', () => {
    let twitterSessionToken: string;

    it('should initiate Twitter OAuth flow and return authorization URL with state', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/workspaces/${workspaceId}/social-accounts/twitter/connect`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({})
        .expect(201);

      const body = res.body.data || res.body;
      expect(body.authorizationUrl).toBeDefined();
      expect(body.state).toBeDefined();
      expect(body.provider).toBe(SocialProvider.TWITTER_X);
    });

    it('should process Twitter OAuth callback and redirect to candidate selection', async () => {
      const state = `tw_state_e2e_${Date.now()}`;
      const user = await prisma.user.findUnique({ where: { email: testUser.email } });

      await prisma.oAuthState.create({
        data: {
          state,
          workspaceId,
          userId: user!.id,
          provider: SocialProvider.TWITTER_X,
          redirectUri: 'http://localhost:4000/api/v1/oauth/twitter/callback',
          expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        },
      });

      const res = await request(app.getHttpServer())
        .get(`/api/v1/oauth/twitter/callback?code=mock_code_tw&state=${state}`)
        .expect(302);

      const location = res.headers.location;
      expect(location).toContain('/settings/social-accounts/connect?session=');
      const url = new URL(location);
      twitterSessionToken = url.searchParams.get('session')!;
      expect(twitterSessionToken).toBeDefined();
    });

    it('should discover Twitter/X profile and connect it to the workspace', async () => {
      const candidatesRes = await request(app.getHttpServer())
        .get(`/api/v1/workspaces/${workspaceId}/social-accounts/candidates?sessionToken=${twitterSessionToken}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const accounts = (candidatesRes.body.data || candidatesRes.body).accounts;
      expect(accounts.length).toBe(1);
      const twitterCandidate = accounts[0];
      expect(twitterCandidate.provider).toBe(SocialProvider.TWITTER_X);
      expect(twitterCandidate.accountType).toBe(SocialAccountType.TWITTER_PROFILE);

      const selectRes = await request(app.getHttpServer())
        .post(`/api/v1/workspaces/${workspaceId}/social-accounts/select`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          sessionToken: twitterSessionToken,
          selectedAccounts: [
            {
              providerAccountId: twitterCandidate.id,
              provider: SocialProvider.TWITTER_X,
              accountType: SocialAccountType.TWITTER_PROFILE,
            },
          ],
        })
        .expect(201);

      expect((selectRes.body.data || selectRes.body).success).toBe(true);

      // Verify in connected accounts list
      const listRes = await request(app.getHttpServer())
        .get(`/api/v1/workspaces/${workspaceId}/social-accounts`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const connectedList = listRes.body.data || listRes.body;
      const hasLinkedIn = connectedList.some((a: any) => a.provider === SocialProvider.LINKEDIN);
      const hasTwitter = connectedList.some((a: any) => a.provider === SocialProvider.TWITTER_X);
      expect(hasLinkedIn).toBe(true);
      expect(hasTwitter).toBe(true);
    });

    it('should disconnect social account cleanly', async () => {
      const listRes = await request(app.getHttpServer())
        .get(`/api/v1/workspaces/${workspaceId}/social-accounts`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const accounts = listRes.body.data || listRes.body;
      const twAccount = accounts.find((a: any) => a.provider === SocialProvider.TWITTER_X);

      await request(app.getHttpServer())
        .delete(`/api/v1/workspaces/${workspaceId}/social-accounts/${twAccount.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const listAfterRes = await request(app.getHttpServer())
        .get(`/api/v1/workspaces/${workspaceId}/social-accounts`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const accountsAfter = listAfterRes.body.data || listAfterRes.body;
      expect(accountsAfter.some((a: any) => a.id === twAccount.id)).toBe(false);
    });
  });
});
