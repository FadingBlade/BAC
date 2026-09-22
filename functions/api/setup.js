import {json,body,id,now,audit,setting,makeSession,sessionCookie} from "../_lib.js";
export async function onRequestPost(context){
  const DB=context.env.DB;
  if((await setting(DB,"initialized"))==="true") return json({error:"BAC is already initialized"},409);
  const x=await body(context.request);
  const name=String(x.display_name||"").trim(), username=String(x.username||"").trim().toLowerCase();
  if(name.length<1||username.length<2) return json({error:"Name and username are required"},400);
  const pid=id("bac");
  await DB.batch([
    DB.prepare("INSERT INTO people(id,display_name,username,role,status,created_at) VALUES(?,?,?,?,?,?)").bind(pid,name,username,"admin","active",now()),
    DB.prepare("INSERT OR REPLACE INTO settings(key,value) VALUES('initialized','true')"),
    DB.prepare("INSERT OR REPLACE INTO settings(key,value) VALUES('organization',?)").bind(String(x.organization||"Blade"))
  ]);
  await audit(DB,pid,"system.initialize",pid,{organization:x.organization||"Blade"});
  const s=await makeSession(DB,pid);
  return json({ok:true,person_id:pid},201,{"set-cookie":sessionCookie(s.raw)});
}
