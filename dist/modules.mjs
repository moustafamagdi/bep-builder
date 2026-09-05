export const moduleGroups = [
  {id:'foundation',label:'Foundation & document control'},
  {id:'management',label:'Information management'},
  {id:'technical',label:'Technical standards'},
  {id:'delivery',label:'Coordination & delivery'},
  {id:'optional',label:'Optional BIM uses'},
  {id:'closeout',label:'Closeout & handover'}
];

export const modules = [
  {id:'overview',group:'foundation',title:'Introduction & project overview',ar:'Introduction & project overview',required:true,desc:'Purpose, contractual status, project and parties.'},
  {id:'scope',group:'foundation',title:'Appointment, scope & exclusions',ar:'Appointment, scope & exclusions',required:true,desc:'Design responsibility, coordination leadership and scope boundaries.'},
  {id:'references',group:'foundation',title:'Information requirements & references',ar:'Information requirements & references',required:true,desc:'Approved references, revisions and adoption status.'},
  {id:'governance',group:'foundation',title:'Governance, team & responsibilities',ar:'Governance, team & responsibilities',required:true,desc:'Roles, responsibilities and decision routes.'},
  {id:'uses',group:'management',title:'BIM objectives & uses',ar:'BIM objectives & uses',required:true,desc:'Required BIM uses and their outputs.'},
  {id:'cde',group:'management',title:'Common data environment',ar:'Common data environment',required:true,desc:'Platforms, states, permissions and submissions.'},
  {id:'information',group:'management',title:'Information production & exchange',ar:'Information production & exchange',required:true,desc:'Checking, sharing, approval and archiving.'},
  {id:'security',group:'management',title:'Information security, backup & recovery',ar:'Information security, backup & recovery',required:true,desc:'Access, retention and recovery.'},
  {id:'software',group:'technical',title:'Technology, software & interoperability',ar:'Technology, software & interoperability',required:true,desc:'Tools, versions and exchange formats.'},
  {id:'breakdown',group:'technical',title:'Project breakdown & model strategy',ar:'Project breakdown & model strategy',required:true,desc:'Buildings, zones, disciplines and federation.'},
  {id:'naming',group:'technical',title:'Naming convention',ar:'Naming convention',required:true,desc:'Naming fields, codes and a worked example.'},
  {id:'coordinates',group:'technical',title:'Coordinates, levels & units',ar:'Coordinates, levels & units',required:true,desc:'CRS, vertical datum, URS and linking procedure.'},
  {id:'loin',group:'technical',title:'Level of information need',ar:'Level of information need',required:true,desc:'Geometry, information and documentation by stage.'},
  {id:'authoring',group:'technical',title:'Authoring & drawing production',ar:'Authoring & drawing production',required:true,desc:'Revit/Civil 3D, worksharing and drawing strategy.'},
  {id:'quality',group:'delivery',title:'Model quality assurance',ar:'Model quality assurance',required:true,desc:'Checks, frequency, ownership and acceptance limits.'},
  {id:'coordination',group:'delivery',title:'Model federation & coordination',ar:'Model federation & coordination',required:true,desc:'Cycles, tests, exceptions and issue closeout.'},
  {id:'meetings',group:'delivery',title:'Meetings, reporting & communication',ar:'Meetings, reporting & communication',required:true,desc:'Frequency, participants and outputs.'},
  {id:'delivery',group:'delivery',title:'Information delivery planning',ar:'Information delivery planning',required:true,desc:'MIDP/TIDPs, dates, producers and formats.'},
  {id:'fourD',group:'optional',title:'4D construction planning',ar:'4D construction planning',feature:'fourD',desc:'Programme-to-model linking and review outputs.'},
  {id:'fiveD',group:'optional',title:'5D & quantity take-off',ar:'5D & quantity take-off',feature:'fiveD',desc:'Measurement, cost codes and model linkage.'},
  {id:'existing',group:'optional',title:'Existing conditions & verification',ar:'Existing conditions & verification',feature:'existing',desc:'Existing-condition sources, surveys and verification.'},
  {id:'fabrication',group:'optional',title:'Digital fabrication',ar:'Digital fabrication',feature:'fabrication',desc:'Fabrication models, information and outputs.'},
  {id:'visualization',group:'optional',title:'Visualization, VR & other uses',ar:'Visualization, VR & other uses',feature:'visualization',desc:'Purpose, scope, tool and deliverables.'},
  {id:'asbuilt',group:'closeout',title:'As-built information',ar:'As-built information',required:true,desc:'Update sources, verification, accuracy and responsibilities.'},
  {id:'assets',group:'closeout',title:'Asset information requirements',ar:'Asset information requirements',feature:'assets',desc:'Schema, attributes and supplier responsibilities.'},
  {id:'cobie',group:'closeout',title:'COBie delivery',ar:'COBie delivery',feature:'cobie',depends:['assets'],desc:'Version, data drops and validation activities.'},
  {id:'tagging',group:'closeout',title:'Asset identification & tagging',ar:'Asset identification & tagging',feature:'tagging',desc:'Identification rules, tagging and verification.'},
  {id:'handover',group:'closeout',title:'Handover, acceptance & archiving',ar:'Handover, acceptance & archiving',required:true,desc:'Closeout package, acceptance record and archive.'},
  {id:'appendices',group:'closeout',title:'Appendices',ar:'Appendices',required:true,desc:'Appendix register, status and linkage.'}
];

export const statuses = [
  {value:'required',label:'Required',include:true},
  {value:'optional',label:'Optional / enabled',include:true},
  {value:'pending',label:'Pending decision',include:true},
  {value:'not_applicable',label:'Not applicable',include:false}
];

export const listSchemas = {
  parties:{label:'Parties',columns:[['name','Organization'],['role','Role'],['code','Code'],['responsibility','Responsibility']]},
  team:{label:'Project team',columns:[['name','Name'],['organization','Organization'],['role','Role'],['email','Email']]},
  responsibilities:{label:'Responsibility matrix',columns:[['activity','Activity / deliverable'],['responsible','Responsible'],['accountable','Accountable'],['consulted','Consulted'],['informed','Informed']]},
  references:{label:'References & requirements',columns:[['title','Title'],['code','Code'],['revision','Revision'],['status','Status','select',['Adopted','For review','Superseded','Not received']],['source','Source']]},
  uses:{label:'BIM uses',columns:[['name','Use'],['status','Status','select',['Required','Optional','Pending','Not applicable']],['owner','Owner'],['output','Output']]},
  software:{label:'Software',columns:[['use','Use'],['product','Product'],['version','Version'],['exchange','Exchange format']]},
  exchanges:{label:'Information exchange schedule',columns:[['exchange','Exchange'],['milestone','Milestone'],['sender','Sender'],['receiver','Receiver'],['format','Format'],['status','Status','select',['Planned','In progress','Submitted','Accepted','Rejected']]]},
  models:{label:'Model register',columns:[['code','Code'],['discipline','Discipline'],['zone','Building / zone'],['producer','Producer']]},
  namingFields:{label:'Naming convention fields',columns:[['order','Order','number'],['field','Field'],['codeList','Permitted values / code list'],['example','Example']]},
  loin:{label:'Level of information need matrix',columns:[['element','Element / system'],['milestone','Milestone'],['geometry','Geometrical information'],['information','Alphanumeric information'],['documentation','Documentation'],['responsible','Responsible party']]},
  milestones:{label:'Milestones',columns:[['name','Milestone'],['gate','Stage gate'],['date','Date','date'],['output','Outputs']]},
  deliverables:{label:'Deliverables',columns:[['title','Deliverable'],['producer','Producer'],['date','Date','date'],['format','Format'],['acceptance','Acceptance']]},
  clashes:{label:'Clash tests',columns:[['name','Test'],['setA','Set A'],['setB','Set B'],['type','Type','select',['Hard','Clearance','Duplicate','Workflow']],['tolerance','Tolerance / clearance'],['owner','Owner']]},
  meetings:{label:'Meetings',columns:[['name','Type'],['frequency','Frequency'],['participants','Participants'],['output','Output']]},
  qaChecks:{label:'Model QA/QC schedule',columns:[['check','Check'],['frequency','Frequency'],['checker','Checker'],['acceptance','Acceptance criterion'],['evidence','Evidence / record']]},
  assetRequirements:{label:'Asset information requirements',columns:[['asset','Asset / system'],['property','Required property'],['source','Source / supplier'],['milestone','Milestone'],['format','Format'],['responsible','Responsible party']]},
  decisions:{label:'Decision & assumption register',columns:[['reference','Reference'],['subject','Subject'],['decision','Decision / assumption'],['owner','Owner'],['dueDate','Due date','date'],['status','Status','select',['Open','Proposed','Agreed','Closed']]]},
  appendices:{label:'Appendices',columns:[['title','Title'],['reference','Reference'],['status','Status'],['location','File / link']]}
};

export const fieldGroups = {
  project:[
    ['projectName','Project name','text',true],['projectCode','Project code','text',true],['description','Project description & work scope','textarea',true],['location','Location','text'],['sector','Project sector','text'],['contractNumber','Contract number','text'],
    ['documentTitle','Document title','text',true],['documentCode','Document number','text',true],['revision','Revision','text',true],['issueDate','Issue date','date',true],['issuePurpose','Issue purpose','text',true],['preparedBy','Prepared by','text',true],['checkedBy','Checked by','text'],['approvedBy','Approved by','text']
  ],
  appointment:[
    ['contractor','Main contractor','text',true],['client','Client / appointing party','text',true],['consultant','Supervision consultant','text',true],['designer','Designer','text'],['contractType','Contract type','text'],['designResponsibility','Design responsibility','select',true,['Contractor design','Client design','Shared / partial','Pending confirmation']],['informationRole','Information management role','select',true,['Lead appointed party','Appointed party','Coordination lead only','Pending confirmation']],['coordinationScope','Coordination leadership scope','textarea',true],['exclusions','Exclusions & scope boundaries','textarea']
  ],
  information:[
    ['cde','CDE platform','text',true],['cdeUrl','Platform URL','url'],['submissionPlatform','Submission platform','text'],['worksharingMode','Worksharing method','select',true,['Cloud worksharing','Local central models','Hybrid','To be agreed']],['informationStates','Approved information states','text'],['suitabilitySystem','Status / suitability code system','text'],['reviewWorkflow','Review & approval workflow','textarea',true],['backupLocation','Backup location','text'],['backupFrequency','Backup frequency','text'],['retention','Retention period','text']
  ],
  technical:[
    ['namingPattern','File naming convention','text',true],['originatorCode','Originator code','text'],['drawingStrategy','Drawing production strategy','select',true,['Discipline models','Separate production models','Hybrid','To be agreed']],['crs','Coordinate reference system (CRS)','text',true],['verticalDatum','Vertical datum','text',true],['units','Units','select',true,['Millimetres','Metres','Project-specific']],['ursReference','URS / survey file reference','text'],['northRotation','North rotation & unit','text'],['loinSystem','LOIN / LOD system & edition','text',true],['classification','Classification system & edition','text'],['modelSizeLimit','Model size limit & source','text'],['authoringProcedure','Authoring procedure summary','textarea']
  ],
  coordination:[
    ['coordinationCycle','Coordination cycle','text',true],['issuePlatform','Issue management platform','text'],['issueWorkflow','Issue states & closeout workflow','textarea',true],['qaFrequency','QA check frequency','text'],['warningPolicy','Warnings policy','text'],['fourDTool','4D tool','text'],['programmeSource','Programme source','text'],['fiveDTool','5D / QTO tool','text'],['assetSchema','Asset information schema','text'],['cobieVersion','COBie version','text'],['asBuiltMethod','As-built verification method','textarea',true],['asBuiltAccuracy','Accuracy & unit','text']
  ]
};

export const defaultLists = () => ({
  parties:[],team:[],responsibilities:[{activity:'BEP management',responsible:'BIM Manager',accountable:'Project Manager',consulted:'Discipline BIM Leads',informed:'Project team'},{activity:'Discipline model production',responsible:'Task team',accountable:'Discipline lead',consulted:'BIM coordination team',informed:'Main contractor'}],references:[],
  uses:[{name:'Construction coordination',status:'Required',owner:'Main contractor',output:'Coordinated model and issue register'},{name:'Information delivery planning',status:'Required',owner:'Main contractor',output:'MIDP / TIDPs'}],
  software:[],exchanges:[],models:[],namingFields:[{order:'1',field:'Project',codeList:'Approved project code',example:'PRJ'},{order:'2',field:'Originator',codeList:'Approved organization code',example:'ORG'},{order:'3',field:'Volume / system',codeList:'Project breakdown code',example:'ZZ'}],loin:[],milestones:[],deliverables:[],clashes:[],
  meetings:[{name:'BIM coordination meeting',frequency:'Weekly',participants:'Relevant task teams',output:'Minutes and updated issue register'}],qaChecks:[{check:'Coordinates, levels and units',frequency:'Before every exchange',checker:'Discipline BIM Lead',acceptance:'Matches approved project reference',evidence:'Model QA checklist'},{check:'Naming and document metadata',frequency:'Before every exchange',checker:'Information Manager',acceptance:'Complies with approved convention',evidence:'Submission check record'}],assetRequirements:[],decisions:[],appendices:[]
});

export function defaultModuleStates(){return Object.fromEntries(modules.map(m=>[m.id,m.required?'required':'not_applicable']));}
