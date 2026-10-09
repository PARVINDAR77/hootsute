import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { TokenVaultService } from './token-vault.service';
import { InternalServerErrorException } from '@nestjs/common';

describe('TokenVaultService', () => {
  const primaryKeyHex = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
  const fallbackKeyHex = 'fedcba9876543210fedcba9876543210fedcba9876543210fedcba9876543210';

  let service: TokenVaultService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TokenVaultService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockImplementation((key: string) => {
              if (key === 'TOKEN_ENCRYPTION_KEY') return primaryKeyHex;
              if (key === 'TOKEN_ENCRYPTION_KEY_FALLBACK') return fallbackKeyHex;
              return null;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<TokenVaultService>(TokenVaultService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should encrypt and decrypt a plaintext token successfully with v1 header', () => {
    const rawToken = 'EAABwzLixnjYBAK...meta_sample_token_value_12345';
    const encrypted = service.encrypt(rawToken);

    expect(encrypted).toBeDefined();
    expect(encrypted.startsWith('v1:')).toBe(true);
    expect(encrypted.split(':').length).toBe(4);

    const decrypted = service.decrypt(encrypted);
    expect(decrypted).toEqual(rawToken);
  });

  it('should decrypt legacy unversioned ciphertext bundle (iv:authTag:ciphertext)', () => {
    // Manually create a 3-part legacy bundle with the primary key
    const rawToken = 'legacy_token_sample';
    const encrypted = service.encrypt(rawToken);
    // Strip the 'v1:' prefix to simulate legacy record
    const legacyBundle = encrypted.replace('v1:', '');
    expect(legacyBundle.split(':').length).toBe(3);

    const decrypted = service.decrypt(legacyBundle);
    expect(decrypted).toEqual(rawToken);
    expect(service.needsRotation(legacyBundle)).toBe(true);
  });

  it('should support dual-key rotation (decrypt with fallback key and rotate to primary)', async () => {
    // Create a vault using ONLY the fallback key as primary to simulate older records
    const oldVaultModule: TestingModule = await Test.createTestingModule({
      providers: [
        TokenVaultService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockImplementation((key: string) => {
              if (key === 'TOKEN_ENCRYPTION_KEY') return fallbackKeyHex;
              return null;
            }),
          },
        },
      ],
    }).compile();

    const oldVault = oldVaultModule.get<TokenVaultService>(TokenVaultService);
    const tokenCreatedUnderOldKey = oldVault.encrypt('token_encrypted_before_rotation');

    // Current service has fallbackKey configured: it should decrypt seamlessly!
    const decrypted = service.decrypt(tokenCreatedUnderOldKey);
    expect(decrypted).toBe('token_encrypted_before_rotation');

    // And rotate to the new primary key
    const reEncrypted = service.rotate(tokenCreatedUnderOldKey);
    expect(service.decrypt(reEncrypted)).toBe('token_encrypted_before_rotation');
  });

  it('should reject tampered ciphertext with InternalServerErrorException', () => {
    const rawToken = 'secret_access_token';
    const encrypted = service.encrypt(rawToken);
    const parts = encrypted.split(':');

    // Tamper with the encrypted portion
    const tamperedHex = parts[3].slice(0, -2) + (parts[3].slice(-2) === 'aa' ? 'bb' : 'aa');
    const tamperedBundle = `${parts[0]}:${parts[1]}:${parts[2]}:${tamperedHex}`;

    expect(() => service.decrypt(tamperedBundle)).toThrow(InternalServerErrorException);
  });
});
