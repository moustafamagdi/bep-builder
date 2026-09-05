export const moduleGroups = [
  {id:'foundation',label:'الأساس وضبط المستند'},
  {id:'management',label:'إدارة المعلومات'},
  {id:'technical',label:'المعايير الفنية'},
  {id:'delivery',label:'التنسيق والتسليم'},
  {id:'optional',label:'الاستخدامات الاختيارية'},
  {id:'closeout',label:'الإغلاق والتسليم النهائي'}
];

export const modules = [
  {id:'overview',group:'foundation',title:'Introduction & project overview',ar:'المقدمة وتعريف المشروع',required:true,desc:'الغرض، الحالة التعاقدية، المشروع والأطراف.'},
  {id:'scope',group:'foundation',title:'Appointment, scope & exclusions',ar:'التعيين والنطاق والاستثناءات',required:true,desc:'مسؤولية التصميم، قيادة التنسيق وحدود النطاق.'},
  {id:'references',group:'foundation',title:'Information requirements & references',ar:'المتطلبات والمراجع',required:true,desc:'المراجع المعتمدة، نسخها وحالة تبنيها.'},
  {id:'governance',group:'foundation',title:'Governance, team & responsibilities',ar:'الحوكمة والفريق والمسؤوليات',required:true,desc:'الأدوار، المسؤوليات ومسار القرارات.'},
  {id:'uses',group:'management',title:'BIM objectives & uses',ar:'أهداف واستخدامات BIM',required:true,desc:'الاستخدامات المطلوبة ومخرجاتها.'},
  {id:'cde',group:'management',title:'Common data environment',ar:'بيئة البيانات المشتركة',required:true,desc:'المنصات، الحالات، الصلاحيات والتقديم.'},
  {id:'information',group:'management',title:'Information production & exchange',ar:'إنتاج وتبادل المعلومات',required:true,desc:'الفحص، المشاركة، الاعتماد والأرشفة.'},
  {id:'security',group:'management',title:'Information security, backup & recovery',ar:'أمن المعلومات والنسخ الاحتياطي',required:true,desc:'الوصول، الاحتفاظ والاستعادة.'},
  {id:'software',group:'technical',title:'Technology, software & interoperability',ar:'البرامج والتوافق',required:true,desc:'الأدوات والإصدارات وصيغ التبادل.'},
  {id:'breakdown',group:'technical',title:'Project breakdown & model strategy',ar:'تقسيم المشروع والموديلات',required:true,desc:'المباني والمناطق والتخصصات والفيدرشن.'},
  {id:'naming',group:'technical',title:'Naming convention',ar:'قواعد التسمية والترميز',required:true,desc:'حقول الاسم، الأكواد ومثال مباشر.'},
  {id:'coordinates',group:'technical',title:'Coordinates, levels & units',ar:'الإحداثيات والمناسيب والوحدات',required:true,desc:'CRS والمرجع الرأسي وURS وإجراء الربط.'},
  {id:'loin',group:'technical',title:'Level of information need',ar:'مستوى احتياج المعلومات',required:true,desc:'الهندسة والبيانات والمستندات حسب المرحلة.'},
  {id:'authoring',group:'technical',title:'Authoring & drawing production',ar:'إجراءات النمذجة وإنتاج اللوحات',required:true,desc:'Revit/Civil 3D، Worksharing واستراتيجية اللوحات.'},
  {id:'quality',group:'delivery',title:'Model quality assurance',ar:'ضمان جودة الموديلات',required:true,desc:'الفحوص، التكرار، المسؤول وحدود القبول.'},
  {id:'coordination',group:'delivery',title:'Model federation & coordination',ar:'الفيدرشن والتنسيق',required:true,desc:'الدورات، الاختبارات، الاستثناءات وإغلاق الملاحظات.'},
  {id:'meetings',group:'delivery',title:'Meetings, reporting & communication',ar:'الاجتماعات والتقارير',required:true,desc:'التكرار والمشاركون والمخرجات.'},
  {id:'delivery',group:'delivery',title:'Information delivery planning',ar:'خطة تسليم المعلومات',required:true,desc:'MIDP/TIDP والمواعيد والمنتجين والصيغ.'},
  {id:'fourD',group:'optional',title:'4D construction planning',ar:'التخطيط الزمني 4D',feature:'fourD',desc:'ربط البرنامج الزمني بالموديل ومخرجات المراجعة.'},
  {id:'fiveD',group:'optional',title:'5D & quantity take-off',ar:'5D وحصر الكميات',feature:'fiveD',desc:'القياس وأكواد التكلفة وربط الموديل.'},
  {id:'existing',group:'optional',title:'Existing conditions & verification',ar:'الحالة القائمة والتحقق',feature:'existing',desc:'مصادر الحالة القائمة والمسح والتحقق.'},
  {id:'fabrication',group:'optional',title:'Digital fabrication',ar:'التصنيع الرقمي',feature:'fabrication',desc:'نماذج التصنيع والبيانات والمخرجات.'},
  {id:'visualization',group:'optional',title:'Visualization, VR & other uses',ar:'التصور وVR والاستخدامات الأخرى',feature:'visualization',desc:'الغرض والنطاق والأداة والتسليم.'},
  {id:'asbuilt',group:'closeout',title:'As-built information',ar:'معلومات As-built',required:true,desc:'مصادر التحديث والتحقق والدقة والمسؤوليات.'},
  {id:'assets',group:'closeout',title:'Asset information requirements',ar:'بيانات الأصول',feature:'assets',desc:'المخطط والخصائص ومسؤوليات الموردين.'},
  {id:'cobie',group:'closeout',title:'COBie delivery',ar:'تسليم COBie',feature:'cobie',depends:['assets'],desc:'الإصدار وData Drops وأعمال الفحص.'},
  {id:'tagging',group:'closeout',title:'Asset identification & tagging',ar:'ترميز وتعريف الأصول',feature:'tagging',desc:'قاعدة الترميز والوسم والتحقق.'},
  {id:'handover',group:'closeout',title:'Handover, acceptance & archiving',ar:'التسليم والقبول والأرشفة',required:true,desc:'حزمة الإغلاق وسجل القبول والأرشيف.'},
  {id:'appendices',group:'closeout',title:'Appendices',ar:'الملاحق',required:true,desc:'قائمة الملاحق وحالتها وارتباطها.'}
];

export const statuses = [
  {value:'required',label:'مطلوب',include:true},
  {value:'optional',label:'اختياري / مفعّل',include:true},
  {value:'pending',label:'لم يُحسم',include:true},
  {value:'not_applicable',label:'غير منطبق',include:false}
];

export const listSchemas = {
  parties:{label:'الأطراف',columns:[['name','الشركة'],['role','الدور'],['code','الكود'],['responsibility','المسؤولية']]},
  team:{label:'فريق المشروع',columns:[['name','الاسم'],['organization','الشركة'],['role','الوظيفة'],['email','البريد']]},
  references:{label:'المراجع والمتطلبات',columns:[['title','العنوان'],['code','الكود'],['revision','الإصدار'],['status','الحالة'],['source','المصدر']]},
  uses:{label:'استخدامات BIM',columns:[['name','الاستخدام'],['status','الحالة'],['owner','المسؤول'],['output','المخرج']]},
  software:{label:'البرامج',columns:[['use','الاستخدام'],['product','البرنامج'],['version','الإصدار'],['exchange','صيغة التبادل']]},
  models:{label:'سجل الموديلات',columns:[['code','الكود'],['discipline','التخصص'],['zone','المبنى/المنطقة'],['producer','المنتج']]},
  milestones:{label:'المراحل',columns:[['name','المرحلة'],['gate','Stage Gate'],['date','التاريخ'],['output','المخرجات']]},
  deliverables:{label:'التسليمات',columns:[['title','المخرج'],['producer','المنتج'],['date','التاريخ'],['format','الصيغة'],['acceptance','القبول']]},
  clashes:{label:'اختبارات الكلاش',columns:[['name','الاختبار'],['setA','المجموعة A'],['setB','المجموعة B'],['type','النوع'],['tolerance','التفاوت/الخلوص'],['owner','المسؤول']]},
  meetings:{label:'الاجتماعات',columns:[['name','النوع'],['frequency','التكرار'],['participants','المشاركون'],['output','المخرج']]},
  appendices:{label:'الملاحق',columns:[['title','العنوان'],['reference','المرجع'],['status','الحالة'],['location','الملف/الرابط']]}
};

export const fieldGroups = {
  project:[
    ['projectName','اسم المشروع','text',true],['projectCode','كود المشروع','text',true],['description','وصف المشروع ونطاق الأعمال','textarea',true],['location','الموقع','text'],['sector','نوع المشروع','text'],['contractNumber','رقم العقد','text'],
    ['documentTitle','عنوان المستند','text',true],['documentCode','رقم المستند','text',true],['revision','المراجعة','text',true],['issueDate','تاريخ الإصدار','date',true],['issuePurpose','غرض الإصدار','text',true],['preparedBy','أعد بواسطة','text',true],['checkedBy','راجع بواسطة','text'],['approvedBy','اعتمد بواسطة','text']
  ],
  appointment:[
    ['contractor','المقاول الرئيسي','text',true],['client','العميل / المالك','text',true],['consultant','استشاري الإشراف','text',true],['designer','المصمم','text'],['contractType','نوع العقد','text'],['designResponsibility','مسؤولية التصميم','select',true,['Contractor design','Client design','Shared / partial','Pending confirmation']],['informationRole','دور إدارة المعلومات','select',true,['Lead appointed party','Appointed party','Coordination lead only','Pending confirmation']],['coordinationScope','نطاق قيادة التنسيق','textarea',true],['exclusions','الاستثناءات وحدود النطاق','textarea']
  ],
  information:[
    ['cde','منصة الـCDE','text',true],['cdeUrl','رابط المنصة','url'],['submissionPlatform','منصة التقديم','text'],['worksharingMode','طريقة العمل','select',true,['Cloud worksharing','Local central models','Hybrid','To be agreed']],['informationStates','حالات المعلومات المعتمدة','text'],['suitabilitySystem','نظام أكواد الحالة/الغرض','text'],['reviewWorkflow','مسار المراجعة والاعتماد','textarea',true],['backupLocation','مكان النسخ الاحتياطي','text'],['backupFrequency','تكرار النسخ','text'],['retention','مدة الاحتفاظ','text']
  ],
  technical:[
    ['namingPattern','قاعدة تسمية الملفات','text',true],['originatorCode','Originator Code','text'],['drawingStrategy','استراتيجية إنتاج اللوحات','select',true,['Discipline models','Separate production models','Hybrid','To be agreed']],['crs','نظام الإحداثيات CRS','text',true],['verticalDatum','المرجع الرأسي','text',true],['units','الوحدات','select',true,['Millimetres','Metres','Project-specific']],['ursReference','مرجع URS / ملف المساح','text'],['northRotation','زاوية الشمال ووحدتها','text'],['loinSystem','نظام LOIN / LOD وإصداره','text',true],['classification','نظام التصنيف وإصداره','text'],['modelSizeLimit','حد حجم الموديل ومصدره','text'],['authoringProcedure','ملخص إجراءات النمذجة','textarea']
  ],
  coordination:[
    ['coordinationCycle','دورة التنسيق','text',true],['issuePlatform','منصة إدارة الملاحظات','text'],['issueWorkflow','حالات الملاحظات ومسار الإغلاق','textarea',true],['qaFrequency','تكرار فحوص الجودة','text'],['warningPolicy','سياسة Warnings','text'],['fourDTool','أداة 4D','text'],['programmeSource','مصدر البرنامج الزمني','text'],['fiveDTool','أداة 5D / QTO','text'],['assetSchema','مخطط بيانات الأصول','text'],['cobieVersion','إصدار COBie','text'],['asBuiltMethod','طريقة التحقق من As-built','textarea',true],['asBuiltAccuracy','الدقة ووحدتها','text']
  ]
};

export const defaultLists = () => ({
  parties:[],team:[],references:[],
  uses:[{name:'Construction coordination',status:'Required',owner:'Main contractor',output:'Coordinated model and issue register'},{name:'Information delivery planning',status:'Required',owner:'Main contractor',output:'MIDP / TIDPs'}],
  software:[],models:[],milestones:[],deliverables:[],clashes:[],
  meetings:[{name:'BIM coordination meeting',frequency:'Weekly',participants:'Relevant task teams',output:'Minutes and updated issue register'}],appendices:[]
});

export function defaultModuleStates(){return Object.fromEntries(modules.map(m=>[m.id,m.required?'required':'not_applicable']));}
