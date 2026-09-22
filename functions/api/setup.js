import{json,body,rid,now,ensureSchema,getSetting,newSession,cookie,log}from"../_lib.js";
export async function onRequestPost(c){if(!c.env.DB)return json({error:"D1 binding DB is missing"},503);await ensureSchema(c.env.DB);if((await getSetting(c.env.DB,"initialized"))==="true")return json({error:"BAC is already initialized"},409);
 const x=await body(c.request),name=String(x.display_name||"").trim(),u=String(x.username||"").trim().toLowerCase().replace(/[^a-z0-9._-]/g,"");
 if(!name||u.length<2)return json({error:"Enter a display name and a username with at least 2 valid characters."},400);const id=rid("bac");
 await c.env.DB.batch([c.env.DB.prepare("INSERT INTO people(id,display_name,username,role,status,created_at) VALUES(?,?,?,?,?,?)").bind(id,name,u,"admin","active",now()),c.env.DB.prepare("INSERT OR REPLACE INTO settings(key,value) VALUES('initialized','true')"),c.env.DB.prepare("INSERT OR REPLACE INTO settings(key,value) VALUES('organization',?)").bind(String(x.organization||"Blade"))]);
 await log(c.env.DB,id,"system.initialize",id,{organization:x.organization||"Blade"});const s=await newSession(c.env.DB,id);return json({ok:true,id},201,{"set-cookie":cookie(s)});
}
