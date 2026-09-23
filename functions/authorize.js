import{schema}from"./_lib.js";
const esc=s=>String(s||"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
export async function onRequestGet(c){
 await schema(c.env.DB);const u=new URL(c.request.url),q=u.searchParams;
 const client=q.get("client_id"),redirect=q.get("redirect_uri"),scope=q.get("scope")||"",state=q.get("state")||"",nonce=q.get("nonce")||"",cc=q.get("code_challenge")||"",method=q.get("code_challenge_method")||"";
 if(q.get("response_type")!=="code"||!client||!redirect||!scope.split(/\s+/).includes("openid")||!cc||method!=="S256")return new Response("Invalid OIDC authorization request",{status:400});
 const app=await c.env.DB.prepare("SELECT * FROM applications WHERE client_id=? AND status='active'").bind(client).first();
 let redirects=[];try{redirects=JSON.parse(app?.redirect_uris||"[]")}catch{}
 if(!app||!redirects.includes(redirect))return new Response("Unknown application or redirect URI",{status:400});
 const next="/?oidc=1&"+new URLSearchParams({client_id:client,redirect_uri:redirect,scope,state,nonce,code_challenge:cc}).toString();
 return Response.redirect(new URL(next,u.origin).toString(),302);
}
