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
  const rows=await api('/rest/v1/bep_projects?select=project_data&order=updated_at.desc',{token:session.access_token});
  return Array.isArray(rows)?rows.map(row=>row.project_data).filter(Boolean):[];
}

export async function upsertCloudProject(project){
  const session=await activeSession();
  const row={id:project.id,user_id:session.user.id,name:project.fields.projectName||'',code:project.fields.projectCode||'',archived:Boolean(project.archived),project_data:project,created_at:project.createdAt,updated_at:project.updatedAt};
  await api('/rest/v1/bep_projects?on_conflict=id',{method:'POST',token:session.access_token,headers:{Prefer:'resolution=merge-duplicates,return=minimal'},body:row});
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

export function mergeProjectSets(localProjects,cloudProjects){
  const merged=new Map();
  for(const project of [...cloudProjects,...localProjects]){
    const current=merged.get(project.id);
    if(!current||String(project.updatedAt||'')>String(current.updatedAt||''))merged.set(project.id,project);
  }
  return [...merged.values()];
}
