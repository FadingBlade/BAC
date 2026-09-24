import{json,body,rid,now,admin,log,schema,sha}from"../_lib.js";
const urls=x=>{try{return JSON.parse(x)}catch{return[]}};
const clean=a=>({...a,redirect_uris:urls(a.redirect_uris)});
export async function onRequestGet(c){
 const a=await admin(c);if(a.error)return a.error;await schema(c.env.DB);
 const r=await c.env.DB.prepare("SELECT id,name,client_id,redirect_uris,status,created_at FROM applications ORDER BY created_at DESC").all();
 return json({applications:r.results.map(clean)});
}
export async function onRequestPost(c){
 const a=await admin(c);if(a.error)return a.error;await schema(c.env.DB);
 const x=await body(c.request),name=String(x.name||"").trim(),u=String(x.redirect_uri||"").trim();
 if(!name||!u)return json({error:"Name and callback URL are required"},400);
 try{const z=new URL(u);if(!["https:","http:"].includes(z.protocol))throw 0;if(z.protocol==="http:"&&!["localhost","127.0.0.1"].includes(z.hostname))return json({error:"Production callbacks must use HTTPS"},400)}catch{return json({error:"Invalid callback URL"},400)}
 const id=rid("app"),client_id=rid("bac_app"),secret=rid("bac_secret")+rid("");
 await c.env.DB.prepare("INSERT INTO applications(id,name,client_id,client_secret_hash,redirect_uris,status,created_at) VALUES(?,?,?,?,?,'active',?)")
  .bind(id,name,client_id,await sha(secret),JSON.stringify([u]),now()).run();
 await log(c.env.DB,a.person.id,"application.create",id,{client_id,redirect_uri:u});
 return json({ok:true,id,client_id,app_secret:secret,callback_url:u,warning:"Save this App Secret now. BAC stores only its hash."},201);
}
export async function onRequestPatch(c){
 const a=await admin(c);if(a.error)return a.error;await schema(c.env.DB);const x=await body(c.request);
 if(!x.id)return json({error:"Application id required"},400);
 if(x.action==="regenerate_secret"){
  const secret=rid("bac_secret")+rid("");
  await c.env.DB.prepare("UPDATE applications SET client_secret_hash=? WHERE id=?").bind(await sha(secret),x.id).run();
  await log(c.env.DB,a.person.id,"application.secret_regenerated",x.id,{});
  return json({ok:true,app_secret:secret,warning:"Save this new App Secret now. The previous secret no longer works."});
 }
 if(x.status&&!["active","disabled"].includes(x.status))return json({error:"Invalid status"},400);
 await c.env.DB.prepare("UPDATE applications SET status=COALESCE(?,status) WHERE id=?").bind(x.status||null,x.id).run();
 await log(c.env.DB,a.person.id,"application.update",x.id,{status:x.status});
 return json({ok:true});
}
