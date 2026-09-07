import {governanceChecks,unresolved,validDate,approvalValid} from './governance.mjs';
import {modules,defaultLists,defaultModuleStates,fieldGroups} from './modules.mjs';

export const STORAGE_KEY='bep-studio-workspace-v2';
export const fieldDefaults={
  projectName:'',projectCode:'',description:'',location:'',sector:'',contractNumber:'',documentTitle:'Post-Contract BIM Execution Plan',documentCode:'',revision:'P01',issueDate:new Date().toISOString().slice(0,10),issuePurpose:'For review and agreement',preparedBy:'',checkedBy:'',approvedBy:'',
  contractor:'',client:'',consultant:'',designer:'',contractType:'',designResponsibility:'Pending confirmation',informationRole:'Lead appointed party',coordinationScope:'Coordination of appointed task teams and interfaces within the contractor scope.',exclusions:'',
  cde:'',cdeUrl:'',submissionPlatform:'',worksharingMode:'To be agreed',informationStates:'Work in Progress, Shared, Published, Archive',suitabilitySystem:'To be agreed',reviewWorkflow:'Information is checked by its producing team before sharing. Formal submissions follow the project review and acceptance workflow.',backupLocation:'',backupFrequency:'',retention:'',
  namingPattern:'PROJECT-ORIGINATOR-VOLUME-LEVEL-TYPE-ROLE-NUMBER',originatorCode:'',drawingStrategy:'To be agreed',crs:'',verticalDatum:'',units:'Millimetres',ursReference:'',northRotation:'',loinSystem:'To be agreed',classification:'',modelSizeLimit:'',authoringProcedure:'',
  coordinationCycle:'Weekly',issuePlatform:'',issueWorkflow:'Issues are identified, assigned, responded to and verified against the latest shared information before closure.',qaFrequency:'Before every formal information exchange',warningPolicy:'Warnings are reviewed and material warnings are resolved or recorded with an approved justification.',fourDTool:'',programmeSource:'',fiveDTool:'',assetSchema:'',cobieVersion:'',asBuiltMethod:'As-built information is updated from approved site records and verified by the responsible production team before submission.',asBuiltAccuracy:''
};

const uid=()=>globalThis.crypto?.randomUUID?.()||`p-${Date.now()}-${Math.random().toString(16).slice(2)}`;
export function newProject(seed={}){
  const now=new Date().toISOString();
  return {id:uid(),schemaVersion:2,preset:'blank',accessRole:'owner',ownerId:'',dbVersion:0,createdAt:now,updatedAt:now,archived:false,fields:{...fieldDefaults,...seed},lists:defaultLists(),moduleStates:defaultModuleStates(),notes:Object.fromEntries(modules.map(m=>[m.id,''])),attachments:[],appliedTemplates:[],templateConflicts:[],releases:[],style:{accent:'#15557a',font:'sans',cover:true,toc:true,showNotApplicable:false,logoPath:'',logoCount:0,logos:[]}};
}
export function emptyWorkspace(){return {schemaVersion:2,activeProjectId:null,projects:[]};}
export function loadWorkspace(){
  try{const raw=localStorage.getItem(STORAGE_KEY);return raw?validateWorkspace(JSON.parse(raw)):emptyWorkspace();}catch{return emptyWorkspace();}
}
export function saveWorkspace(workspace){localStorage.setItem(STORAGE_KEY,JSON.stringify(workspace));}
export function validateWorkspace(raw){
  if(!raw||raw.schemaVersion!==2||!Array.isArray(raw.projects)||raw.projects.length>100)throw new Error('Incompatible backup file.');
  const ids=new Set();
  for(const p of raw.projects){
    if(!p||typeof p.id!=='string'||ids.has(p.id)||!p.fields||!p.lists||!p.moduleStates||!p.style||!Array.isArray(p.releases))throw new Error('Invalid project data.');
    ids.add(p.id);for(const [k,v] of Object.entries(p.fields)){if(typeof v!=='string'||v.length>10000)throw new Error(`Invalid value: ${k}`);}
    const defaults=defaultLists();for(const key of Object.keys(defaults)){if(p.lists[key]===undefined)p.lists[key]=structuredClone(defaults[key]);if(!Array.isArray(p.lists[key])||p.lists[key].length>500)throw new Error(`Invalid table: ${key}`);}
    for(const m of modules)if(!['required','optional','pending','not_applicable'].includes(p.moduleStates[m.id]))throw new Error(`Invalid module status: ${m.id}`);
    if(!/^#[0-9a-f]{6}$/i.test(p.style.accent)||!['sans','serif'].includes(p.style.font))throw new Error('Invalid document identity settings.');
    if(p.fields.units?.startsWith('Length: mm;'))p.fields.units='Millimetres';
    if(p.preset===undefined)p.preset='blank';if(!['blank','default','pilot','hatco','humain'].includes(p.preset))p.preset='blank';
    if(p.accessRole===undefined)p.accessRole='owner';if(!['owner','editor','viewer'].includes(p.accessRole))p.accessRole='owner';
    if(p.ownerId===undefined)p.ownerId='';if(typeof p.ownerId!=='string'||p.ownerId.length>100)throw new Error('Invalid project owner reference.');
    if(p.dbVersion===undefined)p.dbVersion=0;p.dbVersion=Number(p.dbVersion)||0;if(!Number.isInteger(p.dbVersion)||p.dbVersion<0)throw new Error('Invalid cloud project version.');
    if(p.style.logoPath===undefined)p.style.logoPath='';if(typeof p.style.logoPath!=='string'||p.style.logoPath.length>1000)throw new Error('Invalid logo reference.');
    if(p.style.logos===undefined)p.style.logos=p.style.logoPath?[{id:'legacy-logo',path:p.style.logoPath,name:'Project logo',placement:'both'}]:[];
    if(p.style.logoCount===undefined)p.style.logoCount=p.style.logos.length;
    p.style.logoCount=Math.max(0,Math.min(4,Number(p.style.logoCount)||0));
    if(!Array.isArray(p.style.logos)||p.style.logos.length>4||p.style.logos.some(logo=>!logo||typeof logo.id!=='string'||typeof logo.path!=='string'||typeof logo.name!=='string'||!['cover','both'].includes(logo.placement)||logo.path.length>1000||logo.name.length>255))throw new Error('Invalid project logo configuration.');
    while(p.style.logos.length<p.style.logoCount)p.style.logos.push({id:`logo-slot-${p.style.logos.length+1}`,path:'',name:'',placement:'both'});
    if(p.attachments===undefined)p.attachments=[];if(!Array.isArray(p.attachments)||p.attachments.length>200||p.attachments.some(file=>!file||typeof file.id!=='string'||typeof file.path!=='string'||typeof file.name!=='string'||file.id.length>100||file.path.length>1000||file.name.length>255||!Number.isFinite(file.size)||file.size<0||file.size>26214400))throw new Error('Invalid attachment register.');
    if(p.appliedTemplates===undefined)p.appliedTemplates=[];if(!Array.isArray(p.appliedTemplates)||p.appliedTemplates.length>200)throw new Error('Invalid applied template register.');
    if(p.templateConflicts===undefined)p.templateConflicts=[];if(!Array.isArray(p.templateConflicts)||p.templateConflicts.length>500)throw new Error('Invalid template conflict register.');
  }
  return raw;
}
export function migrateLegacySnapshot(raw){
  if(!raw||raw.version!==1||!raw.fields||!raw.enabled)throw new Error('Incompatible backup file.');
  const p=newProject({
    projectName:String(raw.fields.project||''),projectCode:String(raw.fields.code||''),description:String(raw.fields.description||''),location:String(raw.fields.location||''),contractor:String(raw.fields.contractor||''),client:String(raw.fields.client||''),consultant:String(raw.fields.consultant||''),documentCode:String(raw.fields.documentCode||''),revision:String(raw.fields.revision||'P01'),issueDate:String(raw.fields.date||''),preparedBy:String(raw.fields.preparedBy||''),cde:String(raw.fields.cde||'')
  });
  if(raw.fields.software)p.lists.software.push({use:'Primary authoring',product:String(raw.fields.software),version:'',exchange:''});
  const map={overview:'overview',governance:'governance',uses:'uses',information:'information',coordination:'coordination',delivery:'delivery',fourD:'fourD',handover:'handover'};
  for(const [oldKey,newKey] of Object.entries(map)){if(raw.enabled[oldKey]===false)p.moduleStates[newKey]='not_applicable';if(typeof raw.notes?.[oldKey]==='string')p.notes[newKey]=raw.notes[oldKey];}
  if(raw.style){if(/^#[0-9a-f]{6}$/i.test(raw.style.accent))p.style.accent=raw.style.accent;if(['sans','serif'].includes(raw.style.font))p.style.font=raw.style.font;p.style.cover=raw.style.cover!==false;p.style.toc=raw.style.toc!==false;}
  return {schemaVersion:2,activeProjectId:null,projects:[p]};
}
export function cloneProject(project){const copy=structuredClone(project);copy.id=uid();copy.fields.projectName=`${project.fields.projectName} — Copy`;copy.fields.projectCode='';copy.fields.documentCode='';copy.releases=[];copy.lists.approvals=[];copy.attachments=[];copy.style.logoPath='';copy.style.logos=[];copy.style.logoCount=0;copy.accessRole='owner';copy.ownerId='';copy.dbVersion=0;copy.archived=false;copy.createdAt=copy.updatedAt=new Date().toISOString();return copy;}
export function createRelease(project){
  if(!reviewProject(project).ready)throw new Error('Resolve data gaps and record current review and authorization evidence before freezing an issue.');
  const number=project.releases.length+1,at=new Date().toISOString();
  const snapshot={fields:structuredClone(project.fields),lists:structuredClone(project.lists),moduleStates:structuredClone(project.moduleStates),notes:structuredClone(project.notes),attachments:structuredClone(project.attachments||[]),appliedTemplates:structuredClone(project.appliedTemplates||[]),templateConflicts:structuredClone(project.templateConflicts||[]),style:structuredClone(project.style)};
  project.releases.push({id:uid(),number,revision:project.fields.revision||`R${number}`,issueDate:project.fields.issueDate||at.slice(0,10),createdAt:at,readiness:reviewProject(project).score,snapshot});project.updatedAt=at;return number;
}
export function restoreRelease(project,id){const rel=project.releases.find(r=>r.id===id);if(!rel)throw new Error('Issue not found.');Object.assign(project,structuredClone(rel.snapshot));for(const key of Object.keys(defaultLists()))project.lists[key]??=[];project.updatedAt=new Date().toISOString();}

const requiredFields=['projectName','projectCode','description','documentCode','revision','issueDate','issuePurpose','preparedBy','contractor','client','consultant','designResponsibility','informationRole','coordinationScope','cde','reviewWorkflow','namingPattern','drawingStrategy','crs','verticalDatum','units','loinSystem','coordinationCycle','issueWorkflow','asBuiltMethod'];
const fieldLabels=Object.fromEntries(Object.values(fieldGroups).flat().map(([key,label])=>[key,label]));
export function reviewProject(project,today=new Date().toISOString().slice(0,10)){
  const checks=governanceChecks(project,today),advisories=[];
  const add=(passed,code,message)=>checks.push({passed:Boolean(passed),scope:'plan',severity:'critical',code,message});
  const enabled=id=>['required','optional'].includes(project.moduleStates[id]);
  const optionalFieldModules={fourDTool:'fourD',programmeSource:'fourD',fiveDTool:'fiveD',assetSchema:'assets',cobieVersion:'cobie'};
  for(const fields of Object.values(fieldGroups))for(const [key,,type,,options] of fields){
    if(optionalFieldModules[key]&&!enabled(optionalFieldModules[key]))continue;
    if(type==='select'&&project.fields[key])add(options.includes(project.fields[key]),`field:${key}`,`Choose a valid value for ${key}.`);
  }
  add(validDate(project.fields.issueDate),'field:issueDate','Set a valid issue date.');
  for(const key of requiredFields)add(!unresolved(project.fields[key]),`field:${key}`,`Required information is incomplete: ${fieldLabels[key]||key}`);
  for(const m of modules){
    const status=project.moduleStates[m.id];
    add(['required','optional','not_applicable'].includes(status),`module:${m.id}`,`Decide whether ${m.title} applies.`);
    if(m.required)add(status!=='not_applicable',`required-module:${m.id}`,`A core module was excluded: ${m.title}`);
    if(enabled(m.id)&&m.depends)for(const dep of m.depends)add(enabled(dep),`dependency:${m.id}`,`${m.title} requires ${modules.find(x=>x.id===dep)?.title}`);
  }
  const requiredSchedules={references:['title','code','revision','source'],responsibilities:['activity','responsible','accountable'],software:['use','product','version','exchange'],exchanges:['exchange','milestone','sender','receiver','format'],models:['code','discipline','zone','producer'],loin:['element','milestone','geometry','information','documentation','responsible']};
  if(enabled('coordination'))requiredSchedules.clashes=['name','setA','setB','type','tolerance','owner'];
  if(enabled('assets'))requiredSchedules.assetRequirements=['asset','property','source','milestone','format','responsible'];
  for(const [key,fields] of Object.entries(requiredSchedules)){
    const rows=project.lists[key]||[];add(rows.length>0,key,`Complete the ${key} schedule.`);
    rows.forEach((row,i)=>{for(const field of fields)add(!unresolved(row[field]),`row:${key}:${i}`,`${key} row ${i+1}: complete ${field}.`);});
  }
  if(enabled('fourD'))add(!unresolved(project.fields.fourDTool)&&!unresolved(project.fields.programmeSource),'fourD','4D requires an agreed tool and programme source.');
  if(enabled('cobie'))add(!unresolved(project.fields.cobieVersion),'cobie','COBie requires an agreed version.');
  (project.lists.decisions||[]).forEach((row,i)=>add(['Agreed','Closed'].includes(row.status),`row:decisions:${i}`,'Resolve this BEP decision or assumption before issue.'));
  (project.lists.appendices||[]).forEach((row,i)=>add(!['Removed','Not received','Missing'].includes(row.status),`row:appendices:${i}`,'Supply this referenced appendix before issue.'));
  (project.lists.references||[]).forEach((row,i)=>add(row.status!=='Not received',`row:references:${i}`,'Obtain this project reference.'));
  if(project.templateConflicts?.length)advisories.push({severity:'warning',code:'template-conflicts',message:`${project.templateConflicts.length} template conflicts need review.`});
  const planChecks=checks.filter(c=>c.scope==='plan'),failed=planChecks.filter(c=>!c.passed),completed=planChecks.length-failed.length,total=planChecks.length;
  const score=total?Math.floor(100*completed/total):0;
  const executionIssues=checks.filter(c=>c.scope!=='plan'&&!c.passed),productionChecks=checks.filter(c=>c.scope==='production');
  const productionReady=productionChecks.every(c=>c.passed)&&!(project.lists.mobilization||[]).some(r=>unresolved(r.owner)||unresolved(r.resources)||unresolved(r.acceptance)||unresolved(r.checker)||!validDate(r.date))&&(project.lists.mobilization||[]).length>0;
  const dataComplete=failed.length===0&&total>0,approvals=project.lists.approvals||[];
  const reviewed=approvalValid(project,approvals.filter(r=>r.stage==='Technical review').at(-1)||{}),authorized=approvalValid(project,approvals.filter(r=>r.stage==='Issue authorization').at(-1)||{});
  const approvalIssues=[];for(const [stage,ok] of [['Technical review',reviewed],['Issue authorization',authorized]])if(!ok)approvalIssues.push({severity:'approval',code:'approvals',message:`${stage}: record approval evidence for this BEP plan and revision.`});
  return {issues:[...failed,...advisories,...approvalIssues],critical:failed.length,warnings:advisories.length,score,completed,total,checks:planChecks,dataComplete,reviewed,authorized,ready:dataComplete&&reviewed&&authorized,executionIssues,productionReady:dataComplete&&productionReady,executionCount:executionIssues.length};
}
