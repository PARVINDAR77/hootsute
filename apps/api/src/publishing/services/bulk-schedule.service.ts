import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  SocialPlatform,
  SocialConnectionStatus,
  WorkspaceRole,
  DraftStatus,
  ScheduledPostStatus,
  PublishTargetStatus,
  CampaignObjective,
  ContentType,
} from '@prisma/client';
import {
  BulkScheduleRowDto,
  BulkScheduleValidationRowResult,
  BulkScheduleValidationResponse,
  BulkScheduleImportResponse,
  BulkScheduleImportItemResult,
  ScheduledPostContentSnapshot,
} from '@packages/shared';
import { parseCsvRows, normalizeHeader } from '../utils/csv-parser';
import { computeSnapshotHash } from '../utils/canonical-json';

@Injectable()
export class BulkScheduleService {
  private readonly logger = new Logger(BulkScheduleService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Generates a downloadable CSV template with standard column headers and example rows.
   */
  generateCsvTemplate(): string {
    const headers = [
      'Scheduled Date',
      'Timezone',
      'Title',
      'Caption',
      'Platforms',
      'Accounts',
      'Media URLs',
      'Hashtags',
    ];

    const sampleFutureDate1 = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 16)
      .replace('T', ' ');
    const sampleFutureDate2 = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 16)
      .replace('T', ' ');
    const sampleFutureDate3 = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 16)
      .replace('T', ' ');

    const rows = [
      headers.map((h) => `"${h}"`).join(','),
      `"${sampleFutureDate1}","UTC","Product Launch Teaser","Exciting announcement coming soon! We are revolutionizing how brands manage multi-channel social media.","FACEBOOK,LINKEDIN","","https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800","#SaaS #AI #Innovation"`,
      `"${sampleFutureDate2}","UTC","Customer Spotlight","Huge shoutout to our amazing community members for their incredible feedback and support!","INSTAGRAM,TWITTER_X","","https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800","#Community #CustomerLove"`,
      `"${sampleFutureDate3}","UTC","Industry Insight Tip","Pro Tip: Consistent scheduling and real-time engagement drive 3x higher post visibility.","TWITTER_X,LINKEDIN","","","#SocialTips #GrowthHacking"`,
    ];

    return rows.join('\r\n');
  }

  /**
   * Parses and validates a CSV content string without committing any changes to the database.
   * Performs deep pre-flight checking of dates, platform constraints, and account mappings.
   */
  async validateBulkSchedule(
    workspaceId: string,
    csvContent: string,
  ): Promise<BulkScheduleValidationResponse> {
    if (!csvContent || csvContent.trim().length === 0) {
      throw new BadRequestException('CSV content cannot be empty');
    }

    const rawRows = parseCsvRows(csvContent);

    if (rawRows.length < 2) {
      throw new BadRequestException(
        'CSV file must contain a header row and at least one post row',
      );
    }

    const rawHeaders = rawRows[0];
    const headerMap = this.mapHeaderColumns(rawHeaders);

    if (!headerMap.has('caption')) {
      throw new BadRequestException(
        'Missing required column in CSV header: "Caption" or "Content"',
      );
    }
    if (!headerMap.has('date')) {
      throw new BadRequestException(
        'Missing required column in CSV header: "Scheduled Date" or "Date"',
      );
    }

    // Retrieve active social accounts in workspace for handle/ID resolution
    const connectedAccounts = await this.prisma.socialAccount.findMany({
      where: {
        workspaceId,
        connectionStatus: SocialConnectionStatus.CONNECTED,
      },
    });

    const validationRows: BulkScheduleValidationRowResult[] = [];
    const now = new Date();

    for (let r = 1; r < rawRows.length; r++) {
      const row = rawRows[r];
      const rowNumber = r + 1; // 1-indexed for user visibility
      const errors: string[] = [];
      const warnings: string[] = [];

      const rawDate = this.getFieldValue(row, headerMap.get('date') ?? -1);
      const rawTimezone = this.getFieldValue(row, headerMap.get('timezone') ?? -1) || 'UTC';
      const rawTitle = this.getFieldValue(row, headerMap.get('title') ?? -1);
      const rawCaption = this.getFieldValue(row, headerMap.get('caption') ?? -1);
      const rawPlatforms = this.getFieldValue(row, headerMap.get('platforms') ?? -1);
      const rawAccounts = this.getFieldValue(row, headerMap.get('accounts') ?? -1);
      const rawMedia = this.getFieldValue(row, headerMap.get('media') ?? -1);
      const rawHashtags = this.getFieldValue(row, headerMap.get('hashtags') ?? -1);

      // 1. Validate Caption
      if (!rawCaption || rawCaption.trim().length === 0) {
        errors.push('Post caption/content cannot be empty');
      }

      // 2. Validate Scheduled Date
      let scheduledAt: Date | null = null;
      if (!rawDate) {
        errors.push('Scheduled date is required');
      } else {
        const parsed = new Date(rawDate);
        if (isNaN(parsed.getTime())) {
          errors.push(`Invalid date format "${rawDate}". Use YYYY-MM-DD HH:mm or ISO 8601.`);
        } else {
          scheduledAt = parsed;
          // Must be at least 2 minutes in the future
          const minFutureTime = new Date(now.getTime() + 2 * 60 * 1000);
          if (scheduledAt < minFutureTime) {
            errors.push('Scheduled time must be at least 2 minutes in the future');
          }
        }
      }

      // 3. Validate Platforms
      const platforms: SocialPlatform[] = [];
      if (rawPlatforms) {
        const parts = rawPlatforms.split(/[,|;]/).map((p) => p.trim().toUpperCase());
        for (const part of parts) {
          const matched = this.normalizePlatform(part);
          if (matched && !platforms.includes(matched)) {
            platforms.push(matched);
          }
        }
      }

      if (platforms.length === 0) {
        errors.push('At least one valid platform is required (FACEBOOK, INSTAGRAM, LINKEDIN, TWITTER_X)');
      }

      // 4. Validate Hashtags
      const hashtags: string[] = [];
      if (rawHashtags) {
        const tags = rawHashtags
          .split(/[\s,]+/)
          .map((t) => t.trim())
          .filter((t) => t.length > 0)
          .map((t) => (t.startsWith('#') ? t : `#${t}`));
        hashtags.push(...tags);
      }

      // 5. Validate Media URLs
      const mediaUrls: string[] = [];
      if (rawMedia) {
        const urls = rawMedia
          .split(/[,|;]/)
          .map((u) => u.trim())
          .filter((u) => u.length > 0);
        for (const url of urls) {
          if (!url.startsWith('http://') && !url.startsWith('https://')) {
            warnings.push(`Media URL "${url}" should start with https://`);
          }
          mediaUrls.push(url);
        }
      }

      // 6. Platform-Specific Character Length Constraints
      const fullText = hashtags.length > 0 ? `${rawCaption}\n\n${hashtags.join(' ')}` : rawCaption;

      if (platforms.includes(SocialPlatform.TWITTER_X) && fullText.length > 280) {
        errors.push(`Twitter / X post exceeds 280 characters limit (${fullText.length} characters)`);
      }
      if (platforms.includes(SocialPlatform.INSTAGRAM) && fullText.length > 2200) {
        errors.push(`Instagram caption exceeds 2,200 characters limit (${fullText.length} characters)`);
      }
      if (platforms.includes(SocialPlatform.LINKEDIN) && fullText.length > 3000) {
        errors.push(`LinkedIn post exceeds 3,000 characters limit (${fullText.length} characters)`);
      }

      // 7. Resolve Target Accounts
      const targetAccounts: {
        id: string;
        name: string;
        platform: SocialPlatform;
        username?: string | null;
      }[] = [];

      const resolvedAccountIds: string[] = [];

      if (rawAccounts && rawAccounts.trim().length > 0) {
        // Specific accounts provided
        const accountTokens = rawAccounts
          .split(/[,|;]/)
          .map((a) => a.trim().toLowerCase().replace(/^@/, ''))
          .filter((a) => a.length > 0);

        for (const token of accountTokens) {
          const match = connectedAccounts.find(
            (acc) =>
              acc.id.toLowerCase() === token ||
              (acc.accountUsername && acc.accountUsername.toLowerCase() === token) ||
              acc.accountName.toLowerCase() === token,
          );

          if (match) {
            const platform = this.providerToPlatform(match.provider);
            if (!resolvedAccountIds.includes(match.id)) {
              resolvedAccountIds.push(match.id);
              targetAccounts.push({
                id: match.id,
                name: match.accountName,
                platform,
                username: match.accountUsername,
              });
            }
          } else {
            errors.push(`Social account "${token}" not found among connected accounts in this workspace`);
          }
        }
      } else {
        // Auto-match all connected accounts for the requested platforms
        for (const platform of platforms) {
          const matches = connectedAccounts.filter(
            (acc) => this.providerToPlatform(acc.provider) === platform,
          );

          if (matches.length === 0) {
            errors.push(
              `No connected social account found for ${platform}. Connect an account in Settings first.`,
            );
          } else {
            for (const m of matches) {
              if (!resolvedAccountIds.includes(m.id)) {
                resolvedAccountIds.push(m.id);
                targetAccounts.push({
                  id: m.id,
                  name: m.accountName,
                  platform,
                  username: m.accountUsername,
                });
              }
            }
          }
        }
      }

      const rowDto: BulkScheduleRowDto = {
        rowNumber,
        scheduledAt: scheduledAt ? scheduledAt.toISOString() : rawDate,
        timezone: rawTimezone,
        title: rawTitle || undefined,
        caption: rawCaption,
        platforms: platforms as any,
        socialAccountIds: resolvedAccountIds,
        mediaUrls,
        hashtags,
      };

      validationRows.push({
        rowNumber,
        isValid: errors.length === 0,
        errors,
        warnings,
        data: rowDto,
        targetAccounts: targetAccounts as any,
      });
    }

    const validCount = validationRows.filter((r) => r.isValid).length;
    const invalidCount = validationRows.filter((r) => !r.isValid).length;

    return {
      totalRows: validationRows.length,
      validCount,
      invalidCount,
      rows: validationRows,
    };
  }

  /**
   * Commits validated rows directly into ContentDrafts, ScheduledPosts, and Targets.
   * Transactionally isolates failures per post while returning structured batch results.
   */
  async importBulkSchedule(
    workspaceId: string,
    userId: string,
    userRole: WorkspaceRole,
    rows: BulkScheduleRowDto[],
  ): Promise<BulkScheduleImportResponse> {
    if (userRole === WorkspaceRole.VIEWER) {
      throw new ForbiddenException('Viewers do not have permission to schedule social media posts');
    }

    if (!rows || rows.length === 0) {
      throw new BadRequestException('No rows provided for import');
    }

    // Verify workspace active accounts
    const connectedAccounts = await this.prisma.socialAccount.findMany({
      where: {
        workspaceId,
        connectionStatus: SocialConnectionStatus.CONNECTED,
      },
    });

    const accountMap = new Map(connectedAccounts.map((a) => [a.id, a]));

    const importedPosts: BulkScheduleImportItemResult[] = [];
    const importErrors: { rowNumber: number; error: string }[] = [];

    for (const row of rows) {
      try {
        const scheduledDate = new Date(row.scheduledAt);
        if (isNaN(scheduledDate.getTime())) {
          throw new BadRequestException(`Invalid date for row ${row.rowNumber}`);
        }

        const targetAccountIds = row.socialAccountIds || [];
        if (targetAccountIds.length === 0) {
          throw new BadRequestException(`Row ${row.rowNumber} has no target social accounts`);
        }

        // Validate account ownership
        for (const accId of targetAccountIds) {
          if (!accountMap.has(accId)) {
            throw new BadRequestException(
              `Social account [${accId}] is not active in this workspace`,
            );
          }
        }

        const title = row.title || `Bulk Post #${row.rowNumber} (${row.platforms.join(', ')})`;

        // Create ContentDraft with APPROVED status
        const draft = await this.prisma.contentDraft.create({
          data: {
            workspaceId,
            createdByUserId: userId,
            title,
            objective: CampaignObjective.ENGAGEMENT,
            contentType: ContentType.POST,
            status: DraftStatus.APPROVED,
            approvedAt: new Date(),
            approvedByUserId: userId,
            variants: {
              create: row.platforms.map((platform) => ({
                platform,
                body: row.caption,
                hashtags: row.hashtags || [],
                mediaAssetUrl: row.mediaUrls && row.mediaUrls.length > 0 ? row.mediaUrls[0] : null,
              })),
            },
            revisions: {
              create: {
                revisionNumber: 1,
                action: 'APPROVE',
                createdByUserId: userId,
                promptSummary: 'Bulk CSV Import',
                outputSnapshot: {
                  title,
                  caption: row.caption,
                  platforms: row.platforms,
                  hashtags: row.hashtags,
                  mediaUrls: row.mediaUrls,
                },
              },
            },
          },
          include: {
            variants: true,
          },
        });

        // Build immutable ScheduledPostContentSnapshot
        const canonicalVariants = draft.variants.map((v) => ({
          id: v.id,
          platform: v.platform as any,
          headline: v.headline || null,
          body: v.body,
          callToAction: v.callToAction || null,
          hashtags: v.hashtags || [],
          linkUrl: v.linkUrl || null,
          mediaAssetUrl: v.mediaAssetUrl || null,
          mediaAssetId: v.mediaAssetId || null,
        }));

        const contentSnapshot = {
          draftId: draft.id,
          approvedRevisionNumber: 1,
          title: draft.title,
          objective: draft.objective,
          contentType: draft.contentType,
          language: draft.language,
          variants: canonicalVariants,
          approvedAt: draft.approvedAt ? draft.approvedAt.toISOString() : null,
          approvedByUserId: draft.approvedByUserId,
        };

        const snapshotHash = computeSnapshotHash(contentSnapshot);

        // Create ScheduledPost & Targets
        const scheduledPost = await this.prisma.scheduledPost.create({
          data: {
            workspaceId,
            draftId: draft.id,
            createdById: userId,
            scheduledAt: scheduledDate,
            timezone: row.timezone || 'UTC',
            status: ScheduledPostStatus.SCHEDULED,
            approvedRevisionNumber: 1,
            contentSnapshot: contentSnapshot as any,
            snapshotHash,
            targets: {
              create: targetAccountIds.map((accId) => {
                const acc = accountMap.get(accId)!;
                const platform = this.providerToPlatform(acc.provider);
                const variant =
                  draft.variants.find((v) => v.platform === platform) || draft.variants[0];

                return {
                  socialAccountId: acc.id,
                  platform,
                  variantId: variant.id,
                  status: PublishTargetStatus.PENDING,
                };
              }),
            },
          },
          include: {
            targets: true,
          },
        });

        importedPosts.push({
          rowNumber: row.rowNumber,
          scheduledPostId: scheduledPost.id,
          draftId: draft.id,
          title: draft.title,
          scheduledAt: scheduledPost.scheduledAt.toISOString(),
          targetCount: scheduledPost.targets.length,
        });
      } catch (err: any) {
        this.logger.error(`Error importing row #${row.rowNumber}: ${err.message}`);
        importErrors.push({
          rowNumber: row.rowNumber,
          error: err.message || 'Import failed',
        });
      }
    }

    // Write audit log
    await this.prisma.auditLog.create({
      data: {
        workspaceId,
        actorUserId: userId,
        action: 'BULK_SCHEDULE_IMPORT',
        entityType: 'ScheduledPost',
        metadata: {
          importedCount: importedPosts.length,
          failedCount: importErrors.length,
          totalSubmitted: rows.length,
        },
      },
    });

    this.logger.log(
      `Workspace [${workspaceId}] bulk imported ${importedPosts.length} post(s) successfully (${importErrors.length} failed)`,
    );

    return {
      importedCount: importedPosts.length,
      failedCount: importErrors.length,
      scheduledPosts: importedPosts,
      errors: importErrors.length > 0 ? importErrors : undefined,
    };
  }

  private mapHeaderColumns(rawHeaders: string[]): Map<string, number> {
    const map = new Map<string, number>();

    rawHeaders.forEach((h, index) => {
      const normalized = normalizeHeader(h);
      if (['scheduleddate', 'date', 'scheduledat', 'time', 'datetime', 'publishdate'].includes(normalized)) {
        map.set('date', index);
      } else if (['timezone', 'tz'].includes(normalized)) {
        map.set('timezone', index);
      } else if (['title', 'name', 'campaign', 'subject'].includes(normalized)) {
        map.set('title', index);
      } else if (['caption', 'content', 'text', 'body', 'message', 'postcontent'].includes(normalized)) {
        map.set('caption', index);
      } else if (['platforms', 'channels', 'networks', 'platform'].includes(normalized)) {
        map.set('platforms', index);
      } else if (['accounts', 'socialaccounts', 'handles', 'accountids', 'profiles'].includes(normalized)) {
        map.set('accounts', index);
      } else if (['mediaurls', 'mediaurl', 'media', 'image', 'images', 'imageurl'].includes(normalized)) {
        map.set('media', index);
      } else if (['hashtags', 'tags'].includes(normalized)) {
        map.set('hashtags', index);
      }
    });

    return map;
  }

  private getFieldValue(row: string[], colIndex: number): string {
    if (colIndex < 0 || colIndex >= row.length) return '';
    return row[colIndex] ? row[colIndex].trim() : '';
  }

  private normalizePlatform(str: string): SocialPlatform | null {
    switch (str.toUpperCase()) {
      case 'FACEBOOK':
      case 'FB':
        return SocialPlatform.FACEBOOK;
      case 'INSTAGRAM':
      case 'IG':
        return SocialPlatform.INSTAGRAM;
      case 'LINKEDIN':
      case 'LI':
        return SocialPlatform.LINKEDIN;
      case 'TWITTER':
      case 'TWITTER_X':
      case 'X':
        return SocialPlatform.TWITTER_X;
      case 'PINTEREST':
      case 'PIN':
        return SocialPlatform.PINTEREST;
      case 'YOUTUBE':
      case 'YT':
        return SocialPlatform.YOUTUBE;
      case 'TIKTOK':
      case 'TT':
        return SocialPlatform.TIKTOK;
      case 'THREADS':
        return SocialPlatform.THREADS;
      default:
        return null;
    }
  }

  private providerToPlatform(provider: string): SocialPlatform {
    switch (provider) {
      case 'META_FACEBOOK':
        return SocialPlatform.FACEBOOK;
      case 'META_INSTAGRAM':
        return SocialPlatform.INSTAGRAM;
      case 'LINKEDIN':
        return SocialPlatform.LINKEDIN;
      case 'TWITTER_X':
        return SocialPlatform.TWITTER_X;
      case 'PINTEREST':
        return SocialPlatform.PINTEREST;
      case 'YOUTUBE':
        return SocialPlatform.YOUTUBE;
      case 'TIKTOK':
        return SocialPlatform.TIKTOK;
      case 'THREADS':
        return SocialPlatform.THREADS;
      default:
        return SocialPlatform.FACEBOOK;
    }
  }
}
