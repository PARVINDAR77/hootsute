import {
  Injectable,
  Logger,
  ServiceUnavailableException,
  BadRequestException,
  BadGatewayException,
  RequestTimeoutException,
} from '@nestjs/common';
import {
  WhatsAppClient,
  WhatsAppTemplateMessageRequest,
  WhatsAppMessageResult,
} from './whatsapp-client.interface';

@Injectable()
export class MetaWhatsAppClientService implements WhatsAppClient {
  readonly providerName = 'meta';
  private readonly logger = new Logger(MetaWhatsAppClientService.name);

  constructor(
    private readonly globalAccessToken: string,
    private readonly globalPhoneNumberId: string,
    private readonly timeoutMs: number = 20000,
    private readonly maxRetries: number = 2,
  ) {}

  async sendMessage(request: WhatsAppTemplateMessageRequest): Promise<WhatsAppMessageResult> {
    const accessToken = request.accessToken || this.globalAccessToken;
    const phoneNumberId = request.phoneNumberId || this.globalPhoneNumberId;

    if (!accessToken || !phoneNumberId) {
      throw new ServiceUnavailableException(
        'Meta WhatsApp Business integration is unconfigured. Missing access token or Phone Number ID.',
      );
    }

    const url = `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`;

    // Construct Meta WhatsApp Template message payload
    const components: any[] = [];

    // Body variables: {{1}}, {{2}}, ...
    if (request.bodyParameters && request.bodyParameters.length > 0) {
      components.push({
        type: 'body',
        parameters: request.bodyParameters.map((val) => ({
          type: 'text',
          text: String(val).substring(0, 1024), // Meta param max length safety
        })),
      });
    }

    // Dynamic URL Button parameter (if template has dynamic URL button at index 0)
    if (request.buttonUrlParameter) {
      components.push({
        type: 'button',
        sub_type: 'url',
        index: '0',
        parameters: [
          {
            type: 'text',
            text: request.buttonUrlParameter,
          },
        ],
      });
    }

    const payload = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: request.to.replace('+', ''), // Meta accepts digits or +digits, normalized
      type: 'template',
      template: {
        name: request.templateName,
        language: {
          code: request.languageCode || 'en',
        },
        components,
      },
    };

    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.maxRetries + 1; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        const responseBody = await response.json().catch(() => null);

        if (!response.ok) {
          const metaError = responseBody?.error;
          const errorCode = metaError?.code;
          const errorMessage = metaError?.message || response.statusText;

          // Permanent client errors - do not retry
          if (response.status === 400 || response.status === 401 || response.status === 403) {
            if (errorCode === 130429) {
              throw new ServiceUnavailableException('Meta WhatsApp rate limit reached. Please retry in a few moments.');
            }
            if (errorCode === 131026) {
              throw new BadRequestException('Template does not exist or has not been approved in target language.');
            }
            if (errorCode === 131030) {
              throw new BadRequestException('Recipient phone number is not a valid WhatsApp user.');
            }
            throw new BadRequestException(`Meta WhatsApp delivery rejected: ${errorMessage}`);
          }

          // Transient server errors (5xx)
          throw new BadGatewayException(`Meta WhatsApp service responded with HTTP ${response.status}: ${errorMessage}`);
        }

        const messages = responseBody?.messages;
        if (!messages || messages.length === 0 || !messages[0].id) {
          throw new BadGatewayException('Meta WhatsApp API returned unexpected response without message ID');
        }

        return {
          success: true,
          messageId: messages[0].id,
          status: 'sent',
          rawResponse: responseBody,
        };
      } catch (err: any) {
        lastError = err;

        if (err.name === 'AbortError') {
          throw new RequestTimeoutException('Meta WhatsApp API request timed out');
        }

        if (err instanceof BadRequestException || err instanceof ServiceUnavailableException) {
          throw err;
        }

        if (attempt <= this.maxRetries) {
          const backoffMs = attempt * 500;
          this.logger.warn(
            `Meta WhatsApp dispatch attempt ${attempt} failed. Retrying in ${backoffMs}ms... Error: ${err.message}`,
          );
          await new Promise((resolve) => setTimeout(resolve, backoffMs));
        }
      }
    }

    throw lastError || new BadGatewayException('Failed to send WhatsApp message after retries');
  }

  async sendTextMessage(request: {
    to: string;
    text: string;
    accessToken?: string;
    phoneNumberId?: string;
  }): Promise<WhatsAppMessageResult> {
    const accessToken = request.accessToken || this.globalAccessToken;
    const phoneNumberId = request.phoneNumberId || this.globalPhoneNumberId;

    if (!accessToken || !phoneNumberId) {
      throw new ServiceUnavailableException(
        'Meta WhatsApp Business integration is unconfigured. Missing access token or Phone Number ID.',
      );
    }

    const url = `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`;
    const payload = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: request.to.replace('+', ''),
      type: 'text',
      text: {
        preview_url: false,
        body: request.text.substring(0, 4096),
      },
    };

    let attempt = 0;
    let lastError: any = null;

    while (attempt <= this.maxRetries) {
      attempt++;
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

        const response = await fetch(url, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
        const responseBody = await response.json();

        if (!response.ok) {
          const errorMessage = responseBody?.error?.message || responseBody?.error?.error_user_msg || response.statusText;
          throw new BadGatewayException(`Meta WhatsApp text message failed: ${errorMessage}`);
        }

        const messages = responseBody?.messages;
        return {
          success: true,
          messageId: messages?.[0]?.id || `wamid.${Date.now()}`,
          status: 'sent',
          rawResponse: responseBody,
        };
      } catch (err: any) {
        lastError = err;
        if (attempt <= this.maxRetries) {
          await new Promise((resolve) => setTimeout(resolve, attempt * 500));
        }
      }
    }

    throw lastError || new BadGatewayException('Failed to dispatch WhatsApp text message after retries');
  }
}

