# Project Overview — AI Social Media Management SaaS (OmniSocial AI)

## 1. Executive Summary

OmniSocial AI is an enterprise-grade AI-powered Social Media Management platform designed for businesses, agencies, and marketing teams (modeled on established workflows like Hootsuite, Sprout Social, and Buffer). 

The platform enables businesses to:
1. Seamlessly onboard their brands, configure voice/tone guidelines, and invite team members.
2. Connect multi-network social channels (Facebook, Instagram, LinkedIn, X/Twitter, Pinterest).
3. Generate AI-assisted post copy, contextual hashtags, and on-brand creative visuals.
4. Auto-generate curated festival and holiday calendar campaigns.
5. Review content drafts via interactive WhatsApp preview workflows for rapid stakeholder approval.
6. Publish approved scheduled campaigns with real-time delivery and sync.
7. Continuously monitor social analytics, follower growth, and campaign engagement.

## 2. Stage 1 Scope & Boundary

Stage 1 is strictly dedicated to building an **uncompromising foundation**:
- **Monorepo Architecture**: Clean separation between Next.js (Frontend), NestJS (Backend), and Shared Types.
- **Enterprise Authentication & RBAC**: JWT access tokens, rotated database-tracked refresh sessions, password hashing with bcrypt, role-based access control (`SUPER_ADMIN`, `BUSINESS_OWNER`, `BUSINESS_ADMIN`, `BUSINESS_MEMBER`).
- **PostgreSQL & Prisma Persistence**: Strict relational data models, migrations, automated indexing, foreign key cascades, and comprehensive audit logs.
- **API Standards & Observability**: Strict `/api/v1` versioning, centralized validation, structured error filtering, request correlation IDs, Swagger OpenAPI docs, and DB-backed health/readiness endpoints.
- **Modern Responsive Frontend**: Next.js App Router, Tailwind CSS, authenticated route guards, dynamic layouts, honest empty states, and centralized API client.

*Note: In accordance with Stage 1 rules, AI generation APIs, live social publishing integrations, payment gateways, and WhatsApp webhooks are architected for future phases without premature mock endpoints.*

## 3. Core Tech Stack Matrix

| Domain | Technology | Key Libraries / Frameworks |
| :--- | :--- | :--- |
| **Frontend** | Next.js (App Router) | React, TypeScript, Tailwind CSS, Lucide Icons, React Hook Form, Zod |
| **Backend** | NestJS | TypeScript, Express, `@nestjs/jwt`, `@nestjs/swagger`, `class-validator` |
| **Database** | PostgreSQL | Prisma ORM, Prisma Migrate |
| **Security** | Auth & Encryption | bcrypt (salt rounds: 12), short-lived JWT, DB-backed hashed refresh tokens, HttpOnly SameSite cookies |
| **Testing** | Automated Tests | Jest, Supertest, React Testing Tools |
