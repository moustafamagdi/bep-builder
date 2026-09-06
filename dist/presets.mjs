import {newProject} from './store.mjs';
import {modules} from './modules.mjs';

export const BUILTIN_SOURCE='QC00912017-CSC-REP-BRP-BIM-NW-TRH-00001 - Post-Contract BEP reference';

const referenceNotes={
  overview:'The BEP shall be maintained as the controlled project statement for digital engineering and BIM delivery. It records the agreed objectives, standards, project information, delivery arrangements and evidence required for each information exchange.',
  scope:'The scope shall identify the appointed works, design responsibility, coordination boundaries, interfaces, exclusions and information-management duties. Review or federation of another party’s information does not transfer design responsibility.',
  references:'Applicable appointments, information requirements, digital standards, templates and project decisions shall be recorded with their document number, revision, status and owner. Superseded or unreceived references remain visible until resolved.',
  governance:'The project team shall maintain a defined responsibility matrix covering BEP management, model production, information approval, federation, clash resolution, delivery planning, asset information and handover.',
  uses:'Every BIM use shall have a defined purpose, responsible party, input, output, milestone and acceptance method. Uses not required by the appointment remain subject to project agreement.',
  cde:'The common data environment shall implement controlled Work in Progress, Shared, Published and Archived states. Permissions, suitability codes, reviews, transmittals and formal submission routes shall follow the agreed project workflow.',
  information:'Task teams shall check information before sharing it. Each exchange shall state the sender, receiver, milestone, format, status and acceptance criteria, and shall be coordinated with the MIDP and relevant TIDPs.',
  security:'Access shall follow least privilege. Model and document backups, recovery testing, retention, archive ownership and incident escalation shall be defined for every approved platform.',
  software:'Software versions and native and exchange formats shall be agreed before production. Upgrades and interoperability tests shall be coordinated before an affected exchange.',
  breakdown:'The federation strategy shall divide information by facility, building, zone, discipline and production responsibility. Model volumes shall remain manageable and align with the delivery and coordination strategy.',
  naming:'File, model, sheet, family, view, workset and parameter naming shall use approved fields, separators, code lists and examples. Naming rules shall be validated before every formal exchange.',
  coordinates:'The authorized survey and universal reference source shall control horizontal and vertical positioning. Project base point, survey point, true north, levels, grids and units shall be verified before model federation.',
  loin:'Level of information need shall be defined by purpose and milestone across geometry, alphanumeric information and documentation. A single LOD label shall not replace the detailed information requirement.',
  authoring:'Authoring procedures shall cover model opening and closing, links, worksets, views, view templates, browser organization, schedules, sheets, annotations, warnings and file maintenance.',
  quality:'Model quality checks shall cover project setup, coordinates, naming, model health, standards, information completeness and technical content. Results shall identify the checker, date, evidence and corrective action.',
  coordination:'Federated coordination shall use an approved interaction matrix, selection sets, clash types, tolerances, priorities, ownership and closure evidence. Accepted intersections require a recorded justification.',
  meetings:'Coordination meetings shall use the latest shared information and record decisions, owners and due dates. Minutes, issue registers and dashboards shall remain aligned.',
  delivery:'The MIDP shall consolidate approved TIDPs and identify each deliverable, producer, planned date, format, status and acceptance criterion.',
  fourD:'4D planning shall use the approved programme revision and documented activity identifiers. Model linkage, sequence reviews, update frequency and submission outputs shall be agreed with the planning team.',
  fiveD:'Model-based quantity or cost use shall define measurement rules, classifications, cost-code linkage, source model status, validation and responsibility before extraction.',
  existing:'Existing-condition information shall record the survey source, date, accuracy, coverage, limitations and verification status before it is used as a project reference.',
  fabrication:'Fabrication use shall identify the specialist scope, required geometry and data, tolerances, exchange formats, review route and responsibility for fabrication decisions.',
  visualization:'Visualizations and virtual-reality outputs shall identify their purpose, audience, model status, update frequency and issue format, and shall not substitute for technical approval.',
  asbuilt:'As-built information shall be updated from approved site records, verified against installed conditions and checked by the responsible production team before submission.',
  assets:'Asset information requirements shall define required properties, identifiers, suppliers, data drops, formats, validation rules and responsible parties by system and milestone.',
  cobie:'Where COBie is required, the agreed version, worksheets, data drops, property mapping, supplier responsibilities and validation method shall be recorded.',
  tagging:'The physical label, model object and asset record shall share a controlled identifier. Tag format, placement, verification and replacement rules shall be agreed before handover.',
  handover:'The handover package shall include verified models, drawings, indexes, asset information, commissioning records, outstanding-item status, acceptance evidence and the agreed archive.',
  appendices:'Appendices shall be listed with their reference, revision, status and location. A referenced appendix that is missing or removed shall remain a review issue.'
};

const commonLists=()=>({
  responsibilities:[
    {activity:'Maintain and update the Post-Contract BEP',responsible:'BIM Manager',accountable:'Project Manager',consulted:'Discipline BIM Leads',informed:'Project stakeholders'},
    {activity:'Discipline model production and internal checks',responsible:'Task Team',accountable:'Discipline Lead',consulted:'BIM Coordinator',informed:'Information Manager'},
    {activity:'Federation and coordination review',responsible:'BIM Coordinator',accountable:'BIM Manager',consulted:'Task Teams',informed:'Project Manager'},
    {activity:'Information delivery planning',responsible:'Task Information Managers',accountable:'Information Manager',consulted:'Planning and Document Control',informed:'Appointing Party'}
  ],
  references:[
    {title:'ISO 19650-1 - Concepts and principles',code:'ISO 19650-1',revision:'Current adopted edition',status:'For review',source:'Project information requirements'},
    {title:'ISO 19650-2 - Delivery phase of assets',code:'ISO 19650-2',revision:'Current adopted edition',status:'For review',source:'Project information requirements'},
    {title:'Exchange Information Requirements',code:'[EIR reference]',revision:'[Revision]',status:'Not received',source:'Appointing Party'},
    {title:'Post-Contract BEP source reference',code:'REFERENCE-BEP',revision:'01',status:'For review',source:BUILTIN_SOURCE}
  ],
  uses:[
    {name:'3D construction coordination',status:'Required',owner:'Main Contractor',output:'Federated model and coordinated issue register'},
    {name:'Information delivery planning',status:'Required',owner:'Information Manager',output:'MIDP and coordinated TIDPs'},
    {name:'Model quality assurance',status:'Required',owner:'BIM Manager',output:'Model QA/QC records'},
    {name:'As-built and handover information',status:'Required',owner:'Main Contractor',output:'Verified record models and handover package'}
  ],
  software:[
    {use:'Common data environment',product:'Project-approved CDE',version:'Cloud',exchange:'Controlled native files and published records'},
    {use:'3D model authoring',product:'Autodesk Revit',version:'Project-approved version',exchange:'RVT / IFC / DWG / PDF'},
    {use:'Model federation and clash detection',product:'Autodesk Navisworks Manage',version:'Project-approved version',exchange:'NWC / NWF / NWD / HTML'},
    {use:'Planning and 4D',product:'Project-approved planning / 4D platform',version:'To be agreed',exchange:'Native / XLSX / MP4 / PDF'}
  ],
  namingFields:[
    {order:'1',field:'Project',codeList:'Approved project code',example:'PRJ'},
    {order:'2',field:'Originator',codeList:'Approved organization code',example:'MCO'},
    {order:'3',field:'Volume / facility',codeList:'Approved spatial breakdown',example:'B01'},
    {order:'4',field:'Level / location',codeList:'Approved level and location codes',example:'L01'},
    {order:'5',field:'Information type',codeList:'Approved information-type codes',example:'MOD'},
    {order:'6',field:'Role / discipline',codeList:'Approved discipline codes',example:'MEP'},
    {order:'7',field:'Number',codeList:'Unique sequential number',example:'00001'}
  ],
  meetings:[
    {name:'BIM coordination meeting',frequency:'Weekly',participants:'BIM Manager, coordinators and affected task teams',output:'Minutes, decisions and updated issue register'},
    {name:'Information delivery review',frequency:'Before each milestone',participants:'Information Manager, planning and document control',output:'MIDP/TIDP status and recovery actions'}
  ],
  qaChecks:[
    {check:'Coordinates, levels, grids and units',frequency:'Before every exchange',checker:'Discipline BIM Lead',acceptance:'Matches the authorized project reference',evidence:'Model QA checklist'},
    {check:'Naming, metadata and model scope',frequency:'Before every exchange',checker:'Task Information Manager',acceptance:'Complies with approved standards',evidence:'Submission check record'},
    {check:'Model health and warnings',frequency:'Weekly and before issue',checker:'Model Author / BIM Coordinator',acceptance:'Material warnings resolved or justified',evidence:'Model health report'},
    {check:'Required information and classification',frequency:'At each delivery milestone',checker:'Information Manager',acceptance:'Meets milestone information requirements',evidence:'Compliance report'}
  ]
});

const applyCommon=(project)=>{
  const lists=commonLists();
  Object.assign(project.lists,structuredClone(lists));
  project.notes={...project.notes,...referenceNotes};
  project.appliedTemplates.push({id:'builtin-default-bep',name:'Default BEP baseline',type:'company',version:'1.0',sourceReference:BUILTIN_SOURCE,mode:'built-in',appliedAt:new Date().toISOString()});
  project.preset='default';
  return project;
};

export function createDefaultBep(seed={}){
  const project=applyCommon(newProject(seed));
  Object.assign(project.fields,{
    documentTitle:'Post-Contract BIM Execution Plan',issuePurpose:'For review and agreement',informationRole:'Lead appointed party',
    coordinationScope:'Lead the federation and coordination of appointed task teams and manage interfaces within the main contractor scope.',
    informationStates:'Work in Progress, Shared, Published, Archive',reviewWorkflow:'Producing teams complete internal checks before sharing. The lead appointed party reviews coordination and information compliance before formal submission through the approved platform.',
    namingPattern:'PROJECT-ORIGINATOR-VOLUME-LEVEL-TYPE-ROLE-NUMBER',drawingStrategy:'Discipline models',units:'Millimetres',loinSystem:'ISO 19650 level of information need - project matrix',
    coordinationCycle:'Weekly',issueWorkflow:'Open issues are assigned to an owner, reviewed against the latest shared information, and closed only after verification and recorded evidence.',
    qaFrequency:'Before every formal information exchange',warningPolicy:'Material warnings are resolved before issue or retained with an approved justification.',
    asBuiltMethod:'Record information is updated from approved site changes, red-line records and verified installed conditions before submission.'
  },seed);
  return project;
}

export function createPilotBep(seed={}){
  const project=createDefaultBep({
    projectName:'Northwest Transport Hub - Pilot',projectCode:'PILOT-NWTH',description:'Pilot transport-hub project used to demonstrate a fully populated Post-Contract BIM Execution Plan workflow.',location:'Riyadh, Saudi Arabia',sector:'Transport infrastructure',contractNumber:'PILOT-CONTRACT-001',documentCode:'PILOT-MCO-BEP-BIM-00001',revision:'P01',issueDate:new Date().toISOString().slice(0,10),preparedBy:'Pilot BIM Manager',checkedBy:'Pilot Information Manager',approvedBy:'Pilot Project Director',
    contractor:'Pilot Main Contractor',client:'Sample Development Authority',consultant:'Sample Supervision Consultant',designer:'Sample Lead Designer',contractType:'Design and Build',designResponsibility:'Contractor design',informationRole:'Lead appointed party',
    cde:'Autodesk Construction Cloud',cdeUrl:'https://acc.autodesk.com',submissionPlatform:'Aconex',worksharingMode:'Cloud worksharing',suitabilitySystem:'Project suitability codes - pilot',backupLocation:'Approved CDE and controlled corporate backup',backupFrequency:'Daily incremental / weekly full',retention:'Contract period plus agreed archive period',
    originatorCode:'MCO',crs:'Project grid derived from authorized survey',verticalDatum:'Mean Sea Level',ursReference:'PILOT-MCO-MOD-BIM-URS-00001',northRotation:'2.83 degrees',classification:'Uniclass 2015 - project-approved tables',modelSizeLimit:'500 MB per authoring model or approved exception',
    authoringProcedure:'Use approved project templates, controlled worksets and view templates. Links use shared coordinates. Models are audited, synchronized and compacted before formal exchange.',issuePlatform:'ACC Issues',fourDTool:'Synchro 4D Pro',programmeSource:'Approved baseline programme - pilot revision',fiveDTool:'Project-approved QTO platform',assetSchema:'Project Asset Information Requirements',cobieVersion:'COBie 2.4',asBuiltAccuracy:'Project survey tolerance and verified installation records',...seed
  });
  project.preset='pilot';
  project.appliedTemplates[0].id='builtin-pilot-bep';project.appliedTemplates[0].name='Pilot BEP example';
  project.lists.parties=[
    {name:'Sample Development Authority',role:'Appointing Party',code:'SDA',responsibility:'Define requirements and accept information'},
    {name:'Sample Supervision Consultant',role:'Lead reviewer',code:'SSC',responsibility:'Review compliance and technical submissions'},
    {name:'Pilot Main Contractor',role:'Lead Appointed Party',code:'MCO',responsibility:'Manage information delivery and coordination'}
  ];
  project.lists.team=[
    {name:'Pilot BIM Manager',organization:'Pilot Main Contractor',role:'BIM Manager',email:'bim.manager@example.com'},
    {name:'Pilot Information Manager',organization:'Pilot Main Contractor',role:'Information Manager',email:'information.manager@example.com'},
    {name:'Pilot BIM Coordinator',organization:'Pilot Main Contractor',role:'BIM Coordinator',email:'bim.coordinator@example.com'}
  ];
  project.lists.exchanges=[
    {exchange:'Weekly discipline model exchange',milestone:'Construction coordination',sender:'Task Teams',receiver:'Main Contractor',format:'RVT / NWC',status:'Planned'},
    {exchange:'Federated coordination package',milestone:'Monthly coordination review',sender:'Main Contractor',receiver:'Supervision Consultant',format:'NWD / PDF / XLSX',status:'Planned'},
    {exchange:'Record-model and asset-information package',milestone:'Handover',sender:'Main Contractor',receiver:'Appointing Party',format:'RVT / IFC / XLSX / PDF',status:'Planned'}
  ];
  project.lists.models=[
    {code:'PILOT-MCO-B01-ZZ-MOD-ARC-00001',discipline:'Architecture',zone:'Building 01',producer:'Architectural Task Team'},
    {code:'PILOT-MCO-B01-ZZ-MOD-STR-00001',discipline:'Structure',zone:'Building 01',producer:'Structural Task Team'},
    {code:'PILOT-MCO-B01-ZZ-MOD-MEP-00001',discipline:'MEP',zone:'Building 01',producer:'MEP Task Team'}
  ];
  project.lists.loin=[
    {element:'Primary structure',milestone:'Construction',geometry:'Coordinated fabrication geometry',information:'Classification, type, material and status',documentation:'Approved shop drawings',responsible:'Structural Task Team'},
    {element:'Mechanical equipment',milestone:'Handover',geometry:'Verified installed geometry',information:'Asset ID, manufacturer, model and maintainable data',documentation:'O&M and commissioning records',responsible:'Mechanical Task Team'}
  ];
  project.lists.milestones=[
    {name:'Mobilization and CDE setup',gate:'Project start',date:'2026-10-01',output:'Approved BEP, CDE configuration and initial MIDP'},
    {name:'Construction coordination',gate:'Coordinated information',date:'2027-03-30',output:'Coordinated discipline models and closed critical clashes'},
    {name:'Handover',gate:'Accepted asset information',date:'2028-06-30',output:'Verified record models, asset data and archive'}
  ];
  project.lists.deliverables=[
    {title:'Post-Contract BIM Execution Plan',producer:'Pilot Main Contractor',date:'2026-10-15',format:'DOCX / PDF',acceptance:'Reviewed against project information requirements'},
    {title:'Federated coordination model',producer:'Pilot Main Contractor',date:'2027-03-30',format:'NWD / IFC',acceptance:'No unresolved critical clashes'},
    {title:'Record model and asset information',producer:'Relevant Task Teams',date:'2028-06-30',format:'RVT / IFC / XLSX',acceptance:'Validated against AIR and handover requirements'}
  ];
  project.lists.clashes=[
    {name:'Structure vs MEP services',setA:'Structural elements',setB:'MEP services',type:'Hard',tolerance:'0 mm',owner:'BIM Coordinator'},
    {name:'Maintainable equipment clearance',setA:'Equipment maintenance zones',setB:'All building elements',type:'Clearance',tolerance:'Project requirement',owner:'MEP BIM Lead'}
  ];
  project.lists.assetRequirements=[
    {asset:'Maintainable mechanical equipment',property:'Asset ID, manufacturer, model, serial number and warranty',source:'Supplier',milestone:'Handover',format:'COBie / approved asset schema',responsible:'Mechanical Contractor'}
  ];
  project.lists.decisions=[{reference:'PILOT-DEC-001',subject:'Final client code lists',decision:'Confirm final project naming and suitability codes before first formal issue.',owner:'Information Manager',dueDate:'2026-10-10',status:'Proposed'}];
  project.lists.appendices=[
    {title:'Master Information Delivery Plan',reference:'PILOT-MIDP-001',status:'Planned',location:'CDE'},
    {title:'Level of Information Need Matrix',reference:'PILOT-LOIN-001',status:'Planned',location:'CDE'},
    {title:'Model QA/QC Checklist',reference:'PILOT-QA-001',status:'Planned',location:'CDE'}
  ];
  for(const id of ['fourD','fiveD','existing','fabrication','visualization','assets','cobie','tagging'])project.moduleStates[id]='optional';
  return project;
}

export function createPresetProject(type,seed={}){
  if(type==='pilot')return createPilotBep(seed);
  if(type==='blank')return newProject(seed);
  return createDefaultBep(seed);
}

export const builtInPresetSummary=()=>[
  {id:'default',name:'Default BEP',description:'A controlled generic baseline derived from the supplied Post-Contract BEP structure.',sections:modules.length},
  {id:'pilot',name:'Pilot BEP',description:'A populated anonymized example for training, testing and document preview.',sections:modules.length},
  {id:'blank',name:'Blank project',description:'Only the minimum built-in application defaults.',sections:modules.length}
];
