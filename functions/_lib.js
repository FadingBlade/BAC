const te=new TextEncoder();
export const now=()=>new Date().toISOString();
export function json(x,status=200,h={}){return new Response(JSON.stringify(x),{status,headers:{"content-type":"application/json; charset=utf-8","cache-control":"no-store",...h}})}
export async function body(r){try{return await r.json()}catch{return {}}}
export function rid(p){const b=new Uint8Array(16);crypto.getRandomValues(b);return p+"_"+[...b].map(x=>x.toString(16).padStart(2,"0")).join("")}
export function b64u(b){let s="";for(const x of b)s+=String.fromCharCode(x);return btoa(s).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"")}
export function unb64u(s){s=String(s).replace(/-/g,"+").replace(/_/g,"/");while(s.length%4)s+="=";const a=atob(s),b=new Uint8Array(a.length);for(let i=0;i<a.length;i++)b[i]=a.charCodeAt(i);return b}
export async function hash(s){return b64u(new Uint8Array(await crypto.subtle.digest("SHA-256",te.encode(s))))}
export const cookie=(r,max=28800)=>`bac_session=${r}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${max}`;
export async function columns(DB,table){try{return (await DB.prepare(`PRAGMA table_info(${table})`).all()).results||[]}catch{return[]}}
async function hasColumn(DB,table,column){return (await columns(DB,table)).some(x=>x.name===column)}
async function addColumn(DB,table,column,definition){if(!await hasColumn(DB,table,column))await DB.prepare(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`).run()}
export async function schema(DB){
 for(const q of[
`CREATE TABLE IF NOT EXISTS settings(key TEXT PRIMARY KEY,value TEXT NOT NULL)`,
`CREATE TABLE IF NOT EXISTS people(id TEXT PRIMARY KEY,display_name TEXT NOT NULL,username TEXT NOT NULL UNIQUE,role TEXT NOT NULL DEFAULT 'user',status TEXT NOT NULL DEFAULT 'active',created_at TEXT NOT NULL)`,
`CREATE TABLE IF NOT EXISTS credentials(id TEXT PRIMARY KEY,person_id TEXT NOT NULL,label TEXT NOT NULL,public_key_jwk TEXT NOT NULL,algorithm TEXT NOT NULL,status TEXT NOT NULL,created_at TEXT NOT NULL,expires_at TEXT,revoked_at TEXT,revoke_reason TEXT,file_version INTEGER NOT NULL DEFAULT 2)`,
`CREATE TABLE IF NOT EXISTS sessions(id_hash TEXT PRIMARY KEY,person_id TEXT NOT NULL,expires_at TEXT NOT NULL,created_at TEXT NOT NULL)`,
`CREATE TABLE IF NOT EXISTS challenges(id TEXT PRIMARY KEY,person_id TEXT NOT NULL,credential_id TEXT NOT NULL,challenge TEXT NOT NULL,expires_at TEXT NOT NULL,used INTEGER NOT NULL DEFAULT 0)`,
`CREATE TABLE IF NOT EXISTS audit(id INTEGER PRIMARY KEY AUTOINCREMENT,actor_id TEXT,action TEXT NOT NULL,target TEXT,detail TEXT,created_at TEXT NOT NULL)`,
`CREATE INDEX IF NOT EXISTS idx_cred_person ON credentials(person_id)`,
`CREATE INDEX IF NOT EXISTS idx_audit_time ON audit(created_at)`
 ])await DB.prepare(q).run();

 // In-place upgrades from BAC v1/v2.0/v2.1 schemas.
 await addColumn(DB,"credentials","file_version","INTEGER NOT NULL DEFAULT 2");
 await addColumn(DB,"credentials","revoke_reason","TEXT");
 await addColumn(DB,"credentials","revoked_at","TEXT");
 await addColumn(DB,"credentials","expires_at","TEXT");
 await DB.prepare("INSERT OR REPLACE INTO settings(key,value) VALUES('schema_version','2.2.0')").run();
 return {version:"2.2.0"};
}
export async function setting(DB,k){return (await DB.prepare("SELECT value FROM settings WHERE key=?").bind(k).first())?.value??null}
export async function log(DB,a,act,t=null,d=null){await DB.prepare("INSERT INTO audit(actor_id,action,target,detail,created_at) VALUES(?,?,?,?,?)").bind(a,act,t,d?JSON.stringify(d):null,now()).run()}
export async function current(c){const raw=(c.request.headers.get("cookie")||"").split(";").map(x=>x.trim()).find(x=>x.startsWith("bac_session="))?.slice(12);if(!raw)return null;return c.env.DB.prepare(`SELECT p.* FROM sessions s JOIN people p ON p.id=s.person_id WHERE s.id_hash=? AND s.expires_at>? AND p.status='active'`).bind(await hash(raw),now()).first()}
export async function admin(c){const p=await current(c);if(!p)return{error:json({error:"Authentication required"},401)};if(p.role!=="admin")return{error:json({error:"Administrator required"},403)};return{person:p}}
export async function newSession(DB,pid){const r=rid("sess")+rid("token"),h=await hash(r),e=new Date(Date.now()+8*3600000).toISOString();await DB.prepare("INSERT INTO sessions VALUES(?,?,?,?)").bind(h,pid,e,now()).run();return r}
