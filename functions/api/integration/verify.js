import{json,body,schema,sha,log}from"../../_lib.js";
function eq(a,b){if(a.length!==b.length)return false;let x=0;for(let i=0;i<a.length;i++)x|=a.charCodeAt(i)^b.charCodeAt(i);return x===0}
export async function onRequestPost(c){
 await schema(c.env.DB);const x=await body(c.request);
 const appId=String(x.app_id||""),secret=String(x.app_secret||""),ticket=String(x.ticket||"");
 if(!appId||!secret||!ticket)return json({authenticated:false,error:"app_id, app_secret, and ticket are required"},400);
 const app=await c.env.DB.prepare("SELECT * FROM applications WHERE client_id=? AND status='active'").bind(appId).first();
 if(!app||!app.client_secret_hash)return json({authenticated:false,error:"Invalid application credentials"},401);
 const supplied=await sha(secret);if(!eq(supplied,app.client_secret_hash))return json({authenticated:false,error:"Invalid application credentials"},401);
 const th=await sha(ticket);
 const t=await c.env.DB.prepare("SELECT * FROM login_tickets WHERE ticket_hash=? AND application_id=?").bind(th,app.id).first();
 if(!t||t.used||Date.parse(t.expires_at)<Date.now())return json({authenticated:false,error:"Invalid, expired, or already-used ticket"},401);
 const consume=await c.env.DB.prepare("UPDATE login_tickets SET used=1 WHERE ticket_hash=? AND used=0").bind(th).run();
 if(!consume.meta?.changes)return json({authenticated:false,error:"Ticket already used"},401);
 const p=await c.env.DB.prepare("SELECT id,username,display_name,role,status FROM people WHERE id=?").bind(t.person_id).first();
 if(!p||p.status!=="active")return json({authenticated:false,error:"BAC account is disabled or unavailable"},401);
 await log(c.env.DB,p.id,"integration.ticket_redeemed",app.id,{client_id:app.client_id});
 return json({authenticated:true,user:{id:p.id,username:p.username,display_name:p.display_name,role:p.role}});
}
