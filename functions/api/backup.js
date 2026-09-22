import{json,admin,setting}from"../_lib.js";
export async function onRequestGet(c){
 const a=await admin(c);if(a.error)return a.error;
 try{
  const [people,credentials,audit,settings]=await Promise.all([
   c.env.DB.prepare("SELECT * FROM people ORDER BY created_at").all(),
   c.env.DB.prepare("SELECT id,person_id,label,public_key_jwk,algorithm,status,created_at,expires_at,revoked_at,revoke_reason,file_version FROM credentials ORDER BY created_at").all(),
   c.env.DB.prepare("SELECT * FROM audit ORDER BY id").all(),
   c.env.DB.prepare("SELECT key,value FROM settings ORDER BY key").all()
  ]);
  return json({format:"BAC-DATABASE-BACKUP",version:1,created_at:new Date().toISOString(),warning:"This backup contains public credential keys and account metadata. It does not contain .bac private keys.",data:{settings:settings.results,people:people.results,credentials:credentials.results,audit:audit.results}});
 }catch(e){return json({error:"Backup export failed",detail:String(e?.message||e)},500)}
}
