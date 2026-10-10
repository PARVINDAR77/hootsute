import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

export interface ActionTokenPayload {
  workspaceId: string;
  draftId: string;
  recipientConsentId: string;
  expiresAt: number; // Unix epoch ms
  nonce: string;
}

@Injectable()
export class WhatsAppActionTokenService {
  private readonly secretKey: string;

  constructor(private readonly configService: ConfigService) {
    this.secretKey =
      this.configService.get<string>('whatsapp.actionTokenSecret') ||
      'dev-action-secret-minimum-32-characters-required';
  }

  /**
   * Generates a signed, tamper-proof, single-use action token.
   * Format: base64Url(payloadJSON).hmacSha256Hex
   */
  generateToken(
    workspaceId: string,
    draftId: string,
    recipientConsentId: string,
    validityHours: number = 24,
  ): string {
    const payload: ActionTokenPayload = {
      workspaceId,
      draftId,
      recipientConsentId,
      expiresAt: Date.now() + validityHours * 3600 * 1000,
      nonce: crypto.randomBytes(16).toString('hex'),
    };

    const payloadBase64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const signature = crypto
      .createHmac('sha256', this.secretKey)
      .update(payloadBase64)
      .digest('hex');

    return `${payloadBase64}.${signature}`;
  }

  /**
   * Validates the token's cryptographic signature and expiration.
   */
  verifyToken(token: string): ActionTokenPayload {
    if (!token || !token.includes('.')) {
      throw new BadRequestException('Malformed review action token');
    }

    const [payloadBase64, signature] = token.split('.');
    if (!payloadBase64 || !signature) {
      throw new BadRequestException('Malformed review action token format');
    }

    if (!/^[a-f0-9]{64}$/i.test(signature)) {
      throw new UnauthorizedException('Invalid or tampered review action token signature length/format');
    }

    const expectedSignature = crypto
      .createHmac('sha256', this.secretKey)
      .update(payloadBase64)
      .digest('hex');

    const expectedBuffer = Buffer.from(expectedSignature, 'hex');
    const actualBuffer = Buffer.from(signature, 'hex');

    if (
      expectedBuffer.length !== actualBuffer.length ||
      !crypto.timingSafeEqual(expectedBuffer, actualBuffer)
    ) {
      throw new UnauthorizedException('Invalid or tampered review action token signature');
    }

    try {
      const payload: ActionTokenPayload = JSON.parse(
        Buffer.from(payloadBase64, 'base64url').toString('utf8'),
      );

      if (Date.now() > payload.expiresAt) {
        throw new UnauthorizedException('Review action token has expired. Please request a new preview link.');
      }

      return payload;
    } catch (err: any) {
      if (err instanceof UnauthorizedException) throw err;
      throw new BadRequestException('Invalid payload inside review action token');
    }
  }
}
