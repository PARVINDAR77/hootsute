import { Injectable } from '@nestjs/common';
import {
  StorageProvider,
  UploadSignedUrlParams,
  UploadSignedUrlResult,
  DownloadSignedUrlParams,
  ObjectMetadata,
  PutObjectResult,
} from './storage-provider.interface';

interface StoredMockObject {
  buffer: Buffer;
  contentType: string;
  etag: string;
  lastModified: Date;
}

@Injectable()
export class MockStorageProvider implements StorageProvider {
  readonly providerName = 'local_mock';
  private readonly storage = new Map<string, StoredMockObject>();

  async getUploadSignedUrl(params: UploadSignedUrlParams): Promise<UploadSignedUrlResult> {
    const uploadUrl = `http://localhost:4000/api/v1/mock-storage/upload?key=${encodeURIComponent(params.storageKey)}&expires=${Date.now() + params.expiresInSeconds * 1000}`;
    return {
      uploadUrl,
      method: 'PUT',
      headers: {
        'Content-Type': params.mimeType,
      },
      expiresInSeconds: params.expiresInSeconds,
    };
  }

  async getDownloadSignedUrl(params: DownloadSignedUrlParams): Promise<string> {
    return `https://mock-storage.omnisocial.local/${params.storageKey}?token=mock-signed-token-${Date.now()}`;
  }

  async objectExists(storageKey: string): Promise<boolean> {
    return this.storage.has(storageKey);
  }

  async getObjectMetadata(storageKey: string): Promise<ObjectMetadata | null> {
    const obj = this.storage.get(storageKey);
    if (!obj) return null;

    return {
      sizeBytes: obj.buffer.length,
      contentType: obj.contentType,
      etag: obj.etag,
      lastModified: obj.lastModified,
    };
  }

  async getObjectBuffer(storageKey: string, maxBytes = 4096): Promise<Buffer | null> {
    const obj = this.storage.get(storageKey);
    if (!obj) return null;

    return obj.buffer.subarray(0, maxBytes);
  }

  async putObject(storageKey: string, buffer: Buffer, mimeType: string): Promise<PutObjectResult> {
    const etag = `mock-etag-${Date.now()}`;
    this.storage.set(storageKey, {
      buffer,
      contentType: mimeType,
      etag,
      lastModified: new Date(),
    });

    return {
      sizeBytes: buffer.length,
      etag,
    };
  }

  async deleteObject(storageKey: string): Promise<void> {
    this.storage.delete(storageKey);
  }

  // Helper method for testing: inspect in-memory count or clear
  clear(): void {
    this.storage.clear();
  }

  getStoredCount(): number {
    return this.storage.size;
  }
}
