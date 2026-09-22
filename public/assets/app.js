const $=s=>document.querySelector(s);
const api=async(url,opt={})=>{
 const r=await fetch(url,{headers:{"content-type":"application/json",...(opt.headers||{})},...opt});
 const d=await r.json().catch(()=>({})); if(!r.ok)throw new Error(d.error||`HTTP ${r.status}`); return d;
};
const b64u=b=>{let s="";new Uint8Array(b).forEach(x=>s+=String.fromCharCode(x));return btoa(s).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"")};
const from64=s=>{s=s.replace(/-/g,"+").replace(/_/g,"/");while(s.length%4)s+="=";let x=atob(s),b=new Uint8Array(x.length);for(let i=0;i<x.length;i++)b[i]=x.charCodeAt(i);return b};
const keyName=id=>`bac.private.${id}`;

async function boot(){
 const st=await api("/api/status");
 if(!st.initialized){$("#setup").classList.remove("hidden");return}
 if(!st.user){$("#login").classList.remove("hidden");return}
 $("#app").classList.remove("hidden"); $("#who").textContent=`${st.user.display_name} · ${st.user.role}`;
 if(st.user.role!=="admin"){$("#admin").innerHTML='<div class="card"><h2>Authenticated</h2><p>Your BAC credential is valid. Administrator tools are hidden for this account.</p></div>';return}
 refresh();
}
async function setup(){
 try{await api("/api/setup",{method:"POST",body:JSON.stringify({organization:$("#org").value,display_name:$("#sname").value,username:$("#suser").value})});location.reload()}catch(e){msg(e.message)}
}
async function login(){
 try{
  const c=await api("/api/login-challenge",{method:"POST",body:JSON.stringify({username:$("#luser").value})});
  const raw=localStorage.getItem(keyName(c.credential_id)); if(!raw)throw new Error("This browser does not have the private key for that credential.");
  const priv=await crypto.subtle.importKey("jwk",JSON.parse(raw),{name:"ECDSA",namedCurve:"P-256"},false,["sign"]);
  const sig=await crypto.subtle.sign({name:"ECDSA",hash:"SHA-256"},priv,new TextEncoder().encode(c.challenge));
  await api("/api/login-verify",{method:"POST",body:JSON.stringify({challenge_id:c.challenge_id,signature:b64u(sig)})}); location.reload();
 }catch(e){msg(e.message)}
}
async function logout(){await api("/api/logout",{method:"POST"});location.reload()}
async function addPerson(){
 try{await api("/api/people",{method:"POST",body:JSON.stringify({display_name:$("#pname").value,username:$("#puser").value,role:$("#prole").value})});$("#pname").value=$("#puser").value="";await refresh()}catch(e){msg(e.message)}
}
async function issue(personId){
 try{
  const kp=await crypto.subtle.generateKey({name:"ECDSA",namedCurve:"P-256"},true,["sign","verify"]);
  const pub=await crypto.subtle.exportKey("jwk",kp.publicKey), priv=await crypto.subtle.exportKey("jwk",kp.privateKey);
  const d=await api("/api/credentials",{method:"POST",body:JSON.stringify({person_id:personId,label:"BAC Software Credential",public_key_jwk:pub})});
  localStorage.setItem(keyName(d.id),JSON.stringify(priv));
  alert("Credential issued. Its private key is stored only in this browser profile. Export/backup support should be added before relying on BAC for anything important.");
  await refresh();
 }catch(e){msg(e.message)}
}
async function revoke(id){const reason=prompt("Revocation reason:","Lost or replaced");if(reason===null)return;await api("/api/revoke",{method:"POST",body:JSON.stringify({id,reason})});await refresh()}
async function refresh(){
 const [p,c,a]=await Promise.all([api("/api/people"),api("/api/credentials"),api("/api/audit")]);
 $("#people").innerHTML=p.people.map(x=>`<tr><td>${esc(x.display_name)}</td><td>${esc(x.username)}</td><td>${esc(x.role)}</td><td><span class="badge ${x.status==="active"?"ok":"bad"}">${x.status}</span></td><td><button onclick="issue('${x.id}')">Issue credential</button></td></tr>`).join("");
 $("#creds").innerHTML=c.credentials.map(x=>`<tr><td><code>${x.id}</code></td><td>${esc(x.display_name)}</td><td>${esc(x.label)}</td><td><span class="badge ${x.status==="active"?"ok":"bad"}">${x.status}</span></td><td>${new Date(x.expires_at).toLocaleDateString()}</td><td>${x.status==="active"?`<button class="danger" onclick="revoke('${x.id}')">Revoke</button>`:""}</td></tr>`).join("");
 $("#audit").innerHTML=a.events.map(x=>`<tr><td>${new Date(x.created_at).toLocaleString()}</td><td>${esc(x.action)}</td><td><code>${esc(x.target||"")}</code></td></tr>`).join("");
 $("#npeople").textContent=p.people.length;$("#ncred").textContent=c.credentials.filter(x=>x.status==="active").length;$("#nevents").textContent=a.events.length;
}
function esc(s){return String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]))}
function msg(t){const e=$("#message");e.textContent=t;e.classList.remove("hidden");setTimeout(()=>e.classList.add("hidden"),6000)}
Object.assign(window,{setup,login,logout,addPerson,issue,revoke});
boot().catch(e=>msg("BAC could not start: "+e.message));
