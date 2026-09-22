import {json,requireAdmin} from "../_lib.js";
export async function onRequestGet(context){
 const a=await requireAdmin(context); if(a.error)return a.error;
 const r=await context.env.DB.prepare("SELECT * FROM audit ORDER BY id DESC LIMIT 200").all();
 return json({events:r.results});
}
