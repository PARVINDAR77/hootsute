import { Test, TestingModule } from '@nestjs/testing';
import { DraftCommentsService } from './draft-comments.service';
import { PrismaService } from '../../prisma/prisma.service';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { WorkspaceRole } from '@prisma/client';

describe('DraftCommentsService', () => {
  let service: DraftCommentsService;
  let prisma: any;

  const mockWorkspaceId = 'ws-test-111';
  const mockDraftId = 'draft-test-222';
  const mockUserId = 'user-test-333';
  const mockCommentId = 'comment-test-444';

  const mockComment = {
    id: mockCommentId,
    draftId: mockDraftId,
    workspaceId: mockWorkspaceId,
    authorUserId: mockUserId,
    content: 'Please adjust copy tone.',
    parentCommentId: null,
    isResolved: false,
    resolvedByUserId: null,
    resolvedAt: null,
    author: { id: mockUserId, name: 'Reviewer John', email: 'john@test.com' },
    resolvedBy: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    prisma = {
      contentDraft: {
        findFirst: jest.fn(),
      },
      draftComment: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DraftCommentsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<DraftCommentsService>(DraftCommentsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createComment', () => {
    it('should throw NotFoundException if draft does not exist', async () => {
      prisma.contentDraft.findFirst.mockResolvedValue(null);

      await expect(
        service.createComment(mockWorkspaceId, 'invalid-draft', mockUserId, {
          content: 'Test comment',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should create root comment successfully', async () => {
      prisma.contentDraft.findFirst.mockResolvedValue({ id: mockDraftId });
      prisma.draftComment.create.mockResolvedValue(mockComment);

      const result = await service.createComment(mockWorkspaceId, mockDraftId, mockUserId, {
        content: 'Please adjust copy tone.',
      });

      expect(result).toBeDefined();
      expect(result.id).toBe(mockCommentId);
      expect(result.content).toBe('Please adjust copy tone.');
    });
  });

  describe('getComments', () => {
    it('should group root comments with their threaded replies', async () => {
      const mockReply = {
        id: 'reply-1',
        draftId: mockDraftId,
        workspaceId: mockWorkspaceId,
        authorUserId: 'user-2',
        content: 'Fixed it!',
        parentCommentId: mockCommentId,
        isResolved: false,
        author: { id: 'user-2', name: 'Author Jane', email: 'jane@test.com' },
        resolvedBy: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prisma.draftComment.findMany.mockResolvedValue([mockComment, mockReply]);

      const threads = await service.getComments(mockWorkspaceId, mockDraftId);

      expect(threads).toHaveLength(1);
      expect(threads[0].id).toBe(mockCommentId);
      expect(threads[0].replies).toHaveLength(1);
      expect(threads[0].replies![0].content).toBe('Fixed it!');
    });
  });

  describe('toggleResolveComment', () => {
    it('should toggle comment resolved status', async () => {
      prisma.draftComment.findFirst.mockResolvedValue(mockComment);
      prisma.draftComment.update.mockResolvedValue({
        ...mockComment,
        isResolved: true,
        resolvedByUserId: mockUserId,
        resolvedBy: { id: mockUserId, name: 'Reviewer John' },
        resolvedAt: new Date(),
      });

      const result = await service.toggleResolveComment(
        mockWorkspaceId,
        mockDraftId,
        mockCommentId,
        mockUserId,
      );

      expect(result.isResolved).toBe(true);
      expect(result.resolvedByName).toBe('Reviewer John');
    });
  });

  describe('deleteComment', () => {
    it('should prevent non-authors from deleting comments unless admin', async () => {
      prisma.draftComment.findFirst.mockResolvedValue(mockComment);

      await expect(
        service.deleteComment(
          mockWorkspaceId,
          mockCommentId,
          'stranger-user-id',
          WorkspaceRole.VIEWER,
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should allow author to delete own comment', async () => {
      prisma.draftComment.findFirst.mockResolvedValue(mockComment);
      prisma.draftComment.delete.mockResolvedValue({});

      const result = await service.deleteComment(
        mockWorkspaceId,
        mockCommentId,
        mockUserId,
        WorkspaceRole.VIEWER,
      );

      expect(result).toEqual({ success: true });
    });
  });
});
