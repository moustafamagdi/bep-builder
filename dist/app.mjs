import {modules,moduleGroups,statuses,fieldGroups,listSchemas} from './modules.mjs';
import {loadWorkspace,saveWorkspace,validateWorkspace,migrateLegacySnapshot,newProject,cloneProject,createRelease,restoreRelease,reviewProject} from './store.mjs';
import {buildDocument,esc} from './document.mjs';
import {signIn,signUp,signOut,restoreSession,rememberedEmail,requestPasswordReset,consumeAuthRedirect,updatePassword,fetchCloudProjects,upsertCloudProject,deleteCloudProject,mergeProjectSets,uploadAttachment,downloadAttachment,deleteAttachment} from './cloud.mjs';

const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
let workspace=loadWorkspace(),active=null,activeView='project',saveTimer,toastTimer,cloudTimer,session=null,logoObjectUrl='';
const CLOUD_OWNER_KEY='bep-studio-cloud-owner-v1';
const viewMeta={project:['Project & issue','Cover information, document control and appointment'],organization:['Parties & team','Organizations, roles and responsibility matrix'],information:['Information & platforms','References, BIM uses, exchanges, CDE and software'],technical:['Models & standards','Model register, naming, coordinates and LOIN'],coordination:['Coordination & delivery','Milestones, deliverables, clashes, QA and asset information'],modules:['BEP content','Status and project-specific text for every module'],files:['Files & appendices','Private attachments, appendix register and decisions'],review:['Review & issues','Gaps, conflicts and frozen issues'],appearance:['Branding & print','Logo, document style and visible elements'],preview:['Document preview','Print-ready English version']};
const viewLists={organization:['parties','team','responsibilities'],information:['references','uses','software','exchanges'],technical:['models','namingFields','loin'],coordination:['milestones','deliverables','clashes','meetings','qaChecks','assetRequirements']};
function notify(msg){clearTimeout(toastTimer);$('#toast').textContent=msg;$('#toast').hidden=false;toastTimer=setTimeout(()=>$('#toast').hidden=true,4500);}
function current(){return workspace.projects.find(p=>p.id===workspace.activeProjectId)||null;}
function setCloudStatus(mode,label){const button=$('#account-button');button.classList.remove('connected','syncing','error');if(mode)button.classList.add(mode);$('#account-label').textContent=label;}
async function syncProject(project,{quiet=false}={}){
  if(!session||!project)return;
  setCloudStatus('syncing','Syncing…');
  try{await upsertCloudProject(project);setCloudStatus('connected',session.user.email);if(!quiet)$('#save-status').textContent='Saved to cloud';}
  catch(error){setCloudStatus('error','Sync paused');if(!quiet)notify(error.message);}
}
function queueCloudProject(project){if(!session)return;clearTimeout(cloudTimer);cloudTimer=setTimeout(()=>syncProject(project),500);}
async function syncWorkspace(){
  if(!session)return;
  setCloudStatus('syncing','Connecting…');
  try{
    const recordedOwner=localStorage.getItem(CLOUD_OWNER_KEY),localProjects=!recordedOwner||recordedOwner===session.user.id?workspace.projects:[],cloudProjects=await fetchCloudProjects(),cloudById=new Map(cloudProjects.map(p=>[p.id,p]));
    workspace=validateWorkspace({...workspace,projects:mergeProjectSets(localProjects,cloudProjects)});saveWorkspace(workspace);
    const uploads=localProjects.filter(p=>!cloudById.has(p.id)||String(p.updatedAt||'')>String(cloudById.get(p.id).updatedAt||''));
    await Promise.all(uploads.map(p=>upsertCloudProject(p)));
    localStorage.setItem(CLOUD_OWNER_KEY,session.user.id);active=current();setCloudStatus('connected',session.user.email);renderDashboard();
    notify(uploads.length?'Local projects were merged with your cloud workspace.':'Cloud workspace is up to date.');
  }catch(error){setCloudStatus('error','Sync paused');notify(`Cloud sync paused: ${error.message}`);renderDashboard();}
}
function persist(){if(!active)return;active.updatedAt=new Date().toISOString();try{saveWorkspace(workspace);$('#save-status').textContent='Saved locally';queueCloudProject(active);}catch{$('#save-status').textContent='Save failed';notify('Local storage is full. Download a backup before continuing.');}}
function changed(){if(!active)return;$('#save-status').textContent='Saving…';clearTimeout(saveTimer);saveTimer=setTimeout(()=>{persist();renderReadiness();},250);}
function statusText(p){const r=reviewProject(p);return r.ready?'Ready for issue review':`${r.critical} critical gap${r.critical===1?'':'s'}`;}

function renderDashboard(){
  active=null;workspace.activeProjectId=null;saveWorkspace(workspace);$('#editor').hidden=true;$('#dashboard').hidden=false;$('#current-project-name').textContent='Projects';$$('.editor-only').forEach(x=>x.hidden=true);
  const live=workspace.projects.filter(p=>!p.archived),archived=workspace.projects.filter(p=>p.archived),ready=live.filter(p=>reviewProject(p).ready).length;
  $('#portfolio-summary').innerHTML=`<article><span>Active projects</span><strong>${live.length}</strong></article><article><span>Ready for review</span><strong>${ready}</strong></article><article><span>Frozen issues</span><strong>${workspace.projects.reduce((n,p)=>n+p.releases.length,0)}</strong></article><article><span>Archived</span><strong>${archived.length}</strong></article>`;
  const q=$('#project-search').value.trim().toLowerCase(),matches=workspace.projects.filter(p=>`${p.fields.projectName} ${p.fields.projectCode}`.toLowerCase().includes(q));
  $('#project-list').innerHTML=matches.length?matches.sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt)).map(p=>{const r=reviewProject(p);return `<article class="project-card ${p.archived?'archived':''}" data-id="${p.id}"><div class="project-card-top"><span class="project-code">${esc(p.fields.projectCode||'NO CODE')}</span><span class="score ${r.ready?'ready':''}">${r.score}%</span></div><h3>${esc(p.fields.projectName||'Untitled project')}</h3><p>${esc(p.fields.client||'Client not assigned')}</p><div class="project-meta"><span>${statusText(p)}</span><span>${p.releases.length} issue${p.releases.length===1?'':'s'}</span></div><div class="card-actions"><button data-action="open" class="button primary">Open</button><button data-action="duplicate" class="icon-button" title="Duplicate project">⧉</button><button data-action="archive" class="icon-button" title="${p.archived?'Restore':'Archive'}">${p.archived?'↥':'⌄'}</button><button data-action="delete" class="icon-button danger-text" title="Delete">×</button></div></article>`}).join(''):`<div class="empty-state"><strong>No projects yet</strong><p>Create a BEP project. Your work is saved automatically on this device.</p></div>`;
}
function openProject(id){workspace.activeProjectId=id;active=current();if(!active)return;saveWorkspace(workspace);$('#dashboard').hidden=true;$('#editor').hidden=false;$$('.editor-only').forEach(x=>x.hidden=false);$('#current-project-name').textContent=active.fields.projectName||'Untitled project';showView('project');}
function renderReadiness(){if(!active)return;const r=reviewProject(active);$('#readiness-value').textContent=`${r.score}%`;$('#readiness-bar').style.width=`${r.score}%`;$('#readiness-label').textContent=r.ready?'No critical gaps block issue':`${r.critical} critical · ${r.warnings} warning${r.warnings===1?'':'s'}`;$('#current-project-name').textContent=active.fields.projectName||'Untitled project';}
function fieldInput([key,label,type,required,options]){const value=active.fields[key]||'',req=required?'<span class="required">Required</span>':'';if(type==='textarea')return `<label class="field wide"><span>${label}${req}</span><textarea data-field="${key}" rows="4">${esc(value)}</textarea></label>`;if(type==='select')return `<label class="field"><span>${label}${req}</span><select data-field="${key}">${options.map(o=>`<option ${value===o?'selected':''}>${esc(o)}</option>`).join('')}</select></label>`;return `<label class="field"><span>${label}${req}</span><input data-field="${key}" type="${type}" value="${esc(value)}"></label>`;}
function fieldsCard(title,group){return `<section class="form-card"><h2>${title}</h2><div class="field-grid">${fieldGroups[group].map(fieldInput).join('')}</div></section>`;}
function listCell(key,rowIndex,row,[column,,type='text',options=[]]){const value=row[column]||'';if(type==='select')return `<select data-list="${key}" data-row="${rowIndex}" data-col="${column}">${options.map(option=>`<option ${value===option?'selected':''}>${esc(option)}</option>`).join('')}</select>`;return `<input data-list="${key}" data-row="${rowIndex}" data-col="${column}" type="${type}" value="${esc(value)}">`;}
function listEditor(key){const schema=listSchemas[key],rows=active.lists[key];return `<section class="form-card table-card"><div class="card-heading"><div><h2>${schema.label}</h2><p>${rows.length} record${rows.length===1?'':'s'}</p></div><button class="button secondary" data-add-row="${key}">+ Add row</button></div><div class="table-scroll"><table class="editor-table"><thead><tr>${schema.columns.map(c=>`<th>${c[1]}</th>`).join('')}<th></th></tr></thead><tbody>${rows.length?rows.map((row,i)=>`<tr>${schema.columns.map(column=>`<td>${listCell(key,i,row,column)}</td>`).join('')}<td><button class="row-delete" data-delete-row="${key}" data-row="${i}" aria-label="Delete row">×</button></td></tr>`).join(''):`<tr><td colspan="${schema.columns.length+1}" class="empty-cell">No records yet — add the first row.</td></tr>`}</tbody></table></div></section>`;}
function formatBytes(bytes){if(bytes<1024)return `${bytes} B`;if(bytes<1048576)return `${(bytes/1024).toFixed(1)} KB`;return `${(bytes/1048576).toFixed(1)} MB`;}
function renderFiles(root){const files=active.attachments||[];root.innerHTML=`<section class="form-card upload-card"><div><h2>Private project attachments</h2><p>Upload approved references, diagrams and appendices. Files are stored privately and linked to this project.</p></div><label class="button primary" for="attachment-upload">Upload files<input id="attachment-upload" type="file" multiple accept=".pdf,.png,.jpg,.jpeg,.csv,.xlsx,.docx" hidden></label></section><section class="form-card"><div class="card-heading"><h2>Uploaded files</h2><span>${files.length} file${files.length===1?'':'s'}</span></div><div class="file-list">${files.length?files.map(file=>`<article><div class="file-icon">${esc((file.name.split('.').pop()||'FILE').slice(0,4).toUpperCase())}</div><div><strong>${esc(file.name)}</strong><span>${formatBytes(file.size)} · ${esc(new Date(file.uploadedAt).toLocaleDateString('en-GB'))}</span></div><div class="file-actions"><button class="button ghost" data-download-file="${esc(file.id)}">Download</button><button class="icon-button danger-text" data-delete-file="${esc(file.id)}" aria-label="Delete file">×</button></div></article>`).join(''):'<p class="empty-cell">No files uploaded yet.</p>'}</div></section>${listEditor('appendices')}${listEditor('decisions')}`;}
function renderFormView(){
  if(!active)return;const root=$('#form-view');
  if(activeView==='project')root.innerHTML=fieldsCard('Project information','project')+fieldsCard('Appointment & scope','appointment');
  else if(activeView==='organization')root.innerHTML=viewLists.organization.map(listEditor).join('');
  else if(activeView==='information')root.innerHTML=fieldsCard('Data environment & procedures','information')+viewLists.information.map(listEditor).join('');
  else if(activeView==='technical')root.innerHTML=fieldsCard('Technical standards','technical')+viewLists.technical.map(listEditor).join('');
  else if(activeView==='coordination')root.innerHTML=fieldsCard('Coordination & closeout settings','coordination')+viewLists.coordination.map(listEditor).join('');
  else if(activeView==='modules')root.innerHTML=moduleGroups.map(g=>`<section class="form-card"><h2>${g.label}</h2><div class="module-grid">${modules.filter(m=>m.group===g.id).map(m=>`<article class="module-card"><div><strong>${m.ar}</strong><span>${m.title}</span><p>${m.desc}</p></div><select data-module="${m.id}">${statuses.map(s=>`<option value="${s.value}" ${active.moduleStates[m.id]===s.value?'selected':''}>${s.label}</option>`).join('')}</select><label>Project-specific text<textarea data-note="${m.id}" rows="2" placeholder="Added to the end of this section">${esc(active.notes[m.id]||'')}</textarea></label></article>`).join('')}</div></section>`).join('');
  else if(activeView==='files')renderFiles(root);
  else if(activeView==='review')renderReview(root);
  else if(activeView==='appearance')root.innerHTML=`<section class="form-card"><div class="card-heading"><div><h2>Company logo</h2><p>${active.style.logoPath?'A private logo is linked to this project.':'No logo uploaded. The generic BEP mark will be used.'}</p></div><div class="logo-actions"><label class="button secondary" for="logo-upload">${active.style.logoPath?'Replace logo':'Upload logo'}<input id="logo-upload" type="file" accept="image/png,image/jpeg" hidden></label>${active.style.logoPath?'<button class="button ghost danger-text" id="remove-logo">Remove</button>':''}</div></div></section><section class="form-card"><h2>Document identity</h2><div class="field-grid"><label class="field"><span>Primary colour</span><input type="color" data-style="accent" value="${active.style.accent}"></label><label class="field"><span>Document typeface</span><select data-style="font"><option value="sans" ${active.style.font==='sans'?'selected':''}>Arial / Sans serif</option><option value="serif" ${active.style.font==='serif'?'selected':''}>Georgia / Serif</option></select></label><label class="check"><input type="checkbox" data-style="cover" ${active.style.cover?'checked':''}>Show cover</label><label class="check"><input type="checkbox" data-style="toc" ${active.style.toc?'checked':''}>Show table of contents</label><label class="check"><input type="checkbox" data-style="showNotApplicable" ${active.style.showNotApplicable?'checked':''}>Show excluded-module register</label></div></section><section class="form-card"><h2>Printing</h2><p>Use A4, enable Background graphics, and disable the browser's Headers and footers. Wide tables scroll while editing and fit within the page when printed.</p><button class="button primary" data-open-preview>Open preview</button></section>`;
  bindFormEvents();
}
function renderReview(root){const r=reviewProject(active);root.innerHTML=`<section class="review-hero ${r.ready?'ready':''}"><div><span>${r.ready?'READY FOR ISSUE REVIEW':'WORKING DRAFT'}</span><h2>${r.score}% ready</h2><p>${r.ready?'Critical requirements are complete. Review the content, then freeze the issue.':'Complete the critical items before freezing a formal issue.'}</p></div><button class="button primary" id="create-release" ${r.ready?'':'disabled'}>Freeze issue ${esc(active.fields.revision||'')}</button></section><section class="form-card"><div class="card-heading"><h2>Review results</h2><span>${r.critical} critical · ${r.warnings} warning${r.warnings===1?'':'s'}</span></div><div class="issue-list">${r.issues.length?r.issues.map(i=>`<article class="issue ${i.severity}"><b>${i.severity==='critical'?'Resolve':'Warning'}</b><span>${esc(i.message)}</span></article>`).join(''):'<div class="success-state">No recorded gaps.</div>'}</div></section><section class="form-card"><div class="card-heading"><h2>Frozen issues</h2><span>Unaffected by changes to the current draft</span></div><div class="release-list">${active.releases.length?active.releases.slice().reverse().map(r=>`<article><div><strong>${esc(r.revision)}</strong><span>Issue ${r.number} · ${esc(r.issueDate)} · ${r.readiness}% ready</span></div><button class="button ghost" data-restore-release="${r.id}">Restore as draft</button></article>`).join(''):'<p class="empty-cell">No frozen issues yet.</p>'}</div></section>`;}
const safeFileName=name=>name.normalize('NFKD').replace(/[^a-zA-Z0-9._-]+/g,'-').replace(/-+/g,'-').slice(-120)||'file';
async function addAttachments(files){
  if(!session){notify('Sign in before uploading private files.');openAuth();return;}
  const allowed=new Set(['application/pdf','image/png','image/jpeg','text/csv','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','application/vnd.openxmlformats-officedocument.wordprocessingml.document']);
  for(const file of files){
    if(file.size>26214400){notify(`${file.name} is larger than 25 MB.`);continue;}
    if(!allowed.has(file.type)){notify(`${file.name} has an unsupported file type.`);continue;}
    const id=crypto.randomUUID(),path=`${session.user.id}/${active.id}/attachments/${id}-${safeFileName(file.name)}`;
    setCloudStatus('syncing',`Uploading ${file.name}…`);
    try{await uploadAttachment(file,path);active.attachments.push({id,path,name:file.name,size:file.size,type:file.type,uploadedAt:new Date().toISOString()});active.lists.appendices.push({title:file.name,reference:'',status:'Attached',location:file.name,attachmentId:id});}
    catch(error){notify(`Upload failed: ${error.message}`);}
  }
  persist();renderFormView();setCloudStatus('connected',session.user.email);
}
async function downloadStoredFile(id){const file=active.attachments.find(item=>item.id===id);if(!file)return;try{const blob=await downloadAttachment(file.path),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=file.name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}catch(error){notify(error.message);}}
async function removeStoredFile(id){const file=active.attachments.find(item=>item.id===id);if(!file||!await confirmAction('Delete attachment',`${file.name} will be permanently removed from secure storage.`))return;try{await deleteAttachment(file.path);active.attachments=active.attachments.filter(item=>item.id!==id);const appendix=active.lists.appendices.find(row=>row.attachmentId===id);if(appendix){appendix.status='Removed';appendix.location='—';}persist();renderFormView();notify('Attachment deleted.');}catch(error){notify(error.message);}}
async function setLogo(file){if(!session){notify('Sign in before uploading a private logo.');openAuth();return;}if(!['image/png','image/jpeg'].includes(file.type)||file.size>5242880){notify('Use a PNG or JPEG logo no larger than 5 MB.');return;}const old=active.style.logoPath,path=`${session.user.id}/${active.id}/branding/${crypto.randomUUID()}-${safeFileName(file.name)}`;try{setCloudStatus('syncing','Uploading logo…');await uploadAttachment(file,path);active.style.logoPath=path;if(old)await deleteAttachment(old).catch(()=>{});persist();renderFormView();setCloudStatus('connected',session.user.email);notify('Project logo updated.');}catch(error){setCloudStatus('error','Upload failed');notify(error.message);}}
async function removeLogo(){const path=active.style.logoPath;if(!path||!await confirmAction('Remove logo','The logo will be permanently removed from secure storage.'))return;try{await deleteAttachment(path);active.style.logoPath='';persist();renderFormView();notify('Project logo removed.');}catch(error){notify(error.message);}}
async function deleteProjectStorage(project){const paths=[...(project.attachments||[]).map(file=>file.path),project.style.logoPath].filter(Boolean);await Promise.all(paths.map(path=>deleteAttachment(path).catch(()=>null)));}
function bindFormEvents(){
  $$('[data-field]').forEach(el=>el.addEventListener('input',()=>{active.fields[el.dataset.field]=el.value;changed();}));
  $$('[data-list]').forEach(el=>el.addEventListener('input',()=>{active.lists[el.dataset.list][+el.dataset.row][el.dataset.col]=el.value;changed();}));
  $$('[data-add-row]').forEach(btn=>btn.addEventListener('click',()=>{const key=btn.dataset.addRow;active.lists[key].push(Object.fromEntries(listSchemas[key].columns.map(([column,,type,options])=>[column,type==='select'?options[0]:'' ])));changed();renderFormView();}));
  $$('[data-delete-row]').forEach(btn=>btn.addEventListener('click',()=>{active.lists[btn.dataset.deleteRow].splice(+btn.dataset.row,1);changed();renderFormView();}));
  $$('[data-module]').forEach(el=>el.addEventListener('change',()=>{active.moduleStates[el.dataset.module]=el.value;const mod=modules.find(m=>m.id===el.dataset.module);if(el.value!=='not_applicable'&&mod?.depends)for(const dep of mod.depends)if(active.moduleStates[dep]==='not_applicable')active.moduleStates[dep]='required';changed();renderFormView();notify('The module and its dependencies were updated.');}));
  $$('[data-note]').forEach(el=>el.addEventListener('input',()=>{active.notes[el.dataset.note]=el.value;changed();}));
  $$('[data-style]').forEach(el=>el.addEventListener('input',()=>{active.style[el.dataset.style]=el.type==='checkbox'?el.checked:el.value;changed();}));
  $$('[data-open-preview]').forEach(el=>el.addEventListener('click',()=>showView('preview')));
  $('#attachment-upload')?.addEventListener('change',event=>addAttachments([...event.target.files]));
  $$('[data-download-file]').forEach(button=>button.addEventListener('click',()=>downloadStoredFile(button.dataset.downloadFile)));
  $$('[data-delete-file]').forEach(button=>button.addEventListener('click',()=>removeStoredFile(button.dataset.deleteFile)));
  $('#logo-upload')?.addEventListener('change',event=>{const file=event.target.files[0];if(file)setLogo(file);});
  $('#remove-logo')?.addEventListener('click',removeLogo);
  $('#create-release')?.addEventListener('click',()=>{const n=createRelease(active);persist();renderFormView();notify(`Issue ${n} was frozen.`);});
  $$('[data-restore-release]').forEach(btn=>btn.addEventListener('click',async()=>{if(await confirmAction('Restore issue','The current draft will be replaced with this issue snapshot.')){restoreRelease(active,btn.dataset.restoreRelease);persist();renderFormView();renderReadiness();notify('The issue was restored as an editable draft.');}}));
}
async function showView(view){activeView=view;$$('#editor-nav button').forEach(b=>b.classList.toggle('active',b.dataset.view===view));const [title,desc]=viewMeta[view];$('#view-heading').innerHTML=`<span class="eyebrow">BEP WORKSPACE</span><h1>${title}</h1><p>${desc}</p>`;const preview=view==='preview';$('.workarea').hidden=preview;$('#document-pane').classList.toggle('show',preview);if(preview){const projectId=active.id,r=reviewProject(active);document.documentElement.style.setProperty('--accent',active.style.accent);document.documentElement.style.setProperty('--doc-font',active.style.font==='serif'?'Georgia,serif':'Arial,sans-serif');$('#document').innerHTML=buildDocument(active,r);if(logoObjectUrl){URL.revokeObjectURL(logoObjectUrl);logoObjectUrl='';}if(active.style.logoPath&&session)try{logoObjectUrl=URL.createObjectURL(await downloadAttachment(active.style.logoPath));if(active?.id===projectId&&activeView==='preview')$('#document').innerHTML=buildDocument(active,r,logoObjectUrl);}catch(error){notify(`Logo preview unavailable: ${error.message}`);}}else renderFormView();renderReadiness();}
function confirmAction(title,message){return new Promise(resolve=>{const d=$('#confirm-dialog');$('#confirm-title').textContent=title;$('#confirm-message').textContent=message;d.addEventListener('close',()=>resolve(d.returnValue==='confirm'),{once:true});d.showModal();});}

$('#new-project').addEventListener('click',()=>{$('#new-project-form').reset();$('#project-dialog').showModal();});
$('#new-project-form').addEventListener('submit',event=>{event.preventDefault();const submitter=event.submitter;if(submitter?.value!=='create'){$('#project-dialog').close('cancel');return;}const data=new FormData(event.currentTarget),p=newProject({projectName:String(data.get('name')).trim(),projectCode:String(data.get('code')).trim(),contractor:String(data.get('contractor')).trim()});workspace.projects.push(p);saveWorkspace(workspace);syncProject(p,{quiet:true});$('#project-dialog').close('create');openProject(p.id);});
$('#project-list').addEventListener('click',async event=>{const btn=event.target.closest('button[data-action]');if(!btn)return;const card=btn.closest('[data-id]'),p=workspace.projects.find(x=>x.id===card.dataset.id);if(btn.dataset.action==='open')openProject(p.id);if(btn.dataset.action==='duplicate'){const copy=cloneProject(p);workspace.projects.push(copy);saveWorkspace(workspace);syncProject(copy,{quiet:true});renderDashboard();notify('An independent project copy was created.');}if(btn.dataset.action==='archive'){p.archived=!p.archived;p.updatedAt=new Date().toISOString();saveWorkspace(workspace);syncProject(p,{quiet:true});renderDashboard();}if(btn.dataset.action==='delete'&&await confirmAction('Delete project',`${p.fields.projectName} and its frozen issues will be removed permanently from this device and your cloud workspace.`)){workspace.projects=workspace.projects.filter(x=>x.id!==p.id);saveWorkspace(workspace);if(session)try{await deleteProjectStorage(p);await deleteCloudProject(p.id);}catch(error){notify(`Deleted locally, but cloud deletion failed: ${error.message}`);}renderDashboard();}});
$('#project-search').addEventListener('input',renderDashboard);$('#back-dashboard').addEventListener('click',renderDashboard);$('#go-home').addEventListener('click',renderDashboard);
$$('#editor-nav button').forEach(btn=>btn.addEventListener('click',()=>showView(btn.dataset.view)));$('#close-preview').addEventListener('click',()=>showView('review'));
$('#print').addEventListener('click',async()=>{if(!active)return;const r=reviewProject(active);await showView('preview');if(!r.ready&&!confirm('The document has critical gaps and will be marked as an incomplete draft. Continue to print?'))return;setTimeout(()=>window.print(),50);});
$('#backup-all').addEventListener('click',()=>{const blob=new Blob([JSON.stringify({...workspace,exportedAt:new Date().toISOString()},null,2)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`bep-studio-backup-${new Date().toISOString().slice(0,10)}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);notify('Backup is ready.');});
$('#restore-all').addEventListener('change',async event=>{const file=event.target.files[0];if(!file)return;try{if(file.size>10_000_000)throw new Error('The file is larger than 10 MB.');const raw=JSON.parse(await file.text()),loaded=raw.schemaVersion===2?validateWorkspace(raw):validateWorkspace(migrateLegacySnapshot(raw));if(await confirmAction('Restore backup','All projects saved on this device will be replaced.')){workspace=loaded;saveWorkspace(workspace);if(session)await Promise.all(workspace.projects.map(p=>upsertCloudProject(p)));renderDashboard();notify(raw.version===1?'The legacy snapshot was migrated and restored.':'Projects and issues were restored.');}}catch(error){notify(error instanceof SyntaxError?'Invalid JSON file.':error.message);}finally{event.target.value='';}});
window.addEventListener('storage',()=>{workspace=loadWorkspace();if(!active)renderDashboard();});

function showAuthMessage(message,success=false){const el=$('#auth-message');el.textContent=message;el.classList.toggle('success',success);el.hidden=false;}
function clearAuthMessage(){$('#auth-message').hidden=true;$('#auth-message').classList.remove('success');}
function setAuthBusy(form,busy,label){const button=form.querySelector('.auth-submit');button.disabled=busy;if(busy){button.dataset.label=button.textContent;button.textContent=label;}else if(button.dataset.label){button.textContent=button.dataset.label;delete button.dataset.label;}}
function showAuthView(view,{message='',success=false}={}){
  document.body.classList.add('auth-locked');$('#auth-screen').hidden=false;
  const standard=['signin','signup'].includes(view);$('#auth-standard-head').hidden=!standard;$('#auth-tabs').hidden=!standard;
  $$('[data-auth-form]').forEach(form=>form.hidden=form.dataset.authForm!==view);
  $$('[data-auth-view="signin"],[data-auth-view="signup"]').forEach(tab=>tab.setAttribute('aria-selected',String(tab.dataset.authView===view)));
  if(standard){const signup=view==='signup';$('#auth-title').textContent=signup?'Create your account':'Welcome back';$('#auth-subtitle').textContent=signup?'Set up secure access to your BEP workspace.':'Sign in to continue to your BIM Execution Plans.';}
  clearAuthMessage();if(message)showAuthMessage(message,success);
  const email=rememberedEmail();if(email)$$(`[data-auth-form="${view}"] input[name="email"]`).forEach(input=>input.value=email);
  setTimeout(()=>document.querySelector(`[data-auth-form="${view}"] input:not([type="checkbox"])`)?.focus(),50);
}
function unlockApp(){$('#auth-screen').hidden=true;document.body.classList.remove('auth-locked');}
function openAuth(){showAuthView('signin');}
$('#account-button').addEventListener('click',async()=>{
  if(!session){openAuth();return;}
  if(await confirmAction('Sign out','You will need to sign in again to access the project workspace.')){
    await signOut();session=null;setCloudStatus('','Sign in');showAuthView('signin',{message:'You have signed out successfully.',success:true});
  }
});
$$('[data-auth-view]').forEach(button=>button.addEventListener('click',()=>showAuthView(button.dataset.authView)));
$$('[data-toggle-password]').forEach(button=>button.addEventListener('click',()=>{const input=button.parentElement.querySelector('input'),show=input.type==='password';input.type=show?'text':'password';button.textContent=show?'Hide':'Show';button.setAttribute('aria-label',`${show?'Hide':'Show'} password`);}));
$('#signin-form').addEventListener('submit',async event=>{
  event.preventDefault();const form=event.currentTarget,data=new FormData(form),email=String(data.get('email')).trim(),password=String(data.get('password')),remember=data.get('remember')==='on';
  clearAuthMessage();setAuthBusy(form,true,'Signing in…');
  try{session=await signIn(email,password,remember);await syncWorkspace();unlockApp();}
  catch(error){showAuthMessage(error.message);}
  finally{setAuthBusy(form,false);}
});
$('#signup-form').addEventListener('submit',async event=>{
  event.preventDefault();const form=event.currentTarget,data=new FormData(form),email=String(data.get('email')).trim(),password=String(data.get('password')),confirmPassword=String(data.get('confirmPassword')),remember=data.get('remember')==='on';
  if(password!==confirmPassword){showAuthMessage('The password confirmation does not match.');return;}
  clearAuthMessage();setAuthBusy(form,true,'Creating account…');
  try{
    const result=await signUp(email,password,remember,location.origin);
    if(result?.access_token){session=result;await syncWorkspace();unlockApp();}
    else showAuthView('signin',{message:'Account created. Check your email to confirm it, then sign in.',success:true});
  }catch(error){showAuthMessage(error.message);}
  finally{setAuthBusy(form,false);}
});
$('#forgot-form').addEventListener('submit',async event=>{
  event.preventDefault();const form=event.currentTarget,email=String(new FormData(form).get('email')).trim();clearAuthMessage();setAuthBusy(form,true,'Sending…');
  try{await requestPasswordReset(email,location.origin);showAuthMessage('If an account exists for this email, a reset link has been sent. Check your inbox and spam folder.',true);}
  catch(error){showAuthMessage(error.message);}
  finally{setAuthBusy(form,false);}
});
$('#reset-form').addEventListener('submit',async event=>{
  event.preventDefault();const form=event.currentTarget,data=new FormData(form),password=String(data.get('password')),confirmPassword=String(data.get('confirmPassword'));
  if(password!==confirmPassword){showAuthMessage('The password confirmation does not match.');return;}
  clearAuthMessage();setAuthBusy(form,true,'Updating…');
  try{await updatePassword(password);await signOut();session=null;showAuthView('signin',{message:'Password updated successfully. Sign in with your new password.',success:true});}
  catch(error){showAuthMessage(error.message);}
  finally{setAuthBusy(form,false);}
});
window.addEventListener('online',()=>{if(session)syncWorkspace();});

async function initialize(){
  renderDashboard();setCloudStatus('syncing','Connecting…');
  try{
    const redirect=await consumeAuthRedirect();
    if(redirect){session=redirect.session;if(redirect.type==='recovery'){setCloudStatus('','Password recovery');showAuthView('reset');return;}}
    if(!session)session=await restoreSession();
    if(session){await syncWorkspace();unlockApp();}
    else{setCloudStatus('','Sign in');showAuthView('signin');}
  }catch(error){setCloudStatus('error','Authentication error');showAuthView('signin',{message:error.message});}
}
initialize();
