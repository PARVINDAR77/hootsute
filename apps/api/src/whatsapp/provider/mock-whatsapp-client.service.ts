import {
  Injectable,
  Logger,
  ServiceUnavailableException,
  BadRequestException,
} from '@nestjs/common';
import {
  WhatsAppClient,
  WhatsAppTemplateMessageRequest,
  WhatsAppMessageResult,
} from './whatsapp-client.interface';
import * as crypto from 'crypto';

export type MockWhatsAppBehavior = 'success' | 'rate_limit' | 'unconfigured' | 'invalid_recipient';

@Injectable()
export class MockWhatsAppClientService implements WhatsAppClient {
  readonly providerName = 'mock';
  private readonly logger = new Logger(MockWhatsAppClientService.name);

  public behaviorMode: MockWhatsAppBehavior = 'success';
  public dispatchedMessages: WhatsAppTemplateMessageRequest[] = [];
  public callCount = 0;

  async sendMessage(request: WhatsAppTemplateMessageRequest): Promise<WhatsAppMessageResult> {
    this.callCount++;
    this.dispatchedMessages.push(request);

    if (this.behaviorMode === 'unconfigured') {
      throw new ServiceUnavailableException(
        'WhatsApp Business Cloud API is currently unconfigured. Set META_WHATSAPP_ACCESS_TOKEN and PHONE_NUMBER_ID.',
      );
    }

    if (this.behaviorMode === 'rate_limit') {
      throw new ServiceUnavailableException(
        'Meta WhatsApp API rate limit exceeded (error 130429). Please try again shortly.',
      );
    }

    if (this.behaviorMode === 'invalid_recipient') {
      throw new BadRequestException(
        'Recipient phone number is not a valid WhatsApp user or country code is invalid.',
      );
    }

    const randomSuffix = crypto.randomBytes(8).toString('hex');
    const mockWamid = `wamid.HBg${Date.now()}_${randomSuffix}`;

    this.logger.debug(
      `[MockWhatsApp] Message dispatched to ${request.to} using template "${request.templateName}". Assigned messageId: ${mockWamid}`,
    );

    return {
      success: true,
      messageId: mockWamid,
      status: 'sent',
      rawResponse: {
        messaging_product: 'whatsapp',
        contacts: [{ input: request.to, wa_id: request.to.replace('+', '') }],
        messages: [{ id: mockWamid, message_status: 'accepted' }],
      },
    };
  }

  async sendTextMessage(request: { to: string; text: string }): Promise<WhatsAppMessageResult> {
    this.callCount++;
    const randomSuffix = crypto.randomBytes(8).toString('hex');
    const mockWamid = `wamid.HBgText${Date.now()}_${randomSuffix}`;

    this.logger.debug(
      `[MockWhatsApp] Plain text message dispatched to ${request.to}: "${request.text}". Assigned messageId: ${mockWamid}`,
    );

    return {
      success: true,
      messageId: mockWamid,
      status: 'sent',
      rawResponse: {
        messaging_product: 'whatsapp',
        contacts: [{ input: request.to, wa_id: request.to.replace('+', '') }],
        messages: [{ id: mockWamid, message_status: 'accepted' }],
      },
    };
  }

  reset() {
    this.dispatchedMessages = [];
    this.callCount = 0;
    this.behaviorMode = 'success';
  }
}

