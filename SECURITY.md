# Security Policy

## Supported Versions

The latest version on `main` is supported with security updates.

## Reporting a Vulnerability

If you discover a security vulnerability, please **DO NOT** open a public issue.

Instead, email: skaba89@users.noreply.github.com

Include:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

You will receive a response within 48 hours.

## Security Measures

This project implements:

- **bcrypt** password hashing (10 rounds)
- **JWT** access tokens (15 min) + refresh tokens (30 days)
- **Rate limiting** on auth endpoints (5 register/min, 10 login/min per IP)
- **Zod** schema validation on all API inputs (`.strict()` — rejects unknown fields)
- **Content Security Policy** with `script-src 'self' 'unsafe-inline'`
- **IndexedDB isolation** per user account (`ownerId` filtering)
- **Local data wipe** on logout and account deletion
- **CORS** configured for the frontend origin
- **No secrets** in Git (`.gitignore` covers `.env`, `.env.*`)

## Environment Variables

Required for production:

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | Neon Postgres connection string |
| `JWT_SECRET` | 32+ char random string for JWT signing |
| `STRIPE_SECRET_KEY` | Stripe API key (optional) |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret (optional) |
