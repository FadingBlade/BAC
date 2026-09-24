# BAC Website Integration

BAC v1.2 provides a deliberately small server-to-server SSO protocol.

## Flow

1. Register the website in **Applications**.
2. BAC gives you an **App ID** and a one-time-displayed **App Secret**.
3. Send the browser to:
   `https://YOUR-BAC/login?app=YOUR_APP_ID`
4. BAC performs the normal `.bac` challenge-response login.
5. BAC redirects to the application's registered callback:
   `https://example.com/auth/bac?ticket=bac_ticket_...`
6. The website backend POSTs the ticket, App ID, and App Secret to:
   `/api/integration/verify`
7. BAC consumes the ticket and returns the verified user.

Tickets expire after 60 seconds and can be redeemed once.

## Verification request

```json
{
  "app_id": "bac_app_...",
  "app_secret": "bac_secret_...",
  "ticket": "bac_ticket_..."
}
```

Successful response:

```json
{
  "authenticated": true,
  "user": {
    "id": "person_...",
    "username": "novo",
    "display_name": "Novo",
    "role": "user"
  }
}
```

## Security requirements

- Keep the App Secret server-side.
- Use HTTPS callback URLs in production.
- Create your own application session after verification; do not keep the BAC ticket as a session token.
- Never accept a callback URL supplied by the browser. BAC redirects only to the callback registered for the application.
- Treat BAC roles as identity claims, not automatically as authorization to sensitive resources unless that is your intended policy.
