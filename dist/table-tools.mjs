import {listSchemas} from './modules.mjs';
import {isOperationalField,validDate} from './governance.mjs';

export function matchingRows(rows,query='',status=''){
  const terms=query.toLowerCase().trim().split(/\s+/).filter(Boolean);
  return rows.flatMap((row,index)=>{const text=Object.entries(row).filter(([key,v])=>key!=='contentSnapshot'&&key!=='controlId'&&typeof v==='string').map(([,v])=>v).join(' ').toLowerCase();return (!status||row.status===status)&&terms.every(t=>text.includes(t))?[index]:[];});
}
export function bulkColumns(key){return ['approvals','changeLog','appendices'].includes(key)?[]:(listSchemas[key]?.columns||[]).filter(([col,,type])=>type!=='readonly'&&!['id','code','order'].includes(col));}
export function previewBulk(rows,key,indices,column,value){
  const spec=bulkColumns(key).find(c=>c[0]===column);if(!spec)throw new Error('This column cannot be edited in bulk.');
  if(typeof value!=='string'||value.length>10000)throw new Error('Invalid value.');
  if(spec[2]==='select'&&!spec[3].includes(value))throw new Error('Choose a listed value.');
  if(value&&spec[2]==='date'&&!validDate(value))throw new Error('Enter a valid date.');
  if(value&&spec[2]==='number'&&(!Number.isFinite(Number(value))||Number(value)<0))throw new Error('Enter a non-negative number.');
  const selected=[...new Set(indices)];
  if(!selected.length||selected.some(i=>!Number.isInteger(i)||i<0||i>=rows.length))throw new Error('Select current rows first.');
  const changes=selected.filter(i=>(rows[i][column]||'')!==value).map(index=>({index,before:rows[index][column]||'',after:value,label:rows[index].id||rows[index].title||rows[index].name||`Row ${index+1}`}));
  const plan=changes.some(({index})=>!isOperationalField(key,column,rows[index])||!isOperationalField(key,column,{...rows[index],[column]:value}));
  return {changes,plan,column,key,snapshot:JSON.stringify(rows)};
}
export function applyBulk(rows,preview){
  if(JSON.stringify(rows)!==preview.snapshot)throw new Error('The schedule changed. Close this preview and select the rows again.');
  const result=structuredClone(rows);for(const c of preview.changes)result[c.index][preview.column]=c.after;return result;
}
export function baselineToken(project){
  return JSON.stringify([(project.lists.approvals||[]).filter(r=>r.status==='Approved'&&r.contentSnapshot).map(r=>[r.stage,r.contentSnapshot]),project.releases?.at(-1)?.id||'']);
}
export function hasControlledBaseline(project){return Boolean(project.releases?.length||(project.lists.approvals||[]).some(r=>r.status==='Approved'&&r.contentSnapshot));}
