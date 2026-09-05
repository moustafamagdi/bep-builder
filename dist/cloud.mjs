const SUPABASE_URL='https://jtubxhixhiqeyxhpqgpf.supabase.co';
const SUPABASE_PUBLISHABLE_KEY='sb_publishable_DRTFtffhvBGljsgWbE2rzQ__8cqvvpk';
const SESSION_KEY='bep-studio-cloud-session-v1';

function readSession(){
  try{return JSON.parse(localStorage.getItem(SESSION_KEY))||null;}catch{return null;}
}

function writeSession(session){
  if(session)localStorage.setItem(SESSION_KEY,JSON.stringify(session));
  else localStorage.removeItem(SESSION_KEY);
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

export async function signIn(email,password){
  return writeSession(normalizeSession(await api('/auth/v1/token?grant_type=password',{method:'POST',body:{email,password}})));
}

export async function signUp(email,password){
  const data=await api('/auth/v1/signup',{method:'POST',body:{email,password}});
  if(data?.access_token)writeSession(normalizeSession(data));
  return data;
}

export async function signOut(){
  const session=readSession();
  try{if(session?.access_token)await api('/auth/v1/logout',{method:'POST',token:session.access_token});}finally{writeSession(null);}
}

async function refresh(session){
  if(!session?.refresh_token)return null;
  try{return writeSession(normalizeSession(await api('/auth/v1/token?grant_type=refresh_token',{method:'POST',body:{refresh_token:session.refresh_token}})));}
  catch{writeSession(null);return null;}
}

export async function restoreSession(){
  const session=readSession();
  if(!session)return null;
  if((session.expires_at||0)>Math.floor(Date.now()/1000)+60)return session;
  return refresh(session);
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

export function mergeProjectSets(localProjects,cloudProjects){
  const merged=new Map();
  for(const project of [...cloudProjects,...localProjects]){
    const current=merged.get(project.id);
    if(!current||String(project.updatedAt||'')>String(current.updatedAt||''))merged.set(project.id,project);
  }
  return [...merged.values()];
}
