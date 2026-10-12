import { Logger } from '@nestjs/common';
import { MailProvider, SendMailOptions, SendMailResult } from '../mail-provider.interface';

export class ConsoleMailProvider implements MailProvider {
  readonly name = 'console';
  private readonly logger = new Logger(ConsoleMailProvider.name);
  public readonly sentHistory: SendMailOptions[] = [];

  async send(options: SendMailOptions): Promise<SendMailResult> {
    const messageId = `msg_console_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    this.sentHistory.push(options);

    this.logger.log(
      `[MOCK_MAIL] To: ${options.to.join(', ')} | Subject: "${options.subject}" | ID: ${messageId}`,
    );

    return {
      success: true,
      messageId,
      provider: this.name,
      recipientCount: options.to.length,
      timestamp: new Date().toISOString(),
    };
  }

  clearHistory() {
    this.sentHistory.length = 0;
  }
}
