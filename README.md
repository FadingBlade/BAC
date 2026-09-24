# Blade Account Card

**Blade Account Card (BAC)** is a file-based cryptographic identity system built for Cloudflare Pages, Pages Functions, and D1.

BAC users authenticate with an issued `.bac` credential file and its password. The encrypted private key stays client-side; BAC stores the corresponding public key and credential state.

> **Release:** 1.2.1  
> **Status:** First public release / prototype

## Features

- `.bac` file credentials
- ECDSA P-256 challenge-response authentication
- AES-256-GCM encrypted private-key containers
- PBKDF2-HMAC-SHA-256 password derivation
- One-use, expiring login challenges
- Credential expiration and revocation
- Administrator/user roles
- Account enable/disable controls
- Secure server sessions
- Audit trail
- Automatic D1 initialization and compatible schema upgrades
- Built-in health endpoint
- Administrator database export
- Strict CSP/security headers
- Responsive web management UI

## Repository layout

```text
/
├── functions/               Cloudflare Pages Functions
│   ├── _lib.js
│   └── api/
├── public/                  Static web application
│   ├── assets/
│   ├── _headers
│   └── index.html
├── BACKUP-AND-RECOVERY.md
├── CHANGELOG.md
├── LICENSE
├── SECURITY.md
├── package.json
└── README.md
```

## Deploy to Cloudflare Pages

Create a GitHub repository and place the contents of this package at the repository root.

Configure Pages:

```text
Framework preset:       None
Build command:          exit 0
Build output directory: public
Root directory:         (blank)
```

Create or select a Cloudflare D1 database. In the Pages project, add a D1 binding:

```text
Variable name: DB
Database:      your BAC D1 database
```

Redeploy after adding the binding. BAC creates its schema automatically; do not manually paste migration SQL.

Open the root Pages URL. `/api/health` can be used to verify the deployment.

## First setup

1. Initialize the organization and first administrator.
2. Open **People**.
3. Choose **Issue .bac** for the administrator.
4. Set a strong credential-file passphrase.
5. Securely store the downloaded `.bac` file.
6. Open **Backup** and export the initial server database backup.
7. Sign out and verify that the `.bac` file and password can authenticate.

## Backups

Database backups and `.bac` credential backups are deliberately separate. Server backups never contain private credential keys. See `BACKUP-AND-RECOVERY.md`.

## Security model

BAC does not send the plaintext private key or BAC file password to the server. Authentication uses a short-lived random challenge that the browser signs after locally decrypting the selected credential.

File credentials are copyable and can be attacked offline if stolen. Use strong passphrases. For high-assurance deployments, hardware-backed WebAuthn/PIV/TPM credentials are preferable.

See `SECURITY.md`.

## API diagnostics

- `GET /api/health`
- `GET /api/version`

## License

See `LICENSE`.



## Website integration

BAC v1.2 adds a simple one-time-ticket SSO flow for websites you control. Register a site under **Applications**, send users to `/login?app=APP_ID`, and redeem the returned 60-second one-use ticket from your backend using the App Secret. See `INTEGRATION.md` and `examples/cloudflare-pages/`.
