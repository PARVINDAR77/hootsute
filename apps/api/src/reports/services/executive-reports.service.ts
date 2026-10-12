import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateReportScheduleDto } from '../dto/create-report-schedule.dto';
import { UpdateReportScheduleDto } from '../dto/update-report-schedule.dto';
import { GenerateReportDto } from '../dto/generate-report.dto';
import {
  ExecutiveReportScheduleDto,
  GeneratedExecutiveReportDto,
  ExecutiveReportSummaryDto,
  ReportFrequency,
} from '@packages/shared';

@Injectable()
export class ExecutiveReportsService {
  constructor(private readonly prisma: PrismaService) {}

  // ----------------------------------------------------
  // Schedule Management
  // ----------------------------------------------------

  async createSchedule(
    workspaceId: string,
    userId: string,
    dto: CreateReportScheduleDto,
  ): Promise<ExecutiveReportScheduleDto> {
    const schedule = await this.prisma.executiveReportSchedule.create({
      data: {
        workspaceId,
        createdById: userId,
        name: dto.name,
        frequency: dto.frequency as any,
        recipients: dto.recipients,
        includeSocial: dto.includeSocial ?? true,
        includeLinks: dto.includeLinks ?? true,
        includeListening: dto.includeListening ?? true,
        isActive: dto.isActive ?? true,
        nextRunAt: this.calculateNextRun(dto.frequency as any),
      },
    });

    return this.mapScheduleToDto(schedule);
  }

  async getSchedules(workspaceId: string): Promise<ExecutiveReportScheduleDto[]> {
    const schedules = await this.prisma.executiveReportSchedule.findMany({
      where: { workspaceId },
      orderBy: { createdAt: 'desc' },
    });

    return schedules.map((s) => this.mapScheduleToDto(s));
  }

  async getScheduleById(
    workspaceId: string,
    scheduleId: string,
  ): Promise<ExecutiveReportScheduleDto> {
    const schedule = await this.prisma.executiveReportSchedule.findFirst({
      where: { id: scheduleId, workspaceId },
    });

    if (!schedule) {
      throw new NotFoundException(`Schedule ${scheduleId} not found`);
    }

    return this.mapScheduleToDto(schedule);
  }

  async updateSchedule(
    workspaceId: string,
    scheduleId: string,
    dto: UpdateReportScheduleDto,
  ): Promise<ExecutiveReportScheduleDto> {
    await this.getScheduleById(workspaceId, scheduleId);

    const updated = await this.prisma.executiveReportSchedule.update({
      where: { id: scheduleId },
      data: {
        name: dto.name,
        frequency: dto.frequency as any,
        recipients: dto.recipients,
        includeSocial: dto.includeSocial,
        includeLinks: dto.includeLinks,
        includeListening: dto.includeListening,
        isActive: dto.isActive,
      },
    });

    return this.mapScheduleToDto(updated);
  }

  async deleteSchedule(workspaceId: string, scheduleId: string): Promise<{ success: boolean }> {
    await this.getScheduleById(workspaceId, scheduleId);

    await this.prisma.executiveReportSchedule.delete({
      where: { id: scheduleId },
    });

    return { success: true };
  }

  // ----------------------------------------------------
  // Report Generation & Synthesis
  // ----------------------------------------------------

  async generateReport(
    workspaceId: string,
    dto: GenerateReportDto,
  ): Promise<GeneratedExecutiveReportDto> {
    const workspace = await this.prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: {
        whiteLabelConfig: true,
      },
    });

    if (!workspace) {
      throw new NotFoundException(`Workspace ${workspaceId} not found`);
    }

    const periodDays = dto.periodDays && dto.periodDays > 0 ? dto.periodDays : 7;
    const periodEnd = new Date();
    const periodStart = new Date(periodEnd.getTime() - periodDays * 24 * 60 * 60 * 1000);

    const includeSocial = dto.includeSocial ?? true;
    const includeLinks = dto.includeLinks ?? true;
    const includeListening = dto.includeListening ?? true;

    // 1. Social analytics aggregation
    let totalImpressions = 0;
    let totalReach = 0;
    let netFollowerGrowth = 0;
    const topPosts: {
      id: string;
      content: string;
      platform: string;
      impressions: number;
      engagement: number;
    }[] = [];

    if (includeSocial) {
      const snapshots = await this.prisma.accountAnalyticsSnapshot.findMany({
        where: {
          workspaceId,
          snapshotDate: { gte: periodStart, lte: periodEnd },
        },
      });

      for (const snap of snapshots) {
        totalImpressions += snap.impressions || 0;
        totalReach += snap.reach || 0;
        netFollowerGrowth += snap.followersNetChange || 0;
      }

      const postSnapshots = await this.prisma.postAnalyticsSnapshot.findMany({
        where: {
          workspaceId,
          snapshotDate: { gte: periodStart, lte: periodEnd },
        },
        include: {
          scheduledPostTarget: {
            include: {
              scheduledPost: {
                include: {
                  draft: true,
                },
              },
            },
          },
        },
        orderBy: { impressions: 'desc' },
        take: 5,
      });

      for (const postSnap of postSnapshots) {
        const snapshotJson = postSnap.scheduledPostTarget?.scheduledPost?.contentSnapshot as any;
        const draftTitle = postSnap.scheduledPostTarget?.scheduledPost?.draft?.title;
        const content =
          snapshotJson?.baseText?.slice(0, 120) ||
          draftTitle ||
          `Post #${postSnap.externalPostId.slice(0, 10)}`;
        const engagement =
          (postSnap.likesCount || 0) +
          (postSnap.commentsCount || 0) +
          (postSnap.sharesCount || 0);

        topPosts.push({
          id: postSnap.scheduledPostTarget?.scheduledPostId || postSnap.id,
          content,
          platform: postSnap.platform,
          impressions: postSnap.impressions || 0,
          engagement,
        });
      }
    }

    // 2. Link tracking aggregation
    let totalLinkClicks = 0;
    if (includeLinks) {
      const clickCount = await this.prisma.linkClickEvent.count({
        where: {
          shortenedLink: { workspaceId },
          clickedAt: { gte: periodStart, lte: periodEnd },
        },
      });
      totalLinkClicks = clickCount;
    }

    // 3. Social listening & sentiment aggregation
    let totalListeningMentions = 0;
    let sentimentBreakdown = { positive: 0, neutral: 0, negative: 0 };

    if (includeListening) {
      const mentions = await this.prisma.listeningMention.findMany({
        where: {
          workspaceId,
          publishedAt: { gte: periodStart, lte: periodEnd },
        },
        select: { sentiment: true },
      });

      totalListeningMentions = mentions.length;
      for (const m of mentions) {
        if (m.sentiment === 'POSITIVE') sentimentBreakdown.positive++;
        else if (m.sentiment === 'NEGATIVE') sentimentBreakdown.negative++;
        else sentimentBreakdown.neutral++;
      }
    }

    const metricsSummary: ExecutiveReportSummaryDto = {
      totalImpressions,
      totalReach,
      netFollowerGrowth,
      totalLinkClicks,
      totalListeningMentions,
      sentimentBreakdown,
      topPosts,
    };

    // Branding tokens
    const brandName = workspace.whiteLabelConfig?.brandName || workspace.name;
    const logoUrl = workspace.whiteLabelConfig?.logoUrl || workspace.logoUrl;
    const primaryColor = workspace.whiteLabelConfig?.primaryColor || '#6366f1';
    const secondaryColor = workspace.whiteLabelConfig?.secondaryColor || '#4f46e5';
    const accentColor = workspace.whiteLabelConfig?.accentColor || '#06b6d4';
    const hidePoweredBy = workspace.whiteLabelConfig?.hidePoweredBy ?? false;

    const reportTitle =
      dto.title ||
      `${brandName} Executive Performance Review (${periodStart.toLocaleDateString()} - ${periodEnd.toLocaleDateString()})`;

    // Generate HTML synthesis
    const htmlContent = this.generateExecutiveHtml({
      title: reportTitle,
      brandName,
      logoUrl,
      primaryColor,
      secondaryColor,
      accentColor,
      hidePoweredBy,
      periodStart,
      periodEnd,
      summary: metricsSummary,
    });

    const generated = await this.prisma.generatedExecutiveReport.create({
      data: {
        workspaceId,
        scheduleId: dto.scheduleId || null,
        title: reportTitle,
        frequency: dto.scheduleId ? 'WEEKLY' : 'ON_DEMAND',
        periodStart,
        periodEnd,
        metricsSummary: metricsSummary as any,
        htmlContent,
        recipientsSent: dto.recipients || [],
        sentAt: dto.recipients && dto.recipients.length > 0 ? new Date() : null,
        status: 'READY',
      },
    });

    // Update schedule's last run timestamp if applicable
    if (dto.scheduleId) {
      await this.prisma.executiveReportSchedule.update({
        where: { id: dto.scheduleId },
        data: {
          lastRunAt: new Date(),
          nextRunAt: this.calculateNextRun('WEEKLY'),
        },
      });
    }

    return this.mapReportToDto(generated);
  }

  async getGeneratedReports(workspaceId: string): Promise<GeneratedExecutiveReportDto[]> {
    const reports = await this.prisma.generatedExecutiveReport.findMany({
      where: { workspaceId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return reports.map((r) => this.mapReportToDto(r));
  }

  async getGeneratedReportById(
    workspaceId: string,
    id: string,
  ): Promise<GeneratedExecutiveReportDto> {
    const report = await this.prisma.generatedExecutiveReport.findFirst({
      where: { id, workspaceId },
    });

    if (!report) {
      throw new NotFoundException(`Report ${id} not found`);
    }

    return this.mapReportToDto(report);
  }

  async deleteGeneratedReport(
    workspaceId: string,
    id: string,
  ): Promise<{ success: boolean }> {
    await this.getGeneratedReportById(workspaceId, id);

    await this.prisma.generatedExecutiveReport.delete({
      where: { id },
    });

    return { success: true };
  }

  // ----------------------------------------------------
  // HTML Synthesis Engine
  // ----------------------------------------------------

  private generateExecutiveHtml(params: {
    title: string;
    brandName: string;
    logoUrl?: string | null;
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
    hidePoweredBy: boolean;
    periodStart: Date;
    periodEnd: Date;
    summary: ExecutiveReportSummaryDto;
  }): string {
    const {
      title,
      brandName,
      logoUrl,
      primaryColor,
      secondaryColor,
      accentColor,
      hidePoweredBy,
      periodStart,
      periodEnd,
      summary,
    } = params;

    const sentimentTotal =
      summary.sentimentBreakdown.positive +
      summary.sentimentBreakdown.neutral +
      summary.sentimentBreakdown.negative;

    const posPct = sentimentTotal
      ? Math.round((summary.sentimentBreakdown.positive / sentimentTotal) * 100)
      : 0;
    const neuPct = sentimentTotal
      ? Math.round((summary.sentimentBreakdown.neutral / sentimentTotal) * 100)
      : 0;
    const negPct = sentimentTotal
      ? Math.round((summary.sentimentBreakdown.negative / sentimentTotal) * 100)
      : 0;

    const topPostsRows =
      summary.topPosts.length > 0
        ? summary.topPosts
            .map(
              (p) => `
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-weight: 500;">${p.platform}</td>
            <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; color: #334155;">${p.content}</td>
            <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: 600;">${p.impressions.toLocaleString()}</td>
            <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: 600;">${p.engagement.toLocaleString()}</td>
          </tr>`,
            )
            .join('')
        : `<tr><td colspan="4" style="padding: 20px; text-align: center; color: #64748b;">No published post snapshots recorded in this period.</td></tr>`;

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      margin: 0;
      padding: 32px;
      background-color: #f8fafc;
      color: #0f172a;
    }
    .report-container {
      max-width: 900px;
      margin: 0 auto;
      background: #ffffff;
      border-radius: 16px;
      border: 1px solid #e2e8f0;
      overflow: hidden;
      box-shadow: 0 4px 20px -2px rgba(0, 0, 0, 0.05);
    }
    .header {
      background: linear-gradient(135deg, ${primaryColor}, ${secondaryColor});
      color: #ffffff;
      padding: 36px 40px;
    }
    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .brand-title {
      font-size: 26px;
      font-weight: 700;
      letter-spacing: -0.02em;
      margin: 0 0 8px 0;
    }
    .report-date {
      font-size: 14px;
      opacity: 0.9;
    }
    .brand-logo {
      max-height: 48px;
      max-width: 140px;
      object-fit: contain;
      background: rgba(255,255,255,0.15);
      padding: 6px 12px;
      border-radius: 8px;
    }
    .content-body {
      padding: 40px;
    }
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
      margin-bottom: 36px;
    }
    .kpi-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 20px;
      text-align: center;
    }
    .kpi-val {
      font-size: 28px;
      font-weight: 700;
      color: ${primaryColor};
      margin: 6px 0 0 0;
    }
    .kpi-lbl {
      font-size: 12px;
      text-transform: uppercase;
      font-weight: 600;
      color: #64748b;
      letter-spacing: 0.05em;
    }
    .section-title {
      font-size: 18px;
      font-weight: 600;
      margin: 28px 0 16px 0;
      display: flex;
      align-items: center;
      gap: 8px;
      border-bottom: 2px solid #f1f5f9;
      padding-bottom: 8px;
    }
    .sentiment-bar-wrap {
      display: flex;
      height: 24px;
      border-radius: 999px;
      overflow: hidden;
      margin: 16px 0;
    }
    .sentiment-pos { background: #10b981; width: ${posPct}%; }
    .sentiment-neu { background: #94a3b8; width: ${neuPct}%; }
    .sentiment-neg { background: #ef4444; width: ${negPct}%; }
    .sentiment-legend {
      display: flex;
      gap: 20px;
      font-size: 13px;
      color: #475569;
    }
    .table-wrap {
      width: 100%;
      border-collapse: collapse;
      font-size: 14px;
      margin-top: 12px;
    }
    .table-wrap th {
      background: #f1f5f9;
      padding: 10px;
      text-align: left;
      font-weight: 600;
      color: #334155;
    }
    .footer {
      padding: 24px 40px;
      background: #f8fafc;
      border-top: 1px solid #e2e8f0;
      text-align: center;
      font-size: 12px;
      color: #64748b;
    }
  </style>
</head>
<body>
  <div class="report-container">
    <div class="header">
      <div class="header-content">
        <div>
          <h1 class="brand-title">${brandName}</h1>
          <div class="report-date">Executive Performance Review: ${periodStart.toLocaleDateString()} &ndash; ${periodEnd.toLocaleDateString()}</div>
        </div>
        ${logoUrl ? `<img class="brand-logo" src="${logoUrl}" alt="${brandName}" />` : ''}
      </div>
    </div>

    <div class="content-body">
      <div class="kpi-grid">
        <div class="kpi-card">
          <div class="kpi-lbl">Impressions</div>
          <div class="kpi-val">${summary.totalImpressions.toLocaleString()}</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-lbl">Total Reach</div>
          <div class="kpi-val">${summary.totalReach.toLocaleString()}</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-lbl">Net Follower Growth</div>
          <div class="kpi-val" style="color: ${summary.netFollowerGrowth >= 0 ? '#10b981' : '#ef4444'};">
            ${summary.netFollowerGrowth > 0 ? '+' : ''}${summary.netFollowerGrowth.toLocaleString()}
          </div>
        </div>
        <div class="kpi-card">
          <div class="kpi-lbl">Link Clicks</div>
          <div class="kpi-val" style="color: ${accentColor};">${summary.totalLinkClicks.toLocaleString()}</div>
        </div>
      </div>

      <div class="section-title">Brand Sentiment & Voice Monitoring</div>
      <p style="font-size: 14px; color: #475569; margin: 4px 0 12px 0;">
        Synthesized across ${summary.totalListeningMentions.toLocaleString()} brand mentions captured during this review period.
      </p>
      <div class="sentiment-bar-wrap">
        <div class="sentiment-pos" title="Positive (${posPct}%)"></div>
        <div class="sentiment-neu" title="Neutral (${neuPct}%)"></div>
        <div class="sentiment-neg" title="Negative (${negPct}%)"></div>
      </div>
      <div class="sentiment-legend">
        <span><strong style="color: #10b981;">&#9679; Positive:</strong> ${summary.sentimentBreakdown.positive} (${posPct}%)</span>
        <span><strong style="color: #64748b;">&#9679; Neutral:</strong> ${summary.sentimentBreakdown.neutral} (${neuPct}%)</span>
        <span><strong style="color: #ef4444;">&#9679; Negative:</strong> ${summary.sentimentBreakdown.negative} (${negPct}%)</span>
      </div>

      <div class="section-title">Top Published Content Highlights</div>
      <table class="table-wrap">
        <thead>
          <tr>
            <th style="width: 120px;">Network</th>
            <th>Content Snippet</th>
            <th style="width: 120px; text-align: right;">Impressions</th>
            <th style="width: 120px; text-align: right;">Engagements</th>
          </tr>
        </thead>
        <tbody>
          ${topPostsRows}
        </tbody>
      </table>
    </div>

    <div class="footer">
      ${!hidePoweredBy ? `Generated via Omnichannel Intelligence Suite &bull; Confirmed delivery by Agency Portal` : `Confidential &bull; Prepared exclusively for ${brandName}`}
    </div>
  </div>
</body>
</html>`;
  }

  private calculateNextRun(frequency: string): Date {
    const next = new Date();
    if (frequency === 'MONTHLY') {
      next.setDate(next.getDate() + 30);
    } else {
      next.setDate(next.getDate() + 7);
    }
    return next;
  }

  private mapScheduleToDto(raw: any): ExecutiveReportScheduleDto {
    return {
      id: raw.id,
      workspaceId: raw.workspaceId,
      createdById: raw.createdById,
      name: raw.name,
      frequency: raw.frequency as ReportFrequency,
      recipients: raw.recipients,
      includeSocial: raw.includeSocial,
      includeLinks: raw.includeLinks,
      includeListening: raw.includeListening,
      isActive: raw.isActive,
      lastRunAt: raw.lastRunAt ? raw.lastRunAt.toISOString() : null,
      nextRunAt: raw.nextRunAt ? raw.nextRunAt.toISOString() : null,
      createdAt: raw.createdAt.toISOString(),
      updatedAt: raw.updatedAt.toISOString(),
    };
  }

  private mapReportToDto(raw: any): GeneratedExecutiveReportDto {
    return {
      id: raw.id,
      workspaceId: raw.workspaceId,
      scheduleId: raw.scheduleId,
      title: raw.title,
      frequency: raw.frequency as ReportFrequency,
      periodStart: raw.periodStart.toISOString(),
      periodEnd: raw.periodEnd.toISOString(),
      metricsSummary: raw.metricsSummary,
      htmlContent: raw.htmlContent,
      pdfStorageUrl: raw.pdfStorageUrl,
      recipientsSent: raw.recipientsSent,
      sentAt: raw.sentAt ? raw.sentAt.toISOString() : null,
      status: raw.status,
      createdAt: raw.createdAt.toISOString(),
    };
  }
}
