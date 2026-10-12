export interface SendMailOptions {
  to: string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string;
  cc?: string[];
  attachments?: Array<{
    filename: string;
    content: string;
    contentType?: string;
  }>;
}

export interface SendMailResult {
  success: boolean;
  messageId: string;
  provider: string;
  recipientCount: number;
  timestamp: string;
  error?: string;
}

export interface MailProvider {
  name: string;
  send(options: SendMailOptions): Promise<SendMailResult>;
}
