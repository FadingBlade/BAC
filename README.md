# Blade Account Card v2

BAC v2 is file-based. Normal authentication requires an issued `.bac` file plus its file password.

## Cloudflare deployment
Repository root:
```
functions/
public/
package.json
README.md
```
Pages settings:
- Framework: None
- Build command: `exit 0`
- Build output directory: `public`
- Root directory: blank

Create or reuse a D1 database. Bind it to the Pages project using the exact binding name `DB`, then redeploy.

Do **not** paste SQL into D1. BAC creates its tables automatically.

Visit the project root URL, not `/public`.

## First run
1. Initialize BAC.
2. Open People.
3. Click **Issue .bac** for the initial administrator.
4. Choose a strong file password.
5. Your browser downloads the `.bac` file.
6. Store the file securely.
7. Sign out and test authentication using that file.

## Cryptography
- Authentication key: ECDSA P-256
- Private-key file encryption: AES-256-GCM
- Password KDF: PBKDF2-HMAC-SHA-256, 310,000 iterations
- Random salt: 128 bits
- AES-GCM IV: 96 bits
- Login challenge: 256 random bits, server generated, five-minute lifetime, one-use
- Sessions: random opaque tokens; only SHA-256 token hashes are stored server-side
- Private keys and BAC file passwords are not intentionally transmitted to BAC

The file password is essential. A copied `.bac` file can be attacked offline, so weak passwords are unsafe. BAC v2 enforces only a 10-character minimum; use a substantially stronger passphrase.

## Security scope
This is a prototype/learning identity system, not an audited production IdP and not equivalent to a CAC/PIV smart card. A file credential is copyable by design. Future BAC credential providers should include WebAuthn/passkeys, TPM-backed keys, and PIV hardware.

If the `.bac` file is lost, revoke the corresponding credential and issue another one. BAC deliberately has no server-side copy of its private key.


## Automatic database upgrades

BAC v2.2 inspects the live D1 table schema using `PRAGMA table_info` and adds missing compatible columns with `ALTER TABLE ... ADD COLUMN`. This specifically upgrades databases created by older BAC versions without deleting users, credentials, audit records, or settings.

The current schema version is written to `settings.schema_version`.

`/api/health` reports the detected credential columns and any missing required columns. Credential issuance also returns a diagnostic `detail` field if D1 rejects the operation.
