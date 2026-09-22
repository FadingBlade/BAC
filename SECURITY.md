# BAC Security Notes

BAC v1.0 is a learning/prototyping release.

- Do not use it for government credentials, physical access, financial accounts, production SSO, or other high-assurance authentication.
- Software private keys currently live in browser localStorage. XSS or a compromised browser profile could expose them.
- BAC never intentionally uploads the private key to Cloudflare.
- Authentication uses a fresh server-generated random challenge, ECDSA P-256 signatures, one-use challenges, credential status checks, account status checks, and expiring server-side sessions.
- Administrative APIs require an authenticated administrator session.
- Add WebAuthn/passkeys before treating BAC as a serious authentication system.
- Back up your D1 database and keep multiple administrator recovery paths before experimentation.
