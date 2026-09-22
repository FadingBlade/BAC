import{json,body,rid,now,admin,log,schema}from"../_lib.js";
export async function onRequestGet(c){
 const a=await admin(c);if(a.error)return a.error;
 try{await schema(c.env.DB);return json({credentials:(await c.env.DB.prepare(`SELECT cr.*,p.display_name,p.username FROM credentials cr JOIN people p ON p.id=cr.person_id ORDER BY cr.created_at DESC`).all()).results})}
 catch(e){return json({error:"Credential database read failed",code:"BAC_DB_READ",detail:String(e?.message||e)},500)}
}
export async function onRequestPost(c){
 const a=await admin(c);if(a.error)return a.error;
 try{
  await schema(c.env.DB);
  const x=await body(c.request);let k;
  try{k=x.public_key_jwk;if(k.kty!=="EC"||k.crv!=="P-256"||!k.x||!k.y)throw 0}catch{return json({error:"Invalid ECDSA P-256 public key"},400)}
  const owner=await c.env.DB.prepare("SELECT id,status FROM people WHERE id=?").bind(x.person_id||"").first();
  if(!owner)return json({error:"Credential owner does not exist"},404);
  if(owner.status!=="active")return json({error:"Cannot issue a credential to a disabled account"},409);
  const id=rid("cred"),created=now(),exp=new Date(Date.now()+Math.min(Math.max(Number(x.days)||365,1),3650)*86400000).toISOString();
  await c.env.DB.prepare("INSERT INTO credentials(id,person_id,label,public_key_jwk,algorithm,status,created_at,expires_at,file_version) VALUES(?,?,?,?,?,?,?,?,?)").bind(id,x.person_id,String(x.label||"BAC File Credential"),JSON.stringify(k),"ECDSA-P256","active",created,exp,2).run();
  await log(c.env.DB,a.person.id,"credential.issue",id,{person_id:x.person_id});
  return json({ok:true,id,expires_at:exp,issued_at:created},201);
 }catch(e){
  return json({error:"BAC could not issue the credential",code:"BAC_CREDENTIAL_ISSUE",detail:String(e?.message||e)},500);
 }
}
