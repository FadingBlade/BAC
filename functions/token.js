import{schema,json,sha,rid,now}from"./_lib.js";
const b64=o=>btoa(unescape(encodeURIComponent(JSON.stringify(o)))).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"");
const b64b=a=>btoa(String.fromCharCode(...new Uint8Array(a))).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"");
async function challenge(v){return b64b(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(v)))}
export async function onRequestPost(c){
 await schema(c.env.DB);const f=await c.request.formData(),grant=f.get("grant_type"),code=String(f.get("code")||""),client=String(f.get("client_id")||""),redir=String(f.get("redirect_uri")||""),ver=String(f.get("code_verifier")||"");
 if(grant!=="authorization_code"||!code||!client||!redir||!ver)return json({error:"invalid_request"},400);
 const r=await c.env.DB.prepare("SELECT * FROM auth_codes WHERE code_hash=?").bind(await sha(code)).first();
 if(!r||r.used||r.client_id!==client||r.redirect_uri!==redir||Date.parse(r.expires_at)<Date.now()||await challenge(ver)!==r.code_challenge)return json({error:"invalid_grant"},400);
 await c.env.DB.prepare("UPDATE auth_codes SET used=1 WHERE code_hash=?").bind(await sha(code)).run();
 const p=await c.env.DB.prepare("SELECT id,username,display_name,role,status FROM people WHERE id=?").bind(r.person_id).first();if(!p||p.status!=="active")return json({error:"invalid_grant"},400);
 const at=rid("bac_at")+rid(""),exp=new Date(Date.now()+3600000).toISOString();await c.env.DB.prepare("INSERT INTO access_tokens(token_hash,client_id,person_id,scope,expires_at,created_at) VALUES(?,?,?,?,?,?)").bind(await sha(at),client,p.id,r.scope,exp,now()).run();
 // v1.1 uses opaque access tokens. ID token is intentionally omitted until asymmetric OP signing/JWKS is configured.
 return json({access_token:at,token_type:"Bearer",expires_in:3600,scope:r.scope});
}
