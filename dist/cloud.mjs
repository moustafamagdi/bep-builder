const SUPABASE_URL='https://jtubxhixhiqeyxhpqgpf.supabase.co';
const SUPABASE_PUBLISHABLE_KEY='sb_publishable_DRTFtffhvBGljsgWbE2rzQ__8cqvvpk';
const SESSION_KEY='bep-studio-cloud-session-v1';
const EMAIL_KEY='bep-studio-remembered-email-v1';

function readSession(){
  try{return JSON.parse(localStorage.getItem(SESSION_KEY)||sessionStorage.getItem(SESSION_KEY))||null;}catch{return null;}
}

function writeSession(session,remember=session?.remember!==false){
  localStorage.removeItem(SESSION_KEY);sessionStorage.removeItem(SESSION_KEY);
  if(session){session.remember=remember;(remember?localStorage:sessionStorage).setItem(SESSION_KEY,JSON.stringify(session));}
  return session;
}

async function api(path,{method='GET',body,token,headers={}}={}){
  const response=await fetch(`${SUPABASE_URL}${path}`,{
    method,
    headers:{apikey:SUPABASE_PUBLISHABLE_KEY,'Content-Type':'application/json',...(token?{Authorization:`Bearer ${token}`}:{}) ,...headers},
    body:body===undefined?undefined:JSON.stringify(body)
  });
  const text=await response.text();
  let data=null;
  if(text)try{data=JSON.parse(text);}catch{data=text;}
  if(!response.ok)throw new Error(data?.msg||data?.message||data?.error_description||data?.error||`Cloud request failed (${response.status}).`);
  return data;
}

function normalizeSession(data){
  if(!data?.access_token)return null;
  return {...data,expires_at:data.expires_at||Math.floor(Date.now()/1000)+(data.expires_in||3600)};
}

const withCaptcha=(body,captchaToken)=>({...body,gotrue_meta_security:{captcha_token:captchaToken}});

export async function signIn(email,password,remember=true,captchaToken=''){
  const session=writeSession(normalizeSession(await api('/auth/v1/token?grant_type=password',{method:'POST',body:withCaptcha({email,password},captchaToken)})),remember);
  if(remember)localStorage.setItem(EMAIL_KEY,email);else localStorage.removeItem(EMAIL_KEY);
  return session;
}

export async function signUp(email,password,remember=true,redirectTo=location.origin,captchaToken=''){
  const data=await api(`/auth/v1/signup?redirect_to=${encodeURIComponent(redirectTo)}`,{method:'POST',body:withCaptcha({email,password},captchaToken)});
  if(data?.access_token)writeSession(normalizeSession(data),remember);
  if(remember)localStorage.setItem(EMAIL_KEY,email);
  return data;
}

export async function signOut(){
  const session=readSession();
  try{if(session?.access_token)await api('/auth/v1/logout',{method:'POST',token:session.access_token});}finally{writeSession(null);}
}

async function refresh(session){
  if(!session?.refresh_token)return null;
  try{return writeSession(normalizeSession(await api('/auth/v1/token?grant_type=refresh_token',{method:'POST',body:{refresh_token:session.refresh_token}})),session.remember!==false);}
  catch{writeSession(null);return null;}
}

export async function restoreSession(){
  const session=readSession();
  if(!session)return null;
  if((session.expires_at||0)>Math.floor(Date.now()/1000)+60)return session;
  return refresh(session);
}

export function rememberedEmail(){return localStorage.getItem(EMAIL_KEY)||'';}

export async function requestPasswordReset(email,redirectTo=location.origin,captchaToken=''){
  await api(`/auth/v1/recover?redirect_to=${encodeURIComponent(redirectTo)}`,{method:'POST',body:withCaptcha({email},captchaToken)});
}

export async function consumeAuthRedirect(){
  const params=new URLSearchParams(location.hash.replace(/^#/,''));
  const redirectError=params.get('error_description')||params.get('error');
  if(redirectError){history.replaceState({},document.title,`${location.pathname}${location.search}`);throw new Error(redirectError);}
  const accessToken=params.get('access_token'),refreshToken=params.get('refresh_token'),type=params.get('type');
  if(!accessToken)return null;
  const user=await api('/auth/v1/user',{token:accessToken});
  const session=writeSession(normalizeSession({access_token:accessToken,refresh_token:refreshToken,expires_in:Number(params.get('expires_in')||3600),token_type:params.get('token_type')||'bearer',user}),true);
  history.replaceState({},document.title,`${location.pathname}${location.search}`);
  return {session,type};
}

export async function updatePassword(password){
  const session=await activeSession();
  const user=await api('/auth/v1/user',{method:'PUT',token:session.access_token,body:{password}});
  session.user=user;writeSession(session,session.remember!==false);return user;
}

async function activeSession(){
  const session=await restoreSession();
  if(!session)throw new Error('Your cloud session has expired. Sign in again.');
  return session;
}

export async function fetchCloudProjects(){
  const session=await activeSession();
  const [rows,memberships]=await Promise.all([
    api('/rest/v1/bep_projects?select=user_id,project_data,version,updated_at&order=updated_at.desc',{token:session.access_token}),
    api('/rest/v1/bep_project_collaborators?select=project_id,user_id,role',{token:session.access_token})
  ]);
  const roles=new Map((memberships||[]).filter(row=>row.user_id===session.user.id).map(row=>[row.project_id,row.role]));
  return Array.isArray(rows)?rows.map(row=>row.project_data?{...row.project_data,updatedAt:row.updated_at||row.project_data.updatedAt,dbVersion:Number(row.version)||1,ownerId:row.user_id,accessRole:row.user_id===session.user.id?'owner':roles.get(row.project_data.id)||'viewer'}:null).filter(Boolean):[];
}

export async function upsertCloudProject(project){
  const session=await activeSession();
  if(project.accessRole==='viewer')throw new Error('This project is shared with view-only access.');
  const stored=structuredClone(project);delete stored.accessRole;delete stored.ownerId;delete stored.dbVersion;
  const common={name:project.fields.projectName||'',code:project.fields.projectCode||'',archived:Boolean(project.archived),project_data:stored,updated_at:project.updatedAt};
  if(project.accessRole==='editor'&&project.ownerId){
    await api(`/rest/v1/bep_projects?id=eq.${encodeURIComponent(project.id)}`,{method:'PATCH',token:session.access_token,headers:{Prefer:'return=minimal'},body:common});
    return;
  }
  const row={id:project.id,user_id:session.user.id,...common,created_at:project.createdAt};
  await api('/rest/v1/bep_projects?on_conflict=id',{method:'POST',token:session.access_token,headers:{Prefer:'resolution=merge-duplicates,return=minimal'},body:row});
}

export async function acquireProjectSection(projectId,sectionKey,clientId){
  const session=await activeSession();
  return await api('/rest/v1/rpc/acquire_bep_section_lock',{method:'POST',token:session.access_token,body:{p_project_id:projectId,p_section_key:sectionKey,p_client_id:clientId}});
}

export async function renewProjectSection(projectId,sectionKey,clientId){
  const session=await activeSession();
  return await api('/rest/v1/rpc/heartbeat_bep_section_lock',{method:'POST',token:session.access_token,body:{p_project_id:projectId,p_section_key:sectionKey,p_client_id:clientId}});
}

export async function releaseProjectSection(projectId,sectionKey,clientId,{force=false,keepalive=false}={}){
  const session=await activeSession();
  return await api('/rest/v1/rpc/release_bep_section_lock',{method:'POST',token:session.access_token,body:{p_project_id:projectId,p_section_key:sectionKey,p_client_id:clientId,p_force:force},headers:keepalive?{'X-BEP-Keepalive':'1'}:{}});
}

export async function saveCloudProjectSection(project,sectionKey,clientId,patch){
  const session=await activeSession();
  const result=await api('/rest/v1/rpc/save_bep_project_section',{method:'POST',token:session.access_token,body:{p_project_id:project.id,p_section_key:sectionKey,p_client_id:clientId,p_patch:patch,p_expected_version:Number(project.dbVersion)||1}});
  if(!result?.project)throw new Error('The section save did not return the updated project.');
  return {...result.project,updatedAt:result.updatedAt||result.project.updatedAt,dbVersion:Number(result.version)||Number(project.dbVersion)||1,ownerId:project.ownerId,accessRole:project.accessRole};
}

export async function deleteCloudProject(id){
  const session=await activeSession();
  await api(`/rest/v1/bep_projects?id=eq.${encodeURIComponent(id)}`,{method:'DELETE',token:session.access_token,headers:{Prefer:'return=minimal'}});
}

export async function fetchCloudTemplates(){
  const session=await activeSession();
  const rows=await api('/rest/v1/bep_templates?select=*&order=updated_at.desc',{token:session.access_token});
  return (rows||[]).map(row=>({id:row.id,type:row.template_type,name:row.name,description:row.description||'',sourceReference:row.source_reference||'',version:row.version||'1.0',isDefault:Boolean(row.is_default),data:row.template_data||{},createdAt:row.created_at,updatedAt:row.updated_at}));
}

export async function upsertCloudTemplate(template){
  const session=await activeSession(),row={id:template.id,user_id:session.user.id,template_type:template.type,name:template.name,description:template.description||'',source_reference:template.sourceReference||'',version:template.version||'1.0',is_default:Boolean(template.isDefault),template_data:template.data,created_at:template.createdAt,updated_at:template.updatedAt};
  await api('/rest/v1/bep_templates?on_conflict=id',{method:'POST',token:session.access_token,headers:{Prefer:'resolution=merge-duplicates,return=minimal'},body:row});
}

export async function deleteCloudTemplate(id){
  const session=await activeSession();
  await api(`/rest/v1/bep_templates?id=eq.${encodeURIComponent(id)}`,{method:'DELETE',token:session.access_token,headers:{Prefer:'return=minimal'}});
}

const storagePath=path=>path.split('/').map(encodeURIComponent).join('/');

export async function uploadAttachment(file,path,{upsert=false}={}){
  const session=await activeSession();
  const response=await fetch(`${SUPABASE_URL}/storage/v1/object/bep-attachments/${storagePath(path)}`,{
    method:'POST',body:file,headers:{apikey:SUPABASE_PUBLISHABLE_KEY,Authorization:`Bearer ${session.access_token}`,'Content-Type':file.type||'application/octet-stream','x-upsert':String(upsert)}
  });
  const data=await response.json().catch(()=>null);
  if(!response.ok)throw new Error(data?.message||data?.error||`Upload failed (${response.status}).`);
  return data;
}

export async function downloadAttachment(path){
  const session=await activeSession();
  const response=await fetch(`${SUPABASE_URL}/storage/v1/object/authenticated/bep-attachments/${storagePath(path)}`,{headers:{apikey:SUPABASE_PUBLISHABLE_KEY,Authorization:`Bearer ${session.access_token}`}});
  if(!response.ok){const data=await response.json().catch(()=>null);throw new Error(data?.message||data?.error||`Download failed (${response.status}).`);}
  return response.blob();
}

export async function deleteAttachment(path){
  const session=await activeSession();
  await api('/storage/v1/object/bep-attachments',{method:'DELETE',token:session.access_token,body:{prefixes:[path]}});
}

const tokenBytes=()=>{const bytes=new Uint8Array(32);crypto.getRandomValues(bytes);return [...bytes].map(value=>value.toString(16).padStart(2,'0')).join('');};
const tokenHash=async token=>{const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(token));return [...new Uint8Array(bytes)].map(value=>value.toString(16).padStart(2,'0')).join('');};
const shareUrl=token=>`${location.origin}${location.pathname}?share=${encodeURIComponent(token)}`;
const inviteUrl=token=>`${location.origin}${location.pathname}?invite=${encodeURIComponent(token)}`;

export async function fetchPublicShares(projectId){
  const session=await activeSession();
  return await api(`/rest/v1/bep_public_shares?project_id=eq.${encodeURIComponent(projectId)}&select=id,title,created_at,expires_at,revoked_at,public_logos&order=created_at.desc`,{token:session.access_token})||[];
}

export async function createPublicShare(project,title,expiresDays=30,publicLogos=[]){
  const session=await activeSession();if(project.accessRole&&project.accessRole!=='owner')throw new Error('Only the project owner can publish a public preview.');
  const token=tokenBytes(),id=crypto.randomUUID(),expiresAt=new Date(Date.now()+Number(expiresDays)*86400000).toISOString(),stored=structuredClone(project);
  stored.attachments=[];stored.releases=(stored.releases||[]).map(({id,number,revision,issueDate,createdAt,readiness})=>({id,number,revision,issueDate,createdAt,readiness}));stored.style.logos=(stored.style.logos||[]).map(logo=>({...logo,path:''}));delete stored.ownerId;delete stored.accessRole;delete stored.dbVersion;
  await api('/rest/v1/bep_public_shares',{method:'POST',token:session.access_token,headers:{Prefer:'return=minimal'},body:{id,project_id:project.id,owner_id:session.user.id,token_hash:await tokenHash(token),title:title||`${project.fields.projectName} preview`,project_data:stored,public_logos:publicLogos,expires_at:expiresAt}});
  return {id,token,url:shareUrl(token),expiresAt};
}

export async function fetchPublicShare(token){return await api('/rest/v1/rpc/get_bep_public_share',{method:'POST',body:{p_token:token}});}

export async function revokePublicShare(id){
  const session=await activeSession();
  await api(`/rest/v1/bep_public_shares?id=eq.${encodeURIComponent(id)}`,{method:'PATCH',token:session.access_token,headers:{Prefer:'return=minimal'},body:{revoked_at:new Date().toISOString()}});
}

export async function createSignedAttachmentUrl(path,expiresIn){
  const session=await activeSession(),data=await api(`/storage/v1/object/sign/bep-attachments/${storagePath(path)}`,{method:'POST',token:session.access_token,body:{expiresIn:Math.max(60,Number(expiresIn)||60)}}),signed=data?.signedURL||data?.signedUrl;
  if(!signed)throw new Error('The public logo link could not be created.');return signed.startsWith('http')?signed:`${SUPABASE_URL}/storage/v1${signed}`;
}

export async function fetchProjectInvites(projectId){
  const session=await activeSession();return await api(`/rest/v1/bep_project_invites?project_id=eq.${encodeURIComponent(projectId)}&select=id,role,created_at,expires_at,accepted_at,revoked_at&order=created_at.desc`,{token:session.access_token})||[];
}

export async function createProjectInvite(projectId,role='editor',expiresDays=7){
  const session=await activeSession(),token=tokenBytes(),id=crypto.randomUUID(),expiresAt=new Date(Date.now()+Number(expiresDays)*86400000).toISOString();
  await api('/rest/v1/bep_project_invites',{method:'POST',token:session.access_token,headers:{Prefer:'return=minimal'},body:{id,project_id:projectId,owner_id:session.user.id,token_hash:await tokenHash(token),role,expires_at:expiresAt}});
  return {id,token,url:inviteUrl(token),expiresAt,role};
}

export async function revokeProjectInvite(id){const session=await activeSession();await api(`/rest/v1/bep_project_invites?id=eq.${encodeURIComponent(id)}`,{method:'PATCH',token:session.access_token,headers:{Prefer:'return=minimal'},body:{revoked_at:new Date().toISOString()}});}
export async function acceptProjectInvite(token){const session=await activeSession();return await api('/rest/v1/rpc/accept_bep_project_invite',{method:'POST',token:session.access_token,body:{p_token:token}});}
export async function fetchProjectCollaborators(projectId){const session=await activeSession();return await api(`/rest/v1/bep_project_collaborators?project_id=eq.${encodeURIComponent(projectId)}&select=project_id,user_id,role,collaborator_email,accepted_at&order=accepted_at.asc`,{token:session.access_token})||[];}
export async function removeProjectCollaborator(projectId,userId){const session=await activeSession();await api(`/rest/v1/bep_project_collaborators?project_id=eq.${encodeURIComponent(projectId)}&user_id=eq.${encodeURIComponent(userId)}`,{method:'DELETE',token:session.access_token,headers:{Prefer:'return=minimal'}});}
export async function leaveSharedProject(projectId){const session=await activeSession();await removeProjectCollaborator(projectId,session.user.id);}

export function mergeProjectSets(localProjects,cloudProjects){
  const merged=new Map(cloudProjects.map(project=>[project.id,project]));
  for(const project of localProjects){
    const current=merged.get(project.id);
    if(!current){merged.set(project.id,project);continue;}
    const localVersion=Number(project.dbVersion)||0,cloudVersion=Number(current.dbVersion)||0;
    if(localVersion>cloudVersion||(localVersion===0&&cloudVersion===0&&String(project.updatedAt||'')>String(current.updatedAt||'')))merged.set(project.id,project);
  }
  return [...merged.values()];
}
