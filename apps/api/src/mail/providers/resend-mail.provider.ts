import { Logger } from '@nestjs/common';
import { MailProvider, SendMailOptions, SendMailResult } from '../mail-provider.interface';

export class ResendMailProvider implements MailProvider {
  readonly name = 'resend';
  private readonly logger = new Logger(ResendMailProvider.name);

  constructor(private readonly apiKey: string) {}

  async send(options: SendMailOptions): Promise<SendMailResult> {
    const payload = {
      from: options.from || 'OmniSocial AI <no-reply@omnisocial.ai>',
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
      reply_to: options.replyTo,
    };

    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = (await response.json()) as any;

      if (!response.ok) {
        throw new Error(data?.message || `Resend API returned status ${response.status}`);
      }

      return {
        success: true,
        messageId: data.id || `resend_${Date.now()}`,
        provider: this.name,
        recipientCount: options.to.length,
        timestamp: new Date().toISOString(),
      };
    } catch (err: any) {
      this.logger.error(`Resend email delivery failed: ${err.message}`, err.stack);
      return {
        success: false,
        messageId: '',
        provider: this.name,
        recipientCount: options.to.length,
        timestamp: new Date().toISOString(),
        error: err.message,
      };
    }
  }
}
