import{schema}from"./_lib.js";
export async function onRequestGet(c){
 await schema(c.env.DB);const u=new URL(c.request.url),appId=u.searchParams.get("app")||"";
 const app=await c.env.DB.prepare("SELECT id,name,client_id,status FROM applications WHERE client_id=?").bind(appId).first();
 if(!app||app.status!=="active")return new Response("Unknown or disabled BAC application.",{status:400});
 const target=new URL("/",u.origin);target.searchParams.set("bac_sso","1");target.searchParams.set("app",app.client_id);
 return Response.redirect(target.toString(),302);
}
