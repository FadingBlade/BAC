import {json,session} from "../_lib.js";
export async function onRequestGet(context){
 const p=await session(context); if(!p)return json({error:"Authentication required"},401);
 return json({user:{id:p.id,display_name:p.display_name,username:p.username,role:p.role,status:p.status}});
}
