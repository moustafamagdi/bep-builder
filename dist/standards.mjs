import {captureTemplate} from './templates.mjs';

export const isReleasedStandard=t=>t?.type==='company'&&t.data?.standard?.status==='released';
export function draftStandard(source,meta={}){
  const draft=source?.data?structuredClone(source):captureTemplate(source,'company',meta);
  const previous=draft.data.standard;
  draft.id=crypto.randomUUID();draft.version=meta.version||'';
  draft.createdAt=draft.updatedAt=new Date().toISOString();
  draft.data.standard={familyId:previous?.familyId||source?.id||draft.id,parentId:isReleasedStandard(source)?source.id:null,status:'draft',releaseNotes:''};
  return draft;
}
export function releaseStandard(draft,existing=[]){
  if(isReleasedStandard(draft))throw new Error('Create a new version to change a released standard.');
  const result=structuredClone(draft);
  result.name=result.name.trim();result.version=result.version.trim();
  if(!result.name||!result.version||!result.sourceReference.trim()||!result.data.standard?.releaseNotes?.trim())throw new Error('Name, version, source reference and release notes are required.');
  if(existing.some(t=>isReleasedStandard(t)&&t.data.standard.familyId===result.data.standard.familyId&&t.version===result.version))throw new Error('This version already exists. Choose a new version.');
  result.data.standard.status='released';result.data.standard.releasedAt=new Date().toISOString();
  result.updatedAt=result.data.standard.releasedAt;
  return result;
}
export function standardLink(template,mode){
  if(!isReleasedStandard(template))throw new Error('Release a company standard before linking it to a project.');
  return {id:template.id,familyId:template.data.standard.familyId,name:template.name,version:template.version,sourceReference:template.sourceReference,mode,appliedAt:new Date().toISOString()};
}

// Suggestions are project-owned values, not cross-section mutations. Existing free
// text and imported schedules remain valid; package identifiers remain explicit.
export function sharedOptions(project,list,column){
  const lists=project.lists||{};
  let values=[];
  if(column==='milestone')values=(lists.milestones||[]).map(r=>r.name);
  else if(column==='packageId')values=(lists.detailedResponsibilities||[]).map(r=>r.id);
  else if(column==='organization')values=(lists.parties||[]).map(r=>r.name);
  else if(['owner','producer','reviewer','authorizer','receiver','sender','responsible','accountable','consulted','informed','checker'].includes(column))values=[...(lists.parties||[]).map(r=>r.name),...(lists.team||[]).flatMap(r=>[r.name,r.role])];
  return [...new Set(values.filter(v=>typeof v==='string'&&v.trim()).map(v=>v.trim()))];
}
