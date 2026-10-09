# Authentication & Session Management Flow

## 1. Authentication Lifecycle Diagram

```mermaid
sequenceDiagram
    autonumber
    actor User as User Browser
    participant Web as Next.js Web (Client)
    participant API as NestJS API (/api/v1)
    participant DB as PostgreSQL Database

    Note over User, API: 1. Registration Flow
    User->>Web: Enters Name, Email, Password
    Web->>API: POST /api/v1/auth/register
    API->>API: Validate DTO & Normalize Email
    API->>DB: Check if Email exists
    API->>API: Hash password (bcrypt 12 rounds)
    API->>DB: Persist User (role=BUSINESS_OWNER)
    API->>DB: Record AuditLog (AUTH_REGISTER)
    API-->>Web: 201 Created (Safe User Profile)

    Note over User, API: 2. Login Flow
    User->>Web: Submits Email & Password
    Web->>API: POST /api/v1/auth/login
    API->>DB: Find User by normalized email
    API->>API: Verify Bcrypt Hash & Check Active Status
    API->>API: Generate Access Token (JWT, 15m) & Refresh Token (Crypto Random)
    API->>DB: Save RefreshSession (SHA-256 tokenHash, IP, UA, expiresAt)
    API->>DB: Record AuditLog (AUTH_LOGIN)
    API-->>Web: Set HttpOnly Cookie (refreshToken) + Return Access Token & User Profile

    Note over User, API: 3. Authenticated Request & Auto-Refresh
    Web->>API: GET /api/v1/auth/me (Authorization: Bearer <AccessToken>)
    API->>API: Validate JWT Signature & Expiry
    API-->>Web: 200 OK (User Profile)

    Note over User, API: 4. Access Token Expired (401 Response)
    Web->>API: GET /api/v1/dashboard/data (Expired Token)
    API-->>Web: 401 Unauthorized
    Web->>API: POST /api/v1/auth/refresh (Cookie / Refresh Token)
    API->>DB: Find session by SHA-256 tokenHash
    alt Token Valid & Not Revoked
        API->>API: Generate New Access Token & New Refresh Token (Rotation)
        API->>DB: Update RefreshSession with New Hash
        API-->>Web: 200 OK (New Tokens)
        Web->>API: Replay original request
    else Token Revoked / Reused Detection
        API->>DB: Revoke all sessions for this user (Breach Containment)
        API-->>Web: 401 Unauthorized (Force Re-login)
    end

    Note over User, API: 5. Logout Flow
    User->>Web: Clicks Logout
    Web->>API: POST /api/v1/auth/logout
    API->>DB: Mark current RefreshSession revokedAt = NOW()
    API->>DB: Record AuditLog (AUTH_LOGOUT)
    API-->>Web: 200 OK & Clear HttpOnly Refresh Cookie
    Web->>Web: Redirect to /login
```

## 2. Key Security Properties

1. **Short-Lived Access Tokens**:
   - 15 minutes validity limit prevents window of exposure if intercepted.
2. **Refresh Token Rotation & Invalidation**:
   - Each refresh request issues a new token pair and invalidates the previous token.
   - If an already-rotated token is presented again (token reuse), the system marks all sessions for that user as revoked immediately as an automated breach containment measure.
3. **Transport Security**:
   - Refresh tokens are transmitted via `HttpOnly`, `SameSite=Lax` cookies (and optionally via request body for mobile/CLI compatibility).
   - In production environments, the `Secure` attribute is strictly enforced.
4. **Credential Isolation**:
   - Password hashes are excluded from all Prisma default selection returns for public/safe user DTOs.
