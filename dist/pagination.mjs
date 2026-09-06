const waitForImages=async root=>{
  const images=[...root.querySelectorAll('img')];
  await Promise.all(images.map(img=>img.complete?Promise.resolve():new Promise(resolve=>{img.addEventListener('load',resolve,{once:true});img.addEventListener('error',resolve,{once:true});})));
};
const htmlEscape=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));

const activeLogos=(project,logoUrls,location)=>logoUrls.filter((item,index)=>index<Number(project.style.logoCount||0)&&item?.url&&(location==='cover'||item.placement==='both'));

function logoStrip(items,cls){return items.length?`<div class="${cls}">${items.map(item=>`<img src="${htmlEscape(item.url)}" alt="${htmlEscape(item.name||'Project logo')}">`).join('')}</div>`:'';}

function pageShell(project,logoUrls){
  const page=document.createElement('section');page.className='doc-page';
  page.innerHTML=`<header class="page-header">${logoStrip(activeLogos(project,logoUrls,'header'),'page-header-logos')}<div><strong>${htmlEscape(project.fields.projectName||'[Project]')}</strong><span>${htmlEscape(project.fields.documentTitle||'Post-Contract BIM Execution Plan')}</span></div><div class="page-header-ref"><strong>${htmlEscape(project.fields.documentCode||'[Document reference]')}</strong><span>Rev. ${htmlEscape(project.fields.revision||'[Revision]')}</span></div></header><div class="doc-page-content"></div><footer class="page-footer"><span>${htmlEscape(project.fields.contractor||'Main Contractor')}</span><span class="page-status">${htmlEscape(project.preset==='pilot'?'PILOT / EXAMPLE - NOT FOR ISSUE':project.fields.issuePurpose||'Working document')}</span><span class="page-number"></span></footer>`;
  return page;
}

const overflows=content=>content.scrollHeight>content.clientHeight+2;

function addTableAcrossPages(table,context){
  const rows=[...table.tBodies[0]?.rows||[]];
  if(!rows.length){context.addSimple(table);return;}
  const makeTable=()=>{const next=table.cloneNode(false);if(table.tHead)next.append(table.tHead.cloneNode(true));next.append(document.createElement('tbody'));return next;};
  let current=makeTable(),wrapper=context.wrapperFor(current);context.content.append(wrapper);
  for(const sourceRow of rows){
    const row=sourceRow.cloneNode(true);current.tBodies[0].append(row);
    if(overflows(context.content)){const canMove=current.tBodies[0].rows.length>1||wrapper.previousElementSibling;if(canMove){row.remove();if(current.tBodies[0].rows.length===0)wrapper.remove();context.newPage();current=makeTable();wrapper=context.wrapperFor(current,true);context.content.append(wrapper);current.tBodies[0].append(row);}}
  }
}

function addListAcrossPages(list,context){
  const items=[...list.children];if(!items.length){context.addSimple(list);return;}
  const makeList=()=>list.cloneNode(false);let current=makeList(),wrapper=context.wrapperFor(current);context.content.append(wrapper);
  for(const source of items){const item=source.cloneNode(true);current.append(item);if(overflows(context.content)){const canMove=current.children.length>1||wrapper.previousElementSibling;if(canMove){item.remove();if(current.children.length===0)wrapper.remove();context.newPage();current=makeList();wrapper=context.wrapperFor(current,true);context.content.append(wrapper);current.append(item);}}}
}

export async function renderPaginatedDocument(container,html,project,logoUrls=[]){
  container.innerHTML=`<div class="document-source" aria-hidden="true">${html}</div><div class="document-pages"></div>`;
  const source=container.querySelector('.document-source'),pagesRoot=container.querySelector('.document-pages');await waitForImages(source);
  const cover=source.querySelector('.cover');if(cover){const page=cover.cloneNode(true);page.classList.add('doc-page','cover-page');page.classList.remove('page');pagesRoot.append(page);}
  let page,content,currentSection='';
  const newPage=()=>{page=pageShell(project,logoUrls);pagesRoot.append(page);content=page.querySelector('.doc-page-content');return content;};newPage();
  const wrapperFor=(node,continued=false)=>{if(!currentSection)return node;const wrapper=document.createElement('div');wrapper.className=`doc-section-fragment${continued?' continued':''}`;wrapper.dataset.section=currentSection;wrapper.append(node);return wrapper;};
  const addSimple=node=>{const wrapped=wrapperFor(node.cloneNode(true));content.append(wrapped);if(overflows(content)){wrapped.remove();newPage();content.append(wrapped);}};
  const context={get content(){return content;},newPage,wrapperFor,addSimple};
  const addUnit=node=>{if(node.matches?.('table'))addTableAcrossPages(node,context);else if(node.matches?.('ul,ol'))addListAcrossPages(node,context);else addSimple(node);};
  const body=source.querySelector('.document-body');
  for(const block of [...(body?.children||[])]){
    if(block.matches('.doc-end'))continue;
    if(block.matches('.prelim')){currentSection='';for(const child of [...block.children]){if(child.matches('.running'))continue;addUnit(child);}continue;}
    if(block.matches('.doc-section')){
      currentSection=block.id||'';const children=[...block.children],heading=document.createElement('div');heading.className='section-heading';
      while(children.length&&children[0].matches('.section-meta,h2'))heading.append(children.shift().cloneNode(true));
      const first=children.shift(),group=document.createElement('div');group.className='section-opening';group.append(heading);if(first)group.append(first.cloneNode(true));
      const wrapped=wrapperFor(group);content.append(wrapped);if(overflows(content)){wrapped.remove();newPage();content.append(wrapped);}for(const child of children)addUnit(child);continue;
    }
    currentSection='';addUnit(block);
  }
  const pages=[...pagesRoot.querySelectorAll('.doc-page:not(.cover-page)')],total=pages.length;
  pages.forEach((item,index)=>item.querySelector('.page-number').textContent=`Page ${index+1} of ${total}`);
  const sectionPages=new Map();pages.forEach((item,index)=>item.querySelectorAll('[data-section]').forEach(section=>{if(section.dataset.section&&!sectionPages.has(section.dataset.section))sectionPages.set(section.dataset.section,index+1);}));
  pagesRoot.querySelectorAll('.toc a[href^="#"]').forEach(link=>{const number=sectionPages.get(link.getAttribute('href').slice(1));const marker=link.querySelector('em');if(marker)marker.textContent=number||'';});
  source.remove();await waitForImages(pagesRoot);return {pages:pages.length+(cover?1:0),contentPages:total};
}
