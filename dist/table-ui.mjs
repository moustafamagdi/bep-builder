import {matchingRows,bulkColumns,previewBulk,applyBulk} from './table-tools.mjs';
import {listSchemas} from './modules.mjs';
import {esc} from './document.mjs';

const states=new Map();
export function resetTableSelections(){for(const state of states.values())state.selected.clear();}
export function clearTableFilters(){states.clear();}
export function mountTableTools(root,{project,getProject,canEdit,canPlanEdit,commit,notify}){
  for(const card of root.querySelectorAll('[data-list-card]')){
    const key=card.dataset.listCard,rows=project.lists[key]||[],identity=`${project.id}:${key}`;
    let state=states.get(identity);if(!state){state={query:'',status:'',selected:new Set()};states.set(identity,state);}
    const rowElements=new Map();
    card.querySelectorAll('[data-list]').forEach(input=>{const row=input.closest('tr,details.schedule-record');if(row)rowElements.set(Number(input.dataset.row),row);});
    const columns=bulkColumns(key),statusValues=[...new Set(rows.map(r=>r.status).filter(Boolean))];
    const bar=document.createElement('div');bar.className='schedule-toolbar';
    bar.innerHTML=`<label>Search rows<input data-table-read="search" type="search" value="${esc(state.query)}" placeholder="Search any column"></label>${statusValues.length?`<label>Status<select data-table-read="status"><option value="">All statuses</option>${statusValues.map(s=>`<option ${state.status===s?'selected':''}>${esc(s)}</option>`).join('')}</select></label>`:''}<button class="button ghost" data-table-read="clear">Clear filters</button>${columns.length?'<button class="button secondary" data-table-read="select">Select visible</button><button class="button ghost" data-table-read="deselect">Clear selection</button><button class="button primary" data-table-bulk>Bulk edit</button>':''}${card.querySelector('.schedule-record')?'<button class="button ghost" data-table-read="expand">Expand all</button><button class="button ghost" data-table-read="collapse">Collapse all</button>':''}<span class="schedule-count" aria-live="polite"></span>`;
    card.querySelector('.card-heading').after(bar);
    const empty=document.createElement('p');empty.className='filter-empty';empty.textContent='No matching rows. Clear or change the filters.';empty.hidden=true;bar.after(empty);
    if(columns.length){
      const header=card.querySelector('thead tr');if(header){const th=document.createElement('th');th.textContent='Select';header.prepend(th);const blank=card.querySelector('.empty-cell');if(blank)blank.colSpan+=1;}
      for(const [i,row] of rowElements){const check=document.createElement('input');check.type='checkbox';check.dataset.tableRead='row';check.setAttribute('aria-label',`Select row ${i+1}`);check.checked=state.selected.has(i);check.onclick=e=>e.stopPropagation();check.onchange=()=>{if(check.checked)state.selected.add(i);else state.selected.delete(i);update();};if(row.tagName==='TR'){const td=document.createElement('td');td.append(check);row.prepend(td);}else row.querySelector('summary').prepend(check);}
    }
    function update(){
      const visible=new Set(matchingRows(getProject().lists[key],state.query,state.status));
      for(const [i,row] of rowElements){row.hidden=!visible.has(i);if(!visible.has(i))state.selected.delete(i);const check=row.querySelector('[data-table-read="row"]');if(check)check.checked=state.selected.has(i);}
      empty.hidden=visible.size>0||rows.length===0;
      bar.querySelector('.schedule-count').textContent=`${visible.size} / ${rows.length} visible · ${state.selected.size} selected`;
      const bulk=bar.querySelector('[data-table-bulk]');if(bulk)bulk.disabled=!canEdit()||!state.selected.size;
    }
    bar.querySelector('[data-table-read="search"]').oninput=e=>{state.query=e.target.value;state.selected.clear();update();};
    const filter=bar.querySelector('[data-table-read="status"]');if(filter)filter.onchange=e=>{state.status=e.target.value;state.selected.clear();update();};
    bar.querySelector('[data-table-read="clear"]').onclick=()=>{state.query='';state.status='';state.selected.clear();bar.querySelector('input').value='';if(filter)filter.value='';update();};
    bar.querySelector('[data-table-read="select"]')?.addEventListener('click',()=>{state.selected=new Set(matchingRows(getProject().lists[key],state.query,state.status));update();});
    bar.querySelector('[data-table-read="deselect"]')?.addEventListener('click',()=>{state.selected.clear();update();});
    for(const action of ['expand','collapse'])bar.querySelector(`[data-table-read="${action}"]`)?.addEventListener('click',()=>card.querySelectorAll('.schedule-record:not([hidden])').forEach(el=>el.open=action==='expand'));
    bar.querySelector('[data-table-bulk]')?.addEventListener('click',()=>{
      if(!canEdit()){notify('Reserve the section before editing.');return;}let preview=null;
      const dialog=document.createElement('dialog');dialog.className='bulk-dialog';document.body.append(dialog);
      dialog.innerHTML=`<form><h2>Bulk edit · ${esc(listSchemas[key].label)}</h2><p>${state.selected.size} selected rows. Identifiers, approvals and attachment records are excluded from bulk editing.</p><label>Column<select name="column">${columns.map(([k,label])=>`<option value="${k}">${esc(label)}</option>`).join('')}</select></label><label>New value<span data-bulk-value></span></label><div class="bulk-impact"></div><div class="dialog-actions"><button type="button" class="button ghost" data-cancel>Cancel</button><button type="button" class="button secondary" data-preview>Preview changes</button><button type="submit" class="button primary" disabled>Apply changes</button></div></form>`;
      const form=dialog.querySelector('form'),column=form.elements.column,impact=dialog.querySelector('.bulk-impact'),apply=dialog.querySelector('[type="submit"]');
      const invalidate=()=>{preview=null;impact.innerHTML='';apply.disabled=true;};
      function valueControl(){invalidate();const [, ,type,options]=columns.find(c=>c[0]===column.value);dialog.querySelector('[data-bulk-value]').innerHTML=type==='select'?`<select name="value">${options.map(o=>`<option>${esc(o)}</option>`).join('')}</select>`:`<input name="value" type="${['date','number'].includes(type)?type:'text'}" ${type==='number'?'min="0" step="any"':''}>`;form.elements.value.oninput=invalidate;}
      column.onchange=valueControl;valueControl();
      dialog.querySelector('[data-cancel]').onclick=()=>dialog.close();dialog.addEventListener('close',()=>dialog.remove());
      dialog.querySelector('[data-preview]').onclick=()=>{try{preview=previewBulk(getProject().lists[key],key,[...state.selected],column.value,form.elements.value.value);impact.innerHTML=`<p>${preview.changes.length} changed rows · ${preview.plan?'BEP plan change — renewed approval required for approved content':'Operational tracking update'}</p>${preview.plan&&!canPlanEdit()?'<p class="import-warning">Close this dialog and use Start controlled change to record a reason before changing the approved plan.</p>':''}<div class="table-scroll"><table class="editor-table"><thead><tr><th>Row</th><th>Before</th><th>After</th></tr></thead><tbody>${preview.changes.map(c=>`<tr><td>${esc(c.label)}</td><td>${esc(c.before||'—')}</td><td>${esc(c.after||'(clear value)')}</td></tr>`).join('')}</tbody></table></div>`;apply.disabled=!preview.changes.length||(preview.plan&&!canPlanEdit());}catch(error){notify(error.message);}};
      form.onsubmit=e=>{e.preventDefault();try{if(!preview||!canEdit()||(preview.plan&&!canPlanEdit()))throw new Error('Editing permission changed. Close and reopen the section.');const next=applyBulk(getProject().lists[key],preview);commit(key,next);state.selected.clear();dialog.close();}catch(error){notify(error.message);}};
      dialog.showModal();
    });
    update();
  }
}
