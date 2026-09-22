import {json, setting, session} from "../_lib.js";
export async function onRequestGet(context){
  const initialized=(await setting(context.env.DB,"initialized"))==="true";
  const user=await session(context);
  return json({ok:true,initialized,user:user?{id:user.id,display_name:user.display_name,username:user.username,role:user.role}:null});
}
