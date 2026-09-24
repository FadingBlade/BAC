import{json,body,current,schema,rid,sha,now,log}from"../../_lib.js";
export async function onRequestPost(c){
 await schema(c.env.DB);const me=await current(c);if(!me)return json({error:"BAC authentication required"},401);
 const x=await body(c.request),appId=String(x.app_id||"");
 const app=await c.env.DB.prepare("SELECT * FROM applications WHERE client_id=? AND status='active'").bind(appId).first();
 if(!app)return json({error:"Unknown or disabled application"},400);
 let callbacks=[];try{callbacks=JSON.parse(app.redirect_uris||"[]")}catch{}
 const callback=callbacks[0];if(!callback)return json({error:"Application has no callback URL"},400);
 const ticket=rid("bac_ticket")+rid(""),expires=new Date(Date.now()+60000).toISOString();
 await c.env.DB.prepare("INSERT INTO login_tickets(ticket_hash,application_id,person_id,expires_at,used,created_at) VALUES(?,?,?,?,0,?)")
  .bind(await sha(ticket),app.id,me.id,expires,now()).run();
 await log(c.env.DB,me.id,"integration.ticket_issued",app.id,{client_id:app.client_id});
 return json({ticket,callback_url:callback,expires_at:expires});
}
