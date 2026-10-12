import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import * as cookieParser from 'cookie-parser';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import {
  SubscriptionPlan,
  SubscriptionStatus,
  BillingInterval,
  WorkspaceRole,
} from '@packages/shared';

describe('Stage 12: Stripe Billing, Subscription Lifecycle & Customer Portal (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const timestamp = Date.now();
  let workspaceId: string;
  let foreignWorkspaceId: string;
  let ownerUserId: string;
  let viewerUserId: string;
  let ownerToken: string;
  let viewerToken: string;

  beforeAll(async () => {
    process.env.BILLING_PROVIDER = 'mock';

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

    // 1. Create Workspace Owner User
    const ownerEmail = `billing_owner_${timestamp}@test.com`;
    await request(app.getHttpServer()).post('/api/v1/auth/register').send({
      name: 'Billing Owner',
      email: ownerEmail,
      password: 'Password123!',
    });
    const ownerLoginRes = await request(app.getHttpServer()).post('/api/v1/auth/login').send({
      email: ownerEmail,
      password: 'Password123!',
    });
    ownerToken = ownerLoginRes.body.data.accessToken;
    ownerUserId = ownerLoginRes.body.data.user.id;

    // 2. Create Primary Workspace
    const wsRes = await request(app.getHttpServer())
      .post('/api/v1/workspaces')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        name: `Billing Workspace ${timestamp}`,
      });
    workspaceId = wsRes.body.data.id;

    // 3. Create Viewer User & Add to Workspace
    const viewerEmail = `billing_viewer_${timestamp}@test.com`;
    await request(app.getHttpServer()).post('/api/v1/auth/register').send({
      name: 'Billing Viewer',
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

    // 4. Create Foreign Workspace
    const foreignWsRes = await request(app.getHttpServer())
      .post('/api/v1/workspaces')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        name: `Foreign Workspace ${timestamp}`,
      });
    foreignWorkspaceId = foreignWsRes.body.data.id;
  });

  afterAll(async () => {
    // Cleanup created test records
    await prisma.billingInvoice.deleteMany({
      where: { workspaceId: { in: [workspaceId, foreignWorkspaceId] } },
    });
    await prisma.workspaceSubscription.deleteMany({
      where: { workspaceId: { in: [workspaceId, foreignWorkspaceId] } },
    });
    await prisma.workspaceMember.deleteMany({
      where: { workspaceId: { in: [workspaceId, foreignWorkspaceId] } },
    });
    await prisma.workspace.deleteMany({
      where: { id: { in: [workspaceId, foreignWorkspaceId] } },
    });
    await prisma.user.deleteMany({
      where: { id: { in: [ownerUserId, viewerUserId] } },
    });
    await app.close();
  });

  describe('GET /api/v1/billing/plans', () => {
    it('should return publicly accessible pricing plan configurations', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/billing/plans')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(3);

      const pro = res.body.data.find((p: any) => p.plan === SubscriptionPlan.PRO);
      expect(pro).toBeDefined();
      expect(pro.monthlyPriceCents).toBe(2900);
      expect(pro.storageQuotaBytes).toBe(53687091200);
      expect(pro.features).toBeDefined();
    });
  });

  describe('GET /api/v1/workspaces/:workspaceId/billing/subscription', () => {
    it('should reject unauthenticated requests', async () => {
      await request(app.getHttpServer())
        .get(`/api/v1/workspaces/${workspaceId}/billing/subscription`)
        .expect(401);
    });

    it('should reject non-workspace members', async () => {
      // Foreign user attempt
      const unauthEmail = `intruder_${timestamp}@test.com`;
      await request(app.getHttpServer()).post('/api/v1/auth/register').send({
        name: 'Intruder',
        email: unauthEmail,
        password: 'Password123!',
      });
      const loginRes = await request(app.getHttpServer()).post('/api/v1/auth/login').send({
        email: unauthEmail,
        password: 'Password123!',
      });
      const intruderToken = loginRes.body.data.accessToken;

      await request(app.getHttpServer())
        .get(`/api/v1/workspaces/${workspaceId}/billing/subscription`)
        .set('Authorization', `Bearer ${intruderToken}`)
        .expect(403);

      await prisma.user.delete({ where: { id: loginRes.body.data.user.id } });
    });

    it('should allow members to view subscription and lazily initialize FREE subscription', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/workspaces/${workspaceId}/billing/subscription`)
        .set('Authorization', `Bearer ${viewerToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.plan).toBe(SubscriptionPlan.FREE);
      expect(res.body.data.status).toBe(SubscriptionStatus.ACTIVE);
      expect(res.body.data.workspaceId).toBe(workspaceId);
    });
  });

  describe('POST /api/v1/workspaces/:workspaceId/billing/checkout-session', () => {
    it('should reject checkout request from VIEWER role (requires ADMIN/OWNER)', async () => {
      await request(app.getHttpServer())
        .post(`/api/v1/workspaces/${workspaceId}/billing/checkout-session`)
        .set('Authorization', `Bearer ${viewerToken}`)
        .send({
          plan: SubscriptionPlan.PRO,
          billingInterval: BillingInterval.MONTHLY,
          successUrl: 'http://localhost:3000/settings/billing?success=true',
          cancelUrl: 'http://localhost:3000/settings/billing?canceled=true',
        })
        .expect(403);
    });

    it('should reject checkout request for FREE plan tier', async () => {
      await request(app.getHttpServer())
        .post(`/api/v1/workspaces/${workspaceId}/billing/checkout-session`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          plan: SubscriptionPlan.FREE,
          billingInterval: BillingInterval.MONTHLY,
          successUrl: 'http://localhost:3000/settings/billing?success=true',
          cancelUrl: 'http://localhost:3000/settings/billing?canceled=true',
        })
        .expect(400);
    });

    it('should create checkout session for PRO plan for workspace OWNER', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/workspaces/${workspaceId}/billing/checkout-session`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          plan: SubscriptionPlan.PRO,
          billingInterval: BillingInterval.MONTHLY,
          successUrl: 'http://localhost:3000/settings/billing?success=true',
          cancelUrl: 'http://localhost:3000/settings/billing?canceled=true',
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.sessionId).toBeDefined();
      expect(res.body.data.checkoutUrl).toContain('session_id=');

      // Verify that customer ID was initialized on the subscription record
      const sub = await prisma.workspaceSubscription.findUnique({
        where: { workspaceId },
      });
      expect(sub?.stripeCustomerId).toBeDefined();
    });
  });

  describe('POST /api/v1/workspaces/:workspaceId/billing/customer-portal', () => {
    it('should generate a customer portal session URL for owner', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/workspaces/${workspaceId}/billing/customer-portal`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          returnUrl: 'http://localhost:3000/settings/billing',
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.portalUrl).toContain('portal_session=active');
    });
  });

  describe('POST /api/v1/billing/webhook', () => {
    it('should process checkout.session.completed and upgrade workspace limits', async () => {
      const payload = {
        id: `evt_test_${timestamp}`,
        type: 'checkout.session.completed',
        data: {
          object: {
            customer: `cus_test_${timestamp}`,
            subscription: `sub_stripe_${timestamp}`,
            metadata: {
              workspaceId,
              plan: SubscriptionPlan.PRO,
              billingInterval: BillingInterval.MONTHLY,
            },
          },
        },
      };

      const res = await request(app.getHttpServer())
        .post('/api/v1/billing/webhook')
        .set('stripe-signature', 'mock_sig')
        .send(payload)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.received).toBe(true);

      // Verify workspace limits were updated in the database
      const updatedWs = await prisma.workspace.findUnique({
        where: { id: workspaceId },
      });
      expect(updatedWs?.planTier).toBe(SubscriptionPlan.PRO);
      expect(updatedWs?.storageQuotaBytes).toBe(BigInt(53687091200)); // 50 GB
      expect(updatedWs?.maxMediaAssets).toBe(5000);

      // Verify subscription record was updated
      const updatedSub = await prisma.workspaceSubscription.findUnique({
        where: { workspaceId },
      });
      expect(updatedSub?.plan).toBe(SubscriptionPlan.PRO);
      expect(updatedSub?.status).toBe(SubscriptionStatus.ACTIVE);
      expect(updatedSub?.stripeSubscriptionId).toBe(`sub_stripe_${timestamp}`);
    });

    it('should process invoice.payment_succeeded and persist invoice history', async () => {
      const invoicePayload = {
        id: `evt_inv_${timestamp}`,
        type: 'invoice.payment_succeeded',
        data: {
          object: {
            id: `in_stripe_${timestamp}`,
            customer: `cus_test_${timestamp}`,
            amount_due: 2900,
            amount_paid: 2900,
            currency: 'usd',
            status: 'paid',
            invoice_pdf: 'https://pay.stripe.com/invoice/mock.pdf',
            hosted_invoice_url: 'https://invoice.stripe.com/mock',
            period_start: 1760000000,
            period_end: 1762592000,
          },
        },
      };

      const res = await request(app.getHttpServer())
        .post('/api/v1/billing/webhook')
        .set('stripe-signature', 'mock_sig')
        .send(invoicePayload)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.received).toBe(true);

      const invoice = await prisma.billingInvoice.findUnique({
        where: { stripeInvoiceId: `in_stripe_${timestamp}` },
      });
      expect(invoice).toBeDefined();
      expect(invoice?.workspaceId).toBe(workspaceId);
      expect(invoice?.amountPaid).toBe(2900);
      expect(invoice?.status).toBe('paid');
    });

    it('should process customer.subscription.deleted and downgrade workspace to FREE tier', async () => {
      const deletePayload = {
        id: `evt_del_${timestamp}`,
        type: 'customer.subscription.deleted',
        data: {
          object: {
            id: `sub_stripe_${timestamp}`,
          },
        },
      };

      const res = await request(app.getHttpServer())
        .post('/api/v1/billing/webhook')
        .set('stripe-signature', 'mock_sig')
        .send(deletePayload)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.received).toBe(true);

      // Verify workspace limits downgraded
      const downgradedWs = await prisma.workspace.findUnique({
        where: { id: workspaceId },
      });
      expect(downgradedWs?.planTier).toBe(SubscriptionPlan.FREE);
      expect(downgradedWs?.storageQuotaBytes).toBe(BigInt(5368709120)); // 5 GB
      expect(downgradedWs?.maxMediaAssets).toBe(500);

      // Verify subscription canceled
      const downgradedSub = await prisma.workspaceSubscription.findUnique({
        where: { workspaceId },
      });
      expect(downgradedSub?.plan).toBe(SubscriptionPlan.FREE);
      expect(downgradedSub?.status).toBe(SubscriptionStatus.CANCELED);
    });
  });

  describe('GET /api/v1/workspaces/:workspaceId/billing/invoices', () => {
    it('should return list of workspace past invoices', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/workspaces/${workspaceId}/billing/invoices`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data[0].stripeInvoiceId).toBe(`in_stripe_${timestamp}`);
      expect(res.body.data[0].amountPaid).toBe(2900);
    });
  });
});
