const enc = new TextEncoder();

export function json(data, status=200, headers={}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {"content-type":"application/json; charset=utf-8", "cache-control":"no-store", ...headers}
  });
}
export function now(){ return new Date().toISOString(); }
export function id(prefix="id"){
  const b=new Uint8Array(12); crypto.getRandomValues(b);
  return `${prefix}_${[...b].map(x=>x.toString(16).padStart(2,"0")).join("")}`;
}
export function b64u(bytes){
  let s=""; for(const b of bytes) s+=String.fromCharCode(b);
  return btoa(s).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"");
}
export function fromB64u(s){
  s=s.replace(/-/g,"+").replace(/_/g,"/"); while(s.length%4)s+="=";
  const x=atob(s), b=new Uint8Array(x.length); for(let i=0;i<x.length;i++) b[i]=x.charCodeAt(i); return b;
}
export async function sha256(s){
  return b64u(new Uint8Array(await crypto.subtle.digest("SHA-256", enc.encode(s))));
}
export async function body(req){ try{return await req.json()}catch{return {}} }
export async function setting(DB,key){
  const r=await DB.prepare("SELECT value FROM settings WHERE key=?").bind(key).first();
  return r?.value ?? null;
}
export async function audit(DB,actor,action,target=null,detail=null){
  await DB.prepare("INSERT INTO audit(actor_id,action,target,detail,created_at) VALUES(?,?,?,?,?)")
    .bind(actor,action,target,detail?JSON.stringify(detail):null,now()).run();
}
export async function session(context){
  const raw=(context.request.headers.get("cookie")||"").split(";").map(x=>x.trim()).find(x=>x.startsWith("bac_session="))?.split("=")[1];
  if(!raw) return null;
  const h=await sha256(raw);
  return await context.env.DB.prepare(`SELECT p.* FROM sessions s JOIN people p ON p.id=s.person_id
    WHERE s.id_hash=? AND s.expires_at>? AND p.status='active'`).bind(h,now()).first();
}
export async function requireAdmin(context){
  const p=await session(context);
  if(!p) return {error:json({error:"Authentication required"},401)};
  if(p.role!=="admin") return {error:json({error:"Administrator required"},403)};
  return {person:p};
}
export async function makeSession(DB, personId){
  const raw=id("sess")+id("");
  const h=await sha256(raw);
  const exp=new Date(Date.now()+8*3600*1000).toISOString();
  await DB.prepare("INSERT INTO sessions(id_hash,person_id,expires_at,created_at) VALUES(?,?,?,?)").bind(h,personId,exp,now()).run();
  return {raw,exp};
}
export const sessionCookie=(raw,maxAge=28800)=>`bac_session=${raw}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${maxAge}`;
