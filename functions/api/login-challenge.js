import {json,body,id,b64u,now} from "../_lib.js";
export async function onRequestPost(context){
  const x=await body(context.request), username=String(x.username||"").trim().toLowerCase();
  const p=await context.env.DB.prepare("SELECT id,display_name FROM people WHERE username=? AND status='active'").bind(username).first();
  if(!p) return json({error:"Account or credential not found"},404);
  const c=await context.env.DB.prepare("SELECT id,label,public_key_jwk FROM credentials WHERE person_id=? AND status='active' AND (expires_at IS NULL OR expires_at>?) ORDER BY created_at DESC LIMIT 1").bind(p.id,now()).first();
  if(!c) return json({error:"No active credential"},403);
  const bytes=new Uint8Array(32); crypto.getRandomValues(bytes); const challenge=b64u(bytes), cid=id("chal");
  const exp=new Date(Date.now()+5*60*1000).toISOString();
  await context.env.DB.prepare("INSERT INTO challenges(id,purpose,person_id,credential_id,challenge,expires_at,used) VALUES(?,?,?,?,?,?,0)").bind(cid,"login",p.id,c.id,challenge,exp).run();
  return json({challenge_id:cid,challenge,credential_id:c.id,label:c.label});
}
