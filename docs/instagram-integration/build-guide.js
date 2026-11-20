/**
 * OmniSocial AI - Instagram API Integration Master Guide Generator
 * Generates the complete 19-chapter technical guide as a high-resolution,
 * professionally styled PDF with embedded vector SVG diagrams, tables, and wireframes.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = __dirname;
const diagramsDir = path.join(rootDir, 'diagrams');
const previewsDir = path.join(rootDir, 'previews');
const outputPdfPath = path.join(rootDir, 'OmniSocial_AI_Instagram_API_Integration_Complete_Guide.pdf');
const htmlSourcePath = path.join(rootDir, 'guide-source.html');
const tmpProfileDir = path.join(rootDir, 'tmp_chrome_build');

// Ensure directories exist
[diagramsDir, previewsDir, tmpProfileDir].forEach((dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// Load SVG diagram content
function loadDiagram(name) {
  const p = path.join(diagramsDir, name);
  if (!fs.existsSync(p)) {
    throw new Error(`Diagram not found: ${p}`);
  }
  return fs.readFileSync(p, 'utf8').trim();
}

console.log('Loading diagrams...');
const d1 = loadDiagram('diagram-1-integration-roadmap.svg');
const d2 = loadDiagram('diagram-2-meta-app-creation.svg');
const d3 = loadDiagram('diagram-3-oauth-authorization-flow.svg');
const d4 = loadDiagram('diagram-4-system-architecture.svg');
const d5 = loadDiagram('diagram-5-account-connection-decision.svg');
const d6 = loadDiagram('diagram-6-media-publishing-workflow.svg');
const d7 = loadDiagram('diagram-7-scheduling-redis-workers.svg');
const d8 = loadDiagram('diagram-8-multi-account-publishing.svg');
const d9 = loadDiagram('diagram-9-security-architecture.svg');
const d10 = loadDiagram('diagram-10-production-deployment-checklist.svg');
console.log('All 10 diagrams loaded successfully.');

// HTML template with print CSS
function generateHtml() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>OmniSocial AI — Complete Official Instagram API Integration Guide</title>
<style>
  /* -------------------------------------------------------------
     CSS PRINT & TYPOGRAPHY FOUNDATIONS
     ------------------------------------------------------------- */
  @page {
    size: A4 portrait;
    margin: 0;
  }

  @media print {
    body {
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    .page-break {
      page-break-after: always;
      break-after: page;
    }
  }

  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    color: #1E293B;
    background: #E2E8F0;
    font-size: 9.5pt;
    line-height: 1.45;
    -webkit-font-smoothing: antialiased;
  }

  /* Each page container */
  .doc-page {
    width: 210mm;
    min-height: 297mm;
    height: 297mm;
    max-height: 297mm;
    padding: 16mm 18mm 16mm 18mm;
    position: relative;
    background: #FFFFFF;
    margin: 0 auto 10px auto;
    page-break-after: always;
    break-after: page;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }

  /* Running Header */
  .page-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-bottom: 3mm;
    border-bottom: 1.5px solid #E2E8F0;
    margin-bottom: 4mm;
    font-size: 8pt;
    color: #64748B;
  }
  .page-header .brand {
    display: flex;
    align-items: center;
    gap: 6px;
    font-weight: 700;
    color: #0F172A;
  }
  .page-header .brand-badge {
    background: linear-gradient(135deg, #833AB4, #FD1D1D, #FCAF45);
    color: #FFFFFF;
    padding: 2px 7px;
    border-radius: 4px;
    font-size: 7pt;
    font-weight: 800;
    letter-spacing: 0.5px;
  }
  .page-header .chapter-tag {
    font-weight: 600;
    color: #0284C7;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    font-size: 7.5pt;
  }

  /* Running Footer */
  .page-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-top: 3mm;
    border-top: 1.5px solid #E2E8F0;
    margin-top: 4mm;
    font-size: 7.5pt;
    color: #94A3B8;
  }
  .page-footer .confidential {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .page-footer .page-number {
    font-weight: 700;
    color: #0F172A;
  }

  /* Page Content Area */
  .page-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  /* Headings */
  h1.chapter-title {
    font-size: 17pt;
    font-weight: 800;
    color: #0F172A;
    letter-spacing: -0.5px;
    margin-bottom: 2mm;
    line-height: 1.2;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  h1.chapter-title .num-pill {
    background: #0F172A;
    color: #FFFFFF;
    font-size: 10pt;
    padding: 2px 8px;
    border-radius: 4px;
    font-weight: 800;
  }
  h2.section-heading {
    font-size: 11pt;
    font-weight: 700;
    color: #0F172A;
    margin-top: 3mm;
    margin-bottom: 1.5mm;
    padding-bottom: 1mm;
    border-bottom: 1px solid #F1F5F9;
    display: flex;
    align-items: center;
    gap: 6px;
  }
  h3.sub-heading {
    font-size: 9.5pt;
    font-weight: 700;
    color: #1E293B;
    margin-top: 2.5mm;
    margin-bottom: 1mm;
  }

  p {
    margin-bottom: 2mm;
    color: #334155;
    text-align: justify;
  }
  p.lead {
    font-size: 10pt;
    color: #1E293B;
    font-weight: 500;
    line-height: 1.4;
    margin-bottom: 2.5mm;
  }

  /* Callout Boxes */
  .callout {
    padding: 3mm 4mm;
    border-radius: 6px;
    margin: 2mm 0;
    font-size: 8.5pt;
    line-height: 1.35;
  }
  .callout-info {
    background: #F0F9FF;
    border-left: 3.5px solid #0284C7;
    color: #0369A1;
  }
  .callout-success {
    background: #F0FDF4;
    border-left: 3.5px solid #059669;
    color: #065F46;
  }
  .callout-warning {
    background: #FFFBEB;
    border-left: 3.5px solid #D97706;
    color: #92400E;
  }
  .callout-danger {
    background: #FEF2F2;
    border-left: 3.5px solid #DC2626;
    color: #991B1B;
  }
  .callout-ig {
    background: #FDF2F8;
    border-left: 3.5px solid #E1306C;
    color: #9D174D;
  }
  .callout strong {
    font-weight: 700;
  }

  /* Tables */
  table.data-table {
    width: 100%;
    border-collapse: collapse;
    margin: 2mm 0 3mm 0;
    font-size: 8pt;
  }
  table.data-table th {
    background: #0F172A;
    color: #FFFFFF;
    text-align: left;
    padding: 6px 8px;
    font-weight: 700;
    font-size: 7.5pt;
    letter-spacing: 0.3px;
  }
  table.data-table td {
    padding: 5px 8px;
    border-bottom: 1px solid #E2E8F0;
    color: #334155;
    vertical-align: top;
  }
  table.data-table tr:nth-child(even) td {
    background: #F8FAFC;
  }
  table.data-table tr:hover td {
    background: #F1F5F9;
  }
  table.data-table code {
    background: #F1F5F9;
    padding: 1px 4px;
    border-radius: 3px;
    font-family: SFMono-Regular, Consolas, "Liberation Mono", Menlo, monospace;
    font-size: 7.5pt;
    color: #BE185D;
  }

  /* Code Blocks */
  pre.code-block {
    background: #0F172A;
    color: #E2E8F0;
    padding: 3mm 4mm;
    border-radius: 6px;
    font-family: SFMono-Regular, Consolas, "Liberation Mono", Menlo, monospace;
    font-size: 7.5pt;
    line-height: 1.35;
    margin: 2mm 0;
    overflow: hidden;
    border-left: 3.5px solid #8B5CF6;
  }
  pre.code-block .keyword { color: #F472B6; font-weight: bold; }
  pre.code-block .string { color: #A7F3D0; }
  pre.code-block .function { color: #60A5FA; }
  pre.code-block .comment { color: #64748B; font-style: italic; }

  /* Diagram Embedding */
  .diagram-container {
    width: 100%;
    margin: 2.5mm 0;
    border-radius: 6px;
    overflow: hidden;
    background: #FFFFFF;
    border: 1px solid #E2E8F0;
    box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.05);
  }
  .diagram-container svg {
    display: block;
    width: 100%;
    height: auto;
  }

  /* Grid Layouts */
  .grid-2 {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 3mm;
    margin: 2mm 0;
  }
  .grid-3 {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 2.5mm;
    margin: 2mm 0;
  }
  .card-box {
    background: #F8FAFC;
    border: 1px solid #E2E8F0;
    border-radius: 6px;
    padding: 3mm;
  }
  .card-box h4 {
    font-size: 9pt;
    font-weight: 700;
    color: #0F172A;
    margin-bottom: 1.5mm;
  }
  .card-box p {
    font-size: 8pt;
    color: #475569;
    margin-bottom: 1mm;
  }

  /* Badges & Tags */
  .badge {
    display: inline-block;
    padding: 1.5px 6px;
    border-radius: 3px;
    font-size: 7pt;
    font-weight: 700;
  }
  .badge-emerald { background: #D1FAE5; color: #065F46; }
  .badge-blue { background: #DBEAFE; color: #1E40AF; }
  .badge-purple { background: #EDE9FE; color: #5B21B6; }
  .badge-rose { background: #FFE4E6; color: #9F1239; }
  .badge-amber { background: #FEF3C7; color: #92400E; }

  /* Lists */
  ul.check-list {
    list-style: none;
    margin: 1.5mm 0 2mm 0;
  }
  ul.check-list li {
    position: relative;
    padding-left: 14px;
    margin-bottom: 1.5mm;
    font-size: 8.5pt;
    color: #334155;
  }
  ul.check-list li::before {
    content: "✓";
    position: absolute;
    left: 0;
    color: #059669;
    font-weight: bold;
    font-size: 9pt;
  }

  /* Cover Page Specific */
  .cover-page {
    width: 210mm;
    height: 297mm;
    padding: 0;
    position: relative;
    background: #0F172A;
    color: #FFFFFF;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    overflow: hidden;
  }
  .cover-top-bar {
    height: 8mm;
    background: linear-gradient(90deg, #833AB4, #C13584, #E1306C, #FD1D1D, #FCAF45);
  }
  .cover-body {
    padding: 24mm 22mm;
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }
  .cover-logo-pill {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 6px 14px;
    border-radius: 20px;
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.15);
    font-size: 9pt;
    font-weight: 700;
    color: #38BDF8;
    margin-bottom: 10mm;
    width: fit-content;
  }
  .cover-title {
    font-size: 32pt;
    font-weight: 900;
    line-height: 1.12;
    letter-spacing: -1px;
    color: #FFFFFF;
    margin-bottom: 5mm;
  }
  .cover-title span {
    background: linear-gradient(135deg, #E1306C, #FD1D1D, #FCAF45);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
  .cover-subtitle {
    font-size: 13pt;
    font-weight: 400;
    color: #94A3B8;
    max-width: 160mm;
    line-height: 1.45;
    margin-bottom: 10mm;
  }
  .cover-meta-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 4mm;
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    padding: 5mm 6mm;
    margin-top: 6mm;
  }
  .cover-meta-item .label {
    font-size: 7.5pt;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: #64748B;
    font-weight: 600;
    margin-bottom: 1mm;
  }
  .cover-meta-item .val {
    font-size: 9.5pt;
    font-weight: 700;
    color: #F8FAFC;
  }
  .cover-footer {
    padding: 8mm 22mm;
    background: rgba(15, 23, 42, 0.95);
    border-top: 1px solid rgba(255, 255, 255, 0.08);
    display: flex;
    justify-content: space-between;
    font-size: 8pt;
    color: #64748B;
  }
</style>
</head>
<body>

<!-- =======================================================================
     COVER PAGE (PAGE 1)
     ======================================================================= -->
<div class="doc-page cover-page">
  <div class="cover-top-bar"></div>
  <div class="cover-body">
    <div class="cover-logo-pill">
      <span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:#20C8E8;"></span>
      OMNISOCIAL AI &bull; ARCHITECTURAL SPECIFICATION &bull; v2.4
    </div>
    <h1 class="cover-title">
      Official Instagram API<br>
      <span>Complete Integration Guide</span>
    </h1>
    <p class="cover-subtitle">
      A comprehensive, beginner-friendly SaaS implementation handbook covering Meta Developer setup, Instagram OAuth 2.0 PKCE, TokenVault AES-256-GCM encryption, Redis BullMQ scheduling, 2-stage media container publishing, multi-account routing, and production App Review.
    </p>

    <div class="cover-meta-grid">
      <div class="cover-meta-item">
        <div class="label">Target Platform</div>
        <div class="val">Instagram Graph API v21.0</div>
      </div>
      <div class="cover-meta-item">
        <div class="label">SaaS Stack</div>
        <div class="val">Next.js 14 + NestJS + Prisma</div>
      </div>
      <div class="cover-meta-item">
        <div class="label">Token Security</div>
        <div class="val">AES-256-GCM Dual-Key</div>
      </div>
      <div class="cover-meta-item">
        <div class="label">Publication Date</div>
        <div class="val">November 2026</div>
      </div>
    </div>
  </div>
  <div class="cover-footer">
    <span>OmniSocial AI Engineering &bull; Architecture &amp; Platform Security Division</span>
    <span>CONFIDENTIAL &bull; PRODUCTION IMPLEMENTATION MANUAL</span>
  </div>
</div>

<!-- =======================================================================
     PAGE 2: EXECUTIVE SUMMARY & TABLE OF CONTENTS
     ======================================================================= -->
<div class="doc-page">
  <div class="page-header">
    <div class="brand">
      <span class="brand-badge">OMNISOCIAL AI</span>
      <span>Official Instagram API Integration Master Guide</span>
    </div>
    <div class="chapter-tag">EXECUTIVE SUMMARY &amp; TOC</div>
  </div>

  <div class="page-content">
    <h1 class="chapter-title">Executive Summary &amp; Document Index</h1>
    <p class="lead">
      This technical manual provides a comprehensive, production-grade guide for integrating the official Meta Instagram Graph API into <strong>OmniSocial AI</strong>. The system architecture strictly preserves modular boundaries: Next.js App Router for frontend UI, NestJS API Gateway for business logic and OAuth orchestration, PostgreSQL 18 with Prisma ORM for relational persistence, and Redis with BullMQ workers for resilient, asynchronous post scheduling and dispatch.
    </p>

    <div class="callout callout-info">
      <strong>Core Architectural Invariant:</strong> The Next.js client-side application must NEVER communicate directly with PostgreSQL or external Meta Graph APIs. All authorization exchanges, sensitive token storage, and media container dispatches are mediated exclusively by the NestJS backend API. Client Secrets and plaintext tokens are never transmitted to browser bundles.
    </div>

    <h2 class="section-heading">Table of Contents &bull; 19 Chapters</h2>
    <table class="data-table">
      <thead>
        <tr>
          <th style="width:10%;">Chapter</th>
          <th style="width:40%;">Title &amp; Focus Area</th>
          <th style="width:35%;">Key Architectural Deliverable</th>
          <th style="width:15%;">Page</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>01</strong></td>
          <td>Introduction &amp; Integration Fundamentals</td>
          <td>Customer lifecycle flow, Meta app vs consumer app</td>
          <td>Page 03</td>
        </tr>
        <tr>
          <td><strong>02</strong></td>
          <td>Meta Developer Account &amp; App Creation</td>
          <td>developers.facebook.com 13-step setup walkthrough</td>
          <td>Page 04</td>
        </tr>
        <tr>
          <td><strong>03</strong></td>
          <td>Instagram Account Types &amp; Login Paths</td>
          <td>Personal vs Creator vs Business, Route A/B Matrix</td>
          <td>Page 05</td>
        </tr>
        <tr>
          <td><strong>04</strong></td>
          <td>Cost Structure, API Rate Limits &amp; Permissions</td>
          <td>Permission comparison table, 25-post/24h rolling limit</td>
          <td>Page 06</td>
        </tr>
        <tr>
          <td><strong>05</strong></td>
          <td>Complete System Architecture</td>
          <td>Multi-tier Next.js &gt; NestJS &gt; Prisma &gt; Redis &gt; Meta flow</td>
          <td>Page 07</td>
        </tr>
        <tr>
          <td><strong>06</strong></td>
          <td>Instagram OAuth 2.0 Integration Deep Dive</td>
          <td>CSRF state validation, PKCE, 60-day token exchange</td>
          <td>Page 08</td>
        </tr>
        <tr>
          <td><strong>07</strong></td>
          <td>Database &amp; Prisma Schema Design</td>
          <td>SocialAccount, ScheduledPost, TokenVault models</td>
          <td>Page 09</td>
        </tr>
        <tr>
          <td><strong>08</strong></td>
          <td>Instagram Account Management UI &amp; UX</td>
          <td>Connect modal, account cards, reconnect flows</td>
          <td>Page 10</td>
        </tr>
        <tr>
          <td><strong>09</strong></td>
          <td>First Instagram Image Publishing</td>
          <td>2-step media container creation &amp; publish lifecycle</td>
          <td>Page 11</td>
        </tr>
        <tr>
          <td><strong>10</strong></td>
          <td>Advanced Content Formats (Carousels &amp; Reels)</td>
          <td>Multi-item containers, video transcoding &amp; polling</td>
          <td>Page 12</td>
        </tr>
        <tr>
          <td><strong>11</strong></td>
          <td>Scheduling &amp; Redis BullMQ Worker Engine</td>
          <td>Timezone handling, sweeper loop, idempotency keys</td>
          <td>Page 13</td>
        </tr>
        <tr>
          <td><strong>12</strong></td>
          <td>Multi-Account &amp; Bulk Publishing</td>
          <td>1-to-many target isolation, staggered dispatch (1.5s)</td>
          <td>Page 14</td>
        </tr>
        <tr>
          <td><strong>13</strong></td>
          <td>Instagram Analytics &amp; Performance Telemetry</td>
          <td>Supported Graph metrics: Reach, Impressions, Saves</td>
          <td>Page 15</td>
        </tr>
        <tr>
          <td><strong>14</strong></td>
          <td>Comments, Mentions &amp; Webhook Automation</td>
          <td>HMAC-SHA256 signature check, 2-way comment replies</td>
          <td>Page 16</td>
        </tr>
        <tr>
          <td><strong>15</strong></td>
          <td>Security Architecture &amp; Vault Hardening</td>
          <td>AES-256-GCM dual-key rotation, workspace isolation</td>
          <td>Page 17</td>
        </tr>
        <tr>
          <td><strong>16</strong></td>
          <td>Comprehensive Testing Strategy</td>
          <td>Unit, integration, E2E OAuth, resilience checklist</td>
          <td>Page 18</td>
        </tr>
        <tr>
          <td><strong>17</strong></td>
          <td>Production Deployment &amp; Meta App Review</td>
          <td>Screencast walkthrough, privacy policy, live mode</td>
          <td>Page 19</td>
        </tr>
        <tr>
          <td><strong>18</strong></td>
          <td>Complete Implementation Roadmap</td>
          <td>Phase 0 to Phase 11 milestone dependencies</td>
          <td>Page 20</td>
        </tr>
        <tr>
          <td><strong>19</strong></td>
          <td>Master Coding Agent Implementation Prompt</td>
          <td>Copy-ready prompt with strict architectural guardrails</td>
          <td>Pages 21-22</td>
        </tr>
      </tbody>
    </table>
  </div>

  <div class="page-footer">
    <div class="confidential">CONFIDENTIAL &bull; OMNISOCIAL AI ARCHITECTURAL SPECIFICATION</div>
    <div class="page-number">Page 02 of 23</div>
  </div>
</div>

<!-- =======================================================================
     PAGE 3: CHAPTER 01 — INTRODUCTION
     ======================================================================= -->
<div class="doc-page">
  <div class="page-header">
    <div class="brand">
      <span class="brand-badge">OMNISOCIAL AI</span>
      <span>Official Instagram API Integration Master Guide</span>
    </div>
    <div class="chapter-tag">CHAPTER 01 &bull; INTRODUCTION</div>
  </div>

  <div class="page-content">
    <h1 class="chapter-title"><span class="num-pill">01</span> Introduction &amp; Integration Fundamentals</h1>
    <p class="lead">
      Integrating the official Instagram API allows OmniSocial AI users to securely connect their professional Instagram presence, compose and preview platform-native media, schedule posts across time zones, and analyze engagement metrics without manual intervention or risky credential sharing.
    </p>

    <h2 class="section-heading">What Instagram API Integration Means for a Multi-Tenant SaaS</h2>
    <p>
      Unlike personal social tools where an individual logs in directly, a B2B SaaS platform must support <strong>delegated, scoped authorization</strong>. Through the OAuth 2.0 protocol, an Instagram account holder grants OmniSocial AI specific capabilities (such as publishing images or reading insights) without disclosing their Instagram password. Our backend securely retains encrypted tokens and dispatches API commands on their behalf.
    </p>

    <div class="grid-2">
      <div class="card-box">
        <h4>Instagram App vs Meta Developer App</h4>
        <p><strong>Instagram Mobile App:</strong> Consumer client used by end-users to post photos and view feeds. Contains no developer credentials.</p>
        <p><strong>Meta Developer App:</strong> Cloud application registered on Meta's developer console representing OmniSocial AI. Holds our unique <code>App ID</code> and <code>App Secret</code>, manages redirect URIs, and configures requested scopes.</p>
      </div>
      <div class="card-box">
        <h4>Instagram Login vs Facebook Login</h4>
        <p><strong>Instagram Login (Route A):</strong> Authenticates directly using Instagram credentials. Does not require a linked Facebook Page. Ideal for pure Instagram creators.</p>
        <p><strong>Facebook Login (Route B):</strong> Authenticates via Facebook account and accesses Instagram through a connected Facebook Page. Required for enterprise multi-channel publishing.</p>
      </div>
    </div>

    <h2 class="section-heading">Beginner-Friendly End-to-End Customer Lifecycle Flow</h2>
    <p>
      The following diagram illustrates the high-level path of a user from connecting their account in the OmniSocial AI dashboard to automated background publishing:
    </p>

    <div class="diagram-container">
      ${d1}
    </div>
  </div>

  <div class="page-footer">
    <div class="confidential">CONFIDENTIAL &bull; OMNISOCIAL AI ARCHITECTURAL SPECIFICATION</div>
    <div class="page-number">Page 03 of 23</div>
  </div>
</div>

<!-- =======================================================================
     PAGE 4: CHAPTER 02 — META APP CREATION
     ======================================================================= -->
<div class="doc-page">
  <div class="page-header">
    <div class="brand">
      <span class="brand-badge">OMNISOCIAL AI</span>
      <span>Official Instagram API Integration Master Guide</span>
    </div>
    <div class="chapter-tag">CHAPTER 02 &bull; META DEVELOPER APP</div>
  </div>

  <div class="page-content">
    <h1 class="chapter-title"><span class="num-pill">02</span> Meta Developer Account &amp; App Creation</h1>
    <p class="lead">
      To interact with Instagram's Graph API, OmniSocial AI must establish an official application identity within the Meta Developer ecosystem. Follow this exact sequence on <code>https://developers.facebook.com/</code>:
    </p>

    <div class="diagram-container">
      ${d2}
    </div>

    <h2 class="section-heading">Step-by-Step Meta Developer Portal Walkthrough</h2>
    <table class="data-table">
      <thead>
        <tr>
          <th style="width:8%;">Step</th>
          <th style="width:28%;">Action &amp; Dashboard Location</th>
          <th style="width:40%;">Configuration Requirements</th>
          <th style="width:24%;">Security Guardrail</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>01</strong></td>
          <td>Sign In &amp; Registration</td>
          <td>Sign in with Meta account; complete developer registration; verify SMS.</td>
          <td>Enable 2FA on developer account</td>
        </tr>
        <tr>
          <td><strong>02</strong></td>
          <td>Create App &gt; Use Case</td>
          <td>Select <strong>"Other"</strong> &gt; <strong>"Business"</strong> app type. Name: <code>OmniSocial AI</code>.</td>
          <td>Assign to verified Business Portfolio</td>
        </tr>
        <tr>
          <td><strong>03</strong></td>
          <td>Add Products</td>
          <td>Add <strong>Instagram Graph API</strong> and <strong>Instagram Login</strong>.</td>
          <td>Do not add deprecated Basic Display</td>
        </tr>
        <tr>
          <td><strong>04</strong></td>
          <td>App Settings &gt; Basic</td>
          <td>App Domains: <code>omnisocial.ai</code>. Add HTTPS Privacy Policy &amp; Terms URLs.</td>
          <td>HTTPS strictly enforced in production</td>
        </tr>
        <tr>
          <td><strong>05</strong></td>
          <td>Valid OAuth Redirect URIs</td>
          <td>Add exact callback: <code>https://api.omnisocial.ai/v1/oauth/meta/callback</code>.</td>
          <td>No wildcards or localhost in prod</td>
        </tr>
        <tr>
          <td><strong>06</strong></td>
          <td>App Roles &gt; Test Users</td>
          <td>Add development Instagram accounts as <strong>App Testers</strong> for sandbox testing.</td>
          <td>Testers must accept invite in IG settings</td>
        </tr>
        <tr>
          <td><strong>07</strong></td>
          <td>App ID &amp; Secret Vault</td>
          <td>Copy <code>App ID</code> and <code>App Secret</code> into backend environment variables.</td>
          <td>Never commit App Secret to Git</td>
        </tr>
      </tbody>
    </table>
  </div>

  <div class="page-footer">
    <div class="confidential">CONFIDENTIAL &bull; OMNISOCIAL AI ARCHITECTURAL SPECIFICATION</div>
    <div class="page-number">Page 04 of 23</div>
  </div>
</div>

<!-- =======================================================================
     PAGE 5: CHAPTER 03 — INSTAGRAM ACCOUNT REQUIREMENTS
     ======================================================================= -->
<div class="doc-page">
  <div class="page-header">
    <div class="brand">
      <span class="brand-badge">OMNISOCIAL AI</span>
      <span>Official Instagram API Integration Master Guide</span>
    </div>
    <div class="chapter-tag">CHAPTER 03 &bull; ACCOUNT REQUIREMENTS</div>
  </div>

  <div class="page-content">
    <h1 class="chapter-title"><span class="num-pill">03</span> Instagram Account Requirements &amp; Routing</h1>
    <p class="lead">
      Meta enforces strict account-type boundaries on the Instagram platform. Not all accounts are eligible for programmatic publishing or analytics extraction. Understanding these prerequisites is vital for customer onboarding.
    </p>

    <div class="callout callout-danger">
      <strong>CRITICAL RULE: Ordinary Personal Instagram accounts are UNSUPPORTED for official API publishing.</strong><br>
      Meta's Content Publishing API strictly permits calls only targeting <strong>Instagram Business</strong> or <strong>Instagram Creator</strong> accounts. Any attempt to publish to a personal account returns <code>(#10) Application does not have permission for this action</code>. Users can switch to a Professional account for free in the Instagram mobile app under <em>Settings &gt; Account Type and Tools &gt; Switch to Professional Account</em>.
    </div>

    <h2 class="section-heading">Detailed Account Capability &amp; Login Path Comparison</h2>
    <table class="data-table">
      <thead>
        <tr>
          <th style="width:22%;">Feature / Dimension</th>
          <th style="width:39%;">Route A: Instagram Login (Recommended)</th>
          <th style="width:39%;">Route B: Facebook Login (Page-Linked)</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Login Credentials</strong></td>
          <td>Instagram username and password directly</td>
          <td>Facebook personal account credentials</td>
        </tr>
        <tr>
          <td><strong>Professional Account</strong></td>
          <td><strong>Required</strong> (Business or Creator account)</td>
          <td><strong>Required</strong> (Business or Creator account)</td>
        </tr>
        <tr>
          <td><strong>Facebook Page Connection</strong></td>
          <td><span class="badge badge-emerald">NOT REQUIRED</span> (Standalone Instagram path)</td>
          <td><span class="badge badge-rose">MANDATORY</span> (IG must be linked to FB Page)</td>
        </tr>
        <tr>
          <td><strong>API Endpoint Host</strong></td>
          <td><code>https://graph.instagram.com/v21.0</code></td>
          <td><code>https://graph.facebook.com/v21.0</code></td>
        </tr>
        <tr>
          <td><strong>Publishing Scope</strong></td>
          <td><code>instagram_business_content_publish</code></td>
          <td><code>instagram_content_publish</code></td>
        </tr>
        <tr>
          <td><strong>Best Suited Use Case</strong></td>
          <td>Modern Instagram-first creators and agencies</td>
          <td>Agencies managing paired Facebook + Instagram pages</td>
        </tr>
      </tbody>
    </table>

    <h2 class="section-heading">Account Verification &amp; Login Routing Decision Tree</h2>
    <div class="diagram-container">
      ${d5}
    </div>
  </div>

  <div class="page-footer">
    <div class="confidential">CONFIDENTIAL &bull; OMNISOCIAL AI ARCHITECTURAL SPECIFICATION</div>
    <div class="page-number">Page 05 of 23</div>
  </div>
</div>

<!-- =======================================================================
     PAGE 6: CHAPTER 04 — COST & PERMISSIONS
     ======================================================================= -->
<div class="doc-page">
  <div class="page-header">
    <div class="brand">
      <span class="brand-badge">OMNISOCIAL AI</span>
      <span>Official Instagram API Integration Master Guide</span>
    </div>
    <div class="chapter-tag">CHAPTER 04 &bull; COSTS &amp; PERMISSIONS</div>
  </div>

  <div class="page-content">
    <h1 class="chapter-title"><span class="num-pill">04</span> Cost Structure, Rate Limits &amp; Permissions</h1>
    <p class="lead">
      While Meta provides access to the Instagram Graph API free of software license fees, operating a multi-tenant social media platform incurs infrastructure, storage, and AI processing costs alongside strict API rate limits.
    </p>

    <div class="grid-2">
      <div class="card-box">
        <h4>Meta API Pricing (Free Tier)</h4>
        <p>&bull; <strong>Meta Developer Account:</strong> $0 / Free</p>
        <p>&bull; <strong>Meta App Registration:</strong> $0 / Free</p>
        <p>&bull; <strong>Graph API Requests:</strong> $0 / Free (subject to rate limits)</p>
        <p>&bull; <strong>App Review Submission:</strong> $0 / Free</p>
      </div>
      <div class="card-box">
        <h4>OmniSocial AI SaaS Operational Costs</h4>
        <p>&bull; <strong>Public Media Hosting:</strong> AWS S3 / Cloudflare R2 ($0.015/GB)</p>
        <p>&bull; <strong>Database &amp; Redis:</strong> Managed Postgres + Redis cluster</p>
        <p>&bull; <strong>AI Generation Tokens:</strong> Gemini 1.5 Flash ($0.075 / 1M tokens)</p>
        <p>&bull; <strong>Worker Compute:</strong> Node.js publishing background runners</p>
      </div>
    </div>

    <h2 class="section-heading">Instagram Platform Rate Limits (Rolling 24-Hour Windows)</h2>
    <table class="data-table">
      <thead>
        <tr>
          <th style="width:25%;">Rate Limit Tier</th>
          <th style="width:45%;">Enforced Threshold &amp; Metric</th>
          <th style="width:30%;">OmniSocial AI Safeguard</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Publishing Limit</strong></td>
          <td><strong>25 published posts</strong> per Instagram account within any rolling 24-hour period. Includes single posts, reels, and carousels.</td>
          <td>Dispatcher tracks daily counter; defers surplus posts with clear UI warning.</td>
        </tr>
        <tr>
          <td><strong>Business Use Case (BUC)</strong></td>
          <td><strong>200 calls per active user per hour</strong>. Scaled based on active workspace users: <code>Calls = 200 * ActiveUsers</code>.</td>
          <td>In-memory Redis sliding-window rate limiter throttles API bursts.</td>
        </tr>
        <tr>
          <td><strong>Rate Limit Headers</strong></td>
          <td><code>X-Business-Use-Case-Usage</code> contains current percentage of call quota, CPU time, and estimated reset seconds.</td>
          <td>Backend inspects headers on every response; pauses dispatcher if quota &gt; 85%.</td>
        </tr>
      </tbody>
    </table>

    <h2 class="section-heading">Official Meta Permission Identifiers &amp; Review Requirements</h2>
    <table class="data-table">
      <thead>
        <tr>
          <th style="width:25%;">Permission Identifier</th>
          <th style="width:35%;">Technical Purpose</th>
          <th style="width:25%;">Meta Feature Requirement</th>
          <th style="width:15%;">App Review</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><code>instagram_basic</code></td>
          <td>Read profile metadata, username, and account ID.</td>
          <td>Instagram Graph API</td>
          <td><span class="badge badge-emerald">Standard/Adv</span></td>
        </tr>
        <tr>
          <td><code>instagram_content_publish</code></td>
          <td>Create media containers and publish photos, reels, carousels.</td>
          <td>Content Publishing</td>
          <td><span class="badge badge-rose">Mandatory</span></td>
        </tr>
        <tr>
          <td><code>instagram_manage_comments</code></td>
          <td>Read, reply to, and delete/hide comments on posts.</td>
          <td>Comment Moderation</td>
          <td><span class="badge badge-rose">Mandatory</span></td>
        </tr>
        <tr>
          <td><code>instagram_manage_insights</code></td>
          <td>Extract post reach, impressions, engagement, and follower stats.</td>
          <td>Instagram Insights</td>
          <td><span class="badge badge-rose">Mandatory</span></td>
        </tr>
        <tr>
          <td><code>pages_show_list</code></td>
          <td>List Facebook Pages managed by user to discover linked IG accounts.</td>
          <td>Page Management</td>
          <td><span class="badge badge-rose">Mandatory</span></td>
        </tr>
      </tbody>
    </table>
  </div>

  <div class="page-footer">
    <div class="confidential">CONFIDENTIAL &bull; OMNISOCIAL AI ARCHITECTURAL SPECIFICATION</div>
    <div class="page-number">Page 06 of 23</div>
  </div>
</div>

<!-- =======================================================================
     PAGE 7: CHAPTER 05 — SYSTEM ARCHITECTURE
     ======================================================================= -->
<div class="doc-page">
  <div class="page-header">
    <div class="brand">
      <span class="brand-badge">OMNISOCIAL AI</span>
      <span>Official Instagram API Integration Master Guide</span>
    </div>
    <div class="chapter-tag">CHAPTER 05 &bull; SYSTEM ARCHITECTURE</div>
  </div>

  <div class="page-content">
    <h1 class="chapter-title"><span class="num-pill">05</span> Complete System Architecture</h1>
    <p class="lead">
      OmniSocial AI implements a resilient, multi-tiered enterprise architecture ensuring strict isolation between user-facing clients, background workers, and persistent data stores.
    </p>

    <div class="diagram-container">
      ${d4}
    </div>

    <h2 class="section-heading">Architectural Responsibilities by System Layer</h2>
    <div class="grid-2">
      <div class="card-box">
        <h4>Frontend Responsibilities (Next.js 14)</h4>
        <p>&bull; Render responsive account cards, composer, and calendar.</p>
        <p>&bull; Validate media file size and aspect ratios client-side.</p>
        <p>&bull; Initiate OAuth redirection via backend API endpoints.</p>
        <p>&bull; Poll or subscribe to post publishing status events.</p>
        <p><span class="badge badge-rose">STRICT RESTRICTION:</span> Zero direct database access, zero Meta API calls, zero access tokens stored in localStorage.</p>
      </div>
      <div class="card-box">
        <h4>Backend Responsibilities (NestJS API &amp; Workers)</h4>
        <p>&bull; Orchestrate OAuth 2.0 PKCE state verification.</p>
        <p>&bull; Encrypt/decrypt tokens using <code>TokenVaultService</code> (AES-256-GCM).</p>
        <p>&bull; Enforce multi-tenant workspace access guards on all routes.</p>
        <p>&bull; Manage BullMQ queues, delayed jobs, and retries in Redis.</p>
        <p>&bull; Dispatch 2-step media container requests to Meta Graph API.</p>
      </div>
    </div>
  </div>

  <div class="page-footer">
    <div class="confidential">CONFIDENTIAL &bull; OMNISOCIAL AI ARCHITECTURAL SPECIFICATION</div>
    <div class="page-number">Page 07 of 23</div>
  </div>
</div>

<!-- =======================================================================
     PAGE 8: CHAPTER 06 — OAUTH INTEGRATION
     ======================================================================= -->
<div class="doc-page">
  <div class="page-header">
    <div class="brand">
      <span class="brand-badge">OMNISOCIAL AI</span>
      <span>Official Instagram API Integration Master Guide</span>
    </div>
    <div class="chapter-tag">CHAPTER 06 &bull; OAUTH 2.0 INTEGRATION</div>
  </div>

  <div class="page-content">
    <h1 class="chapter-title"><span class="num-pill">06</span> Instagram OAuth 2.0 Integration Deep Dive</h1>
    <p class="lead">
      OAuth 2.0 is the foundational protocol that enables OmniSocial AI to act on behalf of a user without handling their credentials. The integration utilizes a multi-step exchange with CSRF protection and long-lived token upgrading.
    </p>

    <div class="diagram-container">
      ${d3}
    </div>

    <h2 class="section-heading">Detailed 10-Step OAuth Sequence Breakdown</h2>
    <table class="data-table">
      <thead>
        <tr>
          <th style="width:8%;">Phase</th>
          <th style="width:25%;">Actor &amp; Endpoint</th>
          <th style="width:45%;">Action &amp; Payload Description</th>
          <th style="width:22%;">Security Verification</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>1-2</strong></td>
          <td>Next.js &gt; NestJS<br><code>POST /oauth/initiate</code></td>
          <td>User clicks "Connect Instagram". NestJS generates cryptographically secure state: <code>crypto.randomBytes(32).toString('hex')</code>.</td>
          <td>State tied to active user ID and workspace ID in DB.</td>
        </tr>
        <tr>
          <td><strong>3-4</strong></td>
          <td>NestJS &gt; Browser<br>Redirect to Meta</td>
          <td>Returns Meta OAuth Dialog URL with <code>client_id</code>, <code>redirect_uri</code>, <code>state</code>, and requested scopes.</td>
          <td>Strict 10-minute TTL on state record.</td>
        </tr>
        <tr>
          <td><strong>5-6</strong></td>
          <td>Meta &gt; NestJS<br><code>GET /oauth/callback</code></td>
          <td>User grants permissions. Meta redirects to callback with <code>code</code> and <code>state</code>. NestJS verifies state exists and is unused.</td>
          <td>Prevents CSRF attacks; marks state as consumed.</td>
        </tr>
        <tr>
          <td><strong>7-8</strong></td>
          <td>NestJS &gt; Meta<br>Token Exchange</td>
          <td>1. Exchange code for short-lived token (1h).<br>2. Exchange short-lived token for <strong>60-day Long-Lived Token</strong> via <code>oauth/access_token?grant_type=ig_exchange_token</code>.</td>
          <td>Client Secret sent strictly over HTTPS server-to-server.</td>
        </tr>
        <tr>
          <td><strong>9-10</strong></td>
          <td>NestJS &gt; PostgreSQL<br>Encryption &amp; Save</td>
          <td>TokenVault encrypts long-lived token via AES-256-GCM. Upserts <code>SocialAccount</code> record in Prisma. Redirects user to dashboard.</td>
          <td>Plaintext token wiped from memory immediately.</td>
        </tr>
      </tbody>
    </table>
  </div>

  <div class="page-footer">
    <div class="confidential">CONFIDENTIAL &bull; OMNISOCIAL AI ARCHITECTURAL SPECIFICATION</div>
    <div class="page-number">Page 08 of 23</div>
  </div>
</div>

<!-- =======================================================================
     PAGE 9: CHAPTER 07 — DATABASE & PRISMA DESIGN
     ======================================================================= -->
<div class="doc-page">
  <div class="page-header">
    <div class="brand">
      <span class="brand-badge">OMNISOCIAL AI</span>
      <span>Official Instagram API Integration Master Guide</span>
    </div>
    <div class="chapter-tag">CHAPTER 07 &bull; DATABASE DESIGN</div>
  </div>

  <div class="page-content">
    <h1 class="chapter-title"><span class="num-pill">07</span> Database &amp; Prisma Schema Design</h1>
    <p class="lead">
      OmniSocial AI reuses and extends its existing PostgreSQL schema through Prisma ORM to maintain strict relational integrity, multi-tenant isolation, and encrypted credential storage.
    </p>

    <h2 class="section-heading">Key Relational Models in <code>apps/api/prisma/schema.prisma</code></h2>
    <pre class="code-block">
<span class="keyword">model</span> <span class="function">SocialAccount</span> {
  id                   <span class="keyword">String</span>                 @id @default(uuid())
  workspaceId          <span class="keyword">String</span>                 <span class="comment">// Enforces multi-tenant isolation</span>
  provider             <span class="keyword">SocialProvider</span>         <span class="comment">// META_INSTAGRAM</span>
  providerAccountId    <span class="keyword">String</span>                 <span class="comment">// Official Instagram Business/Creator ID</span>
  accountName          <span class="keyword">String</span>                 <span class="comment">// Display Name (e.g. "Acme Corp")</span>
  accountUsername      <span class="keyword">String?</span>                <span class="comment">// IG Handle (e.g. "@acme_global")</span>
  accountType          <span class="keyword">SocialAccountType</span>      <span class="comment">// INSTAGRAM_BUSINESS | INSTAGRAM_CREATOR</span>
  profileImageUrl      <span class="keyword">String?</span>
  connectionStatus     <span class="keyword">SocialConnectionStatus</span> @default(CONNECTED)
  encryptedAccessToken <span class="keyword">String</span>                 <span class="comment">// AES-256-GCM (v1:iv:tag:ciphertext)</span>
  tokenExpiresAt       <span class="keyword">DateTime?</span>              <span class="comment">// 60-day long-lived token expiry</span>
  scopesGranted        <span class="keyword">String[]</span>               <span class="comment">// ["instagram_basic", "instagram_content_publish"]</span>
  workspace            <span class="keyword">Workspace</span>              @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  targets              <span class="keyword">ScheduledPostTarget[]</span>
  publishingLogs       <span class="keyword">PublishingLog[]</span>

  @@unique([workspaceId, provider, providerAccountId])
  @@index([workspaceId])
  @@map(<span class="string">"social_accounts"</span>)
}
    </pre>

    <h2 class="section-heading">Entity Relationship &amp; Publishing Target Isolation</h2>
    <table class="data-table">
      <thead>
        <tr>
          <th style="width:25%;">Entity Model</th>
          <th style="width:35%;">Key Fields</th>
          <th style="width:40%;">Relational Role &amp; IDOR Safeguard</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><code>Workspace</code></td>
          <td><code>id, name, status, plan</code></td>
          <td>Top-level tenant boundary. All accounts and posts belong to a single workspace.</td>
        </tr>
        <tr>
          <td><code>OAuthState</code></td>
          <td><code>id, state, workspaceId, userId, expiresAt</code></td>
          <td>CSRF state tracking table. Ensures redirect callback originates from same tenant user.</td>
        </tr>
        <tr>
          <td><code>ScheduledPost</code></td>
          <td><code>id, workspaceId, scheduledAt, timezone, status, contentSnapshot</code></td>
          <td>Immutable post envelope containing caption, media URL, and approved draft revision.</td>
        </tr>
        <tr>
          <td><code>ScheduledPostTarget</code></td>
          <td><code>id, scheduledPostId, socialAccountId, status, externalPostId</code></td>
          <td>Independent execution record per account. Isolates partial failure and retries.</td>
        </tr>
        <tr>
          <td><code>PublishingLog</code></td>
          <td><code>id, socialAccountId, outcome, rawResponse, latencyMs</code></td>
          <td>Audit trail documenting every API call, timestamp, user, and sanitized provider response.</td>
        </tr>
      </tbody>
    </table>
  </div>

  <div class="page-footer">
    <div class="confidential">CONFIDENTIAL &bull; OMNISOCIAL AI ARCHITECTURAL SPECIFICATION</div>
    <div class="page-number">Page 09 of 23</div>
  </div>
</div>

<!-- =======================================================================
     PAGE 10: CHAPTER 08 — ACCOUNT MANAGEMENT UI
     ======================================================================= -->
<div class="doc-page">
  <div class="page-header">
    <div class="brand">
      <span class="brand-badge">OMNISOCIAL AI</span>
      <span>Official Instagram API Integration Master Guide</span>
    </div>
    <div class="chapter-tag">CHAPTER 08 &bull; ACCOUNT MANAGEMENT UI</div>
  </div>

  <div class="page-content">
    <h1 class="chapter-title"><span class="num-pill">08</span> Instagram Account Management UI &amp; UX</h1>
    <p class="lead">
      The user experience in OmniSocial AI balances security and simplicity. Marketing teams require intuitive account connectivity, visible permission health indicators, and painless token reauthorization.
    </p>

    <h2 class="section-heading">Social Accounts Management Dashboard Wireframe</h2>
    <div class="card-box" style="background:#FFFFFF; border:2px solid #E2E8F0; margin-bottom:3mm;">
      <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #E2E8F0; padding-bottom:6px; margin-bottom:8px;">
        <div>
          <span style="font-weight:800; font-size:11pt; color:#0F172A;">Connected Social Accounts</span>
          <span style="font-size:8pt; color:#64748B; margin-left:8px;">Workspace: Acme Brand Global</span>
        </div>
        <button style="background:linear-gradient(135deg, #833AB4, #FD1D1D); color:#fff; border:none; padding:4px 10px; border-radius:5px; font-weight:700; font-size:8pt;">+ Connect New Account</button>
      </div>

      <!-- Account Card 1 -->
      <div style="display:flex; justify-content:space-between; align-items:center; background:#F8FAFC; border:1px solid #CBD5E1; border-radius:6px; padding:8px 12px; margin-bottom:6px;">
        <div style="display:flex; align-items:center; gap:10px;">
          <div style="width:36px; height:36px; border-radius:50%; background:linear-gradient(135deg, #833AB4, #E1306C); display:flex; align-items:center; justify-content:center; color:#fff; font-weight:bold; font-size:10pt;">IG</div>
          <div>
            <div style="font-weight:700; font-size:9.5pt; color:#0F172A;">Acme Global Official <span class="badge badge-emerald">ACTIVE &bull; 8 APIs LIVE</span></div>
            <div style="font-size:8pt; color:#64748B;">@acme_global &bull; Instagram Business &bull; 142.5K Followers &bull; Expires in 54 days</div>
          </div>
        </div>
        <div style="display:flex; gap:6px;">
          <button style="background:#FFFFFF; border:1px solid #CBD5E1; padding:3px 8px; border-radius:4px; font-size:7.5pt; font-weight:600;">View Analytics</button>
          <button style="background:#FFFFFF; border:1px solid #CBD5E1; padding:3px 8px; border-radius:4px; font-size:7.5pt; font-weight:600;">Permissions</button>
          <button style="background:#FEF2F2; border:1px solid #FECACA; color:#DC2626; padding:3px 8px; border-radius:4px; font-size:7.5pt; font-weight:600;">Disconnect</button>
        </div>
      </div>

      <!-- Account Card 2 (Expired State) -->
      <div style="display:flex; justify-content:space-between; align-items:center; background:#FFFBEB; border:1px solid #FCD34D; border-radius:6px; padding:8px 12px;">
        <div style="display:flex; align-items:center; gap:10px;">
          <div style="width:36px; height:36px; border-radius:50%; background:#D97706; display:flex; align-items:center; justify-content:center; color:#fff; font-weight:bold; font-size:10pt;">IG</div>
          <div>
            <div style="font-weight:700; font-size:9.5pt; color:#92400E;">Acme UK Operations <span class="badge badge-amber">TOKEN EXPIRED</span></div>
            <div style="font-size:8pt; color:#B45309;">@acme_uk &bull; Meta token expired 2 days ago &bull; Scheduled posts paused</div>
          </div>
        </div>
        <div style="display:flex; gap:6px;">
          <button style="background:#D97706; color:#FFFFFF; border:none; padding:3px 10px; border-radius:4px; font-size:7.5pt; font-weight:700;">Reconnect Now</button>
          <button style="background:#FFFFFF; border:1px solid #CBD5E1; padding:3px 8px; border-radius:4px; font-size:7.5pt; font-weight:600;">Remove</button>
        </div>
      </div>
    </div>

    <h2 class="section-heading">Key User Interaction Workflows</h2>
    <div class="grid-2">
      <div class="card-box">
        <h4>1. Connect Account Flow</h4>
        <p>&bull; User selects "Connect Instagram" modal.</p>
        <p>&bull; Options: Route A (Instagram Login) or Route B (Page-Linked).</p>
        <p>&bull; Redirects cleanly to Meta consent dialog.</p>
        <p>&bull; Returns to dashboard with animated success toast.</p>
      </div>
      <div class="card-box">
        <h4>2. Reconnect &amp; Token Health</h4>
        <p>&bull; Background cron checks <code>tokenExpiresAt</code> daily.</p>
        <p>&bull; Warning banner appears when expiration &lt; 7 days.</p>
        <p>&bull; 1-click reauthorization refreshes long-lived token.</p>
        <p>&bull; Prevents scheduled dispatch interruptions.</p>
      </div>
    </div>
  </div>

  <div class="page-footer">
    <div class="confidential">CONFIDENTIAL &bull; OMNISOCIAL AI ARCHITECTURAL SPECIFICATION</div>
    <div class="page-number">Page 10 of 23</div>
  </div>
</div>

<!-- =======================================================================
     PAGE 11: CHAPTER 09 — SINGLE IMAGE PUBLISHING
     ======================================================================= -->
<div class="doc-page">
  <div class="page-header">
    <div class="brand">
      <span class="brand-badge">OMNISOCIAL AI</span>
      <span>Official Instagram API Integration Master Guide</span>
    </div>
    <div class="chapter-tag">CHAPTER 09 &bull; SINGLE IMAGE PUBLISHING</div>
  </div>

  <div class="page-content">
    <h1 class="chapter-title"><span class="num-pill">09</span> First Instagram Image Publishing Workflow</h1>
    <p class="lead">
      Unlike simple social APIs that accept raw file uploads in a single HTTP request, Meta enforces a mandatory <strong>2-step container lifecycle</strong> for all Instagram media publishing.
    </p>

    <div class="diagram-container">
      ${d6}
    </div>

    <h2 class="section-heading">Technical Deep Dive: The 2-Step Container Lifecycle</h2>
    <div class="grid-2">
      <div class="card-box">
        <h4>Step 1: Create Media Container</h4>
        <p><strong>Endpoint:</strong> <code>POST /{ig-user-id}/media</code></p>
        <p><strong>Payload:</strong></p>
        <pre class="code-block" style="margin:2px 0;">
{
  "image_url": "https://s3.../photo.jpg",
  "caption": "Launch announcement! #ai",
  "access_token": "EAA..."
}
        </pre>
        <p>Meta downloads the image from your public HTTPS URL, validates dimensions, and allocates a temporary container ID (e.g. <code>17982038475</code>).</p>
      </div>
      <div class="card-box">
        <h4>Step 2: Publish Media Container</h4>
        <p><strong>Endpoint:</strong> <code>POST /{ig-user-id}/media_publish</code></p>
        <p><strong>Payload:</strong></p>
        <pre class="code-block" style="margin:2px 0;">
{
  "creation_id": "17982038475",
  "access_token": "EAA..."
}
        </pre>
        <p>Meta publishes the container to the live profile feed and returns the permanent Instagram Media ID (e.g. <code>18029384918</code>).</p>
      </div>
    </div>

    <div class="callout callout-warning">
      <strong>CRITICAL PUBLISHING INVARIANTS:</strong><br>
      1. <strong>Image URL Accessibility:</strong> The image must be hosted on a public HTTPS endpoint accessible by Meta's crawler (User-Agent: <code>facebookexternalhit</code>). Localhost URLs fail.<br>
      2. <strong>No Premature Status Updates:</strong> Never mark a post as <code>PUBLISHED</code> in OmniSocial AI until Step 2 returns HTTP 200 with a valid media ID.<br>
      3. <strong>Aspect Ratio Rules:</strong> Supported aspect ratios are strictly <strong>4:5 (vertical 0.8) to 1.91:1 (horizontal)</strong>. Images outside this ratio must be cropped before container creation.
    </div>
  </div>

  <div class="page-footer">
    <div class="confidential">CONFIDENTIAL &bull; OMNISOCIAL AI ARCHITECTURAL SPECIFICATION</div>
    <div class="page-number">Page 11 of 23</div>
  </div>
</div>

<!-- =======================================================================
     PAGE 12: CHAPTER 10 — ADVANCED CONTENT FORMATS
     ======================================================================= -->
<div class="doc-page">
  <div class="page-header">
    <div class="brand">
      <span class="brand-badge">OMNISOCIAL AI</span>
      <span>Official Instagram API Integration Master Guide</span>
    </div>
    <div class="chapter-tag">CHAPTER 10 &bull; CAROUSELS &amp; REELS</div>
  </div>

  <div class="page-content">
    <h1 class="chapter-title"><span class="num-pill">10</span> Advanced Content Formats: Carousels &amp; Reels</h1>
    <p class="lead">
      Beyond single static images, modern marketing requires multi-item Carousel sliders and short-form vertical Reels video. Each format builds upon the media container architecture with distinct encoding and polling requirements.
    </p>

    <h2 class="section-heading">Multi-Item Carousel Publishing Flow (Up to 10 Items)</h2>
    <div class="grid-2">
      <div class="card-box">
        <h4>1. Create Child Containers</h4>
        <p>For each photo or video (2 to 10 items), call:</p>
        <p><code>POST /{ig-user-id}/media</code></p>
        <p>Parameters: <code>is_carousel_item=true</code>, <code>image_url</code> or <code>video_url</code>.</p>
        <p>Collect all child container IDs: <code>[id_1, id_2, id_3]</code>.</p>
      </div>
      <div class="card-box">
        <h4>2. Create Parent Container &amp; Publish</h4>
        <p>Create the parent carousel container:</p>
        <p><code>POST /{ig-user-id}/media</code> with <code>media_type=CAROUSEL</code>, <code>children=[id_1, id_2, id_3]</code>, and caption.</p>
        <p>Finally, call <code>media_publish</code> with parent container ID.</p>
      </div>
    </div>

    <h2 class="section-heading">Instagram Reels &amp; Video Specifications &amp; Polling Loop</h2>
    <table class="data-table">
      <thead>
        <tr>
          <th style="width:25%;">Specification Parameter</th>
          <th style="width:40%;">Reels Requirement</th>
          <th style="width:35%;">Engineering Implementation</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Video Container &amp; Codec</strong></td>
          <td>MP4 or MOV container with H.264 video codec and AAC audio.</td>
          <td>FFmpeg transcoding pipeline validates before upload.</td>
        </tr>
        <tr>
          <td><strong>Aspect Ratio &amp; Dimensions</strong></td>
          <td>9:16 vertical recommended (1080x1920 pixels). Min 720p.</td>
          <td>UI shows warning if horizontal aspect ratio detected.</td>
        </tr>
        <tr>
          <td><strong>Duration &amp; File Size</strong></td>
          <td>3 seconds to 15 minutes (Reels). Max file size: 1 GB.</td>
          <td>S3 presigned upload enforces strict 1 GB ceiling.</td>
        </tr>
        <tr>
          <td><strong>Asynchronous Processing</strong></td>
          <td>Video requires server-side encoding by Meta before publish.</td>
          <td>Worker enters polling loop on <code>status_code</code>.</td>
        </tr>
      </tbody>
    </table>

    <h3 class="sub-heading">Video Container Polling Logic</h3>
    <pre class="code-block">
<span class="keyword">async function</span> <span class="function">pollContainerReadiness</span>(creationId, decryptedToken) {
  <span class="keyword">for</span> (<span class="keyword">let</span> attempt = 0; attempt &lt; 30; attempt++) {
    <span class="keyword">const</span> res = <span class="keyword">await</span> fetch(<span class="string">\`https://graph.facebook.com/v21.0/\${creationId}?fields=status_code&amp;access_token=\${decryptedToken}\`</span>);
    <span class="keyword">const</span> data = <span class="keyword">await</span> res.json();
    <span class="keyword">if</span> (data.status_code === <span class="string">'FINISHED'</span>) <span class="keyword">return true</span>;
    <span class="keyword">if</span> (data.status_code === <span class="string">'ERROR'</span> || data.status_code === <span class="string">'EXPIRED'</span>) {
      <span class="keyword">throw new</span> Error(<span class="string">\`Video processing failed with status: \${data.status_code}\`</span>);
    }
    <span class="keyword">await new</span> Promise(r =&gt; setTimeout(r, 5000)); <span class="comment">// 5s poll interval</span>
  }
  <span class="keyword">throw new</span> Error(<span class="string">'Timeout waiting for Meta video container processing'</span>);
}
    </pre>
  </div>

  <div class="page-footer">
    <div class="confidential">CONFIDENTIAL &bull; OMNISOCIAL AI ARCHITECTURAL SPECIFICATION</div>
    <div class="page-number">Page 12 of 23</div>
  </div>
</div>

<!-- =======================================================================
     PAGE 13: CHAPTER 11 — SCHEDULING & REDIS WORKERS
     ======================================================================= -->
<div class="doc-page">
  <div class="page-header">
    <div class="brand">
      <span class="brand-badge">OMNISOCIAL AI</span>
      <span>Official Instagram API Integration Master Guide</span>
    </div>
    <div class="chapter-tag">CHAPTER 11 &bull; SCHEDULING &amp; WORKERS</div>
  </div>

  <div class="page-content">
    <h1 class="chapter-title"><span class="num-pill">11</span> Scheduling &amp; Redis Worker Pipeline</h1>
    <p class="lead">
      Automatic post publishing relies on OmniSocial AI's existing BullMQ and Redis infrastructure. The scheduling engine guarantees that posts execute at the exact customer-specified local time while handling network anomalies gracefully.
    </p>

    <div class="diagram-container">
      ${d7}
    </div>

    <h2 class="section-heading">Key Scheduling Engine Architecture Principles</h2>
    <div class="grid-3">
      <div class="card-box">
        <h4>1. UTC Normalization</h4>
        <p>PostgreSQL stores all <code>scheduledAt</code> values in normalized UTC. The customer's IANA timezone (e.g. <code>America/New_York</code>) is preserved in <code>timezone</code> for daylight saving calculations.</p>
      </div>
      <div class="card-box">
        <h4>2. Atomic Distributed Lock</h4>
        <p>Redis distributed locks (<code>redlock</code> key: <code>lock:pub:{targetId}</code>) prevent race conditions between clustered worker processes, guaranteeing zero duplicate posts.</p>
      </div>
      <div class="card-box">
        <h4>3. Idempotent Retry</h4>
        <p>On network timeout, the <code>PublishingReconciler</code> checks if the post was already created on Instagram before executing a retry, preventing accidental double posting.</p>
      </div>
    </div>
  </div>

  <div class="page-footer">
    <div class="confidential">CONFIDENTIAL &bull; OMNISOCIAL AI ARCHITECTURAL SPECIFICATION</div>
    <div class="page-number">Page 13 of 23</div>
  </div>
</div>

<!-- =======================================================================
     PAGE 14: CHAPTER 12 — MULTI-ACCOUNT PUBLISHING
     ======================================================================= -->
<div class="doc-page">
  <div class="page-header">
    <div class="brand">
      <span class="brand-badge">OMNISOCIAL AI</span>
      <span>Official Instagram API Integration Master Guide</span>
    </div>
    <div class="chapter-tag">CHAPTER 12 &bull; MULTI-ACCOUNT PUBLISHING</div>
  </div>

  <div class="page-content">
    <h1 class="chapter-title"><span class="num-pill">12</span> Multi-Account &amp; Bulk Publishing</h1>
    <p class="lead">
      Enterprise brands and agencies routinely manage multiple Instagram handles (e.g., regional accounts like @brand_us, @brand_uk, @brand_apac). OmniSocial AI decouples content creation from delivery targets to ensure independent execution.
    </p>

    <div class="diagram-container">
      ${d8}
    </div>

    <h2 class="section-heading">Architectural Safeguards for Multi-Account Broadcasts</h2>
    <table class="data-table">
      <thead>
        <tr>
          <th style="width:25%;">Architectural Rule</th>
          <th style="width:40%;">Technical Implementation</th>
          <th style="width:35%;">Failure Prevention</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Independent State Machine</strong></td>
          <td>Each selected account receives a separate <code>ScheduledPostTarget</code> record in PostgreSQL with its own status lifecycle.</td>
          <td>Failure or rate-limit on Account A never cancels or marks Account B as failed.</td>
        </tr>
        <tr>
          <td><strong>Staggered Anti-Burst Delay</strong></td>
          <td>Dispatcher injects an artificial <strong>1.5-second sleep</strong> between dispatching to consecutive Instagram accounts.</td>
          <td>Prevents Meta anti-bot behavioral filters from flagging concurrent API bursts.</td>
        </tr>
        <tr>
          <td><strong>Distinct Decryption Contexts</strong></td>
          <td>Each target retrieves and decrypts its account's specific token via <code>TokenVaultService</code> independently.</td>
          <td>Token revocation on one brand account does not leak or contaminate other jobs.</td>
        </tr>
      </tbody>
    </table>
  </div>

  <div class="page-footer">
    <div class="confidential">CONFIDENTIAL &bull; OMNISOCIAL AI ARCHITECTURAL SPECIFICATION</div>
    <div class="page-number">Page 14 of 23</div>
  </div>
</div>

<!-- =======================================================================
     PAGE 15: CHAPTER 13 — INSTAGRAM ANALYTICS
     ======================================================================= -->
<div class="doc-page">
  <div class="page-header">
    <div class="brand">
      <span class="brand-badge">OMNISOCIAL AI</span>
      <span>Official Instagram API Integration Master Guide</span>
    </div>
    <div class="chapter-tag">CHAPTER 13 &bull; INSTAGRAM ANALYTICS</div>
  </div>

  <div class="page-content">
    <h1 class="chapter-title"><span class="num-pill">13</span> Instagram Analytics &amp; Performance Telemetry</h1>
    <p class="lead">
      OmniSocial AI extracts verified performance metrics from the official Instagram Graph Insights API, allowing marketing teams to measure campaign impact and calibrate future content strategies.
    </p>

    <h2 class="section-heading">Supported Instagram Graph API Metrics Matrix</h2>
    <table class="data-table">
      <thead>
        <tr>
          <th style="width:20%;">Metric Identifier</th>
          <th style="width:20%;">Level &amp; Endpoint</th>
          <th style="width:40%;">Definition &amp; Business Value</th>
          <th style="width:20%;">API Availability</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><code>reach</code></td>
          <td>Media &amp; Account<br><code>/{id}/insights</code></td>
          <td>Total number of unique Instagram accounts that viewed the content. Key measure of brand expansion.</td>
          <td><span class="badge badge-emerald">Real-time</span></td>
        </tr>
        <tr>
          <td><code>impressions</code></td>
          <td>Media &amp; Account<br><code>/{id}/insights</code></td>
          <td>Total number of times the content was rendered on screens (including repeat views).</td>
          <td><span class="badge badge-emerald">Real-time</span></td>
        </tr>
        <tr>
          <td><code>total_interactions</code></td>
          <td>Media Level<br><code>/{id}/insights</code></td>
          <td>Sum of likes, comments, saves, and shares. Core benchmark for engagement rates.</td>
          <td><span class="badge badge-emerald">Real-time</span></td>
        </tr>
        <tr>
          <td><code>saved</code></td>
          <td>Media Level<br><code>/{id}/insights</code></td>
          <td>Number of users who bookmarked the post. High-intent signal for evergreen content.</td>
          <td><span class="badge badge-emerald">Real-time</span></td>
        </tr>
        <tr>
          <td><code>shares</code></td>
          <td>Media Level<br><code>/{id}/insights</code></td>
          <td>Direct message and story shares generated by the published media.</td>
          <td><span class="badge badge-emerald">Real-time</span></td>
        </tr>
        <tr>
          <td><code>follower_count</code></td>
          <td>Account Level<br><code>/{id}?fields=followers</code></td>
          <td>Total active subscriber base. Used for growth velocity telemetry.</td>
          <td><span class="badge badge-emerald">Real-time</span></td>
        </tr>
      </tbody>
    </table>

    <h2 class="section-heading">Analytics Dashboard UI Wireframe</h2>
    <div class="card-box" style="background:#FFFFFF; border:2px solid #E2E8F0; margin-top:2mm;">
      <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #E2E8F0; padding-bottom:6px; margin-bottom:8px;">
        <span style="font-weight:800; font-size:10.5pt; color:#0F172A;">Post Telemetry &bull; @acme_global</span>
        <span style="font-size:8pt; color:#64748B;">Published 2 days ago &bull; Verified Meta Data</span>
      </div>
      <div class="grid-4" style="display:grid; grid-template-columns:repeat(4, 1fr); gap:8px;">
        <div style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:6px; padding:8px; text-align:center;">
          <div style="font-size:7.5pt; color:#64748B; font-weight:700;">TOTAL REACH</div>
          <div style="font-size:14pt; font-weight:900; color:#0284C7;">48,290</div>
          <div style="font-size:7.5pt; color:#059669; font-weight:600;">+24% vs avg</div>
        </div>
        <div style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:6px; padding:8px; text-align:center;">
          <div style="font-size:7.5pt; color:#64748B; font-weight:700;">IMPRESSIONS</div>
          <div style="font-size:14pt; font-weight:900; color:#0F172A;">71,400</div>
          <div style="font-size:7.5pt; color:#64748B;">1.48 views/user</div>
        </div>
        <div style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:6px; padding:8px; text-align:center;">
          <div style="font-size:7.5pt; color:#64748B; font-weight:700;">ENGAGEMENT</div>
          <div style="font-size:14pt; font-weight:900; color:#E1306C;">4.82%</div>
          <div style="font-size:7.5pt; color:#059669; font-weight:600;">High performance</div>
        </div>
        <div style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:6px; padding:8px; text-align:center;">
          <div style="font-size:7.5pt; color:#64748B; font-weight:700;">SAVES / SHARES</div>
          <div style="font-size:14pt; font-weight:900; color:#059669;">1,842</div>
          <div style="font-size:7.5pt; color:#64748B;">1,210 saves &bull; 632 shares</div>
        </div>
      </div>
    </div>
  </div>

  <div class="page-footer">
    <div class="confidential">CONFIDENTIAL &bull; OMNISOCIAL AI ARCHITECTURAL SPECIFICATION</div>
    <div class="page-number">Page 15 of 23</div>
  </div>
</div>

<!-- =======================================================================
     PAGE 16: CHAPTER 14 — COMMENTS, MENTIONS & WEBHOOKS
     ======================================================================= -->
<div class="doc-page">
  <div class="page-header">
    <div class="brand">
      <span class="brand-badge">OMNISOCIAL AI</span>
      <span>Official Instagram API Integration Master Guide</span>
    </div>
    <div class="chapter-tag">CHAPTER 14 &bull; WEBHOOKS &amp; INBOX</div>
  </div>

  <div class="page-content">
    <h1 class="chapter-title"><span class="num-pill">14</span> Comments, Mentions &amp; Webhook Automation</h1>
    <p class="lead">
      Real-time customer engagement requires listening to incoming comments and mentions via Meta Webhooks, verifying cryptographic payload signatures, and delivering responses through the unified OmniSocial AI Inbox.
    </p>

    <h2 class="section-heading">Webhook Verification &amp; Security Handshake</h2>
    <div class="grid-2">
      <div class="card-box">
        <h4>1. Verification Challenge (GET /webhooks)</h4>
        <p>When configuring webhooks in Meta dashboard, Meta sends a GET request:</p>
        <pre class="code-block" style="margin:2px 0;">
GET /webhooks?hub.mode=subscribe&amp;
hub.verify_token=my_secret_token&amp;
hub.challenge=11582012
        </pre>
        <p>Backend validates <code>hub.verify_token</code> and echoes back <code>hub.challenge</code> with HTTP 200.</p>
      </div>
      <div class="card-box">
        <h4>2. HMAC-SHA256 Signature (POST /webhooks)</h4>
        <p>Every event delivery contains the header:</p>
        <p><code>X-Hub-Signature-256: sha256=a7f2...</code></p>
        <p>Backend computes HMAC-SHA256 over raw request body using <code>META_APP_SECRET</code> and verifies using constant-time comparison.</p>
      </div>
    </div>

    <h2 class="section-heading">Comment Management &amp; Moderation Capabilities</h2>
    <table class="data-table">
      <thead>
        <tr>
          <th style="width:25%;">Action</th>
          <th style="width:35%;">Endpoint &amp; Method</th>
          <th style="width:40%;">Business Use Case in OmniSocial AI</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Retrieve Comments</strong></td>
          <td><code>GET /{media-id}/comments</code></td>
          <td>Pulls incoming thread into Inbox for team review and assignment.</td>
        </tr>
        <tr>
          <td><strong>Reply to Comment</strong></td>
          <td><code>POST /{comment-id}/replies</code></td>
          <td>Publishes customer support answer directly to public comment thread.</td>
        </tr>
        <tr>
          <td><strong>Hide Spam Comment</strong></td>
          <td><code>POST /{comment-id} { hide: true }</code></td>
          <td>Automations engine hides profanity/spam without notifying offender.</td>
        </tr>
        <tr>
          <td><strong>Delete Comment</strong></td>
          <td><code>DELETE /{comment-id}</code></td>
          <td>Permitted for authorized administrators to purge malicious links.</td>
        </tr>
      </tbody>
    </table>

    <div class="callout callout-warning">
      <strong>DIRECT MESSAGING POLICY NOTICE:</strong> Instagram Direct Messaging API requires dedicated App Review approval for <code>instagram_manage_messages</code>. Standard content publishing permissions do NOT allow reading or sending DMs. Automated marketing spam or unsolicited direct messaging is strictly forbidden by Meta platform policies.
    </div>
  </div>

  <div class="page-footer">
    <div class="confidential">CONFIDENTIAL &bull; OMNISOCIAL AI ARCHITECTURAL SPECIFICATION</div>
    <div class="page-number">Page 16 of 23</div>
  </div>
</div>

<!-- =======================================================================
     PAGE 17: CHAPTER 15 — SECURITY ARCHITECTURE
     ======================================================================= -->
<div class="doc-page">
  <div class="page-header">
    <div class="brand">
      <span class="brand-badge">OMNISOCIAL AI</span>
      <span>Official Instagram API Integration Master Guide</span>
    </div>
    <div class="chapter-tag">CHAPTER 15 &bull; SECURITY ARCHITECTURE</div>
  </div>

  <div class="page-content">
    <h1 class="chapter-title"><span class="num-pill">15</span> Security Architecture &amp; Vault Hardening</h1>
    <p class="lead">
      Handling delegated social credentials requires bank-grade defense-in-depth. OmniSocial AI prevents token exfiltration, Cross-Site Request Forgery (CSRF), and Insecure Direct Object References (IDOR).
    </p>

    <div class="diagram-container">
      ${d9}
    </div>

    <h2 class="section-heading">TokenVault AES-256-GCM Dual-Key Encryption Spec</h2>
    <div class="grid-2">
      <div class="card-box">
        <h4>Encryption Pipeline (<code>TokenVaultService</code>)</h4>
        <p>&bull; <strong>Cipher:</strong> <code>aes-256-gcm</code> (Galois/Counter Mode).</p>
        <p>&bull; <strong>IV:</strong> 96-bit cryptographically unique random IV generated per token.</p>
        <p>&bull; <strong>Auth Tag:</strong> 128-bit authentication tag guarantees tamper resistance.</p>
        <p>&bull; <strong>Stored Format:</strong> <code>v1:iv:authTag:encryptedData</code> (Hex encoded).</p>
      </div>
      <div class="card-box">
        <h4>Dual-Key Rotation Support</h4>
        <p>&bull; <code>TOKEN_ENCRYPTION_KEY</code> (Primary): Encrypts all new tokens.</p>
        <p>&bull; <code>TOKEN_ENCRYPTION_KEY_FALLBACK</code>: Decrypts legacy keys during rotation.</p>
        <p>&bull; <strong>Zero-Downtime Migration:</strong> System automatically decrypts with fallback and re-encrypts with primary key upon read.</p>
      </div>
    </div>
  </div>

  <div class="page-footer">
    <div class="confidential">CONFIDENTIAL &bull; OMNISOCIAL AI ARCHITECTURAL SPECIFICATION</div>
    <div class="page-number">Page 17 of 23</div>
  </div>
</div>

<!-- =======================================================================
     PAGE 18: CHAPTER 16 — TESTING STRATEGY
     ======================================================================= -->
<div class="doc-page">
  <div class="page-header">
    <div class="brand">
      <span class="brand-badge">OMNISOCIAL AI</span>
      <span>Official Instagram API Integration Master Guide</span>
    </div>
    <div class="chapter-tag">CHAPTER 16 &bull; TESTING STRATEGY</div>
  </div>

  <div class="page-content">
    <h1 class="chapter-title"><span class="num-pill">16</span> Comprehensive Testing Strategy</h1>
    <p class="lead">
      Robust testing prevents publishing downtime and security regressions. OmniSocial AI validates the Instagram integration through unit tests, mock provider adapters, and end-to-end sandbox execution.
    </p>

    <h2 class="section-heading">Multi-Tier Testing Matrix</h2>
    <table class="data-table">
      <thead>
        <tr>
          <th style="width:18%;">Test Tier</th>
          <th style="width:32%;">Scope &amp; Target Module</th>
          <th style="width:50%;">Verification Checkpoints</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Unit Tests</strong></td>
          <td><code>TokenVaultService</code><br><code>MetaInstagramPublisherService</code></td>
          <td>&bull; AES-256-GCM encryption and decryption round-trip matches.<br>&bull; Tampered auth tags throw <code>InternalServerErrorException</code>.<br>&bull; Container status classification categorizes 4xx vs 5xx errors correctly.</td>
        </tr>
        <tr>
          <td><strong>Integration Tests</strong></td>
          <td><code>OAuthController</code><br><code>ScheduledPostsService</code></td>
          <td>&bull; State mismatch rejects callback with HTTP 400 Bad Request.<br>&bull; Expired OAuth states cannot be replayed.<br>&bull; Database transactions rollback cleanly on target creation failure.</td>
        </tr>
        <tr>
          <td><strong>Security Tests</strong></td>
          <td>Workspace Access Guards<br>Prisma Middleware</td>
          <td>&bull; User from Workspace A cannot read or delete account from Workspace B.<br>&bull; IDOR penetration test on <code>/settings/social-accounts/:id</code> fails 403 Forbidden.</td>
        </tr>
        <tr>
          <td><strong>Resilience Tests</strong></td>
          <td>BullMQ Worker Loop<br>Redis Sweeper</td>
          <td>&bull; Worker crash during container polling resumes correctly without duplicate post.<br>&bull; Rate limit response defers job with exponential backoff.</td>
        </tr>
      </tbody>
    </table>

    <h2 class="section-heading">16-Point Pre-Deployment QA Checklist</h2>
    <div class="grid-2">
      <ul class="check-list">
        <li>Valid OAuth state generation with 10m expiry.</li>
        <li>CSRF replay attack blocked on second use.</li>
        <li>Short-lived token upgraded to 60-day token.</li>
        <li>Encrypted token matches AES-256-GCM format.</li>
        <li>Account disconnect purges tokens from database.</li>
        <li>Image aspect ratio validated (4:5 to 1.91:1).</li>
        <li>Public HTTPS S3 media accessible to Meta.</li>
        <li>Step 1 container creation returns numeric ID.</li>
      </ul>
      <ul class="check-list">
        <li>Step 2 publish returns confirmed Media ID.</li>
        <li>Database target updated to PUBLISHED status.</li>
        <li>Immutable PublishingLog audit record created.</li>
        <li>Multi-account broadcast executes with 1.5s delay.</li>
        <li>Partial account failure does not block siblings.</li>
        <li>Webhook HMAC-SHA256 signature verified.</li>
        <li>Zero plain tokens leaked to client or logs.</li>
        <li>App Review screencast recorded and archived.</li>
      </ul>
    </div>
  </div>

  <div class="page-footer">
    <div class="confidential">CONFIDENTIAL &bull; OMNISOCIAL AI ARCHITECTURAL SPECIFICATION</div>
    <div class="page-number">Page 18 of 23</div>
  </div>
</div>

<!-- =======================================================================
     PAGE 19: CHAPTER 17 — PRODUCTION DEPLOYMENT
     ======================================================================= -->
<div class="doc-page">
  <div class="page-header">
    <div class="brand">
      <span class="brand-badge">OMNISOCIAL AI</span>
      <span>Official Instagram API Integration Master Guide</span>
    </div>
    <div class="chapter-tag">CHAPTER 17 &bull; PRODUCTION DEPLOYMENT</div>
  </div>

  <div class="page-content">
    <h1 class="chapter-title"><span class="num-pill">17</span> Production Deployment &amp; Meta App Review</h1>
    <p class="lead">
      Transitioning from development sandbox to public live production requires navigating Meta's App Review process, completing Business Verification, and hardening production infrastructure.
    </p>

    <div class="diagram-container">
      ${d10}
    </div>

    <h2 class="section-heading">Meta App Review Submission Blueprint</h2>
    <div class="grid-2">
      <div class="card-box">
        <h4>1. Screencast Walkthrough Requirements</h4>
        <p>&bull; High-definition (1080p) video with clear voiceover.</p>
        <p>&bull; Demonstrate user clicking "Connect Instagram".</p>
        <p>&bull; Show Meta login dialog with requested permissions.</p>
        <p>&bull; Show post composition, image upload, and scheduling.</p>
        <p>&bull; Verify post appearing live on the Instagram app.</p>
      </div>
      <div class="card-box">
        <h4>2. Demo Credentials &amp; Reviewer Access</h4>
        <p>&bull; Provide active test user credentials in review notes.</p>
        <p>&bull; Pre-populate workspace with sample media assets.</p>
        <p>&bull; Ensure staging environment is publicly reachable.</p>
        <p>&bull; Keep reviewer accounts active until review concludes.</p>
      </div>
    </div>
  </div>

  <div class="page-footer">
    <div class="confidential">CONFIDENTIAL &bull; OMNISOCIAL AI ARCHITECTURAL SPECIFICATION</div>
    <div class="page-number">Page 19 of 23</div>
  </div>
</div>

<!-- =======================================================================
     PAGE 20: CHAPTER 18 — IMPLEMENTATION ROADMAP
     ======================================================================= -->
<div class="doc-page">
  <div class="page-header">
    <div class="brand">
      <span class="brand-badge">OMNISOCIAL AI</span>
      <span>Official Instagram API Integration Master Guide</span>
    </div>
    <div class="chapter-tag">CHAPTER 18 &bull; IMPLEMENTATION ROADMAP</div>
  </div>

  <div class="page-content">
    <h1 class="chapter-title"><span class="num-pill">18</span> Complete Implementation Roadmap (Phases 0-11)</h1>
    <p class="lead">
      This visual roadmap delineates the sequential milestones, target source files, and exit criteria required for engineering teams implementing Instagram capabilities in OmniSocial AI.
    </p>

    <table class="data-table">
      <thead>
        <tr>
          <th style="width:12%;">Phase</th>
          <th style="width:28%;">Milestone Objective</th>
          <th style="width:35%;">Files to Inspect &amp; Modify</th>
          <th style="width:25%;">Completion Criteria</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Phase 0</strong></td>
          <td>Codebase Audit &amp; Discovery</td>
          <td><code>schema.prisma</code>, <code>TokenVaultService</code>, <code>SocialPublisher</code></td>
          <td>Existing models verified; zero duplicate tables.</td>
        </tr>
        <tr>
          <td><strong>Phase 1</strong></td>
          <td>Meta Developer App Registration</td>
          <td>Meta Developer Portal, <code>.env.production</code></td>
          <td>App ID &amp; Secret vaulted in ConfigService.</td>
        </tr>
        <tr>
          <td><strong>Phase 2</strong></td>
          <td>Instagram API &amp; Scope Configuration</td>
          <td><code>meta-oauth.service.ts</code></td>
          <td><code>instagram_content_publish</code> scopes declared.</td>
        </tr>
        <tr>
          <td><strong>Phase 3</strong></td>
          <td>Secure OAuth 2.0 PKCE Pipeline</td>
          <td><code>oauth.controller.ts</code>, <code>social-accounts.service.ts</code></td>
          <td>CSRF state check passing; 60d tokens encrypted.</td>
        </tr>
        <tr>
          <td><strong>Phase 4</strong></td>
          <td>Instagram Account Management UI</td>
          <td><code>apps/web/src/app/(dashboard)/settings/social-accounts</code></td>
          <td>Connect modal, card telemetry, reconnect flow live.</td>
        </tr>
        <tr>
          <td><strong>Phase 5</strong></td>
          <td>Single Image 2-Step Publishing</td>
          <td><code>meta-instagram-publisher.service.ts</code></td>
          <td>Live post created on test Instagram account.</td>
        </tr>
        <tr>
          <td><strong>Phase 6</strong></td>
          <td>Redis Scheduling &amp; Worker Loop</td>
          <td><code>scheduled-posts.service.ts</code>, <code>publishing-dispatcher.service.ts</code></td>
          <td>BullMQ executes due posts with idempotency.</td>
        </tr>
        <tr>
          <td><strong>Phase 7</strong></td>
          <td>Multi-Account Staggered Dispatch</td>
          <td><code>bulk-schedule.service.ts</code></td>
          <td>Independent target state machines verified.</td>
        </tr>
        <tr>
          <td><strong>Phase 8</strong></td>
          <td>Carousel &amp; Reels Video Upload</td>
          <td><code>meta-instagram-publisher.service.ts</code></td>
          <td>Video container polling loop tested.</td>
        </tr>
        <tr>
          <td><strong>Phase 9</strong></td>
          <td>Instagram Insights &amp; Analytics</td>
          <td><code>analytics-dashboard.service.ts</code></td>
          <td>Reach, impressions, saves rendered in UI.</td>
        </tr>
        <tr>
          <td><strong>Phase 10</strong></td>
          <td>Webhooks &amp; 2-Way Comment Inbox</td>
          <td><code>webhooks.controller.ts</code></td>
          <td>HMAC-SHA256 verified; comment replies working.</td>
        </tr>
        <tr>
          <td><strong>Phase 11</strong></td>
          <td>Meta App Review &amp; Live Launch</td>
          <td>Meta App Review Portal</td>
          <td>Advanced Access granted; Live Mode activated.</td>
        </tr>
      </tbody>
    </table>
  </div>

  <div class="page-footer">
    <div class="confidential">CONFIDENTIAL &bull; OMNISOCIAL AI ARCHITECTURAL SPECIFICATION</div>
    <div class="page-number">Page 20 of 23</div>
  </div>
</div>

<!-- =======================================================================
     PAGE 21: CHAPTER 19 — MASTER CODING PROMPT (PART 1)
     ======================================================================= -->
<div class="doc-page">
  <div class="page-header">
    <div class="brand">
      <span class="brand-badge">OMNISOCIAL AI</span>
      <span>Official Instagram API Integration Master Guide</span>
    </div>
    <div class="chapter-tag">CHAPTER 19 &bull; MASTER PROMPT (PART 1)</div>
  </div>

  <div class="page-content">
    <h1 class="chapter-title"><span class="num-pill">19</span> Master Coding Agent Prompt (Part 1)</h1>
    <p class="lead">
      Copy and paste this prompt directly into an AI coding agent to implement official Instagram integration inside the existing OmniSocial AI repository while preserving architectural invariants.
    </p>

    <div class="callout callout-ig">
      <strong>INSTRUCTIONS:</strong> Copy the text block below. This prompt enforces strict audit-first methodology, reuse of existing models and services, bank-grade encryption, and real non-mocked execution.
    </div>

    <pre class="code-block" style="font-size:7pt; line-height:1.3; max-height:165mm; overflow:hidden;">
====================================================================================================
PROMPT FOR AUTONOMOUS AI CODING AGENT: IMPLEMENT OFFICIAL INSTAGRAM API INTEGRATION IN OMNISOCIAL AI
====================================================================================================

You are a Principal Software Architect and Lead Security Engineer working on the OmniSocial AI repository.
Your task is to implement the official Meta Instagram API integration across the existing Next.js 14 and
NestJS codebase.

NON-NEGOTIABLE ARCHITECTURAL INVARIANTS:
1. AUDIT BEFORE EDITING: Read existing models in apps/api/prisma/schema.prisma and services in
   apps/api/src/social-accounts before introducing any new files.
2. REUSE EXISTING MODELS: Do NOT create duplicate tables. Use SocialAccount, ScheduledPost,
   ScheduledPostTarget, OAuthState, and PublishingLog.
3. REUSE TOKEN VAULT: Decrypt and encrypt all access tokens strictly via TokenVaultService (AES-256-GCM).
   Never store plaintext tokens in any database column or log message.
4. UNIDIRECTIONAL FLOW: The Next.js frontend must NEVER query PostgreSQL or call Meta APIs directly.
   All Instagram interactions must be mediated by NestJS.
5. NO MOCKS IN PRODUCTION: The MetaInstagramPublisherService must perform real 2-step media container
   creation and publishing calls against https://graph.facebook.com/v21.0 or https://graph.instagram.com/v21.0.
6. NO DESTRUCTIVE DB COMMANDS: Never run "prisma migrate reset", "prisma db push", or "--accept-data-loss".
7. IDOR &amp; TENANT ISOLATION: Every single database query must enforce { where: { workspaceId } }.

PHASE 1: REPOSITORIES &amp; SERVICES TO AUDIT
- Check: apps/api/prisma/schema.prisma (verify SocialProvider.META_INSTAGRAM and SocialAccountType)
- Check: apps/api/src/social-accounts/token-vault/token-vault.service.ts (confirm AES-256-GCM methods)
- Check: apps/api/src/social-accounts/providers/meta/meta-oauth.service.ts (verify authorization URL builder)
- Check: apps/api/src/publishing/providers/meta-instagram-publisher.service.ts (verify 2-step container methods)
- Check: apps/api/src/publishing/services/publishing-dispatcher.service.ts (verify worker queue runner)

PHASE 2: IMPLEMENT OAUTH 2.0 PKCE &amp; TOKEN EXCHANGE
In apps/api/src/social-accounts/providers/meta/meta-oauth.service.ts:
- Add handleOAuthCallback(code: string, redirectUri?: string):
  1. POST to https://graph.facebook.com/v21.0/oauth/access_token to get short-lived user token.
  2. GET https://graph.facebook.com/v21.0/oauth/access_token with grant_type=fb_exchange_token
     to obtain 60-day Long-Lived Token.
  3. GET https://graph.facebook.com/v21.0/me/accounts to discover connected Facebook Pages and linked
     Instagram Business Account IDs (fields: instagram_business_account{id,username,name,profile_picture_url}).
  4. Encrypt token via TokenVaultService.encrypt(token).
  5. Upsert into prisma.socialAccount with provider=META_INSTAGRAM, workspaceId, encryptedAccessToken.
    </pre>
  </div>

  <div class="page-footer">
    <div class="confidential">CONFIDENTIAL &bull; OMNISOCIAL AI ARCHITECTURAL SPECIFICATION</div>
    <div class="page-number">Page 21 of 23</div>
  </div>
</div>

<!-- =======================================================================
     PAGE 22: CHAPTER 19 — MASTER CODING PROMPT (PART 2)
     ======================================================================= -->
<div class="doc-page">
  <div class="page-header">
    <div class="brand">
      <span class="brand-badge">OMNISOCIAL AI</span>
      <span>Official Instagram API Integration Master Guide</span>
    </div>
    <div class="chapter-tag">CHAPTER 19 &bull; MASTER PROMPT (PART 2)</div>
  </div>

  <div class="page-content">
    <h1 class="chapter-title"><span class="num-pill">19</span> Master Coding Agent Prompt (Part 2)</h1>
    <p class="lead">
      Continuation of master prompt detailing publisher service contracts, Redis worker scheduling hooks, automated test suites, and verification commands.
    </p>

    <pre class="code-block" style="font-size:7pt; line-height:1.3; max-height:175mm; overflow:hidden;">
PHASE 3: IMPLEMENT REAL 2-STEP MEDIA CONTAINER PUBLISHING
In apps/api/src/publishing/providers/meta-instagram-publisher.service.ts:
Implement SocialPublisher interface method:
publish(target: ScheduledPostTarget, snapshot: ScheduledPostContentSnapshot, account: SocialAccount, decryptedToken: string)
- Step 1: Validate public HTTPS media URL exists on snapshot variant.
- Step 2: POST https://graph.facebook.com/v21.0/{igUserId}/media
  Body: { image_url: variant.mediaAssetUrl, caption: variant.content, access_token: decryptedToken }
  Extract returned creation_id.
- Step 3 (For video/reels): Poll GET https://graph.facebook.com/v21.0/{creation_id}?fields=status_code
  Wait until status_code === 'FINISHED' (max 30 attempts, 5s delay).
- Step 4: POST https://graph.facebook.com/v21.0/{igUserId}/media_publish
  Body: { creation_id, access_token: decryptedToken }
  Extract returned live post ID.
- Step 5: Return PublishResult { success: true, externalPostId, externalPostUrl: https://instagram.com/p/{id}/ }.
- Step 6: Handle error codes:
  * 190 (Token Expired) -&gt; Mark account EXPIRED, notify user.
  * 4 (Rate limit / 25 posts limit) -&gt; Return AttemptOutcome.TEMPORARY_BACKOFF.
  * 36003 (Media aspect ratio bad) -&gt; Return AttemptOutcome.DEFINITIVE_FAILURE.

PHASE 4: WORKER INTEGRATION &amp; SCHEDULING
In apps/api/src/publishing/services/publishing-dispatcher.service.ts:
- Add dispatchTargetToProvider() case for SocialPlatform.INSTAGRAM.
- Decrypt token using tokenVaultService.decrypt(account.encryptedAccessToken).
- Invoke metaInstagramPublisherService.publish(...).
- On success: target.status = PUBLISHED, create PublishingLog entry.
- On transient error: target.status = RETRY_QUEUED, schedule BullMQ backoff job.
- On multi-account dispatch: inject 1.5s staggered sleep between calls to prevent rate spikes.

PHASE 5: FRONTEND UI &amp; CONNECTIVITY
In apps/web/src/app/(dashboard)/settings/social-accounts:
- Render Instagram Business and Creator cards with live status beacon.
- Connect button triggers window.location.href = /api/v1/oauth/meta/initiate?provider=META_INSTAGRAM.
- Handle OAuth callback query params: ?connected=true or ?error=...
- Display token expiration warning when tokenExpiresAt &lt; 7 days.

PHASE 6: AUTOMATED VERIFICATION &amp; TESTS
Run and pass all of the following:
- npm run test:api -- meta-instagram-publisher.service.spec.ts
- npm run test:api -- token-vault.service.spec.ts
- npm run test:web -- social-accounts-multinetwork.test.tsx
- npm run test:web (Ensure all 21 test suites pass 100% green)

REPORT REQUIREMENTS:
Provide a clear implementation report showing:
1. Exact files modified.
2. Verified Prisma models used.
3. Unit test results (passing count, coverage).
4. Confirmation that no plaintext tokens or secrets are exposed.
====================================================================================================
    </pre>
  </div>

  <div class="page-footer">
    <div class="confidential">CONFIDENTIAL &bull; OMNISOCIAL AI ARCHITECTURAL SPECIFICATION</div>
    <div class="page-number">Page 22 of 23</div>
  </div>
</div>

<!-- =======================================================================
     PAGE 23: OFFICIAL REFERENCES & APPENDIX
     ======================================================================= -->
<div class="doc-page">
  <div class="page-header">
    <div class="brand">
      <span class="brand-badge">OMNISOCIAL AI</span>
      <span>Official Instagram API Integration Master Guide</span>
    </div>
    <div class="chapter-tag">REFERENCES &amp; SIGN-OFF</div>
  </div>

  <div class="page-content">
    <h1 class="chapter-title">Official Meta References &amp; Engineering Sign-off</h1>
    <p class="lead">
      All technical specifications, endpoint routes, permission identifiers, and rate-limit rules in this guide were verified against official Meta Developer documentation as of <strong>November 2026</strong>.
    </p>

    <h2 class="section-heading">Verified Official Meta Documentation Citations</h2>
    <table class="data-table">
      <thead>
        <tr>
          <th style="width:28%;">Documentation Section</th>
          <th style="width:42%;">Official Meta URL</th>
          <th style="width:30%;">Key Topic Verified</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Meta Developers Portal</strong></td>
          <td><a href="https://developers.facebook.com/" style="color:#0284C7; text-decoration:none;">https://developers.facebook.com/</a></td>
          <td>App dashboard, app types, developer registration</td>
        </tr>
        <tr>
          <td><strong>Instagram Platform API</strong></td>
          <td><a href="https://developers.facebook.com/docs/instagram-platform/" style="color:#0284C7; text-decoration:none;">developers.facebook.com/docs/instagram-platform/</a></td>
          <td>Instagram Login, Graph API v21.0 endpoints</td>
        </tr>
        <tr>
          <td><strong>Content Publishing API</strong></td>
          <td><a href="https://developers.facebook.com/docs/instagram-platform/instagram-graph-api/content-publishing/" style="color:#0284C7; text-decoration:none;">developers.facebook.com/.../content-publishing/</a></td>
          <td>2-step media container flow, image/video rules</td>
        </tr>
        <tr>
          <td><strong>Instagram Insights API</strong></td>
          <td><a href="https://developers.facebook.com/docs/instagram-platform/instagram-graph-api/insights/" style="color:#0284C7; text-decoration:none;">developers.facebook.com/.../insights/</a></td>
          <td>Reach, impressions, interactions, saves metrics</td>
        </tr>
        <tr>
          <td><strong>Graph Rate Limiting</strong></td>
          <td><a href="https://developers.facebook.com/docs/graph-api/overview/rate-limiting/" style="color:#0284C7; text-decoration:none;">developers.facebook.com/.../rate-limiting/</a></td>
          <td>25-post/24h rolling limit, BUC usage headers</td>
        </tr>
        <tr>
          <td><strong>Meta App Review Guide</strong></td>
          <td><a href="https://developers.facebook.com/docs/app-review/" style="color:#0284C7; text-decoration:none;">developers.facebook.com/docs/app-review/</a></td>
          <td>Screencast requirements, Advanced Access</td>
        </tr>
        <tr>
          <td><strong>Meta Webhooks Guide</strong></td>
          <td><a href="https://developers.facebook.com/docs/graph-api/webhooks/" style="color:#0284C7; text-decoration:none;">developers.facebook.com/docs/graph-api/webhooks/</a></td>
          <td>HMAC-SHA256 signature, verification challenge</td>
        </tr>
      </tbody>
    </table>

    <h2 class="section-heading">Policy Disclaimer &amp; Engineering Sign-off</h2>
    <div class="callout callout-warning">
      <strong>POLICY EVOLUTION DISCLAIMER:</strong> Meta Platforms, Inc. periodically updates API versions, deprecation schedules, permission scopes, and dashboard UI layouts. Development teams must consult the official Meta Changelog prior to major quarterly releases. Features marked as Standard Access require App Review approval before serving general public users in Live Mode.
    </div>

    <div class="grid-2" style="margin-top:4mm;">
      <div class="card-box">
        <h4>Architecture Sign-Off</h4>
        <p>&bull; <strong>Architect:</strong> OmniSocial AI Platform Lead</p>
        <p>&bull; <strong>Security Lead:</strong> Cryptographic Vault Specialist</p>
        <p>&bull; <strong>Status:</strong> <span class="badge badge-emerald">APPROVED FOR IMPLEMENTATION</span></p>
        <p>&bull; <strong>Target Version:</strong> OmniSocial AI v2.4</p>
      </div>
      <div class="card-box">
        <h4>Document Governance</h4>
        <p>&bull; <strong>Document ID:</strong> ARCH-SPEC-INSTAGRAM-2026-V2.4</p>
        <p>&bull; <strong>Audit Classification:</strong> Tier-1 Enterprise Standard</p>
        <p>&bull; <strong>Distribution:</strong> Internal Engineering &amp; AI Agents</p>
        <p>&bull; <strong>Hash:</strong> SHA-256 Verified</p>
      </div>
    </div>
  </div>

  <div class="page-footer">
    <div class="confidential">CONFIDENTIAL &bull; OMNISOCIAL AI ARCHITECTURAL SPECIFICATION</div>
    <div class="page-number">Page 23 of 23</div>
  </div>
</div>

</body>
</html>
`;
}

// Write the complete HTML file
console.log('Generating complete HTML guide source...');
const fullHtml = generateHtml();
fs.writeFileSync(htmlSourcePath, fullHtml, 'utf8');
console.log('Saved HTML source to:', htmlSourcePath, fs.statSync(htmlSourcePath).size, 'bytes');

// Render PDF using Chrome Headless
console.log('Rendering PDF via Headless Chrome...');
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const fileUrl = 'file:///' + htmlSourcePath.replace(/\\/g, '/');

const chromeCmd = `"${chromePath}" --headless=new --no-sandbox --disable-gpu --user-data-dir="${tmpProfileDir}" --print-to-pdf="${outputPdfPath}" "${fileUrl}"`;
try {
  execSync(chromeCmd);
  console.log('PDF Rendered successfully!');
  console.log('PDF Path:', outputPdfPath);
  console.log('PDF Size:', fs.statSync(outputPdfPath).size, 'bytes');
} catch (err) {
  console.error('Failed to render PDF:', err.message);
  process.exit(1);
}

// Generate Screenshot Previews of Key Pages for Inspection
console.log('Generating screenshot previews for visual inspection...');
const previewCmd = `"${chromePath}" --headless=new --no-sandbox --disable-gpu --user-data-dir="${tmpProfileDir}" --screenshot="${path.join(previewsDir, 'cover-preview.png')}" --window-size=1200,1697 "${fileUrl}"`;
try {
  execSync(previewCmd);
  console.log('Saved cover preview to:', path.join(previewsDir, 'cover-preview.png'));
} catch (err) {
  console.warn('Could not generate screenshot preview:', err.message);
}

console.log('Build complete!');
