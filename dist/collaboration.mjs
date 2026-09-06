import {fieldGroups} from './modules.mjs';

const fieldsFor=groups=>groups.flatMap(group=>fieldGroups[group].map(([key])=>key));
const sectionFields={
  project:fieldsFor(['project','appointment']),
  information:fieldsFor(['information']),
  technical:fieldsFor(['technical']),
  coordination:fieldsFor(['coordination'])
};
const sectionLists={
  organization:['parties','team','responsibilities'],
  information:['references','uses','software','exchanges'],
  technical:['models','namingFields','loin'],
  coordination:['milestones','deliverables','clashes','meetings','qaChecks','assetRequirements'],
  files:['appendices','decisions']
};
const viewLocks={project:'project',templates:'__project__',organization:'organization',information:'information',technical:'technical',coordination:'coordination',modules:'modules',files:'files',review:'__project__',appearance:'appearance'};

const copy=value=>structuredClone(value);
export const lockKeyForView=view=>viewLocks[view]||'';

export function cloudProjectData(project){
  const stored=copy(project);
  delete stored.accessRole;delete stored.ownerId;delete stored.dbVersion;delete stored.updatedAt;
  return stored;
}

export function sectionSnapshot(project,key){
  if(key==='__project__')return cloudProjectData(project);
  const patch={};
  if(sectionFields[key])patch.fields=Object.fromEntries(sectionFields[key].map(field=>[field,project.fields[field]??'']));
  if(sectionLists[key])patch.lists=Object.fromEntries(sectionLists[key].map(list=>[list,copy(project.lists[list]||[])]));
  if(key==='modules'){patch.moduleStates=copy(project.moduleStates);patch.notes=copy(project.notes);}
  if(key==='files')patch.attachments=copy(project.attachments||[]);
  if(key==='appearance')patch.style=copy(project.style);
  return patch;
}

export function applySectionSnapshot(project,key,snapshot){
  if(key==='__project__'){
    const accessRole=project.accessRole,ownerId=project.ownerId,dbVersion=project.dbVersion,updatedAt=project.updatedAt;
    const replacement=copy(snapshot);
    Object.keys(project).forEach(field=>delete project[field]);
    Object.assign(project,replacement,{accessRole,ownerId,dbVersion,updatedAt});
    return project;
  }
  if(snapshot.fields)Object.assign(project.fields,copy(snapshot.fields));
  if(snapshot.lists)for(const [list,rows] of Object.entries(snapshot.lists))project.lists[list]=copy(rows);
  if(snapshot.moduleStates)project.moduleStates=copy(snapshot.moduleStates);
  if(snapshot.notes)project.notes=copy(snapshot.notes);
  if(snapshot.attachments)project.attachments=copy(snapshot.attachments);
  if(snapshot.style)project.style=copy(snapshot.style);
  return project;
}

export function sectionChanged(project,key,baseline){
  return JSON.stringify(sectionSnapshot(project,key))!==baseline;
}
