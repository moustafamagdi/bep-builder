import {sections,fieldNames,requiredFields,freshState,validateState,buildDocument} from './content.mjs';
let state=freshState(),dirty=false,toastTimer;
const $=s=>document.querySelector(s);
const article=$('#document'),form=$('#project-form');
function notify(message){clearTimeout(toastTimer);$('#toast').textContent=message;$('#toast').hidden=false;toastTimer=setTimeout(()=>$('#toast').hidden=true,5000);}
function render(){
  document.documentElement.style.setProperty('--accent',state.style.accent);
  document.documentElement.style.setProperty('--document-font',state.style.font==='serif'?'Georgia,serif':'Arial,sans-serif');
  article.innerHTML=buildDocument(state);
  const count=sections.filter(s=>state.enabled[s.id]).length,missing=requiredFields.filter(k=>!state.fields[k].trim()).length;
  $('#document-status').textContent=`${count} أقسام مفعّلة${missing?` · ${missing} بيانات أساسية ناقصة`:' · البيانات الأساسية مكتملة'} · مسودة`;
  document.title=`${state.fields.project.trim()||'BEP Studio'} — Post-Contract BEP`;
}
function populate(){
  for(const k of fieldNames)form.elements.namedItem(k).value=state.fields[k];
  for(const el of document.querySelectorAll('[data-section]'))el.checked=state.enabled[el.dataset.section];
  $('#accent').value=state.style.accent;$('#font').value=state.style.font;$('#cover').checked=state.style.cover;$('#toc').checked=state.style.toc;
  $('#section-note').value=state.notes[$('#note-section').value];render();
}
for(const s of sections){
  const label=document.createElement('label');label.className='section-option';
  const span=document.createElement('span');span.textContent=s.ar;
  const small=document.createElement('small');small.textContent=s.detail;span.append(small);
  const input=document.createElement('input');input.type='checkbox';input.dataset.section=s.id;input.checked=state.enabled[s.id];input.setAttribute('aria-label',s.ar);
  input.addEventListener('change',()=>{state.enabled[s.id]=input.checked;dirty=true;render();});label.append(span,input);$('#section-controls').append(label);
  const option=document.createElement('option');option.value=s.id;option.textContent=s.ar;$('#note-section').append(option);
}
form.addEventListener('submit',event=>event.preventDefault());
form.addEventListener('input',event=>{if(fieldNames.includes(event.target.name)){state.fields[event.target.name]=event.target.value;dirty=true;render();}});
$('#note-section').addEventListener('change',()=>$('#section-note').value=state.notes[$('#note-section').value]);
$('#section-note').addEventListener('input',event=>{state.notes[$('#note-section').value]=event.target.value;dirty=true;render();});
for(const key of ['accent','font','cover','toc'])$('#'+key).addEventListener('input',event=>{state.style[key]=event.target.type==='checkbox'?event.target.checked:event.target.value;dirty=true;render();});
const tabs=[...document.querySelectorAll('[role=tab]')];
function selectTab(tab){for(const t of tabs){const selected=t===tab;t.setAttribute('aria-selected',String(selected));t.tabIndex=selected?0:-1;$('#'+t.getAttribute('aria-controls')).hidden=!selected;}}
for(const tab of tabs){tab.addEventListener('click',()=>selectTab(tab));tab.addEventListener('keydown',event=>{let i=tabs.indexOf(tab);if(event.key==='ArrowLeft')i=(i+1)%tabs.length;else if(event.key==='ArrowRight')i=(i+tabs.length-1)%tabs.length;else if(event.key==='Home')i=0;else if(event.key==='End')i=tabs.length-1;else return;event.preventDefault();selectTab(tabs[i]);tabs[i].focus();});}
$('#download').addEventListener('click',()=>{
  const file=new Blob([JSON.stringify(state,null,2)],{type:'application/json'}),url=URL.createObjectURL(file),a=document.createElement('a');
  a.href=url;a.download=`${(state.fields.code||'BEP-project').replace(/[^a-z0-9_-]/gi,'_')}-draft.json`;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);dirty=false;notify('تم تجهيز ملف البيانات للتنزيل. احتفظ به لاستكمال العمل لاحقًا.');
});
$('#import').addEventListener('change',async event=>{
  const file=event.target.files[0];if(!file)return;
  try{if(file.size>200000)throw new Error('الملف أكبر من الحد المسموح: 200KB.');const loaded=validateState(JSON.parse(await file.text()));if(dirty&&!window.confirm('فتح النسخة سيستبدل تعديلات الجلسة الحالية. هل حفظت نسخة منها وتريد المتابعة؟'))return;state=loaded;dirty=false;populate();notify('تم فتح بيانات المشروع والأقسام والملاحظات.');}catch(error){notify(error instanceof SyntaxError?'الملف ليس JSON صالحًا.':error.message);}finally{event.target.value='';}
});
$('#print').addEventListener('click',()=>{if(!sections.some(s=>state.enabled[s.id])){notify('فعّل قسمًا واحدًا على الأقل قبل الطباعة.');return;}window.print();});
window.addEventListener('beforeunload',event=>{if(dirty){event.preventDefault();event.returnValue='';}});
populate();
