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

## 3. Endpoints Matrix (Stage 1 Foundation)

| Method | Endpoint | Access Level | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/auth/register` | Public | Register new `BUSINESS_OWNER` account |
| `POST` | `/api/v1/auth/login` | Public | Authenticate user & issue tokens |
| `POST` | `/api/v1/auth/refresh` | Public (Requires Valid Refresh Token) | Rotate access token and refresh session |
| `POST` | `/api/v1/auth/logout` | Authenticated | Revoke current refresh session & clear cookies |
| `POST` | `/api/v1/auth/logout-all` | Authenticated | Revoke all active sessions for current user |
| `GET`  | `/api/v1/auth/me` | Authenticated | Retrieve current user profile (safe DTO) |
| `GET`  | `/api/v1/health` | Public | System uptime & node process health check |
| `GET`  | `/api/v1/health/ready` | Public | Verifies PostgreSQL DB connectivity & readiness |
| `GET`  | `/api/docs` | Public | Interactive Swagger / OpenAPI documentation UI |
