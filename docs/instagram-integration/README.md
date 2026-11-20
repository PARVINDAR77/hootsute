# OmniSocial AI — Official Instagram API Integration Master Guide

This directory contains the complete technical specification, architectural blueprint, and generated PDF handbook for integrating the official **Meta Instagram Graph API v21.0** into **OmniSocial AI**.

---

## 📁 Artifacts & Directory Structure

```text
d:\hootsute\docs\instagram-integration\
├── OmniSocial_AI_Instagram_API_Integration_Complete_Guide.pdf   # The Master 23-Page Technical PDF Guide
├── guide-source.html                                            # Standalone HTML/CSS/SVG Document Source
├── build-guide.js                                               # Production PDF Generation Pipeline Script
├── generate-diagrams.js                                         # Standalone SVG Vector Diagram Generator
├── generate-previews.js                                         # Visual Inspection Screenshot Generator
├── README.md                                                    # Regeneration & Stack Guide (This File)
├── REFERENCES.md                                                # Official Meta Documentation Citations
├── INSPECTION_REPORT.md                                         # Quality Control & Visual Audit Report
├── diagrams/                                                    # 10 Standalone Vector SVG Diagrams
│   ├── diagram-1-integration-roadmap.svg
│   ├── diagram-2-meta-app-creation.svg
│   ├── diagram-3-oauth-authorization-flow.svg
│   ├── diagram-4-system-architecture.svg
│   ├── diagram-5-account-connection-decision.svg
│   ├── diagram-6-media-publishing-workflow.svg
│   ├── diagram-7-scheduling-redis-workers.svg
│   ├── diagram-8-multi-account-publishing.svg
│   ├── diagram-9-security-architecture.svg
│   └── diagram-10-production-deployment-checklist.svg
└── previews/                                                    # High-Resolution Inspection Screenshots
    ├── cover-preview.png
    ├── page-1.png ... page-23.png
```

---

## 🚀 How to Regenerate the PDF

The PDF generation pipeline utilizes headless Google Chrome with strict CSS `@page` layout controls to produce pixel-perfect, vector-sharp typography and graphics.

### Prerequisites
1. **Node.js**: v18+ (verified on Node.js v24.18.0)
2. **Google Chrome**: Installed at standard path (`C:\Program Files\Google\Chrome\Application\chrome.exe` or configured in script)

### Step 1: Re-build SVG Diagrams (Optional)
If you modify diagram styling or flowchart labels:
```bash
node docs/instagram-integration/generate-diagrams.js
```

### Step 2: Compile & Render Final PDF
To re-compile the 23-page HTML source and render the PDF:
```bash
node docs/instagram-integration/build-guide.js
```
Output: `OmniSocial_AI_Instagram_API_Integration_Complete_Guide.pdf` (~2.59 MB).

### Step 3: Re-generate Screenshot Previews (For QA)
To render high-resolution inspection PNGs of the pages:
```bash
node docs/instagram-integration/generate-previews.js
```

---

## 🏛️ Core Architectural Invariants
1. **Frontend Isolation:** Next.js 14 client-side code never communicates directly with PostgreSQL or external Meta Graph APIs. All authorization and publishing flows are mediated by the NestJS backend API.
2. **Zero Plaintext Tokens:** All long-lived Instagram access tokens are encrypted with `AES-256-GCM` via `TokenVaultService` prior to database persistence.
3. **Multi-Tenant Boundaries:** Every query and worker job strictly filters on `workspaceId` to prevent Insecure Direct Object References (IDOR).
4. **Idempotent Background Publishing:** Redis with BullMQ manages distributed locks and retry policies to guarantee zero duplicate posts.
5. **No Production Mocks:** All media container creation and publishing dispatches target official Meta Graph endpoints (`v21.0`).
