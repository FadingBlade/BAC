# Security Policy

## Scope
Blade Account Card v1.0.0 is a prototype/source-available identity system. It is not a DoD CAC/PIV implementation, audited production identity provider, or substitute for hardware-backed credentials.

## Credential security
A `.bac` file contains an ECDSA P-256 private key encrypted locally with AES-256-GCM. Its encryption key is derived from the user's file password with PBKDF2-HMAC-SHA-256. The server stores only the public key and lifecycle state.

A copied `.bac` file can be subjected to offline password guessing. Use a long, unique passphrase and protect backups.

## Reporting
Do not publish exploitable vulnerabilities before maintainers have had a reasonable opportunity to investigate and patch them. Never include real BAC credential files, passwords, session cookies, or private keys in an issue.

## Operational guidance
Use HTTPS only. Keep Cloudflare and GitHub accounts protected with MFA. Restrict D1 access. Review audit logs. Revoke lost credentials immediately. Database backups do not contain private credential keys.
