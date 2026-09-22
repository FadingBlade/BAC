import {json,body,now,requireAdmin,audit} from "../_lib.js";
export async function onRequestPost(context){
 const a=await requireAdmin(context); if(a.error)return a.error;
 const x=await body(context.request); if(!x.id)return json({error:"Credential id required"},400);
 await context.env.DB.prepare("UPDATE credentials SET status='revoked',revoked_at=?,revoke_reason=? WHERE id=?").bind(now(),String(x.reason||"Administrative revocation"),x.id).run();
 await audit(context.env.DB,a.person.id,"credential.revoke",x.id,{reason:x.reason||"Administrative revocation"});
 return json({ok:true});
}
