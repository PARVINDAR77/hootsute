import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@Injectable()
export class TokenVaultService {
  private readonly logger = new Logger(TokenVaultService.name);
  private readonly algorithm = 'aes-256-gcm';
  private readonly primaryKey: Buffer;
  private readonly fallbackKey: Buffer | null = null;
  private readonly currentVersion = 'v1';

  constructor(private readonly configService: ConfigService) {
    const rawPrimaryKey =
      this.configService.get<string>('TOKEN_ENCRYPTION_KEY') ||
      process.env.TOKEN_ENCRYPTION_KEY ||
      '';

    this.primaryKey = this.deriveKey(rawPrimaryKey, 'primary');

    const rawFallbackKey =
      this.configService.get<string>('TOKEN_ENCRYPTION_KEY_FALLBACK') ||
      process.env.TOKEN_ENCRYPTION_KEY_FALLBACK ||
      '';

    if (rawFallbackKey && rawFallbackKey.trim().length > 0) {
      this.fallbackKey = this.deriveKey(rawFallbackKey, 'fallback');
      this.logger.log('TokenVaultService initialized with dual-key rotation support.');
    }
  }

  private deriveKey(rawKey: string, keyLabel: string): Buffer {
    if (rawKey.length === 64) {
      // 64-char hex string = 32 bytes
      return Buffer.from(rawKey, 'hex');
    } else if (rawKey.length > 0) {
      // Derive 32-byte key via SHA-256
      return crypto.createHash('sha256').update(rawKey).digest();
    } else {
      if (keyLabel === 'primary') {
        this.logger.warn(
          'TOKEN_ENCRYPTION_KEY is not defined in configuration. Generating fallback ephemeral key (will not persist across server restarts).',
        );
        return crypto.randomBytes(32);
      }
      return Buffer.alloc(0);
    }
  }

  /**
   * Encrypts a plaintext string (e.g. social provider access token) using AES-256-GCM.
   * Format: v1:iv:authTag:encryptedData (all in hex format)
   */
  encrypt(plaintext: string): string {
    if (!plaintext) {
      throw new InternalServerErrorException('Cannot encrypt empty or null value');
    }

    try {
      const iv = crypto.randomBytes(12); // Standard 96-bit IV for GCM
      const cipher = crypto.createCipheriv(this.algorithm, this.primaryKey, iv);

      let encrypted = cipher.update(plaintext, 'utf8', 'hex');
      encrypted += cipher.final('hex');

      const authTag = cipher.getAuthTag();

      return `${this.currentVersion}:${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
    } catch (err: any) {
      this.logger.error(`Token encryption failure: ${err.message}`);
      throw new InternalServerErrorException('Failed to securely encrypt credential');
    }
  }

  /**
   * Decrypts a ciphertext bundle.
   * Supports both versioned (v1:iv:authTag:ciphertext) and legacy unversioned (iv:authTag:ciphertext).
   * Automatically attempts decryption with fallback key if primary key fails.
   */
  decrypt(ciphertextBundle: string): string {
    if (!ciphertextBundle) {
      throw new InternalServerErrorException('Cannot decrypt empty or null ciphertext');
    }

    let ivHex: string;
    let authTagHex: string;
    let encryptedHex: string;

    const parts = ciphertextBundle.split(':');

    if (parts.length === 4 && parts[0] === 'v1') {
      // Versioned format v1:iv:authTag:ciphertext
      [, ivHex, authTagHex, encryptedHex] = parts;
    } else if (parts.length === 3) {
      // Legacy unversioned format iv:authTag:ciphertext
      [ivHex, authTagHex, encryptedHex] = parts;
    } else {
      throw new InternalServerErrorException('Invalid ciphertext bundle format');
    }

    // Try primary key first
    try {
      return this.decryptWithKey(this.primaryKey, ivHex, authTagHex, encryptedHex);
    } catch (primaryErr: any) {
      // If dual-key rotation is active, try fallback key
      if (this.fallbackKey) {
        try {
          return this.decryptWithKey(this.fallbackKey, ivHex, authTagHex, encryptedHex);
        } catch {
          // If both fail, throw authenticated exception
        }
      }
      this.logger.error(`Token decryption authentication failure: ${primaryErr.message}`);
      throw new InternalServerErrorException('Failed to decrypt authenticated credential');
    }
  }

  private decryptWithKey(
    key: Buffer,
    ivHex: string,
    authTagHex: string,
    encryptedHex: string,
  ): string {
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const decipher = crypto.createDecipheriv(this.algorithm, key, iv);

    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  /**
   * Checks whether the given ciphertext needs rotation (i.e., legacy unversioned or decrypted via fallback key).
   */
  needsRotation(ciphertextBundle: string): boolean {
    if (!ciphertextBundle) return false;
    const parts = ciphertextBundle.split(':');
    return parts.length === 3 || parts[0] !== this.currentVersion;
  }

  /**
   * Re-encrypts an existing ciphertext with the current primary key and version header.
   */
  rotate(ciphertextBundle: string): string {
    const plaintext = this.decrypt(ciphertextBundle);
    return this.encrypt(plaintext);
  }
}
