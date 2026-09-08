const stable=v=>Array.isArray(v)?v.map(stable):v&&typeof v==='object'?Object.fromEntries(Object.keys(v).sort().map(k=>[k,stable(v[k])])):v;
export function compareRevisions(before,after){
 const changes=[];
 function walk(a,b,path){
  if(JSON.stringify(stable(a))===JSON.stringify(stable(b)))return;
  if(Array.isArray(a)&&Array.isArray(b)){
   const combined=[...a,...b],identity=['id','code'].find(key=>combined.length&&combined.every(r=>r&&typeof r==='object'&&typeof r[key]==='string'&&r[key])&&[a,b].every(rows=>new Set(rows.map(r=>r[key])).size===rows.length));
   if(identity){const left=new Map(a.map(r=>[r[identity],r])),right=new Map(b.map(r=>[r[identity],r]));for(const id of new Set([...left.keys(),...right.keys()]))walk(left.get(id),right.get(id),`${path}[${id}]`);if(a.map(r=>r[identity]).join('|')!==b.map(r=>r[identity]).join('|')&&a.length===b.length&&a.every(r=>right.has(r[identity])))changes.push({path:`${path}.rowOrder`,kind:'Changed',before:a.map(r=>r[identity]),after:b.map(r=>r[identity])});}
   else for(let i=0;i<Math.max(a.length,b.length);i++)walk(a[i],b[i],`${path}[row ${i+1}]`);
   return;
  }
  if(a&&b&&!Array.isArray(a)&&!Array.isArray(b)&&typeof a==='object'&&typeof b==='object'){
   for(const k of new Set([...Object.keys(a),...Object.keys(b)])){if(['contentSnapshot','controlId'].includes(k))continue;walk(a[k],b[k],path?`${path}.${k}`:k);}return;
  }
  changes.push({path,kind:a===undefined?'Added':b===undefined?'Removed':'Changed',before:a,after:b});
 }
 for(const key of ['fields','lists','notes','moduleStates','style','attachments','standardLink','appliedTemplates'])walk(before?.[key],after?.[key],key);
 return changes;
}
export function diffValue(value){return value===undefined?'—':typeof value==='string'?value:JSON.stringify(value, (k,v)=>['contentSnapshot','controlId'].includes(k)?undefined:v,2);}
