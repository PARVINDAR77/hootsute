import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@Injectable()
export class TokenVaultService {
  private readonly logger = new Logger(TokenVaultService.name);
  private readonly algorithm = 'aes-256-gcm';
  private readonly key: Buffer;

  constructor(private readonly configService: ConfigService) {
    const rawKey =
      this.configService.get<string>('TOKEN_ENCRYPTION_KEY') ||
      process.env.TOKEN_ENCRYPTION_KEY ||
      '';

    if (rawKey.length === 64) {
      // 64-char hex string = 32 bytes
      this.key = Buffer.from(rawKey, 'hex');
    } else if (rawKey.length > 0) {
      // Derive 32-byte key via SHA-256
      this.key = crypto.createHash('sha256').update(rawKey).digest();
    } else {
      this.logger.warn(
        'TOKEN_ENCRYPTION_KEY is not defined in configuration. Generating fallback ephemeral key (will not persist across server restarts).',
      );
      this.key = crypto.randomBytes(32);
    }
  }

  /**
   * Encrypts a plaintext string (e.g. social provider access token) using AES-256-GCM.
   * Format: iv:authTag:encryptedData (all in hex format)
   */
  encrypt(plaintext: string): string {
    if (!plaintext) {
      throw new InternalServerErrorException('Cannot encrypt empty or null value');
    }

    try {
      const iv = crypto.randomBytes(12); // Standard 96-bit IV for GCM
      const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);

      let encrypted = cipher.update(plaintext, 'utf8', 'hex');
      encrypted += cipher.final('hex');

      const authTag = cipher.getAuthTag();

      return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
    } catch (err: any) {
      this.logger.error(`Token encryption failure: ${err.message}`);
      throw new InternalServerErrorException('Failed to securely encrypt credential');
    }
  }

  /**
   * Decrypts a ciphertext bundle formatted as iv:authTag:encryptedData using AES-256-GCM.
   */
  decrypt(ciphertextBundle: string): string {
    if (!ciphertextBundle) {
      throw new InternalServerErrorException('Cannot decrypt empty or null ciphertext');
    }

    const parts = ciphertextBundle.split(':');
    if (parts.length !== 3) {
      throw new InternalServerErrorException('Invalid ciphertext bundle format');
    }

    const [ivHex, authTagHex, encryptedHex] = parts;

    try {
      const iv = Buffer.from(ivHex, 'hex');
      const authTag = Buffer.from(authTagHex, 'hex');
      const decipher = crypto.createDecipheriv(this.algorithm, this.key, iv);

      decipher.setAuthTag(authTag);

      let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (err: any) {
      this.logger.error(`Token decryption authentication failure: ${err.message}`);
      throw new InternalServerErrorException('Failed to decrypt authenticated credential');
    }
  }
}
