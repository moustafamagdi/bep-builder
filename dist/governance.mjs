const select=(key,label,values)=>[key,label,'select',values];
export const governanceSchemas={
 compliance:{label:'EIR compliance matrix',columns:[['id','Requirement ID'],['source','Source / revision / clause'],['requirement','Requirement'],['section','BEP section ID'],['owner','Owner'],['evidence','Evidence / reference'],select('status','Compliance',['Open','Compliant','Deviation accepted','Not applicable']),['justification','Deviation / exclusion justification'],['authority','Decision authority']]},
 detailedResponsibilities:{label:'Detailed responsibility matrix',columns:[['id','Package ID'],['scope','Model / system / package'],['milestone','Milestone'],['inputs','Inputs / dependencies'],['producer','Producer'],['reviewer','Technical reviewer'],['authorizer','Authorizer'],['receiver','Receiver'],['boundary','Scope boundary / interface']]},
 mobilization:{label:'Mobilization and capability',columns:[['id','Activity ID'],['activity','Activity / capability test'],['owner','Owner'],['resources','People / capacity / tools'],['acceptance','Pass / acceptance criteria'],select('gate','Required before',['Before production','BEP issue']),['date','Target date','date'],select('status','Status',['Planned','In progress','Passed','Failed','Not applicable']),['evidence','Test / training evidence'],['checker','Checker / exclusion authority']]},
 risks:{label:'Information delivery risks',columns:[['id','Project risk ID'],['risk','Risk / cause / impact'],['owner','Owner'],select('likelihood','Likelihood',['Low','Medium','High']),select('impact','Impact',['Low','Medium','High']),['mitigation','Mitigation / response'],select('gate','Disposition required before',['During execution','Before production','BEP issue']),['date','Action due','date'],select('status','Status',['Open','Mitigating','Accepted','Closed']),['evidence','Acceptance / closure evidence']]},
 approvals:{label:'BEP review and authorization records',columns:[select('stage','Stage',['Technical review','Issue authorization','Client acceptance']),['revision','BEP revision'],['person','Reviewer / approver'],['role','Role / organization'],select('status','Decision',['Pending','Approved','Rejected']),['date','Decision date','date'],['evidence','Approval record / transmittal'],['contentKey','Content reference','readonly']]},
 changeLog:{label:'BEP change register',columns:[['revision','Revision'],['date','Change date','date'],['sections','Affected sections'],['reason','Change / reason'],['author','Author'],['reference','Instruction / decision reference']]}
};
export const deliveryColumns=[['id','Deliverable ID'],['tidp','Task team / TIDP'],['title','Deliverable'],['packageId','Responsibility package ID'],['milestone','Milestone'],['producer','Producer'],['reviewer','Reviewer'],['dependencies','Predecessor IDs (comma separated)'],['productionDays','Production days','number'],['reviewDays','Review days','number'],['date','Date','date'],['forecastDate','Forecast issue','date'],['actualDate','Actual issue','date'],['revision','Current revision'],select('status','Status',['Planned','In progress','Submitted','Accepted','Rejected']),['format','Format'],['acceptance','Acceptance'],['evidence','Acceptance evidence']];
export const unresolved=value=>!String(value||'').trim()||/\[[^\]]+\]|\b(?:TBC|TBD|pending confirmation|to be (?:agreed|confirmed)|approval pending|named .* at (?:mobilization|issue)|project-approved version)\b/i.test(String(value));
export const validDate=value=>/^\d{4}-\d{2}-\d{2}$/.test(value||'')&&!Number.isNaN(Date.parse(value))&&new Date(value).toISOString().slice(0,10)===value;
const stable=value=>Array.isArray(value)?value.map(stable):value&&typeof value==='object'?Object.fromEntries(Object.keys(value).sort().map(k=>[k,stable(value[k])])):value;
// Plan approvals deliberately exclude operational updates. Unknown fields stay in scope.
export const operationalFields={deliverables:['forecastDate','actualDate','status','revision','evidence'],mobilization:['status','evidence'],risks:['status','evidence'],exchanges:['status']};
export const gateFor=(key,row)=>row.gate||(key==='mobilization'?'Before production':'During execution');
export function isOperationalField(key,field,row={}){if(!operationalFields[key]?.includes(field))return false;if(['mobilization','risks'].includes(key)&&gateFor(key,row)==='BEP issue')return false;if(key==='mobilization'&&row.status==='Not applicable')return false;return true;}
export function planLists(p){return Object.fromEntries(Object.entries(p.lists).filter(([key])=>key!=='approvals').map(([key,rows])=>[key,rows.map(row=>Object.fromEntries(Object.entries(row).filter(([field])=>!isOperationalField(key,field,row))))]));}
const legacyContent=p=>JSON.stringify(stable({fields:p.fields,lists:Object.fromEntries(Object.entries(p.lists).filter(([key])=>key!=='approvals')),notes:p.notes,moduleStates:p.moduleStates,style:p.style,attachments:p.attachments||[]}));
export function approvalContent(p){return JSON.stringify(stable({scope:'bep-plan-v2',...(p.standardLink?{standardLink:p.standardLink}:{}),fields:p.fields,lists:planLists(p),notes:p.notes,moduleStates:p.moduleStates,style:p.style,attachments:p.attachments||[]}));}
export function contentKey(p){const s=approvalContent(p);let h=2166136261;for(let i=0;i<s.length;i++)h=Math.imul(h^s.charCodeAt(i),16777619);return `PLAN-${(h>>>0).toString(16).padStart(8,'0')}`;}
export function bindApproval(p,index){const row=p.lists.approvals[index];if(!row)throw new Error('Approval record not found.');row.contentKey=contentKey(p);row.approvalScope='bep-plan-v2';row.contentSnapshot=approvalContent(p);}
export function approvalValid(p,row){return (row.approvalScope==='bep-plan-v2'||!p.standardLink)&&row.status==='Approved'&&row.revision===p.fields.revision&&validDate(row.date)&&!unresolved(row.person)&&!unresolved(row.role)&&!unresolved(row.evidence)&&row.contentSnapshot===(row.approvalScope==='bep-plan-v2'?approvalContent(p):legacyContent(p));}
export function deliverySummary(rows,today=new Date().toISOString().slice(0,10)){return {total:rows.length,issued:rows.filter(r=>validDate(r.actualDate)).length,onTime:rows.filter(r=>validDate(r.actualDate)&&validDate(r.date)&&r.actualDate<=r.date).length,overdue:rows.filter(r=>validDate(r.date)&&!validDate(r.actualDate)&&r.date<today).length,accepted:rows.filter(r=>r.status==='Accepted'&&validDate(r.actualDate)&&!unresolved(r.evidence)).length};}
export function governanceChecks(p,today=new Date().toISOString().slice(0,10)){
 const checks=[];
 const check=(key,i,test,message,scope='plan')=>checks.push({passed:Boolean(test),scope,severity:scope==='plan'?'critical':'execution',code:i===null?key:`row:${key}:${i}`,message});
 const needed={compliance:['id','source','requirement','section','owner'],detailedResponsibilities:['id','scope','milestone','producer','reviewer','authorizer','receiver','boundary'],mobilization:['id','activity','owner','resources','checker','acceptance'],risks:['id','risk','owner','mitigation'],deliverables:['id','tidp','title','packageId','milestone','producer','reviewer','format','acceptance']};
 for(const [key,fields] of Object.entries(needed)){
  const rows=p.lists[key]||[];if(key!=='risks')check(key,null,rows.length>0,`Complete ${key} before BEP issue.`);
  const ids=new Set();rows.forEach((r,i)=>{for(const f of fields)check(key,i,!unresolved(r[f]),`${key} row ${i+1}: complete ${f}.`);check(key,i,!r.id||!ids.has(r.id),`Duplicate identifier: ${r.id}.`);ids.add(r.id);});
 }
 (p.lists.compliance||[]).forEach((r,i)=>{
  check('compliance',i,Object.hasOwn(p.moduleStates,r.section),'Map requirement to a valid BEP section ID.');
  check('compliance',i,['Compliant','Deviation accepted','Not applicable'].includes(r.status)&&!unresolved(r.evidence),'Resolve requirement and record supporting evidence.');
  if(r.status!=='Compliant')check('compliance',i,!unresolved(r.justification)&&!unresolved(r.authority),'Record exclusion/deviation justification and authority.');
 });
 (p.lists.mobilization||[]).forEach((r,i)=>{
  const gate=gateFor('mobilization',r),scope=gate==='BEP issue'?'plan':'production';
  check('mobilization',i,['Before production','BEP issue'].includes(gate),'Choose the mobilization gate.');
  check('mobilization',i,validDate(r.date),'Set a valid mobilization target date.');
  check('mobilization',i,['Planned','In progress','Passed','Failed','Not applicable'].includes(r.status),'Select a valid mobilization status.',scope);
  check('mobilization',i,['Passed','Not applicable'].includes(r.status)&&!unresolved(r.evidence)&&!unresolved(r.checker),`${r.id||'Test'}: pass the test or record an authorized exclusion with evidence before ${gate==='BEP issue'?'BEP issue':'production'}.`,scope);
  if(r.status==='Not applicable')check('mobilization',i,!unresolved(r.evidence)&&!unresolved(r.checker),'Record authorized exclusion evidence.');
  if(validDate(r.date)&&r.date<today)check('mobilization',i,['Passed','Not applicable'].includes(r.status),`${r.id||'Test'}: mobilization target date has passed.`,'execution');
 });
 (p.lists.risks||[]).forEach((r,i)=>{
  const gate=gateFor('risks',r),scope=gate==='BEP issue'?'plan':gate==='Before production'?'production':'execution';
  check('risks',i,['During execution','Before production','BEP issue'].includes(gate),'Choose a risk disposition gate.');
  check('risks',i,validDate(r.date),'Set a valid risk action date.');
  for(const field of ['likelihood','impact'])check('risks',i,['Low','Medium','High'].includes(r[field]),`Set risk ${field}.`);
  check('risks',i,['Open','Mitigating','Accepted','Closed'].includes(r.status),'Select a valid risk status.',scope);
  if(gate!=='During execution'||['Accepted','Closed'].includes(r.status))check('risks',i,['Accepted','Closed'].includes(r.status)&&!unresolved(r.evidence),`${r.id||'Risk'}: record risk acceptance / closure evidence before ${gate.toLowerCase()}.`,scope);
  if(r.impact==='High')check('risks',i,['Accepted','Closed'].includes(r.status),`${r.id||'Risk'}: high-impact risk remains under monitoring.`,'execution');
  if(validDate(r.date)&&r.date<today)check('risks',i,['Accepted','Closed'].includes(r.status),`${r.id||'Risk'}: risk action is overdue.`,'execution');
 });
 const rows=p.lists.deliverables||[],byId=new Map(rows.map(r=>[r.id,r]));
 const dependencies=r=>String(r.dependencies||'').split(',').map(s=>s.trim()).filter(Boolean);
 rows.forEach((r,i)=>{
  check('deliverables',i,validDate(r.date),'Set the baseline planned issue date.');
  for(const k of ['productionDays','reviewDays'])check('deliverables',i,r[k]!==''&&r[k]!==undefined&&Number.isInteger(Number(r[k]))&&Number(r[k])>=0,`Set non-negative whole ${k}.`);
  check('deliverables',i,(p.lists.detailedResponsibilities||[]).some(x=>x.id===r.packageId),'Link a valid responsibility package ID.');
  check('deliverables',i,dependencies(r).every(id=>byId.has(id)&&id!==r.id),'Check predecessor IDs: missing or self-referencing predecessor.');
  const seen=new Set();const cyclic=id=>{if(id===r.id)return true;if(seen.has(id)||!byId.has(id))return false;seen.add(id);return dependencies(byId.get(id)).some(cyclic);};
  check('deliverables',i,!dependencies(r).some(cyclic),'Circular delivery dependencies.');
  for(const k of ['forecastDate','actualDate'])if(r[k])check('deliverables',i,validDate(r[k]),`Invalid ${k}.`,'execution');
  check('deliverables',i,!r.status||['Planned','In progress','Submitted','Accepted','Rejected'].includes(r.status),'Select a valid delivery status.','execution');
  if(['Submitted','Accepted','Rejected'].includes(r.status))check('deliverables',i,validDate(r.actualDate),'Issued deliverable requires an actual issue date.','execution');
  if(r.status==='Accepted')check('deliverables',i,!unresolved(r.evidence),'Accepted deliverable requires acceptance evidence.','execution');
  if(validDate(r.date)&&r.date<today)check('deliverables',i,validDate(r.actualDate),`${r.id||'Deliverable'}: planned issue date has passed.`,'execution');
 });
 return checks;
}
export function governanceIssues(p,today){return governanceChecks(p,today).filter(c=>!c.passed);}
export function seedGovernance(p){
 p.lists.compliance=[{id:'REQ-001',source:'[Client EIR revision / clause]',requirement:'Confirm project naming, exchanges and information acceptance criteria against the received EIR.',section:'references',owner:'HATCO BIM Manager',evidence:'',status:'Open',justification:'',authority:''}];
 p.lists.detailedResponsibilities=[{id:'PKG-BIM',scope:'HATCO BIM delivery and appointed discipline coordination',milestone:'Construction',inputs:'Approved design references and project EIR',producer:'HATCO discipline task teams',reviewer:'HATCO Discipline Lead',authorizer:'HATCO Project Manager',receiver:'Designated project reviewer',boundary:'HATCO appointed scope; external leadership per appointment'}];
 p.lists.mobilization=['Confirm team capability and available capacity','Configure accounts, permissions and worksharing','Test coordinates and native / NWC / IFC exchange','Train team on HATCO standards and issue workflow','Test backup restoration'].map((activity,i)=>({id:`MOB-${i+1}`,activity,owner:'HATCO BIM Manager',resources:'[Assigned people / tools / availability]',date:'',acceptance:'Demonstrate the configured procedure with a checked sample and retain the test record.',gate:'Before production',status:'Planned',evidence:'',checker:'HATCO BIM Manager'}));
 p.lists.risks=[{id:'R-BIM-001',risk:'Missing EIR or survey reference may cause rework and rejected exchanges.',owner:'HATCO BIM Manager',likelihood:'Medium',impact:'High',mitigation:'Obtain and verify requirements and survey before affected production; link to project risk register.',date:'',gate:'During execution',status:'Open',evidence:''}];
 p.lists.changeLog=[{revision:p.fields.revision,date:p.fields.issueDate,sections:'All',reason:'Initial company baseline adapted to project; review required.',author:'HATCO BIM function',reference:'HAT-BIM-STD-001'}];
 p.lists.approvals=['Technical review','Issue authorization'].map(stage=>({stage,revision:p.fields.revision,person:'',role:'',status:'Pending',date:'',evidence:'',contentKey:''}));
 p.lists.deliverables=p.lists.deliverables.map((r,i)=>({...r,id:`DEL-${String(i+1).padStart(3,'0')}`,tidp:'HATCO',packageId:'PKG-BIM',milestone:i===p.lists.deliverables.length-1?'Handover':'Construction',reviewer:'HATCO Discipline Lead',dependencies:'',productionDays:'',reviewDays:'',forecastDate:'',actualDate:'',revision:'P01',status:'Planned',evidence:''}));
 return p;
}
