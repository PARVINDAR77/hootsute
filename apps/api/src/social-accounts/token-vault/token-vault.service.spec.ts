import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { TokenVaultService } from './token-vault.service';
import { InternalServerErrorException } from '@nestjs/common';

describe('TokenVaultService', () => {
  let service: TokenVaultService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TokenVaultService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockImplementation((key: string) => {
              if (key === 'TOKEN_ENCRYPTION_KEY') {
                return '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
              }
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

  it('should encrypt and decrypt a plaintext token successfully', () => {
    const rawToken = 'EAABwzLixnjYBAK...meta_sample_token_value_12345';
    const encrypted = service.encrypt(rawToken);

    expect(encrypted).toBeDefined();
    expect(encrypted).not.toEqual(rawToken);
    expect(encrypted.split(':').length).toBe(3);

    const decrypted = service.decrypt(encrypted);
    expect(decrypted).toEqual(rawToken);
  });

  it('should produce distinct ciphertexts for identical plaintext due to random IV', () => {
    const rawToken = 'consistent_plaintext_token';
    const enc1 = service.encrypt(rawToken);
    const enc2 = service.encrypt(rawToken);

    expect(enc1).not.toEqual(enc2);
    expect(service.decrypt(enc1)).toEqual(rawToken);
    expect(service.decrypt(enc2)).toEqual(rawToken);
  });

  it('should reject tampered ciphertext with InternalServerErrorException', () => {
    const rawToken = 'secret_access_token';
    const encrypted = service.encrypt(rawToken);
    const parts = encrypted.split(':');

    // Tamper with encrypted data
    const tamperedHex = parts[2].slice(0, -2) + (parts[2].slice(-2) === 'aa' ? 'bb' : 'aa');
    const tamperedBundle = `${parts[0]}:${parts[1]}:${tamperedHex}`;

    expect(() => service.decrypt(tamperedBundle)).toThrow(InternalServerErrorException);
  });

  it('should reject malformed ciphertext bundles', () => {
    expect(() => service.decrypt('invalid_bundle')).toThrow(InternalServerErrorException);
    expect(() => service.decrypt('only:two_parts')).toThrow(InternalServerErrorException);
  });
});
