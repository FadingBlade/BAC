import {json,body,id,now,requireAdmin,audit} from "../_lib.js";
export async function onRequestGet(context){
 const a=await requireAdmin(context); if(a.error)return a.error;
 const r=await context.env.DB.prepare("SELECT id,display_name,username,role,status,created_at FROM people ORDER BY created_at DESC").all();
 return json({people:r.results});
}
export async function onRequestPost(context){
 const a=await requireAdmin(context); if(a.error)return a.error;
 const x=await body(context.request), name=String(x.display_name||"").trim(), username=String(x.username||"").trim().toLowerCase();
 if(!name||!username) return json({error:"Name and username required"},400);
 const pid=id("bac");
 try{
  await context.env.DB.prepare("INSERT INTO people(id,display_name,username,role,status,created_at) VALUES(?,?,?,?,?,?)").bind(pid,name,username,x.role==="admin"?"admin":"user","active",now()).run();
 }catch{return json({error:"Username already exists"},409)}
 await audit(context.env.DB,a.person.id,"person.create",pid,{username});
 return json({ok:true,id:pid},201);
}
