import {json,sha256,sessionCookie} from "../_lib.js";
export async function onRequestPost(context){
 const raw=(context.request.headers.get("cookie")||"").split(";").map(x=>x.trim()).find(x=>x.startsWith("bac_session="))?.split("=")[1];
 if(raw) await context.env.DB.prepare("DELETE FROM sessions WHERE id_hash=?").bind(await sha256(raw)).run();
 return json({ok:true},200,{"set-cookie":sessionCookie("",0)});
}
