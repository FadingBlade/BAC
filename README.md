# Blade Account Card (BAC)

BAC is a small, expandable identity and cryptographic credential lab designed for Cloudflare Pages + Pages Functions + D1.

## What this release does
- First-run GUI initialization
- People and roles
- Browser-generated ECDSA P-256 credentials
- Challenge-response login
- Server-side credential/status verification
- Credential expiration and revocation
- HttpOnly/Secure sessions
- Audit trail
- D1 storage
- No dedicated server

## Security model
The software credential private key is generated in the browser and stored in that browser profile's localStorage in v1.0. It is never uploaded to BAC. This is useful for learning and prototyping, but localStorage is **not equivalent to a TPM, PIV smart card, or non-exportable WebAuthn credential**. Do not use v1.0 as a production identity provider.

## Cloudflare setup
1. Put this project in a GitHub repository.
2. In Cloudflare, create a D1 database named `bac-db`.
3. Run `migrations/0001_initial.sql` against that database using the D1 console or Wrangler.
4. Create a Cloudflare Pages project connected to the repository.
5. Build command: leave blank.
6. Build output directory: `public`
7. In the Pages project, add a D1 binding:
   - Variable name: `DB`
   - Database: `bac-db`
8. Redeploy the Pages project.
9. Open the deployed URL. The BAC initialization screen creates the first administrator.

The `/functions` directory must stay at the repository root. Do not put it inside `public`.

## Local development
Install Node.js, then:

```bash
npm install
npx wrangler d1 create bac-db
```

Copy `wrangler.example.jsonc` to `wrangler.jsonc` and put the returned database ID in it.

Initialize the local database:

```bash
npm run db:local
```

Run BAC:

```bash
npm run dev
```

## Important first-login behavior
The administrator created during initialization has no credential yet, but receives an 8-hour setup session. Immediately click **Issue credential** beside the administrator. The private key is then stored in that browser. After signing out, that credential is what lets the administrator sign back in.

If browser storage is cleared before backup/export functionality is added, that credential's private key is lost. For v1.0, create/recover an administrator by database administration if this happens.

## Expansion points
The database already separates people, credentials, applications, challenges, sessions, settings and audit events. Future providers can add WebAuthn/passkeys, TPM-backed keys, PIV cards and hardware tokens without changing the basic person/credential model.

Recommended next milestones:
1. WebAuthn/passkey provider
2. encrypted credential backup/export
3. user disable/enable GUI
4. application registration + OAuth/OIDC
5. recovery codes / second administrator approval
6. CSRF protections for administrative state changes
7. session management and forced logout
8. rate limiting / abuse controls
9. security headers and CSP
10. formal schema migrations/versioning
