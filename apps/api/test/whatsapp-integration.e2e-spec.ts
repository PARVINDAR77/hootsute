import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import * as cookieParser from 'cookie-parser';
import * as crypto from 'crypto';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { WorkspaceRole, SocialPlatform, RecipientConsentStatus, WhatsAppMessageStatus } from '@prisma/client';

describe('Stage 5: WhatsApp Provider Integration & Webhooks (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const timestamp = Date.now();
  const ownerUser = {
    name: 'WhatsApp Admin Owner',
    email: `wa_owner_${timestamp}@test.com`,
    password: 'Password123!',
  };
  const foreignUser = {
    name: 'WhatsApp Foreign User',
    email: `wa_foreign_${timestamp}@test.com`,
    password: 'Password123!',
  };

  let ownerToken: string;
  let foreignToken: string;
  let workspaceId: string;
  let foreignWorkspaceId: string;
  let recipientId: string;
  let draftId: string;

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

    // Register & Login Owner
    await request(app.getHttpServer()).post('/api/v1/auth/register').send(ownerUser);
    const ownerRes = await request(app.getHttpServer()).post('/api/v1/auth/login').send({
      email: ownerUser.email,
      password: ownerUser.password,
    });
    ownerToken = ownerRes.body.data.accessToken;

    // Register & Login Foreign User
    await request(app.getHttpServer()).post('/api/v1/auth/register').send(foreignUser);
    const foreignRes = await request(app.getHttpServer()).post('/api/v1/auth/login').send({
      email: foreignUser.email,
      password: foreignUser.password,
    });
    foreignToken = foreignRes.body.data.accessToken;

    // Create Primary Workspace
    const wsRes = await request(app.getHttpServer())
      .post('/api/v1/workspaces')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        name: 'Omni Retail WhatsApp',
        slug: `omni-wa-${timestamp}`,
      });
    workspaceId = wsRes.body.data.id;

    // Create Foreign Workspace
    const foreignWsRes = await request(app.getHttpServer())
      .post('/api/v1/workspaces')
      .set('Authorization', `Bearer ${foreignToken}`)
      .send({
        name: 'Foreign WA Workspace',
        slug: `foreign-wa-${timestamp}`,
      });
    foreignWorkspaceId = foreignWsRes.body.data.id;

    // Create a Draft with Instagram variant for notification testing
    const draftRes = await request(app.getHttpServer())
      .post(`/api/v1/workspaces/${workspaceId}/content-drafts`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        title: 'Diwali Festival Campaign',
        objective: 'ENGAGEMENT',
        contentType: 'POST',
        language: 'en',
        variants: [
          {
            platform: SocialPlatform.INSTAGRAM,
            body: 'Celebrate Diwali with exciting discounts! #Diwali2026',
            hashtags: ['#Diwali2026'],
          },
        ],
      });
    expect(draftRes.status).toBe(201);
    draftId = draftRes.body.data.id;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('1. WhatsApp Business Settings & Isolation', () => {
    it('configures workspace WhatsApp credentials with encrypted token', async () => {
      const res = await request(app.getHttpServer())
        .put(`/api/v1/workspaces/${workspaceId}/whatsapp/settings`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          wabaId: 'waba_test_12345678',
          phoneNumberId: 'phone_test_87654321',
          systemUserAccessToken: 'EAAB_test_mock_token_secret_value',
          businessPhoneNumber: '+91 98765 00000',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.hasConfiguredToken).toBe(true);
      expect(res.body.data.wabaId).toBe('waba_test_12345678');
      expect(res.body.data.encryptedAccessToken).toBeUndefined(); // Token never returned
    });

    it('retrieves configured workspace settings', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/workspaces/${workspaceId}/whatsapp/settings`)
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.phoneNumberId).toBe('phone_test_87654321');
      expect(res.body.data.hasConfiguredToken).toBe(true);
    });

    it('rejects foreign user from accessing workspace WhatsApp settings (IDOR isolation)', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/workspaces/${workspaceId}/whatsapp/settings`)
        .set('Authorization', `Bearer ${foreignToken}`);

      expect(res.status).toBe(403);
    });
  });

  describe('2. Recipient Consent Management', () => {
    it('registers reviewer phone number with consent acknowledgement', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/workspaces/${workspaceId}/whatsapp/recipients`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          phoneNumber: '+91 (987) 654-3210',
          displayName: 'Marketing Lead',
          consentAcknowledged: true,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.phoneNumber).toBe('+919876543210');
      expect(res.body.data.status).toBe(RecipientConsentStatus.OPTED_IN);
      recipientId = res.body.data.id;
    });

    it('rejects registration without explicit consent acknowledgement', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/workspaces/${workspaceId}/whatsapp/recipients`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          phoneNumber: '+919876543211',
          displayName: 'Assistant Lead',
          consentAcknowledged: false,
        });

      expect(res.status).toBe(400);
    });

    it('rejects duplicate registration of already opted-in recipient', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/workspaces/${workspaceId}/whatsapp/recipients`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          phoneNumber: '+91 98765 43210',
          displayName: 'Duplicate Lead',
          consentAcknowledged: true,
        });

      expect(res.status).toBe(409);
    });

    it('lists registered recipients for workspace', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/workspaces/${workspaceId}/whatsapp/recipients`)
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.some((r: any) => r.id === recipientId)).toBe(true);
    });

    it('revokes consent and suppresses notifications when deleted', async () => {
      const res = await request(app.getHttpServer())
        .delete(`/api/v1/workspaces/${workspaceId}/whatsapp/recipients/${recipientId}`)
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe(RecipientConsentStatus.OPTED_OUT);
    });

    it('re-activates opted-out recipient upon re-registration', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/workspaces/${workspaceId}/whatsapp/recipients`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          phoneNumber: '+919876543210',
          displayName: 'Marketing Lead Re-Opted',
          consentAcknowledged: true,
        });

      expect(res.status).toBe(201);
      expect(res.body.data.status).toBe(RecipientConsentStatus.OPTED_IN);
    });
  });

  describe('3. Notification Preview Dispatch & Audit', () => {
    let generatedActionToken: string;

    it('dispatches WhatsApp preview notification to opted-in recipient', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/workspaces/${workspaceId}/content-drafts/${draftId}/whatsapp-preview`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          recipientConsentIds: [recipientId],
          platform: SocialPlatform.INSTAGRAM,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.dispatchedCount).toBe(1);
      expect(res.body.messages[0].status).toBe(WhatsAppMessageStatus.SENT);
      expect(res.body.messages[0].providerMessageId).toBeDefined();

      generatedActionToken = res.body.messages[0].parameters.actionToken;
      expect(generatedActionToken).toBeDefined();
    });

    it('retrieves WhatsApp notification history for draft', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/workspaces/${workspaceId}/content-drafts/${draftId}/whatsapp-history`)
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data[0].draftId).toBe(draftId);
      expect(res.body.data[0].recipient.phoneNumber).toBe('+919876543210');
    });

    it('resolves public review link with valid action token without requiring Bearer auth', async () => {
      const res = await request(app.getHttpServer()).get(
        `/api/v1/review/whatsapp/${generatedActionToken}`,
      );

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.draft.id).toBe(draftId);
      expect(res.body.data.draft.title).toBe('Diwali Festival Campaign');
      expect(res.body.data.workspace.name).toBe('Omni Retail WhatsApp');
    });

    it('rejects tampered or forged review token', async () => {
      const [payloadB64, sig] = generatedActionToken.split('.');
      const alteredSig = sig.substring(0, sig.length - 1) + (sig.endsWith('a') ? 'b' : 'a');
      const tamperedToken = `${payloadB64}.${alteredSig}`;

      const res = await request(app.getHttpServer()).get(
        `/api/v1/review/whatsapp/${tamperedToken}`,
      );

      expect(res.status).toBe(401);
    });

    it('approves draft directly via valid review action token', async () => {
      const res = await request(app.getHttpServer()).post(
        `/api/v1/review/whatsapp/${generatedActionToken}/approve`,
      );

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('APPROVED');
    });

    it('rejects draft with mandatory change reason via valid review action token', async () => {
      // Create a fresh draft for rejection test
      const freshDraft = await request(app.getHttpServer())
        .post(`/api/v1/workspaces/${workspaceId}/content-drafts`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          title: 'Draft for Rejection Test',
          variants: [
            {
              platform: SocialPlatform.INSTAGRAM,
              body: 'Test content to be rejected',
            },
          ],
        });

      // Dispatch preview to get new action token
      const previewRes = await request(app.getHttpServer())
        .post(`/api/v1/workspaces/${workspaceId}/content-drafts/${freshDraft.body.data.id}/whatsapp-preview`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          recipientConsentIds: [recipientId],
        });

      const rejectToken = previewRes.body.messages[0].parameters.actionToken;

      const res = await request(app.getHttpServer())
        .post(`/api/v1/review/whatsapp/${rejectToken}/reject`)
        .send({
          reason: 'Please rewrite headline with stronger festive appeal',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('REJECTED');
      expect(res.body.data.rejectionReason).toBe('Please rewrite headline with stronger festive appeal');
    });

    it('rejects rejection request without valid reason', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/review/whatsapp/${generatedActionToken}/reject`)
        .send({
          reason: 'no', // Too short (<3 chars)
        });

      expect(res.status).toBe(400);
    });
  });

  describe('4. Meta Webhooks & Challenge Verification', () => {
    it('verifies Meta webhook challenge handshake successfully', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/webhooks/whatsapp')
        .query({
          'hub.mode': 'subscribe',
          'hub.verify_token': 'omnisocial_wa_verify_token',
          'hub.challenge': '1234567890_challenge_verified',
        });

      expect(res.status).toBe(200);
      expect(res.text).toBe('1234567890_challenge_verified');
    });

    it('rejects handshake with incorrect verify token', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/webhooks/whatsapp')
        .query({
          'hub.mode': 'subscribe',
          'hub.verify_token': 'wrong_token',
          'hub.challenge': 'challenge_failed',
        });

      expect(res.status).toBe(403);
    });

    it('processes inbound "APPROVE" reply and approves draft', async () => {
      // Create a draft and dispatch preview
      const replyDraft = await request(app.getHttpServer())
        .post(`/api/v1/workspaces/${workspaceId}/content-drafts`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          title: 'Draft for Inbound Reply Test',
          variants: [
            {
              platform: SocialPlatform.FACEBOOK,
              body: 'Festival campaign for Facebook',
            },
          ],
        });

      await request(app.getHttpServer())
        .post(`/api/v1/workspaces/${workspaceId}/content-drafts/${replyDraft.body.data.id}/whatsapp-preview`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          recipientConsentIds: [recipientId],
        });

      const payload = {
        object: 'whatsapp_business_account',
        entry: [
          {
            id: 'WHATSAPP_BUSINESS_ACCOUNT_ID',
            changes: [
              {
                value: {
                  messaging_product: 'whatsapp',
                  metadata: {
                    display_phone_number: '15550000000',
                    phone_number_id: 'phone_test_87654321',
                  },
                  messages: [
                    {
                      from: '919876543210',
                      id: `wamid.HBgL_approve_${timestamp}`,
                      timestamp: Math.floor(Date.now() / 1000).toString(),
                      text: { body: 'APPROVE' },
                      type: 'text',
                    },
                  ],
                },
                field: 'messages',
              },
            ],
          },
        ],
      };

      const res = await request(app.getHttpServer())
        .post('/api/v1/webhooks/whatsapp')
        .set('x-hub-signature-256', 'sha256=mock_signature_for_dev')
        .send(payload);

      expect(res.status).toBe(200);

      // Verify draft is now APPROVED in DB
      const updatedDraft = await prisma.contentDraft.findUnique({
        where: { id: replyDraft.body.data.id },
      });
      expect(updatedDraft?.status).toBe('APPROVED');
    });

    it('processes inbound "STOP" message and updates consent to OPTED_OUT', async () => {
      const payload = {
        object: 'whatsapp_business_account',
        entry: [
          {
            id: 'WHATSAPP_BUSINESS_ACCOUNT_ID',
            changes: [
              {
                value: {
                  messaging_product: 'whatsapp',
                  metadata: {
                    display_phone_number: '15550000000',
                    phone_number_id: 'phone_test_87654321',
                  },
                  messages: [
                    {
                      from: '919876543210',
                      id: `wamid.HBgL_optout_${timestamp}`,
                      timestamp: Math.floor(Date.now() / 1000).toString(),
                      text: { body: 'STOP' },
                      type: 'text',
                    },
                  ],
                },
                field: 'messages',
              },
            ],
          },
        ],
      };

      const res = await request(app.getHttpServer())
        .post('/api/v1/webhooks/whatsapp')
        .set('x-hub-signature-256', 'sha256=mock_signature_for_dev')
        .send(payload);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Verify recipient in DB is now OPTED_OUT
      const updatedRecipient = await prisma.whatsAppRecipientConsent.findUnique({
        where: { id: recipientId },
      });
      expect(updatedRecipient?.status).toBe(RecipientConsentStatus.OPTED_OUT);
    });
  });
});
