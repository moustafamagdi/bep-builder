import test from 'node:test';
import assert from 'node:assert/strict';
import {modules} from '../dist/modules.mjs';
import {newProject,reviewProject,createRelease,restoreRelease,validateWorkspace,cloneProject} from '../dist/store.mjs';
import {buildDocument} from '../dist/document.mjs';
import {mergeProjectSets} from '../dist/cloud.mjs';

function completeProject(){
  const p=newProject({projectName:'Demo Hub',projectCode:'DHM',description:'A transport hub.',documentCode:'DHM-BEP-001',preparedBy:'BIM Manager',contractor:'MainCo',client:'ClientCo',consultant:'ConsultCo',cde:'ACC',crs:'EPSG:32638',verticalDatum:'MSL'});
  p.lists.references.push({title:'EIR',code:'EIR-001',revision:'01',status:'Adopted',source:'Client'});
  p.lists.software.push({use:'Authoring',product:'Revit',version:'2026',exchange:'RVT / IFC'});
  p.lists.models.push({code:'DHM-ARC-Z01',discipline:'Architecture',zone:'Zone 01',producer:'Architect'});
  p.lists.deliverables.push({title:'Coordinated model',producer:'MainCo',date:'2026-10-01',format:'NWD',acceptance:'No critical clashes'});
  p.lists.clashes.push({name:'MEP vs Structure',setA:'MEP',setB:'Structure',type:'Hard',tolerance:'0 mm',owner:'BIM Lead'});
  return p;
}

test('blank project reports critical gaps and cannot be ready',()=>{const p=newProject();const r=reviewProject(p);assert.equal(r.ready,false);assert.ok(r.critical>5);});
test('completed core project becomes ready while optional modules remain excluded',()=>{const p=completeProject(),r=reviewProject(p);assert.equal(r.ready,true);assert.equal(r.critical,0);});
test('COBie activates asset information and requires a declared version',()=>{const p=completeProject();p.moduleStates.cobie='required';let r=reviewProject(p);assert.ok(r.issues.some(i=>i.code==='dependency:cobie'));p.moduleStates.assets='required';assert.ok(reviewProject(p).issues.some(i=>i.code==='cobie'));p.fields.cobieVersion='2.4';assert.equal(reviewProject(p).critical,0);});
test('4D requires tool and programme source',()=>{const p=completeProject();p.moduleStates.fourD='optional';assert.ok(reviewProject(p).issues.some(i=>i.code==='fourD'));p.fields.fourDTool='Navisworks Manage 2026';p.fields.programmeSource='Approved baseline P6 Rev 03';assert.equal(reviewProject(p).critical,0);});
test('document numbers included modules contiguously and omits excluded content',()=>{const p=completeProject();p.moduleStates.fourD='optional';p.fields.fourDTool='Navisworks';p.fields.programmeSource='P6';const html=buildDocument(p,reviewProject(p));const active=modules.filter(m=>p.moduleStates[m.id]!=='not_applicable');active.forEach((m,i)=>{assert.ok(html.includes(`id="m-${m.id}"`));assert.ok(html.includes(`${i+1}. ${m.title.replaceAll('&','&amp;')}`));});assert.doesNotMatch(html,/5D &amp; quantity take-off/);});
test('user input is escaped in the generated BEP',()=>{const p=completeProject();p.fields.projectName='<img src=x onerror=alert(1)>';p.notes.overview='<script>alert(1)</script>';const html=buildDocument(p,reviewProject(p));assert.doesNotMatch(html,/<img|<script>/);assert.match(html,/&lt;img/);assert.match(html,/&lt;script/);});
test('frozen release restores without changing the frozen snapshot',()=>{const p=completeProject();createRelease(p);const id=p.releases[0].id;p.fields.projectName='Changed';restoreRelease(p,id);assert.equal(p.fields.projectName,'Demo Hub');p.fields.projectName='Again';assert.equal(p.releases[0].snapshot.fields.projectName,'Demo Hub');});
test('duplicated project has a new identity and no release history',()=>{const p=completeProject();createRelease(p);const copy=cloneProject(p);assert.notEqual(copy.id,p.id);assert.equal(copy.releases.length,0);assert.equal(copy.fields.projectCode,'');});
test('workspace validation rejects duplicate IDs and unsafe style data',()=>{const p=completeProject(),w={schemaVersion:2,activeProjectId:null,projects:[p]};assert.deepEqual(validateWorkspace(structuredClone(w)),w);assert.throws(()=>validateWorkspace({...w,projects:[p,p]}));const bad=structuredClone(w);bad.projects[0].style.accent='url(javascript:x)';assert.throws(()=>validateWorkspace(bad));});
test('cloud merge keeps the newest version of each project',()=>{const local=completeProject(),cloud=structuredClone(local);local.updatedAt='2026-09-05T12:00:00Z';cloud.updatedAt='2026-09-05T11:00:00Z';cloud.fields.projectName='Old cloud name';const remoteOnly=completeProject();remoteOnly.id='remote-only';const merged=mergeProjectSets([local],[cloud,remoteOnly]);assert.equal(merged.length,2);assert.equal(merged.find(p=>p.id===local.id).fields.projectName,'Demo Hub');assert.ok(merged.some(p=>p.id==='remote-only'));});
