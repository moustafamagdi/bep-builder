import {fieldGroups} from './modules.mjs';

const fieldViews={};
for(const [group,fields] of Object.entries(fieldGroups))for(const [key] of fields)fieldViews[key]=group==='appointment'?'project':group;
const listViews={parties:'organization',team:'organization',responsibilities:'organization',references:'information',uses:'information',software:'information',exchanges:'information',models:'technical',namingFields:'technical',loin:'technical',milestones:'coordination',deliverables:'coordination',clashes:'coordination',meetings:'coordination',qaChecks:'coordination',assetRequirements:'coordination',decisions:'files',appendices:'files'};

export function issueTarget(code,project){
  if(code.startsWith('field:')){const key=code.slice(6);return {view:fieldViews[key]||'project',selector:`[data-field="${key}"]`};}
  if(code.startsWith('module:')||code.startsWith('required-module:')||code.startsWith('dependency:')){const id=code.slice(code.indexOf(':')+1);return {view:'modules',selector:`[data-module-card="${id}"]`,focus:`[data-module="${id}"]`};}
  const direct={fourD:{view:'coordination',selector:'[data-field="fourDTool"]'},cobie:{view:'coordination',selector:'[data-field="cobieVersion"]'},'template-conflicts':{view:'templates',selector:'.conflict-box'}}[code];if(direct)return direct;
  const aliases={'asset-requirements':'assetRequirements','open-decisions':'decisions','missing-appendices':'appendices'},key=aliases[code]||code;
  if(listViews[key]){
    let row=null;if(code==='open-decisions')row=project.lists.decisions.findIndex(item=>item.status==='Open');if(code==='missing-appendices')row=project.lists.appendices.findIndex(item=>['Removed','Not received','Missing'].includes(item.status));
    return {view:listViews[key],selector:row>=0?`[data-list="${key}"][data-row="${row}"]`:`[data-list-card="${key}"]`};
  }
  return {view:'review',selector:'.review-hero'};
}
