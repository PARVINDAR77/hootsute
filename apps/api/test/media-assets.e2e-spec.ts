import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import * as cookieParser from 'cookie-parser';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { MockStorageProvider } from '../src/media/providers/mock-storage.provider';
import { StorageProviderFactory } from '../src/media/providers/storage-provider.factory';
import {
  MediaType,
  MediaProcessingStatus,
  WorkspaceRole,
  SocialPlatform,
  ScheduledPostStatus,
} from '@prisma/client';

describe('Stage 11: Media Asset Management & Cloud Storage (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let mockStorage: MockStorageProvider;

  const timestamp = Date.now();
  let workspaceId: string;
  let foreignWorkspaceId: string;
  let ownerUserId: string;
  let editorUserId: string;
  let viewerUserId: string;
  let ownerToken: string;
  let editorToken: string;
  let viewerToken: string;

  // 1x1 valid PNG image buffer (with width: 800, height: 600 in IHDR)
  const validPngBuffer = Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, // PNG Magic bytes
    0x00, 0x00, 0x00, 0x0d, // IHDR length (13)
    0x49, 0x48, 0x44, 0x52, // 'IHDR'
    0x00, 0x00, 0x03, 0x20, // Width: 800
    0x00, 0x00, 0x02, 0x58, // Height: 600
    0x08, 0x06, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00,
  ]);

  // Spoofed file (Declared as PNG but content is ASCII text)
  const spoofedBuffer = Buffer.from('This is a malicious text file disguised as a PNG image');

  beforeAll(async () => {
    process.env.MEDIA_STORAGE_PROVIDER = 'mock';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication({ rawBody: true });
    app.use(cookieParser());
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();
    prisma = app.get<PrismaService>(PrismaService);
    const storageFactory = app.get<StorageProviderFactory>(StorageProviderFactory);
    mockStorage = storageFactory.getProvider() as MockStorageProvider;

    // 1. Create Workspace Owner User
    const ownerEmail = `media_owner_${timestamp}@test.com`;
    await request(app.getHttpServer()).post('/api/v1/auth/register').send({
      name: 'Media Owner',
      email: ownerEmail,
      password: 'Password123!',
    });
    const ownerLoginRes = await request(app.getHttpServer()).post('/api/v1/auth/login').send({
      email: ownerEmail,
      password: 'Password123!',
    });
    ownerToken = ownerLoginRes.body.data.accessToken;
    ownerUserId = ownerLoginRes.body.data.user.id;

    // 2. Create Workspace Editor User
    const editorEmail = `media_editor_${timestamp}@test.com`;
    await request(app.getHttpServer()).post('/api/v1/auth/register').send({
      name: 'Media Editor',
      email: editorEmail,
      password: 'Password123!',
    });
    const editorLoginRes = await request(app.getHttpServer()).post('/api/v1/auth/login').send({
      email: editorEmail,
      password: 'Password123!',
    });
    editorToken = editorLoginRes.body.data.accessToken;
    editorUserId = editorLoginRes.body.data.user.id;

    // 3. Create Workspace Viewer User
    const viewerEmail = `media_viewer_${timestamp}@test.com`;
    await request(app.getHttpServer()).post('/api/v1/auth/register').send({
      name: 'Media Viewer',
      email: viewerEmail,
      password: 'Password123!',
    });
    const viewerLoginRes = await request(app.getHttpServer()).post('/api/v1/auth/login').send({
      email: viewerEmail,
      password: 'Password123!',
    });
    viewerToken = viewerLoginRes.body.data.accessToken;
    viewerUserId = viewerLoginRes.body.data.user.id;

    // 4. Create Main Workspace
    const wsRes = await request(app.getHttpServer())
      .post('/api/v1/workspaces')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ name: `Media WS ${timestamp}` });
    workspaceId = wsRes.body.data.id;

    // Add Editor and Viewer to Main Workspace
    await prisma.workspaceMember.create({
      data: {
        workspaceId,
        userId: editorUserId,
        role: WorkspaceRole.EDITOR,
      },
    });

    await prisma.workspaceMember.create({
      data: {
        workspaceId,
        userId: viewerUserId,
        role: WorkspaceRole.VIEWER,
      },
    });

    // 5. Create Foreign Workspace (to test isolation)
    const foreignWsRes = await request(app.getHttpServer())
      .post('/api/v1/workspaces')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ name: `Foreign Media WS ${timestamp}` });
    foreignWorkspaceId = foreignWsRes.body.data.id;
  });

  afterAll(async () => {
    if (mockStorage && typeof mockStorage.clear === 'function') {
      mockStorage.clear();
    }
    // Clean up test data
    if (workspaceId) {
      await prisma.scheduledPostTarget.deleteMany({
        where: { scheduledPost: { workspaceId } },
      });
      await prisma.scheduledPost.deleteMany({ where: { workspaceId } });
      await prisma.contentRevision.deleteMany({ where: { draft: { workspaceId } } });
      await prisma.contentVariant.deleteMany({ where: { draft: { workspaceId } } });
      await prisma.contentDraft.deleteMany({ where: { workspaceId } });
      await prisma.mediaAsset.deleteMany({ where: { workspaceId } });
      await prisma.workspaceMember.deleteMany({ where: { workspaceId } });
      await prisma.workspace.delete({ where: { id: workspaceId } }).catch(() => {});
    }
    if (foreignWorkspaceId) {
      await prisma.mediaAsset.deleteMany({ where: { workspaceId: foreignWorkspaceId } });
      await prisma.workspaceMember.deleteMany({ where: { workspaceId: foreignWorkspaceId } });
      await prisma.workspace.delete({ where: { id: foreignWorkspaceId } }).catch(() => {});
    }
    if (ownerUserId) {
      await prisma.user.delete({ where: { id: ownerUserId } }).catch(() => {});
    }
    if (editorUserId) {
      await prisma.user.delete({ where: { id: editorUserId } }).catch(() => {});
    }
    if (viewerUserId) {
      await prisma.user.delete({ where: { id: viewerUserId } }).catch(() => {});
    }
    await app.close();
  });

  describe('1. Upload Session Lifecycle', () => {
    it('should reject upload session with invalid or disallowed MIME types', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/workspaces/${workspaceId}/media/upload-session`)
        .set('Authorization', `Bearer ${editorToken}`)
        .send({
          filename: 'malware.exe',
          mimeType: 'application/x-msdownload',
          sizeBytes: 1024,
        });

      expect(res.status).toBe(400);
      const msg = Array.isArray(res.body.message) ? res.body.message.join(' ') : res.body.message;
      expect(msg).toContain('Unsupported MIME type');
    });

    it('should reject file size exceeding limits', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/workspaces/${workspaceId}/media/upload-session`)
        .set('Authorization', `Bearer ${editorToken}`)
        .send({
          filename: 'huge-image.png',
          mimeType: 'image/png',
          sizeBytes: 150 * 1024 * 1024, // 150MB exceeds 100MB limit
        });

      expect(res.status).toBe(400);
      expect(res.body.message.some((m: string) => m.includes('File size cannot exceed'))).toBe(true);
    });

    it('should create an upload session for a valid PNG image', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/workspaces/${workspaceId}/media/upload-session`)
        .set('Authorization', `Bearer ${editorToken}`)
        .send({
          filename: 'product-banner.png',
          mimeType: 'image/png',
          sizeBytes: validPngBuffer.length,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.assetId).toBeDefined();
      expect(res.body.data.storageKey).toContain(`workspaces/${workspaceId}/media/`);
      expect(res.body.data.uploadUrl).toBeDefined();
      expect(res.body.data.method).toBe('PUT');

      // Verify asset created with UPLOADING in database
      const asset = await prisma.mediaAsset.findUnique({
        where: { id: res.body.data.assetId },
      });
      expect(asset).not.toBeNull();
      expect(asset?.processingStatus).toBe(MediaProcessingStatus.UPLOADING);
      expect(asset?.mediaType).toBe(MediaType.IMAGE);
    });
  });

  describe('2. Verification & Magic Byte Inspection', () => {
    let pendingAssetId: string;
    let pendingStorageKey: string;

    beforeEach(async () => {
      const sessionRes = await request(app.getHttpServer())
        .post(`/api/v1/workspaces/${workspaceId}/media/upload-session`)
        .set('Authorization', `Bearer ${editorToken}`)
        .send({
          filename: 'test-inspect.png',
          mimeType: 'image/png',
          sizeBytes: validPngBuffer.length,
        });
      pendingAssetId = sessionRes.body.data.assetId;
      pendingStorageKey = sessionRes.body.data.storageKey;
    });

    it('should fail complete-upload if object is not yet uploaded to storage', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/workspaces/${workspaceId}/media/${pendingAssetId}/complete`)
        .set('Authorization', `Bearer ${editorToken}`)
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('not found in storage');
    });

    it('should reject spoofed file and set status to FAILED in database', async () => {
      // Put spoofed file into mock storage
      await mockStorage.putObject(pendingStorageKey, spoofedBuffer, 'image/png');

      const res = await request(app.getHttpServer())
        .post(`/api/v1/workspaces/${workspaceId}/media/${pendingAssetId}/complete`)
        .set('Authorization', `Bearer ${editorToken}`)
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Unsupported file signature');

      const asset = await prisma.mediaAsset.findUnique({ where: { id: pendingAssetId } });
      expect(asset?.processingStatus).toBe(MediaProcessingStatus.FAILED);
    });

    it('should verify valid PNG file, extract dimensions, and transition to READY', async () => {
      // Put valid PNG into mock storage
      await mockStorage.putObject(pendingStorageKey, validPngBuffer, 'image/png');

      const res = await request(app.getHttpServer())
        .post(`/api/v1/workspaces/${workspaceId}/media/${pendingAssetId}/complete`)
        .set('Authorization', `Bearer ${editorToken}`)
        .send({});

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.processingStatus).toBe('READY');
      expect(res.body.data.width).toBe(800);
      expect(res.body.data.height).toBe(600);
      expect(res.body.data.accessUrl).toBeDefined();
    });
  });

  describe('3. Querying & Filtering Assets', () => {
    let readyAssetId: string;

    beforeAll(async () => {
      const sessionRes = await request(app.getHttpServer())
        .post(`/api/v1/workspaces/${workspaceId}/media/upload-session`)
        .set('Authorization', `Bearer ${editorToken}`)
        .send({
          filename: 'summer-sale-poster.png',
          mimeType: 'image/png',
          sizeBytes: validPngBuffer.length,
        });
      readyAssetId = sessionRes.body.data.assetId;
      await mockStorage.putObject(sessionRes.body.data.storageKey, validPngBuffer, 'image/png');
      await request(app.getHttpServer())
        .post(`/api/v1/workspaces/${workspaceId}/media/${readyAssetId}/complete`)
        .set('Authorization', `Bearer ${editorToken}`)
        .send({});
    });

    it('should list assets in the workspace with pagination and filters', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/workspaces/${workspaceId}/media?mediaType=IMAGE&status=READY`)
        .set('Authorization', `Bearer ${editorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
      expect(res.body.total).toBeGreaterThanOrEqual(1);

      const found = res.body.data.find((a: any) => a.id === readyAssetId);
      expect(found).toBeDefined();
      expect(found.accessUrl).toBeDefined();
    });

    it('should get asset details by ID with signed download URL', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/workspaces/${workspaceId}/media/${readyAssetId}`)
        .set('Authorization', `Bearer ${editorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(readyAssetId);
      expect(res.body.data.originalFilename).toBe('summer-sale-poster.png');
      expect(res.body.data.accessUrl).toContain('mock-storage');
    });

    it('should generate pre-signed download URL endpoint', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/workspaces/${workspaceId}/media/${readyAssetId}/download-url`)
        .set('Authorization', `Bearer ${editorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.url).toBeDefined();
      expect(res.body.data.expiresInSeconds).toBe(3600);
    });
  });

  describe('4. Cross-Workspace & RBAC Isolation', () => {
    let assetIdInMainWs: string;

    beforeAll(async () => {
      const sessionRes = await request(app.getHttpServer())
        .post(`/api/v1/workspaces/${workspaceId}/media/upload-session`)
        .set('Authorization', `Bearer ${editorToken}`)
        .send({
          filename: 'isolated-asset.png',
          mimeType: 'image/png',
          sizeBytes: validPngBuffer.length,
        });
      assetIdInMainWs = sessionRes.body.data.assetId;
      await mockStorage.putObject(sessionRes.body.data.storageKey, validPngBuffer, 'image/png');
      await request(app.getHttpServer())
        .post(`/api/v1/workspaces/${workspaceId}/media/${assetIdInMainWs}/complete`)
        .set('Authorization', `Bearer ${editorToken}`)
        .send({});
    });

    it('should deny access when querying asset from foreign workspace', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/workspaces/${foreignWorkspaceId}/media/${assetIdInMainWs}`)
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(res.status).toBe(404);
    });

    it('should deny delete when targeting asset from foreign workspace', async () => {
      const res = await request(app.getHttpServer())
        .delete(`/api/v1/workspaces/${foreignWorkspaceId}/media/${assetIdInMainWs}`)
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(res.status).toBe(404);
    });

    it('should allow workspace viewer to view media assets', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/workspaces/${workspaceId}/media/${assetIdInMainWs}`)
        .set('Authorization', `Bearer ${viewerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(assetIdInMainWs);
    });
  });

  describe('5. Content Draft & Publishing Integration', () => {
    let readyAssetId: string;
    let draftId: string;

    beforeAll(async () => {
      // 1. Prepare ready media asset
      const sessionRes = await request(app.getHttpServer())
        .post(`/api/v1/workspaces/${workspaceId}/media/upload-session`)
        .set('Authorization', `Bearer ${editorToken}`)
        .send({
          filename: 'draft-attachment.png',
          mimeType: 'image/png',
          sizeBytes: validPngBuffer.length,
        });
      readyAssetId = sessionRes.body.data.assetId;
      await mockStorage.putObject(sessionRes.body.data.storageKey, validPngBuffer, 'image/png');
      await request(app.getHttpServer())
        .post(`/api/v1/workspaces/${workspaceId}/media/${readyAssetId}/complete`)
        .set('Authorization', `Bearer ${editorToken}`)
        .send({});
    });

    it('should create a content draft with attached mediaAssetId on variant', async () => {
      const draftRes = await request(app.getHttpServer())
        .post(`/api/v1/workspaces/${workspaceId}/content-drafts`)
        .set('Authorization', `Bearer ${editorToken}`)
        .send({
          title: 'Draft with Media Asset',
          variants: [
            {
              platform: SocialPlatform.INSTAGRAM,
              body: 'Exciting announcement coming soon with our new visual! #visuals',
              mediaAssetId: readyAssetId,
            },
          ],
        });

      expect(draftRes.status).toBe(201);
      expect(draftRes.body.data.variants).toHaveLength(1);
      expect(draftRes.body.data.variants[0].mediaAssetId).toBe(readyAssetId);
      expect(draftRes.body.data.variants[0].mediaAsset).toBeDefined();
      expect(draftRes.body.data.variants[0].mediaAsset.originalFilename).toBe('draft-attachment.png');
      expect(draftRes.body.data.variants[0].mediaAsset.storageKey).toBeDefined();

      draftId = draftRes.body.data.id;
    });

    it('should retrieve draft and include enriched mediaAsset details', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/workspaces/${workspaceId}/content-drafts/${draftId}`)
        .set('Authorization', `Bearer ${editorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.variants[0].mediaAssetId).toBe(readyAssetId);
      expect(res.body.data.variants[0].mediaAsset).toBeDefined();
      expect(res.body.data.variants[0].mediaAsset.originalFilename).toBe('draft-attachment.png');
      expect(res.body.data.variants[0].mediaAsset.storageKey).toBeDefined();
    });
  });

  describe('6. Soft Deletion & Conflict Protection', () => {
    let unreferencedAssetId: string;
    let scheduledAssetId: string;
    let scheduledDraftId: string;
    let scheduledPostId: string;

    beforeAll(async () => {
      // 1. Create unreferenced asset
      const sess1 = await request(app.getHttpServer())
        .post(`/api/v1/workspaces/${workspaceId}/media/upload-session`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          filename: 'delete-me.png',
          mimeType: 'image/png',
          sizeBytes: validPngBuffer.length,
        });
      unreferencedAssetId = sess1.body.data.assetId;
      await mockStorage.putObject(sess1.body.data.storageKey, validPngBuffer, 'image/png');
      await request(app.getHttpServer())
        .post(`/api/v1/workspaces/${workspaceId}/media/${unreferencedAssetId}/complete`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({});

      // 2. Create asset attached to a scheduled draft
      const sess2 = await request(app.getHttpServer())
        .post(`/api/v1/workspaces/${workspaceId}/media/upload-session`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          filename: 'locked-by-post.png',
          mimeType: 'image/png',
          sizeBytes: validPngBuffer.length,
        });
      scheduledAssetId = sess2.body.data.assetId;
      await mockStorage.putObject(sess2.body.data.storageKey, validPngBuffer, 'image/png');
      await request(app.getHttpServer())
        .post(`/api/v1/workspaces/${workspaceId}/media/${scheduledAssetId}/complete`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({});

      // Create draft with this variant
      const draftRes = await request(app.getHttpServer())
        .post(`/api/v1/workspaces/${workspaceId}/content-drafts`)
        .set('Authorization', `Bearer ${editorToken}`)
        .send({
          title: 'Scheduled Draft With Media',
          variants: [
            {
              platform: SocialPlatform.FACEBOOK,
              body: 'Scheduled post content with media asset',
              mediaAssetId: scheduledAssetId,
            },
          ],
        });
      scheduledDraftId = draftRes.body.data.id;

      // Submit review and approve draft
      await request(app.getHttpServer())
        .post(`/api/v1/workspaces/${workspaceId}/content-drafts/${scheduledDraftId}/submit-review`)
        .set('Authorization', `Bearer ${editorToken}`)
        .send({});

      await request(app.getHttpServer())
        .post(`/api/v1/workspaces/${workspaceId}/content-drafts/${scheduledDraftId}/approve`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({});

      // Create active scheduled post referencing this draft in Prisma
      const post = await prisma.scheduledPost.create({
        data: {
          workspaceId,
          draftId: scheduledDraftId,
          createdById: ownerUserId,
          scheduledAt: new Date(Date.now() + 86400000),
          status: ScheduledPostStatus.SCHEDULED,
          approvedRevisionNumber: 1,
          contentSnapshot: {
            text: 'Scheduled post content with media asset',
            mediaAssetId: scheduledAssetId,
          },
          snapshotHash: 'mock-hash-scheduled-post',
        },
      });
      scheduledPostId = post.id;
    });

    it('should block deletion of asset referenced by an active scheduled post (409 Conflict)', async () => {
      const res = await request(app.getHttpServer())
        .delete(`/api/v1/workspaces/${workspaceId}/media/${scheduledAssetId}`)
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(res.status).toBe(409);
      expect(res.body.message).toContain('upcoming scheduled posts');
    });

    it('should allow soft-deleting an unreferenced media asset', async () => {
      const res = await request(app.getHttpServer())
        .delete(`/api/v1/workspaces/${workspaceId}/media/${unreferencedAssetId}`)
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Verify soft-deleted from active listings
      const listRes = await request(app.getHttpServer())
        .get(`/api/v1/workspaces/${workspaceId}/media`)
        .set('Authorization', `Bearer ${ownerToken}`);

      const found = listRes.body.data.find((a: any) => a.id === unreferencedAssetId);
      expect(found).toBeUndefined();

      // Verify deletedAt is set in database
      const dbAsset = await prisma.mediaAsset.findUnique({
        where: { id: unreferencedAssetId },
      });
      expect(dbAsset?.deletedAt).not.toBeNull();
    });

    it('should allow deletion after the scheduled post is cancelled', async () => {
      // Cancel the scheduled post
      await prisma.scheduledPost.update({
        where: { id: scheduledPostId },
        data: { status: ScheduledPostStatus.CANCELLED },
      });

      const res = await request(app.getHttpServer())
        .delete(`/api/v1/workspaces/${workspaceId}/media/${scheduledAssetId}`)
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});
