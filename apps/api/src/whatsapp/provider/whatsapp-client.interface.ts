export interface WhatsAppTemplateMessageRequest {
  to: string; // E.164 formatted number
  templateName: string;
  languageCode: string;
  bodyParameters: string[];
  buttonUrlParameter?: string;
  wabaId?: string;
  phoneNumberId?: string;
  accessToken?: string;
}

export interface WhatsAppTextMessageRequest {
  to: string; // E.164 formatted number
  text: string;
  wabaId?: string;
  phoneNumberId?: string;
  accessToken?: string;
}

export interface WhatsAppMessageResult {
  success: boolean;
  messageId: string;
  status: 'sent' | 'queued';
  rawResponse?: any;
}

export interface WhatsAppClient {
  readonly providerName: string;
  sendMessage(request: WhatsAppTemplateMessageRequest): Promise<WhatsAppMessageResult>;
  sendTextMessage(request: WhatsAppTextMessageRequest): Promise<WhatsAppMessageResult>;
}

export const WHATSAPP_CLIENT = Symbol('WHATSAPP_CLIENT');

