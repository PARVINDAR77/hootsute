import { MockStorageProvider } from './mock-storage.provider';
import { StorageProviderFactory } from './storage-provider.factory';
import { S3StorageProvider } from './s3-storage.provider';
import { ConfigService } from '@nestjs/config';

describe('Storage Providers & Factory', () => {
  describe('MockStorageProvider', () => {
    let mockProvider: MockStorageProvider;

    beforeEach(() => {
      mockProvider = new MockStorageProvider();
    });

    it('generates a signed upload URL', async () => {
      const res = await mockProvider.getUploadSignedUrl({
        storageKey: 'workspaces/ws-1/media/test.jpg',
        mimeType: 'image/jpeg',
        maxSizeBytes: 5000000,
        expiresInSeconds: 900,
      });

      expect(res.uploadUrl).toContain('mock-storage/upload');
      expect(res.uploadUrl).toContain('test.jpg');
      expect(res.method).toBe('PUT');
      expect(res.headers?.['Content-Type']).toBe('image/jpeg');
      expect(res.expiresInSeconds).toBe(900);
    });

    it('puts, verifies existence, gets metadata and buffer, and deletes object', async () => {
      const key = 'workspaces/ws-1/media/image-123.png';
      const buffer = Buffer.from('fake-png-content');

      expect(await mockProvider.objectExists(key)).toBe(false);

      const putRes = await mockProvider.putObject(key, buffer, 'image/png');
      expect(putRes.sizeBytes).toBe(buffer.length);
      expect(putRes.etag).toBeDefined();

      expect(await mockProvider.objectExists(key)).toBe(true);

      const metadata = await mockProvider.getObjectMetadata(key);
      expect(metadata?.sizeBytes).toBe(buffer.length);
      expect(metadata?.contentType).toBe('image/png');

      const readBuffer = await mockProvider.getObjectBuffer(key, 4);
      expect(readBuffer?.toString()).toBe('fake');

      await mockProvider.deleteObject(key);
      expect(await mockProvider.objectExists(key)).toBe(false);
    });
  });

  describe('StorageProviderFactory', () => {
    let configService: jest.Mocked<ConfigService>;
    let s3Provider: jest.Mocked<S3StorageProvider>;
    let mockProvider: jest.Mocked<MockStorageProvider>;
    let factory: StorageProviderFactory;

    beforeEach(() => {
      configService = {
        get: jest.fn(),
      } as any;
      s3Provider = { providerName: 's3' } as any;
      mockProvider = { providerName: 'local_mock' } as any;

      factory = new StorageProviderFactory(configService, s3Provider, mockProvider);
    });

    it('returns MockStorageProvider when in test environment', () => {
      configService.get.mockImplementation((key: string) => {
        if (key === 'nodeEnv' || key === 'NODE_ENV') return 'test';
        if (key === 'MEDIA_STORAGE_PROVIDER') return 'local_mock';
        return undefined;
      });

      const provider = factory.getProvider();
      expect(provider.providerName).toBe('local_mock');
    });

    it('strictly throws in production if mock storage is configured', () => {
      configService.get.mockImplementation((key: string) => {
        if (key === 'nodeEnv' || key === 'NODE_ENV') return 'production';
        if (key === 'MEDIA_STORAGE_PROVIDER') return 'local_mock';
        return undefined;
      });

      expect(() => factory.getProvider()).toThrow(
        /Invalid storage provider configuration in production/,
      );
    });

    it('returns S3StorageProvider in production when s3 is configured', () => {
      configService.get.mockImplementation((key: string) => {
        if (key === 'nodeEnv' || key === 'NODE_ENV') return 'production';
        if (key === 'MEDIA_STORAGE_PROVIDER') return 's3';
        if (key === 'AWS_S3_BUCKET') return 'my-prod-bucket';
        return undefined;
      });

      const provider = factory.getProvider();
      expect(provider.providerName).toBe('s3');
    });
  });
});
