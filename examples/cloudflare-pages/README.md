# Cloudflare Pages integration example

1. Register the website in BAC and set the callback to:
   `https://YOUR-SITE.pages.dev/auth/bac`
2. Add `BAC_APP_ID` as an environment variable.
3. Add `BAC_APP_SECRET` as a secret.
4. Change `BAC_URL` in `functions/auth/bac.js` to your BAC deployment.
5. Put a login link on the site:
   `<a href="https://YOUR-BAC-DOMAIN.pages.dev/login?app=YOUR_APP_ID">Sign in with BAC</a>`
6. Replace the demo JSON response with your application's normal session-cookie creation.

Never expose `BAC_APP_SECRET` in browser JavaScript.
