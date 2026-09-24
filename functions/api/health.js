import{json,schema,columns}from"../_lib.js";
export async function onRequestGet(c){
 if(!c.env.DB)return json({ok:false,error:"Bind D1 as DB"},503);
 try{
  const m=await schema(c.env.DB),cols=await columns(c.env.DB,"credentials");
  const required=["id","person_id","label","public_key_jwk","algorithm","status","created_at","expires_at","revoked_at","revoke_reason","file_version"];
  const names=cols.map(x=>x.name),missing=required.filter(x=>!names.includes(x));
  return json({ok:missing.length===0,version:"1.2.1",schema_version:m.version,credential_model:"encrypted-bac-file",database:{credentials_columns:names,missing}});
 }catch(e){return json({ok:false,error:"BAC database migration failed",detail:String(e?.message||e)},500)}
}
