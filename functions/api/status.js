import{json,ensureSchema,getSetting,current}from"../_lib.js";
export async function onRequestGet(c){
 if(!c.env.DB)return json({ok:false,error:"D1 binding missing. Bind your database with variable name DB."},503);
 try{await ensureSchema(c.env.DB);const initialized=(await getSetting(c.env.DB,"initialized"))==="true";const user=await current(c);return json({ok:true,initialized,user:user?{id:user.id,display_name:user.display_name,username:user.username,role:user.role}:null})}
 catch(e){return json({ok:false,error:"D1 is bound but BAC could not initialize its schema.",detail:String(e?.message||e)},500)}
}
