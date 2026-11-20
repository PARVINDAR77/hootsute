# OmniSocial AI — Social Media Platform Integrations Specification

This document details the official API capabilities, authentication models, media requirements, and delivery mechanics for all 8 supported social media networks in OmniSocial AI.

---

## 1. Supported Platform Matrix

| Platform | Provider Key | Account Types Supported | Publishing Capabilities | Media Formats Supported | Auth & Security Protocol |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Instagram** | `META_INSTAGRAM` | Professional (Business & Creator) | Single Image, Carousel (up to 10), Reels | JPEG, PNG, MP4, MOV (1:1, 4:5, 9:16) | Meta Graph API v21.0 OAuth 2.0 + AES-256-GCM Envelope Encryption |
| **Facebook** | `META_FACEBOOK` | Pages | Status, Single Photo, Multi-Photo, Video, Link Post | JPEG, PNG, GIF, MP4, WebM | Meta Graph API v21.0 OAuth 2.0 Page Tokens |
| **X (Twitter)** | `TWITTER` | Professional & Standard | Tweets, Threads, Polls (text), Media Posts | JPEG, PNG, GIF, MP4 (max 512MB) | Twitter API v2 OAuth 2.0 PKCE |
| **LinkedIn** | `LINKEDIN` | Company Pages & Member Profiles | Text Share, Single Image, Document (PDF), Video | JPEG, PNG, PDF, MP4 | LinkedIn Community Management API OAuth 2.0 |
| **Pinterest** | `PINTEREST` | Business Accounts | Pins, Idea Pins, Board Selection | JPEG, PNG, MP4 (2:3 aspect ratio recommended) | Pinterest API v5 OAuth 2.0 |
| **YouTube** | `YOUTUBE` | Brand Channels & Creator Channels | Shorts, Standard Video Dispatch, Community Posts | MP4, MOV (16:9 landscape, 9:16 vertical Shorts) | Google OAuth 2.0 (YouTube Data API v3) |
| **TikTok** | `TIKTOK` | Business & Creator Accounts | Video Post, Direct Creator Publish | MP4, WebM (9:16 vertical video) | TikTok for Business Content Posting API |
| **Threads** | `THREADS` | Professional Accounts | Text Post (up to 500 chars), Single/Multi-Photo, Video | JPEG, PNG, MP4 | Meta Threads API OAuth 2.0 |

---

## 2. Token Security & Envelope Encryption (`TokenVault`)

All OAuth access tokens and refresh tokens are encrypted at rest using AES-256-GCM envelope encryption:
- **Cipher**: AES-256-GCM
- **Format**: `v1:<12-byte IV hex>:<16-byte Auth Tag hex>:<Ciphertext hex>`
- **Key Rotation**: Supported via dual-key version headers (`v1:`, `v2:`).
- **Tenant Isolation**: Tokens are strictly scoped to the workspace owning the connection and are never exposed to client-side code.

---

## 3. Disconnection & Replay Prevention
- **State Tokens**: Single-use cryptographically signed random states prevent OAuth CSRF attacks.
- **Revocation**: Disconnecting a channel immediately invalidates local credentials in PostgreSQL and triggers upstream token revocation where supported.
