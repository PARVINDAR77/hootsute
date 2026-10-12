export interface EmailTemplatePayload {
  subject: string;
  html: string;
  text: string;
}

function baseLayout(title: string, bodyContent: string, footerNote?: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #0f172a;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #f8fafc;
      -webkit-font-smoothing: antialiased;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 40px 20px;
    }
    .card {
      background-color: #1e293b;
      border: 1px solid #334155;
      border-radius: 12px;
      padding: 32px;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3);
    }
    .header {
      display: flex;
      align-items: center;
      margin-bottom: 24px;
      padding-bottom: 20px;
      border-bottom: 1px solid #334155;
    }
    .brand {
      font-size: 20px;
      font-weight: 700;
      color: #6366f1;
      letter-spacing: -0.5px;
    }
    .title {
      font-size: 22px;
      font-weight: 700;
      color: #ffffff;
      margin-top: 0;
      margin-bottom: 16px;
      line-height: 1.3;
    }
    .content {
      font-size: 15px;
      line-height: 1.6;
      color: #cbd5e1;
    }
    .btn {
      display: inline-block;
      background-color: #4f46e5;
      color: #ffffff !important;
      font-weight: 600;
      font-size: 15px;
      padding: 12px 28px;
      border-radius: 8px;
      text-decoration: none;
      margin: 24px 0;
      text-align: center;
    }
    .btn:hover {
      background-color: #4338ca;
    }
    .metric-badge {
      display: inline-block;
      padding: 6px 12px;
      background-color: #0f172a;
      border: 1px solid #334155;
      border-radius: 6px;
      font-size: 13px;
      color: #a5b4fc;
      margin-right: 8px;
      margin-bottom: 8px;
    }
    .footer {
      text-align: center;
      margin-top: 32px;
      font-size: 12px;
      color: #64748b;
      line-height: 1.5;
    }
    .footer a {
      color: #818cf8;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="header">
        <span class="brand">OmniSocial AI</span>
      </div>
      <div class="content">
        ${bodyContent}
      </div>
    </div>
    <div class="footer">
      ${footerNote || 'This is an automated notification from OmniSocial AI platform. Please do not reply directly to this email.'}<br>
      &copy; ${new Date().getFullYear()} OmniSocial AI. All rights reserved.
    </div>
  </div>
</body>
</html>`;
}

export function renderInvitationTemplate(data: {
  workspaceName: string;
  inviterName: string;
  role: string;
  acceptUrl: string;
  expiresAt: Date | string;
}): EmailTemplatePayload {
  const expiresStr =
    data.expiresAt instanceof Date
      ? data.expiresAt.toLocaleDateString()
      : new Date(data.expiresAt).toLocaleDateString();

  const subject = `You've been invited to join ${data.workspaceName} on OmniSocial AI`;

  const html = baseLayout(
    subject,
    `
    <h2 class="title">You're invited to collaborate!</h2>
    <p><strong>${data.inviterName}</strong> has invited you to join the <strong>${data.workspaceName}</strong> workspace as a <strong>${data.role}</strong>.</p>
    <p>Join the team to create content, schedule posts across social networks, and monitor audience engagement in one unified command center.</p>
    <div style="text-align: center;">
      <a href="${data.acceptUrl}" class="btn">Accept Invitation</a>
    </div>
    <p style="font-size: 13px; color: #94a3b8;">This invitation link will expire on <strong>${expiresStr}</strong>. If you did not expect this invitation, you can safely ignore this email.</p>
    `,
    `Sent on behalf of ${data.workspaceName}.`,
  );

  const text = `You've been invited to join ${data.workspaceName} on OmniSocial AI by ${data.inviterName} as ${data.role}.\n\nAccept your invitation: ${data.acceptUrl}\n(Expires on ${expiresStr})`;

  return { subject, html, text };
}

export function renderExecutiveReportTemplate(data: {
  workspaceName: string;
  reportTitle: string;
  periodText: string;
  reportUrl: string;
  agencyName?: string;
  metrics?: {
    totalImpressions?: number;
    totalReach?: number;
    netFollowerGrowth?: number;
    avgEngagementRate?: number;
  };
}): EmailTemplatePayload {
  const brand = data.agencyName || data.workspaceName;
  const subject = `Executive Performance Report: ${data.reportTitle} (${data.periodText})`;

  const metricsHtml = data.metrics
    ? `
    <div style="margin: 20px 0; background: #0f172a; border: 1px solid #334155; border-radius: 8px; padding: 16px;">
      <h4 style="margin: 0 0 12px 0; font-size: 14px; text-transform: uppercase; color: #94a3b8; letter-spacing: 0.5px;">Performance Highlights</h4>
      <div style="display: flex; flex-wrap: wrap;">
        <span class="metric-badge">Impressions: <strong>${(data.metrics.totalImpressions || 0).toLocaleString()}</strong></span>
        <span class="metric-badge">Total Reach: <strong>${(data.metrics.totalReach || 0).toLocaleString()}</strong></span>
        <span class="metric-badge">Net Growth: <strong>+${(data.metrics.netFollowerGrowth || 0).toLocaleString()}</strong></span>
        <span class="metric-badge">Avg Engagement: <strong>${(data.metrics.avgEngagementRate || 0).toFixed(2)}%</strong></span>
      </div>
    </div>`
    : '';

  const html = baseLayout(
    subject,
    `
    <h2 class="title">Social Media Executive Performance Report</h2>
    <p>Your scheduled executive social media intelligence report for <strong>${data.workspaceName}</strong> covering <strong>${data.periodText}</strong> is ready for review.</p>
    ${metricsHtml}
    <p>Access the interactive interactive visual report, platform breakdowns, and top-performing campaign telemetry:</p>
    <div style="text-align: center;">
      <a href="${data.reportUrl}" class="btn">View Executive Report</a>
    </div>
    `,
    `Generated by ${brand} Analytics Engine.`,
  );

  const text = `Executive Performance Report: ${data.reportTitle}\nPeriod: ${data.periodText}\nWorkspace: ${data.workspaceName}\n\nView complete interactive report: ${data.reportUrl}`;

  return { subject, html, text };
}

export function renderApprovalNotificationTemplate(data: {
  workspaceName: string;
  draftTitle: string;
  requestedBy: string;
  stepRole: string;
  reviewUrl: string;
}): EmailTemplatePayload {
  const subject = `Action Required: Content draft awaits your approval (${data.workspaceName})`;

  const html = baseLayout(
    subject,
    `
    <h2 class="title">Content Draft Ready for Review</h2>
    <p><strong>${data.requestedBy}</strong> has submitted a new content draft for review in <strong>${data.workspaceName}</strong>.</p>
    <p>This draft requires sign-off from a team member with the <strong>${data.stepRole}</strong> role before it can be scheduled for publication.</p>
    <div style="background: #0f172a; padding: 14px; border-radius: 8px; border-left: 4px solid #6366f1; margin: 16px 0;">
      <strong style="color: #ffffff;">Draft:</strong> "${data.draftTitle}"
    </div>
    <div style="text-align: center;">
      <a href="${data.reviewUrl}" class="btn">Review and Approve</a>
    </div>
    `,
  );

  const text = `Action Required: Review draft "${data.draftTitle}" in ${data.workspaceName}.\nSubmitted by: ${data.requestedBy}\nReview URL: ${data.reviewUrl}`;

  return { subject, html, text };
}

export function renderApprovalDecisionTemplate(data: {
  workspaceName: string;
  draftTitle: string;
  decision: 'APPROVED' | 'CHANGES_REQUESTED';
  reviewerName: string;
  notes?: string;
  draftUrl: string;
}): EmailTemplatePayload {
  const isApproved = data.decision === 'APPROVED';
  const subject = isApproved
    ? `Draft Approved: "${data.draftTitle}" is ready to publish`
    : `Changes Requested on "${data.draftTitle}" (${data.workspaceName})`;

  const badgeColor = isApproved ? '#10b981' : '#f59e0b';
  const statusText = isApproved ? 'APPROVED' : 'CHANGES REQUESTED';

  const notesHtml = data.notes
    ? `
    <div style="background: #0f172a; padding: 14px; border-radius: 8px; border-left: 4px solid ${badgeColor}; margin: 16px 0;">
      <strong style="color: #ffffff;">Reviewer Notes from ${data.reviewerName}:</strong>
      <p style="margin: 8px 0 0 0; color: #cbd5e1; font-style: italic;">"${data.notes}"</p>
    </div>`
    : '';

  const html = baseLayout(
    subject,
    `
    <h2 class="title">Review Decision Update</h2>
    <p>Your content draft <strong>"${data.draftTitle}"</strong> in <strong>${data.workspaceName}</strong> has been reviewed by <strong>${data.reviewerName}</strong>.</p>
    <div style="margin: 12px 0;">
      <span style="background: ${badgeColor}; color: #000; font-weight: 700; padding: 4px 10px; border-radius: 4px; font-size: 13px;">${statusText}</span>
    </div>
    ${notesHtml}
    <div style="text-align: center;">
      <a href="${data.draftUrl}" class="btn">Open Draft Details</a>
    </div>
    `,
  );

  const text = `Draft Decision: ${statusText}\nDraft: "${data.draftTitle}"\nReviewer: ${data.reviewerName}\nNotes: ${data.notes || 'None'}\nURL: ${data.draftUrl}`;

  return { subject, html, text };
}

export function renderWebhookFailureTemplate(data: {
  workspaceName: string;
  subscriptionName: string;
  targetUrl: string;
  failureCount: number;
  lastErrorMessage?: string;
  settingsUrl: string;
}): EmailTemplatePayload {
  const subject = `Alert: Outbound Webhook Delivery Failures for ${data.subscriptionName}`;

  const html = baseLayout(
    subject,
    `
    <h2 class="title" style="color: #ef4444;">Webhook Delivery Failures Alert</h2>
    <p>Your outbound webhook endpoint <strong>${data.subscriptionName}</strong> in <strong>${data.workspaceName}</strong> has failed <strong>${data.failureCount}</strong> consecutive delivery attempts.</p>
    <div style="background: #0f172a; padding: 14px; border-radius: 8px; border-left: 4px solid #ef4444; margin: 16px 0; font-family: monospace; font-size: 13px;">
      <div><strong>Target:</strong> ${data.targetUrl}</div>
      <div style="margin-top: 6px; color: #fca5a5;"><strong>Error:</strong> ${data.lastErrorMessage || 'HTTP 5xx Server Error / Connection Timeout'}</div>
    </div>
    <p>Please inspect your endpoint server logs or review the delivery stream in OmniSocial settings.</p>
    <div style="text-align: center;">
      <a href="${data.settingsUrl}" class="btn">Inspect Delivery Stream</a>
    </div>
    `,
  );

  const text = `Alert: Webhook ${data.subscriptionName} in ${data.workspaceName} failed ${data.failureCount} attempts.\nTarget: ${data.targetUrl}\nError: ${data.lastErrorMessage || 'Unknown'}\nInspect: ${data.settingsUrl}`;

  return { subject, html, text };
}
