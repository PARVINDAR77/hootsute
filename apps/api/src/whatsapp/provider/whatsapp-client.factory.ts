import { ConfigService } from '@nestjs/config';
import { WhatsAppClient } from './whatsapp-client.interface';
import { MetaWhatsAppClientService } from './meta-whatsapp-client.service';
import { MockWhatsAppClientService } from './mock-whatsapp-client.service';

export function createWhatsAppClient(configService: ConfigService): WhatsAppClient {
  const provider = (
    configService.get<string>('whatsapp.provider') ||
    (process.env.NODE_ENV === 'test' ? 'mock' : 'meta')
  ).toLowerCase();

  const isProduction = process.env.NODE_ENV === 'production';

  if (isProduction && provider === 'mock') {
    throw new Error(
      '[Security Policy] Mock WhatsApp client is strictly forbidden in production environments. Configure valid META_WHATSAPP_ACCESS_TOKEN and PHONE_NUMBER_ID.',
    );
  }

  if (provider === 'mock' || (process.env.NODE_ENV === 'test' && provider !== 'meta')) {
    return new MockWhatsAppClientService();
  }

  const accessToken = configService.get<string>('whatsapp.accessToken') || '';
  const phoneNumberId = configService.get<string>('whatsapp.phoneNumberId') || '';

  return new MetaWhatsAppClientService(accessToken, phoneNumberId);
}
