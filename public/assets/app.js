const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)],te=new TextEncoder(),td=new TextDecoder();
const esc=s=>String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
async function api(u,o={}){const r=await fetch(u,{...o,headers:{"content-type":"application/json",...(o.headers||{})}}),d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.error||`HTTP ${r.status}`);return d}
const b64=b=>{let s="";new Uint8Array(b).forEach(x=>s+=String.fromCharCode(x));return btoa(s).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"")};
const ub64=s=>{s=s.replace(/-/g,"+").replace(/_/g,"/");while(s.length%4)s+="=";let a=atob(s),b=new Uint8Array(a.length);for(let i=0;i<a.length;i++)b[i]=a.charCodeAt(i);return b};
function note(t,good=false){let e=$("#msg");e.textContent=t;e.className="notice "+(good?"success":"error");setTimeout(()=>e.classList.add("hidden"),6500)}
async function derive(password,salt,iterations=310000){const m=await crypto.subtle.importKey("raw",te.encode(password),"PBKDF2",false,["deriveKey"]);return crypto.subtle.deriveKey({name:"PBKDF2",salt,iterations,hash:"SHA-256"},m,{name:"AES-GCM",length:256},false,["encrypt","decrypt"])}
async function makeBAC(person,label,password,days){if(password.length<10)throw new Error("Use a BAC file password of at least 10 characters.");const kp=await crypto.subtle.generateKey({name:"ECDSA",namedCurve:"P-256"},true,["sign","verify"]),pub=await crypto.subtle.exportKey("jwk",kp.publicKey),priv=await crypto.subtle.exportKey("jwk",kp.privateKey);const r=await api("/api/credentials",{method:"POST",body:JSON.stringify({person_id:person.id,label,days,public_key_jwk:pub})});const salt=crypto.getRandomValues(new Uint8Array(16)),iv=crypto.getRandomValues(new Uint8Array(12)),iterations=310000,key=await derive(password,salt,iterations);const payload=te.encode(JSON.stringify({private_key_jwk:priv}));const aad=te.encode(`BAC2|${r.id}|${person.id}`);const cipher=await crypto.subtle.encrypt({name:"AES-GCM",iv,additionalData:aad,tagLength:128},key,payload);const file={format:"BLADE-ACCOUNT-CARD",version:2,credential:{id:r.id,person_id:person.id,display_name:person.display_name,username:person.username,label,issued_at:r.issued_at,expires_at:r.expires_at,algorithm:"ECDSA-P256"},protection:{kdf:"PBKDF2-SHA256",iterations,salt:b64(salt),cipher:"AES-256-GCM",iv:b64(iv),aad:`BAC2|${r.id}|${person.id}`},encrypted_private_key:b64(cipher)};download(`${person.username}-${r.id.slice(-8)}.bac`,JSON.stringify(file,null,2),"application/vnd.blade.bac+json");return r}
function download(name,data,type){const a=document.createElement("a"),u=URL.createObjectURL(new Blob([data],{type}));a.href=u;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(u),1000)}
async function unlock(file,password){if(file.format!=="BLADE-ACCOUNT-CARD"||file.version!==2)throw new Error("Not a supported BAC v2 credential file.");const p=file.protection;if(p.kdf!=="PBKDF2-SHA256"||p.cipher!=="AES-256-GCM")throw new Error("Unsupported BAC protection method.");const key=await derive(password,ub64(p.salt),p.iterations);try{const plain=await crypto.subtle.decrypt({name:"AES-GCM",iv:ub64(p.iv),additionalData:te.encode(p.aad),tagLength:128},key,ub64(file.encrypted_private_key));return JSON.parse(td.decode(plain))}catch{throw new Error("Incorrect BAC file password or damaged credential file.")}}
let selected=null;
async function chooseLogin(){try{const f=$("#bacfile").files[0];if(!f)return;selected=JSON.parse(await f.text());if(selected.format!=="BLADE-ACCOUNT-CARD"||selected.version!==2)throw 0;$("#filemeta").classList.remove("hidden");$("#filemeta").innerHTML=`<b>${esc(selected.credential.display_name)}</b><br><span class="muted">${esc(selected.credential.label)} · ${esc(selected.credential.id)}</span><br><span class="small muted">Expires ${new Date(selected.credential.expires_at).toLocaleString()}</span>`}catch{selected=null;$("#filemeta").classList.add("hidden");note("That is not a valid BAC v2 file.")}}
async function login(){try{if(!selected)throw new Error("Select a .bac credential file first.");const unlocked=await unlock(selected,$("#filepass").value);const ch=await api("/api/challenge",{method:"POST",body:JSON.stringify({credential_id:selected.credential.id})});const k=await crypto.subtle.importKey("jwk",unlocked.private_key_jwk,{name:"ECDSA",namedCurve:"P-256"},false,["sign"]);const sig=await crypto.subtle.sign({name:"ECDSA",hash:"SHA-256"},k,te.encode(ch.challenge));await api("/api/verify",{method:"POST",body:JSON.stringify({challenge_id:ch.challenge_id,signature:b64(sig)})});location.reload()}catch(e){note(e.message)}}
async function boot(){try{await api("/api/health");const s=await api("/api/status");$("#health").textContent="SYSTEM ONLINE";$("#health").className="badge ok";if(!s.initialized)return show("setup");if(!s.user)return show("login");show("app");$("#who").textContent=`${s.user.display_name} · ${s.user.role}`;if(s.user.role!=="admin"){$("#admin").innerHTML='<div class="card"><h2>Authenticated</h2><p>Your BAC file was accepted. This account does not have administrator privileges.</p></div>';return}await refresh()}catch(e){show("fatal");$("#fatalText").textContent=e.message}}
function show(id){["setup","login","app","fatal"].forEach(x=>$("#"+x).classList.toggle("hidden",x!==id))}
async function setup(){try{await api("/api/setup",{method:"POST",body:JSON.stringify({organization:$("#org").value,name:$("#sname").value,username:$("#suser").value})});location.reload()}catch(e){note(e.message)}}
async function logout(){await api("/api/logout",{method:"POST"});location.reload()}
async function addPerson(){try{await api("/api/people",{method:"POST",body:JSON.stringify({name:$("#pname").value,username:$("#puser").value,role:$("#prole").value})});await refresh();note("Person created.",true)}catch(e){note(e.message)}}
async function issue(id){const p=PEOPLE.find(x=>x.id===id);if(!p)return;const password=prompt(`Create a password for ${p.display_name}'s .bac file.\nMinimum 10 characters.\n\nThe password is NOT sent to the server.`);if(password===null)return;const confirm=prompt("Enter the same BAC file password again.");if(confirm!==password)return note("Passwords did not match.");try{await makeBAC(p,"BAC File Credential",password,365);await refresh();note("Credential issued and .bac file downloaded. Store it securely.",true)}catch(e){note(e.message)}}
async function revoke(id){const reason=prompt("Revocation reason:","Replaced");if(reason===null)return;await api("/api/revoke",{method:"POST",body:JSON.stringify({id,reason})});await refresh();note("Credential revoked.",true)}
async function updatePerson(id,role,status){try{await api("/api/people",{method:"PATCH",body:JSON.stringify({id,role,status})});await refresh()}catch(e){note(e.message)}}
let PEOPLE=[];
async function refresh(){const[p,c,a]=await Promise.all([api("/api/people"),api("/api/credentials"),api("/api/audit")]);PEOPLE=p.people;$("#npeople").textContent=p.people.length;$("#ncred").textContent=c.credentials.filter(x=>x.status==="active").length;$("#nevents").textContent=a.events.length;$("#people").innerHTML=p.people.map(x=>`<tr><td>${esc(x.display_name)}<br><span class="small muted">${esc(x.id)}</span></td><td>${esc(x.username)}</td><td>${esc(x.role)}</td><td><span class="badge ${x.status==="active"?"ok":"bad"}">${x.status}</span></td><td><button data-action="issue" data-id="${x.id}">Issue .bac</button> <button data-action="role" data-id="${x.id}" data-role="${x.role==="admin"?"user":"admin"}" data-status="${x.status}">${x.role==="admin"?"Make user":"Make admin"}</button> <button data-action="status" data-id="${x.id}" data-role="${x.role}" data-status="${x.status==="active"?"disabled":"active"}">${x.status==="active"?"Disable":"Enable"}</button></td></tr>`).join("");$("#creds").innerHTML=c.credentials.map(x=>`<tr><td><code>${esc(x.id)}</code></td><td>${esc(x.display_name)}</td><td>${esc(x.label)}</td><td><span class="badge ${x.status==="active"?"ok":"bad"}">${x.status}</span></td><td>${new Date(x.expires_at).toLocaleDateString()}</td><td>${x.status==="active"?`<button class="danger" data-action="revoke" data-id="${x.id}">Revoke</button>`:""}</td></tr>`).join("");$("#audit").innerHTML=a.events.map(x=>`<tr><td>${new Date(x.created_at).toLocaleString()}</td><td>${esc(x.action)}</td><td><code>${esc(x.target||"")}</code></td></tr>`).join("")}
function tab(id,b){$$(".section").forEach(x=>x.classList.remove("active"));$("#sec-"+id).classList.add("active");$$(".tabs button").forEach(x=>x.classList.remove("active"));b.classList.add("active")}


async function exportBackup(){
 try{
  const r=await fetch("/api/backup",{headers:{"accept":"application/json"}});
  const text=await r.text(); if(!r.ok){let x={};try{x=JSON.parse(text)}catch{};throw new Error(x.error||`HTTP ${r.status}`)}
  download(`bac-database-backup-${new Date().toISOString().slice(0,10)}.json`,text,"application/json");
  note("Database backup exported. Remember: .bac private-key files must be backed up separately.",true);
 }catch(e){note(e.message)}
}

function bindUI(){
 $("#setupBtn")?.addEventListener("click",setup);
 $("#bacfile")?.addEventListener("change",chooseLogin);
 $("#loginBtn")?.addEventListener("click",login);
 $("#logoutBtn")?.addEventListener("click",logout);
 $("#addPersonBtn")?.addEventListener("click",addPerson);
 $("#exportBackupBtn")?.addEventListener("click",exportBackup);
 $$(".tabs [data-tab]").forEach(b=>b.addEventListener("click",()=>tab(b.dataset.tab,b)));
 document.addEventListener("click",async e=>{
   const b=e.target.closest("button[data-action]"); if(!b)return;
   const {action,id,role,status}=b.dataset;
   if(action==="issue") await issue(id);
   else if(action==="revoke") await revoke(id);
   else if(action==="role"||action==="status") await updatePerson(id,role,status);
 });
}
bindUI();
boot();

