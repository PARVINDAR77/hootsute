# API Conventions & Guidelines

## 1. Base URL & Versioning

All REST API endpoints are strictly versioned under:
```
http(s)://<domain>/api/v1
```

## 2. Request & Response Envelopes

### Success Envelope
Successful requests return standard JSON with data directly or wrapped cleanly:
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation completed successfully"
}
```

### Standardized Error Payload
In case of exceptions or validation failures, the global `HttpExceptionFilter` intercepts errors and returns:
```json
{
  "statusCode": 400,
  "timestamp": "2026-10-09T05:30:00.000Z",
  "path": "/api/v1/auth/login",
  "correlationId": "req-98f98d7a-12e4-4a25-9a84-0a3cbfe99881",
  "error": "Bad Request",
  "message": ["email must be an email", "password must be longer than or equal to 8 characters"]
}
```

## 3. Endpoints Matrix

### Authentication & System (Stage 1)
| Method | Endpoint | Access Level | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/auth/register` | Public | Register new account (enforced `BUSINESS_OWNER`) |
| `POST` | `/api/v1/auth/login` | Public | Authenticate user & issue tokens |
| `POST` | `/api/v1/auth/refresh` | Public (Token) | Rotate access token and refresh session |
| `POST` | `/api/v1/auth/logout` | Authenticated | Revoke current refresh session & clear cookies |
| `POST` | `/api/v1/auth/logout-all` | Authenticated | Revoke all active sessions for current user |
| `GET`  | `/api/v1/auth/me` | Authenticated | Retrieve current user profile (safe DTO) |
| `GET`  | `/api/v1/health` | Public | System uptime & node process health check |
| `GET`  | `/api/v1/health/ready` | Public | Verifies PostgreSQL DB connectivity & readiness |
| `GET`  | `/api/docs` | Public | Interactive Swagger / OpenAPI documentation UI |

### Workspaces & Multi-Tenancy (Stage 2)
| Method | Endpoint | Access Level | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/workspaces` | Authenticated | Create business workspace (creator becomes OWNER) |
| `GET`  | `/api/v1/workspaces` | Authenticated | List all authorized workspaces for current user |
| `GET`  | `/api/v1/workspaces/:workspaceId` | Workspace Member | Retrieve workspace details |
| `PATCH`| `/api/v1/workspaces/:workspaceId` | Workspace ADMIN / OWNER | Update workspace settings |
| `GET`  | `/api/v1/workspaces/:workspaceId/members` | Workspace Member | List all members of the workspace |
| `PATCH`| `/api/v1/workspaces/:workspaceId/members/:memberId` | Workspace ADMIN / OWNER | Update member role/status (anti-escalation enforced) |
| `DELETE`| `/api/v1/workspaces/:workspaceId/members/:memberId` | Workspace ADMIN / OWNER / Self | Remove member (final-owner protected) |
| `POST` | `/api/v1/workspaces/:workspaceId/transfer-ownership` | Workspace OWNER | Atomically transfer ownership to another member |
| `POST` | `/api/v1/workspaces/:workspaceId/invitations` | Workspace ADMIN / OWNER | Issue expiring single-use hashed invitation |
| `GET`  | `/api/v1/workspaces/:workspaceId/invitations` | Workspace ADMIN / OWNER | List pending invitations for the workspace |
| `POST` | `/api/v1/workspaces/:workspaceId/invitations/:invitationId/revoke` | Workspace ADMIN / OWNER | Revoke a pending invitation |
| `GET`  | `/api/v1/invitations/info` | Public | Retrieve public workspace info by raw token |
| `POST` | `/api/v1/invitations/accept` | Authenticated | Claim invitation token and join workspace |
