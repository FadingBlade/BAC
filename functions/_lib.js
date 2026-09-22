const te=new TextEncoder();
export const now=()=>new Date().toISOString();
export function json(data,status=200,headers={}){return new Response(JSON.stringify(data),{status,headers:{"content-type":"application/json; charset=utf-8","cache-control":"no-store",...headers}})}
export async function body(req){try{return await req.json()}catch{return {}}}
export function rid(prefix){const b=new Uint8Array(16);crypto.getRandomValues(b);return prefix+"_"+[...b].map(x=>x.toString(16).padStart(2,"0")).join("")}
export function b64u(b){let s="";for(const x of b)s+=String.fromCharCode(x);return btoa(s).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"")}
export function unb64u(s){s=String(s).replace(/-/g,"+").replace(/_/g,"/");while(s.length%4)s+="=";const a=atob(s),b=new Uint8Array(a.length);for(let i=0;i<a.length;i++)b[i]=a.charCodeAt(i);return b}
export async function hash(s){return b64u(new Uint8Array(await crypto.subtle.digest("SHA-256",te.encode(s))))}
export const cookie=(raw,max=28800)=>`bac_session=${raw}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${max}`;
export async function ensureSchema(DB){
 const sql=[
 `CREATE TABLE IF NOT EXISTS settings(key TEXT PRIMARY KEY,value TEXT NOT NULL)`,
 `CREATE TABLE IF NOT EXISTS people(id TEXT PRIMARY KEY,display_name TEXT NOT NULL,username TEXT NOT NULL UNIQUE,role TEXT NOT NULL DEFAULT 'user',status TEXT NOT NULL DEFAULT 'active',created_at TEXT NOT NULL)`,
 `CREATE TABLE IF NOT EXISTS credentials(id TEXT PRIMARY KEY,person_id TEXT NOT NULL,label TEXT NOT NULL,public_key_jwk TEXT NOT NULL,algorithm TEXT NOT NULL DEFAULT 'ECDSA-P256',status TEXT NOT NULL DEFAULT 'active',created_at TEXT NOT NULL,expires_at TEXT,revoked_at TEXT,revoke_reason TEXT)`,
 `CREATE TABLE IF NOT EXISTS sessions(id_hash TEXT PRIMARY KEY,person_id TEXT NOT NULL,expires_at TEXT NOT NULL,created_at TEXT NOT NULL)`,
 `CREATE TABLE IF NOT EXISTS challenges(id TEXT PRIMARY KEY,purpose TEXT NOT NULL,person_id TEXT,credential_id TEXT,challenge TEXT NOT NULL,expires_at TEXT NOT NULL,used INTEGER NOT NULL DEFAULT 0)`,
 `CREATE TABLE IF NOT EXISTS applications(id TEXT PRIMARY KEY,name TEXT NOT NULL,redirect_uri TEXT,status TEXT NOT NULL DEFAULT 'active',created_at TEXT NOT NULL)`,
 `CREATE TABLE IF NOT EXISTS audit(id INTEGER PRIMARY KEY AUTOINCREMENT,actor_id TEXT,action TEXT NOT NULL,target TEXT,detail TEXT,created_at TEXT NOT NULL)`,
 `CREATE INDEX IF NOT EXISTS idx_credentials_person ON credentials(person_id)`,
 `CREATE INDEX IF NOT EXISTS idx_audit_created ON audit(created_at)`
 ];
 for(const q of sql) await DB.prepare(q).run();
}
export async function getSetting(DB,k){const r=await DB.prepare("SELECT value FROM settings WHERE key=?").bind(k).first();return r?.value??null}
export async function log(DB,actor,action,target=null,detail=null){await DB.prepare("INSERT INTO audit(actor_id,action,target,detail,created_at) VALUES(?,?,?,?,?)").bind(actor,action,target,detail?JSON.stringify(detail):null,now()).run()}
export async function current(context){
 const raw=(context.request.headers.get("cookie")||"").split(";").map(x=>x.trim()).find(x=>x.startsWith("bac_session="))?.slice(12);
 if(!raw)return null;const h=await hash(raw);
 return context.env.DB.prepare(`SELECT p.* FROM sessions s JOIN people p ON p.id=s.person_id WHERE s.id_hash=? AND s.expires_at>? AND p.status='active'`).bind(h,now()).first();
}
export async function admin(context){const p=await current(context);if(!p)return {error:json({error:"Authentication required"},401)};if(p.role!=="admin")return {error:json({error:"Administrator required"},403)};return {person:p}}
export async function newSession(DB,pid){const raw=rid("sess")+rid("x"),h=await hash(raw),exp=new Date(Date.now()+8*3600000).toISOString();await DB.prepare("INSERT INTO sessions(id_hash,person_id,expires_at,created_at) VALUES(?,?,?,?)").bind(h,pid,exp,now()).run();return raw}
