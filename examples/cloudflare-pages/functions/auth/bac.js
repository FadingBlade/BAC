const BAC_URL = "https://YOUR-BAC-DOMAIN.pages.dev";

export async function onRequestGet(context) {
  const url = new URL(context.request.url);
  const ticket = url.searchParams.get("ticket");
  if (!ticket) return new Response("Missing BAC ticket", { status: 400 });

  // Store these as Cloudflare secrets/environment variables.
  const response = await fetch(`${BAC_URL}/api/integration/verify`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      app_id: context.env.BAC_APP_ID,
      app_secret: context.env.BAC_APP_SECRET,
      ticket
    })
  });

  const result = await response.json();
  if (!response.ok || !result.authenticated) {
    return new Response("BAC authentication failed", { status: 401 });
  }

  // Replace this demo response with your site's own session creation.
  return Response.json(result.user);
}
