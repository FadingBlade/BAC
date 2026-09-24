A# Changelog

## 1.2.1 — 2026-09-21
First public release.

- File-based `.bac` credentials
- Password-protected local private keys
- ECDSA P-256 challenge-response authentication
- AES-256-GCM credential encryption
- Credential expiration and revocation
- User and administrator roles
- Account enable/disable controls
- HttpOnly secure sessions
- Audit logging
- Automatic D1 schema initialization/upgrades
- Database health diagnostics
- Administrator JSON database export
- Strict Content Security Policy
- Responsive management interface

- Applications registry and Sign in with BAC authorization flow
- Authorization Code + PKCE (S256)
- OIDC discovery metadata
- Opaque access tokens and UserInfo endpoint

## 1.2.1

- Added simple BAC Ticket SSO for arbitrary server-backed websites
- Added `/login?app=...` entry point
- Added 60-second one-use integration tickets
- Added server-to-server `/api/integration/verify`
- Added application secret regeneration and enable/disable controls
- Added Cloudflare Pages integration example
- Removed the experimental partial-OIDC endpoints from this release to avoid implying OIDC conformance
