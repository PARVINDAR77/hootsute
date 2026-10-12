export interface UploadSignedUrlParams {
  storageKey: string;
  mimeType: string;
  maxSizeBytes: number;
  expiresInSeconds: number;
}

export interface UploadSignedUrlResult {
  uploadUrl: string;
  method: 'PUT' | 'POST';
  headers?: Record<string, string>;
  expiresInSeconds: number;
}

export interface DownloadSignedUrlParams {
  storageKey: string;
  expiresInSeconds: number;
  downloadFilename?: string;
}

export interface ObjectMetadata {
  sizeBytes: number;
  contentType: string;
  etag?: string;
  lastModified?: Date;
}

export interface PutObjectResult {
  sizeBytes: number;
  etag?: string;
}

export interface StorageProvider {
  readonly providerName: string;

  /**
   * Generates a secure, short-lived signed URL for direct-to-cloud upload.
   */
  getUploadSignedUrl(params: UploadSignedUrlParams): Promise<UploadSignedUrlResult>;

  /**
   * Generates a short-lived signed URL for reading/downloading private assets.
   */
  getDownloadSignedUrl(params: DownloadSignedUrlParams): Promise<string>;

  /**
   * Checks whether an object exists in storage at the given key.
   */
  objectExists(storageKey: string): Promise<boolean>;

  /**
   * Fetches metadata for an existing object in storage.
   */
  getObjectMetadata(storageKey: string): Promise<ObjectMetadata | null>;

  /**
   * Reads raw object buffer from storage (for file signature inspection).
   */
  getObjectBuffer(storageKey: string, maxBytes?: number): Promise<Buffer | null>;

  /**
   * Directly uploads a buffer to storage (server-mediated upload).
   */
  putObject(storageKey: string, buffer: Buffer, mimeType: string): Promise<PutObjectResult>;

  /**
   * Deletes an object from cloud storage.
   */
  deleteObject(storageKey: string): Promise<void>;
}
