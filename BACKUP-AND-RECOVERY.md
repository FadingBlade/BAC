# Backup and Recovery

BAC has two intentionally separate backup domains.

## 1. Server/database backup
Administrators can open **Backup** in BAC and export a JSON snapshot. It contains settings, people, public credential records, lifecycle state, and audit events. It does not contain `.bac` private keys.

For disaster recovery, also use Cloudflare's supported D1 backup/recovery capabilities appropriate to your account and deployment.

## 2. Credential backup
Each user is responsible for securely backing up their issued `.bac` file. Keep at least one protected offline copy. The BAC file password is not stored by the server.

If a `.bac` file or its password is lost, it cannot be reconstructed from D1. An administrator must revoke the old credential and issue a replacement.

## Lost or stolen file
Revoke the corresponding credential immediately. Revocation makes the file unusable against BAC even if its password is known.

## Important
Do not store a `.bac` credential and its password in the same plaintext location.
