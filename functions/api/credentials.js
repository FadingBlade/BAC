import {json,body,id,now,requireAdmin,audit} from "../_lib.js";
export async function onRequestGet(context){
 const a=await requireAdmin(context); if(a.error)return a.error;
 const r=await context.env.DB.prepare(`SELECT c.id,c.person_id,c.label,c.algorithm,c.status,c.created_at,c.expires_at,c.revoked_at,c.revoke_reason,p.display_name,p.username
 FROM credentials c JOIN people p ON p.id=c.person_id ORDER BY c.created_at DESC`).all();
 return json({credentials:r.results});
}
export async function onRequestPost(context){
 const a=await requireAdmin(context); if(a.error)return a.error;
 const x=await body(context.request);
 if(!x.person_id||!x.public_key_jwk) return json({error:"person_id and public_key_jwk required"},400);
 const cid=id("cred"), exp=x.expires_at||new Date(Date.now()+365*86400000).toISOString();
 try{
   const jwk=typeof x.public_key_jwk==="string"?x.public_key_jwk:JSON.stringify(x.public_key_jwk);
   await context.env.DB.prepare("INSERT INTO credentials(id,person_id,label,public_key_jwk,algorithm,status,created_at,expires_at) VALUES(?,?,?,?,?,?,?,?)")
    .bind(cid,x.person_id,String(x.label||"BAC Software Credential"),jwk,"ECDSA-P256","active",now(),exp).run();
 }catch(e){return json({error:"Unable to issue credential"},400)}
 await audit(context.env.DB,a.person.id,"credential.issue",cid,{person_id:x.person_id});
 return json({ok:true,id:cid,expires_at:exp},201);
}
