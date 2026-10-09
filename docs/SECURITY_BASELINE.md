# Security Baseline & Hardening Controls

## 1. Threat Modeling & Safeguards

| Threat Vector | Mitigation Strategy in Stage 1 Foundation |
| :--- | :--- |
| **Credential Stuffing & Brute Force** | bcrypt password hashing with work factor 12; Rate limiting on sensitive endpoints via `@nestjs/throttler` (100 req/60s); Generic authentication failure messages that prevent email enumeration. |
| **Cross-Site Scripting (XSS)** | Refresh tokens stored in `HttpOnly` cookies, completely inaccessible to JavaScript execution in the browser. Access tokens held in memory within React state. |
| **Cross-Site Request Forgery (CSRF)** | `SameSite=Lax` cookies; API endpoints utilize state-changing methods requiring custom headers (`Authorization: Bearer ...` or `Content-Type: application/json`) which are not triggerable via simple HTML form submissions. |
| **SQL Injection** | Exclusively parameterized queries executed via Prisma ORM engine; raw SQL interpolation is strictly prohibited. |
| **Mass Assignment Vulnerabilities** | NestJS `ValidationPipe` with `whitelist: true` and `forbidNonWhitelisted: true` strips or throws on unexpected incoming fields. |
| **Privilege Escalation** | Public registration unconditionally defaults to `BUSINESS_OWNER` or `BUSINESS_MEMBER`. `SUPER_ADMIN` accounts can exclusively be bootstrapped via secure CLI scripts (`npm run admin:create`). Role guard enforces permissions at endpoint boundaries. |
| **Information Disclosure** | Centralized `HttpExceptionFilter` strips stack traces and internal database errors from public responses. Sensitive fields like `passwordHash` and `tokenHash` are omitted at the query and serialization layer. |

## 2. Super Admin Bootstrap Policy

No default super-admin credentials exist in source code or default database seeds.
To provision the first `SUPER_ADMIN`, administrators must invoke:
```bash
npm run admin:create -- --email admin@domain.com --password "SecureRandomPassword123!" --name "System Administrator"
```
Or define environment variables `BOOTSTRAP_ADMIN_EMAIL` and `BOOTSTRAP_ADMIN_PASSWORD` during controlled provisioning.
