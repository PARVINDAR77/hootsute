import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { DraftCommentDto } from '@packages/shared';
import { WorkspaceRole } from '@prisma/client';
import { CreateDraftCommentDto } from '../dto/create-draft-comment.dto';

@Injectable()
export class DraftCommentsService {
  private readonly logger = new Logger(DraftCommentsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Adds a top-level or threaded comment to a content draft
   */
  async createComment(
    workspaceId: string,
    draftId: string,
    userId: string,
    dto: CreateDraftCommentDto,
  ): Promise<DraftCommentDto> {
    const draft = await this.prisma.contentDraft.findFirst({
      where: { id: draftId, workspaceId },
    });

    if (!draft) {
      throw new NotFoundException(`Draft "${draftId}" not found.`);
    }

    if (dto.parentCommentId) {
      const parent = await this.prisma.draftComment.findFirst({
        where: { id: dto.parentCommentId, draftId },
      });
      if (!parent) {
        throw new NotFoundException(`Parent comment "${dto.parentCommentId}" not found.`);
      }
    }

    const comment = await this.prisma.draftComment.create({
      data: {
        draftId,
        workspaceId,
        authorUserId: userId,
        content: dto.content,
        parentCommentId: dto.parentCommentId || null,
      },
      include: {
        author: { select: { id: true, name: true, email: true } },
        resolvedBy: { select: { id: true, name: true } },
      },
    });

    return this.mapCommentToDto(comment);
  }

  /**
   * Retrieves all comments for a draft structured as root threads with nested replies
   */
  async getComments(workspaceId: string, draftId: string): Promise<DraftCommentDto[]> {
    const allComments = await this.prisma.draftComment.findMany({
      where: { draftId, workspaceId },
      include: {
        author: { select: { id: true, name: true, email: true } },
        resolvedBy: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    // Group into root comments and replies
    const roots: DraftCommentDto[] = [];
    const replyMap = new Map<string, DraftCommentDto[]>();

    allComments.forEach((c) => {
      const dto = this.mapCommentToDto(c);
      if (c.parentCommentId) {
        const existing = replyMap.get(c.parentCommentId) || [];
        existing.push(dto);
        replyMap.set(c.parentCommentId, existing);
      } else {
        roots.push(dto);
      }
    });

    // Attach replies to their parent
    roots.forEach((root) => {
      root.replies = replyMap.get(root.id) || [];
    });

    return roots;
  }

  /**
   * Toggles resolved status on a comment thread
   */
  async toggleResolveComment(
    workspaceId: string,
    draftId: string,
    commentId: string,
    userId: string,
  ): Promise<DraftCommentDto> {
    const comment = await this.prisma.draftComment.findFirst({
      where: { id: commentId, draftId, workspaceId },
    });

    if (!comment) {
      throw new NotFoundException(`Comment "${commentId}" not found.`);
    }

    const newResolved = !comment.isResolved;

    const updated = await this.prisma.draftComment.update({
      where: { id: commentId },
      data: {
        isResolved: newResolved,
        resolvedByUserId: newResolved ? userId : null,
        resolvedAt: newResolved ? new Date() : null,
      },
      include: {
        author: { select: { id: true, name: true, email: true } },
        resolvedBy: { select: { id: true, name: true } },
      },
    });

    return this.mapCommentToDto(updated);
  }

  /**
   * Deletes a comment (allowed by author or workspace ADMIN/OWNER)
   */
  async deleteComment(
    workspaceId: string,
    commentId: string,
    userId: string,
    userRole: WorkspaceRole,
  ): Promise<{ success: boolean }> {
    const comment = await this.prisma.draftComment.findFirst({
      where: { id: commentId, workspaceId },
    });

    if (!comment) {
      throw new NotFoundException(`Comment "${commentId}" not found.`);
    }

    const isAuthor = comment.authorUserId === userId;
    const isAdmin = userRole === WorkspaceRole.ADMIN || userRole === WorkspaceRole.OWNER;

    if (!isAuthor && !isAdmin) {
      throw new ForbiddenException('You do not have permission to delete this comment.');
    }

    await this.prisma.draftComment.delete({
      where: { id: commentId },
    });

    return { success: true };
  }

  private mapCommentToDto(c: any): DraftCommentDto {
    return {
      id: c.id,
      draftId: c.draftId,
      workspaceId: c.workspaceId,
      authorUserId: c.authorUserId,
      authorName: c.author?.name || 'Workspace Member',
      authorEmail: c.author?.email || '',
      content: c.content,
      parentCommentId: c.parentCommentId,
      isResolved: c.isResolved,
      resolvedByUserId: c.resolvedByUserId,
      resolvedByName: c.resolvedBy?.name || null,
      resolvedAt: c.resolvedAt ? c.resolvedAt.toISOString() : null,
      replies: [],
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
    };
  }
}
