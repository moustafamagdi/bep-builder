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
  return {id:uid(),schemaVersion:2,createdAt:now,updatedAt:now,archived:false,fields:{...fieldDefaults,...seed},lists:defaultLists(),moduleStates:defaultModuleStates(),notes:Object.fromEntries(modules.map(m=>[m.id,''])),attachments:[],releases:[],style:{accent:'#15557a',font:'sans',cover:true,toc:true,showNotApplicable:false,logoPath:''}};
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
    if(p.style.logoPath===undefined)p.style.logoPath='';if(typeof p.style.logoPath!=='string'||p.style.logoPath.length>1000)throw new Error('Invalid logo reference.');
    if(p.attachments===undefined)p.attachments=[];if(!Array.isArray(p.attachments)||p.attachments.length>200||p.attachments.some(file=>!file||typeof file.id!=='string'||typeof file.path!=='string'||typeof file.name!=='string'||file.id.length>100||file.path.length>1000||file.name.length>255||!Number.isFinite(file.size)||file.size<0||file.size>26214400))throw new Error('Invalid attachment register.');
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
export function cloneProject(project){const copy=structuredClone(project);copy.id=uid();copy.fields.projectName=`${project.fields.projectName} — Copy`;copy.fields.projectCode='';copy.fields.documentCode='';copy.releases=[];copy.attachments=[];copy.style.logoPath='';copy.archived=false;copy.createdAt=copy.updatedAt=new Date().toISOString();return copy;}
export function createRelease(project){
  const number=project.releases.length+1,at=new Date().toISOString();
  const snapshot={fields:structuredClone(project.fields),lists:structuredClone(project.lists),moduleStates:structuredClone(project.moduleStates),notes:structuredClone(project.notes),attachments:structuredClone(project.attachments||[]),style:structuredClone(project.style)};
  project.releases.push({id:uid(),number,revision:project.fields.revision||`R${number}`,issueDate:project.fields.issueDate||at.slice(0,10),createdAt:at,readiness:reviewProject(project).score,snapshot});project.updatedAt=at;return number;
}
export function restoreRelease(project,id){const rel=project.releases.find(r=>r.id===id);if(!rel)throw new Error('Issue not found.');Object.assign(project,structuredClone(rel.snapshot));project.updatedAt=new Date().toISOString();}

const requiredFields=['projectName','projectCode','description','documentCode','revision','issueDate','issuePurpose','preparedBy','contractor','client','consultant','designResponsibility','informationRole','coordinationScope','cde','reviewWorkflow','namingPattern','drawingStrategy','crs','verticalDatum','units','loinSystem','coordinationCycle','issueWorkflow','asBuiltMethod'];
const fieldLabels=Object.fromEntries(Object.values(fieldGroups).flat().map(([key,label])=>[key,label]));
export function reviewProject(project){
  const issues=[];
  for(const key of requiredFields)if(!project.fields[key]?.trim())issues.push({severity:'critical',code:`field:${key}`,message:`Required information is incomplete: ${fieldLabels[key]||key}`});
  for(const m of modules){
    const status=project.moduleStates[m.id];if(status==='pending')issues.push({severity:'warning',code:`module:${m.id}`,message:`Module status is undecided: ${m.ar}`});
    if(m.required&&status==='not_applicable')issues.push({severity:'critical',code:`required-module:${m.id}`,message:`A core module was excluded without an alternative: ${m.ar}`});
    if(status!=='not_applicable'&&m.depends)for(const dep of m.depends)if(project.moduleStates[dep]==='not_applicable')issues.push({severity:'critical',code:`dependency:${m.id}`,message:`${m.ar} requires ${modules.find(x=>x.id===dep)?.ar}`});
  }
  if(!project.lists.references.length)issues.push({severity:'warning',code:'references',message:'No references or information requirements have been added.'});
  if(!project.lists.responsibilities.length)issues.push({severity:'warning',code:'responsibilities',message:'The responsibility matrix is empty.'});
  if(!project.lists.software.length)issues.push({severity:'critical',code:'software',message:'No software products or versions have been added.'});
  if(!project.lists.exchanges.length)issues.push({severity:'warning',code:'exchanges',message:'The information exchange schedule is empty.'});
  if(!project.lists.models.length)issues.push({severity:'warning',code:'models',message:'The model register is empty.'});
  if(!project.lists.loin.length)issues.push({severity:'warning',code:'loin',message:'The level of information need matrix is empty.'});
  if(!project.lists.deliverables.length)issues.push({severity:'critical',code:'deliverables',message:'The delivery plan is empty.'});
  if(!project.lists.clashes.length&&project.moduleStates.coordination!=='not_applicable')issues.push({severity:'warning',code:'clashes',message:'No coordination test matrix has been added.'});
  if(project.moduleStates.fourD!=='not_applicable'&&(!project.fields.fourDTool.trim()||!project.fields.programmeSource.trim()))issues.push({severity:'critical',code:'fourD',message:'4D is enabled without a tool and programme source.'});
  if(project.moduleStates.cobie!=='not_applicable'&&!project.fields.cobieVersion.trim())issues.push({severity:'critical',code:'cobie',message:'COBie is enabled without a specified version.'});
  if(project.moduleStates.assets!=='not_applicable'&&!project.lists.assetRequirements.length)issues.push({severity:'warning',code:'asset-requirements',message:'Asset information is enabled but its requirement matrix is empty.'});
  if(project.lists.decisions.some(row=>row.status==='Open'))issues.push({severity:'warning',code:'open-decisions',message:'Open decisions or assumptions remain in the project register.'});
  if(project.lists.appendices.some(row=>['Removed','Not received','Missing'].includes(row.status)))issues.push({severity:'warning',code:'missing-appendices',message:'One or more referenced appendices are missing or removed.'});
  const critical=issues.filter(i=>i.severity==='critical').length,warnings=issues.length-critical;
  const score=Math.max(0,Math.round(100-(critical*6+warnings*2)));
  return {issues,critical,warnings,score,ready:critical===0};
}
