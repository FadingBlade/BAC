import {json,body,fromB64u,now,makeSession,sessionCookie,audit} from "../_lib.js";
export async function onRequestPost(context){
  const x=await body(context.request);
  const row=await context.env.DB.prepare(`SELECT ch.*,c.public_key_jwk,c.status credential_status,p.status person_status
    FROM challenges ch JOIN credentials c ON c.id=ch.credential_id JOIN people p ON p.id=ch.person_id WHERE ch.id=?`).bind(x.challenge_id||"").first();
  if(!row||row.used||row.expires_at<=now()||row.credential_status!=="active"||row.person_status!=="active") return json({error:"Challenge invalid or expired"},403);
  try{
    const key=await crypto.subtle.importKey("jwk",JSON.parse(row.public_key_jwk),{name:"ECDSA",namedCurve:"P-256"},false,["verify"]);
    const ok=await crypto.subtle.verify({name:"ECDSA",hash:"SHA-256"},key,fromB64u(x.signature||""),new TextEncoder().encode(row.challenge));
    if(!ok) return json({error:"Signature rejected"},403);
  }catch{return json({error:"Credential verification failed"},403)}
  await context.env.DB.prepare("UPDATE challenges SET used=1 WHERE id=?").bind(row.id).run();
  const s=await makeSession(context.env.DB,row.person_id);
  await audit(context.env.DB,row.person_id,"auth.login",row.credential_id);
  return json({ok:true},200,{"set-cookie":sessionCookie(s.raw)});
}
