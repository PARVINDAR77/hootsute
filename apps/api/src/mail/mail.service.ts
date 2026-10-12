import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  EmailDeliveryResultDto,
  EmailTemplateType,
  SendEmailRequestDto,
} from '@packages/shared';
import { MailProvider, SendMailOptions } from './mail-provider.interface';
import { ConsoleMailProvider } from './providers/console-mail.provider';
import { ResendMailProvider } from './providers/resend-mail.provider';
import { SmtpMailProvider } from './providers/smtp-mail.provider';
import {
  renderApprovalDecisionTemplate,
  renderApprovalNotificationTemplate,
  renderExecutiveReportTemplate,
  renderInvitationTemplate,
  renderWebhookFailureTemplate,
} from './mail.templates';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly provider: MailProvider;
  private readonly defaultFrom: string;

  constructor(private readonly configService: ConfigService) {
    const providerType =
      this.configService.get<string>('MAIL_PROVIDER') || 'console';
    this.defaultFrom =
      this.configService.get<string>('MAIL_FROM') ||
      'OmniSocial AI <no-reply@omnisocial.ai>';

    const resendKey = this.configService.get<string>('RESEND_API_KEY');
    const smtpHost = this.configService.get<string>('SMTP_HOST');

    if (providerType === 'resend' && resendKey) {
      this.provider = new ResendMailProvider(resendKey);
      this.logger.log('MailService initialized with Resend provider');
    } else if (providerType === 'smtp' && smtpHost) {
      this.provider = new SmtpMailProvider({
        host: smtpHost,
        port: parseInt(this.configService.get<string>('SMTP_PORT') || '587', 10),
        user: this.configService.get<string>('SMTP_USER'),
        pass: this.configService.get<string>('SMTP_PASS'),
      });
      this.logger.log('MailService initialized with SMTP provider');
    } else {
      this.provider = new ConsoleMailProvider();
      this.logger.log('MailService initialized with Console mock provider');
    }
  }

  getProviderName(): string {
    return this.provider.name;
  }

  getConsoleHistory(): SendMailOptions[] {
    if (this.provider instanceof ConsoleMailProvider) {
      return this.provider.sentHistory;
    }
    return [];
  }

  clearConsoleHistory(): void {
    if (this.provider instanceof ConsoleMailProvider) {
      this.provider.clearHistory();
    }
  }

  async sendEmail(dto: SendEmailRequestDto): Promise<EmailDeliveryResultDto> {
    const recipients = Array.isArray(dto.to) ? dto.to : [dto.to];
    let htmlContent = '';
    let textContent = '';
    let renderedSubject = dto.subject;

    switch (dto.template) {
      case 'WORKSPACE_INVITATION': {
        const rendered = renderInvitationTemplate(dto.templateData as any);
        htmlContent = rendered.html;
        textContent = rendered.text;
        if (!dto.subject) renderedSubject = rendered.subject;
        break;
      }
      case 'EXECUTIVE_REPORT': {
        const rendered = renderExecutiveReportTemplate(dto.templateData as any);
        htmlContent = rendered.html;
        textContent = rendered.text;
        if (!dto.subject) renderedSubject = rendered.subject;
        break;
      }
      case 'APPROVAL_REQUIRED': {
        const rendered = renderApprovalNotificationTemplate(dto.templateData as any);
        htmlContent = rendered.html;
        textContent = rendered.text;
        if (!dto.subject) renderedSubject = rendered.subject;
        break;
      }
      case 'APPROVAL_DECISION': {
        const rendered = renderApprovalDecisionTemplate(dto.templateData as any);
        htmlContent = rendered.html;
        textContent = rendered.text;
        if (!dto.subject) renderedSubject = rendered.subject;
        break;
      }
      case 'WEBHOOK_FAILURE_ALERT': {
        const rendered = renderWebhookFailureTemplate(dto.templateData as any);
        htmlContent = rendered.html;
        textContent = rendered.text;
        if (!dto.subject) renderedSubject = rendered.subject;
        break;
      }
      default:
        htmlContent = `<p>${JSON.stringify(dto.templateData)}</p>`;
        textContent = JSON.stringify(dto.templateData);
    }

    const result = await this.provider.send({
      to: recipients,
      subject: renderedSubject,
      html: htmlContent,
      text: textContent,
      from: dto.from || this.defaultFrom,
      replyTo: dto.replyTo,
      cc: dto.cc,
      attachments: dto.attachments,
    });

    return {
      success: result.success,
      messageId: result.messageId,
      provider: result.provider,
      recipientCount: result.recipientCount,
      timestamp: result.timestamp,
      error: result.error,
    };
  }

  async sendInvitationEmail(
    to: string,
    data: {
      workspaceName: string;
      inviterName: string;
      role: string;
      acceptUrl: string;
      expiresAt: Date | string;
    },
  ): Promise<EmailDeliveryResultDto> {
    return this.sendEmail({
      to,
      subject: `You're invited to join ${data.workspaceName} on OmniSocial AI`,
      template: 'WORKSPACE_INVITATION',
      templateData: data,
    });
  }

  async sendExecutiveReportEmail(
    to: string[],
    data: {
      workspaceName: string;
      reportTitle: string;
      periodText: string;
      reportUrl: string;
      agencyName?: string;
      metrics?: any;
    },
  ): Promise<EmailDeliveryResultDto> {
    return this.sendEmail({
      to,
      subject: `Executive Report: ${data.reportTitle} (${data.periodText})`,
      template: 'EXECUTIVE_REPORT',
      templateData: data,
    });
  }

  async sendApprovalRequiredEmail(
    to: string[],
    data: {
      workspaceName: string;
      draftTitle: string;
      requestedBy: string;
      stepRole: string;
      reviewUrl: string;
    },
  ): Promise<EmailDeliveryResultDto> {
    return this.sendEmail({
      to,
      subject: `Action Required: Content draft awaits your approval (${data.workspaceName})`,
      template: 'APPROVAL_REQUIRED',
      templateData: data,
    });
  }

  async sendApprovalDecisionEmail(
    to: string,
    data: {
      workspaceName: string;
      draftTitle: string;
      decision: 'APPROVED' | 'CHANGES_REQUESTED';
      reviewerName: string;
      notes?: string;
      draftUrl: string;
    },
  ): Promise<EmailDeliveryResultDto> {
    const isApproved = data.decision === 'APPROVED';
    return this.sendEmail({
      to,
      subject: isApproved
        ? `Draft Approved: "${data.draftTitle}" is ready to publish`
        : `Changes Requested on "${data.draftTitle}" (${data.workspaceName})`,
      template: 'APPROVAL_DECISION',
      templateData: data,
    });
  }

  async sendWebhookFailureAlert(
    to: string[],
    data: {
      workspaceName: string;
      subscriptionName: string;
      targetUrl: string;
      failureCount: number;
      lastErrorMessage?: string;
      settingsUrl: string;
    },
  ): Promise<EmailDeliveryResultDto> {
    return this.sendEmail({
      to,
      subject: `Alert: Webhook Failures for ${data.subscriptionName}`,
      template: 'WEBHOOK_FAILURE_ALERT',
      templateData: data,
    });
  }
}
