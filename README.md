# Blade Account Card (BAC) v1.1 (AE)

A Cloudflare Pages + Pages Functions + D1 cryptographic identity lab.

## The intentionally simple deployment

BAC **does not require you to paste SQL into D1**. On first access, `/api/health` creates the schema automatically.

### Repository layout matters

Upload the **contents of this folder** to the root of your Git repository:

```text
/
├── functions/
├── public/
├── package.json
└── README.md
```

Do not put the entire project inside another folder.

### Cloudflare Pages settings

Create/import the Git repository as a **Pages** project.

- Framework preset: None
- Production branch: main
- Build command: `exit 0`
- Build output directory: `public`
- Root directory: leave blank

Cloudflare's current documentation recommends `exit 0` for static Pages projects that use Pages Functions.

### D1

1. Create a D1 database named `bac-db`.
2. Open your **Pages project**.
3. Add a D1 binding.
4. Variable name must be exactly: `DB`
5. Select `bac-db`.
6. Redeploy the Pages project.

**Do not run a migration file. BAC creates the required tables itself.**

Open:

```text
https://YOUR-PROJECT.pages.dev/
```

Do not add `/public`.

If everything is configured correctly, the top-right status says **SYSTEM ONLINE** and you get the initialization wizard.

## First administrator

Initialize BAC, then immediately go to **People → Issue** beside your administrator account. That creates the administrator's first BAC credential in your browser.

Then go to **Credentials → Backup key** and protect the backup file.

## Security scope

BAC v1.1 is a learning/prototyping identity system. Software keys are exportable and stored in browser localStorage. It is not a replacement for PIV/CAC, TPM-backed keys, passkeys, or an audited production IdP.

Authentication itself is real asymmetric challenge-response:
1. server creates a cryptographically random one-use challenge;
2. browser signs it with ECDSA P-256;
3. Pages Function verifies it against the registered public key;
4. server checks account/credential status and expiration;
5. server issues an HttpOnly, Secure, SameSite session cookie.

## Expansion path

The next major credential provider should be WebAuthn/passkeys. The current person/credential/session/audit separation is deliberately structured so hardware-backed providers can be added without replacing the rest of BAC.
