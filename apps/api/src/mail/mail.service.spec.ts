import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { MailService } from './mail.service';

describe('MailService', () => {
  let service: MailService;
  let configService: Partial<ConfigService>;

  beforeEach(async () => {
    configService = {
      get: jest.fn((key: string) => {
        if (key === 'MAIL_PROVIDER') return 'console';
        if (key === 'MAIL_FROM') return 'OmniSocial AI <test@omnisocial.ai>';
        return null;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MailService,
        {
          provide: ConfigService,
          useValue: configService,
        },
      ],
    }).compile();

    service = module.get<MailService>(MailService);
  });

  afterEach(() => {
    service.clearConsoleHistory();
  });

  it('should initialize with console provider by default', () => {
    expect(service.getProviderName()).toBe('console');
  });

  it('should send an invitation email and record to console history', async () => {
    const res = await service.sendInvitationEmail('colleague@example.com', {
      workspaceName: 'Acme Media',
      inviterName: 'Alice Admin',
      role: 'EDITOR',
      acceptUrl: 'https://app.omnisocial.ai/invitations/accept?token=sample123',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    expect(res.success).toBe(true);
    expect(res.recipientCount).toBe(1);
    expect(res.provider).toBe('console');

    const history = service.getConsoleHistory();
    expect(history).toHaveLength(1);
    expect(history[0].to).toContain('colleague@example.com');
    expect(history[0].subject).toContain('Acme Media');
    expect(history[0].html).toContain('Alice Admin');
    expect(history[0].html).toContain('EDITOR');
  });

  it('should send executive report emails to multiple recipients', async () => {
    const recipients = ['ceo@client.com', 'cmo@client.com'];
    const res = await service.sendExecutiveReportEmail(recipients, {
      workspaceName: 'Acme Corp',
      reportTitle: 'Q3 Global Social Impact',
      periodText: 'Jul 1 - Sep 30, 2026',
      reportUrl: 'https://app.omnisocial.ai/reports/exec-123',
      metrics: {
        totalImpressions: 450000,
        totalReach: 320000,
        netFollowerGrowth: 5400,
        avgEngagementRate: 4.85,
      },
    });

    expect(res.success).toBe(true);
    expect(res.recipientCount).toBe(2);

    const history = service.getConsoleHistory();
    expect(history).toHaveLength(1);
    expect(history[0].to).toEqual(recipients);
    expect(history[0].html).toContain('Performance Highlights');
    expect(history[0].html).toContain('4.85%');
  });

  it('should send approval required notification', async () => {
    const res = await service.sendApprovalRequiredEmail(['manager@client.com'], {
      workspaceName: 'Acme Corp',
      draftTitle: 'Product Launch Teaser',
      requestedBy: 'Bob Creator',
      stepRole: 'ADMIN',
      reviewUrl: 'https://app.omnisocial.ai/content/drafts/d-123',
    });

    expect(res.success).toBe(true);
    const history = service.getConsoleHistory();
    expect(history[0].html).toContain('Product Launch Teaser');
    expect(history[0].html).toContain('Bob Creator');
  });

  it('should send approval decision notification for both approved and changes requested', async () => {
    await service.sendApprovalDecisionEmail('author@client.com', {
      workspaceName: 'Acme Corp',
      draftTitle: 'Product Launch Teaser',
      decision: 'CHANGES_REQUESTED',
      reviewerName: 'Alice Admin',
      notes: 'Please update hashtag to #AcmeLaunch2026',
      draftUrl: 'https://app.omnisocial.ai/content/drafts/d-123',
    });

    const history = service.getConsoleHistory();
    expect(history[0].html).toContain('CHANGES REQUESTED');
    expect(history[0].html).toContain('Please update hashtag to #AcmeLaunch2026');
  });

  it('should send webhook failure alerts', async () => {
    await service.sendWebhookFailureAlert(['dev@company.com'], {
      workspaceName: 'Acme Corp',
      subscriptionName: 'Zapier Sync',
      targetUrl: 'https://hooks.zapier.com/catch/123',
      failureCount: 5,
      lastErrorMessage: 'ETIMEDOUT after 10000ms',
      settingsUrl: 'https://app.omnisocial.ai/settings/webhooks',
    });

    const history = service.getConsoleHistory();
    expect(history[0].html).toContain('Zapier Sync');
    expect(history[0].html).toContain('consecutive delivery attempts');
    expect(history[0].html).toContain('ETIMEDOUT');
  });
});
