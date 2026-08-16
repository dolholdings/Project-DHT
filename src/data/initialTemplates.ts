import { ProjectTemplate } from '../types';

export const INITIAL_TEMPLATES: ProjectTemplate[] = [
  {
    id: 'tpl_hvac_turnkey',
    name: 'HVAC Turnkey System Installation',
    description: 'Complete MEP engineering workflow template covering initial thermal load survey, BIM modelling, equipment hoisting, ductwork, TAB commissioning, and civil defence signoff.',
    category: 'HVAC Engineering',
    estimatedBudget: 450000,
    estimatedDurationDays: 90,
    tags: ['MEP', 'HVAC', 'Turnkey', 'Chillers', 'BIM'],
    createdBy: 'Pawan Kumar',
    createdAt: '2026-06-15T09:00:00Z',
    version: 'v1.0',
    lists: ['1. Engineering & Survey', '2. BIM & Procurement', '3. Site Installation', '4. Commissioning & TAB', '5. Civil Defence Signoff'],
    customFields: [
      {
        id: 'cf_cfm_capacity',
        name: 'Cooling Capacity (TR / CFM)',
        type: 'number',
        description: 'Target thermal cooling capacity in Tons of Refrigeration',
        defaultValue: 250,
        required: true
      },
      {
        id: 'cf_refrigerant_type',
        name: 'Refrigerant Specification',
        type: 'dropdown',
        options: ['R-410A', 'R-134a', 'R-32', 'R-1234ze (Low GWP)', 'Ammonia (NH3)'],
        description: 'Chiller refrigerant chemical designation',
        defaultValue: 'R-410A',
        required: true
      },
      {
        id: 'cf_civil_defence_cert',
        name: 'Civil Defence Safety Signoff',
        type: 'checkbox',
        description: 'Civil defence fire & life safety mandatory verification',
        defaultValue: false,
        required: false
      },
      {
        id: 'cf_bms_integration',
        name: 'BMS Integration Protocol',
        type: 'dropdown',
        options: ['BACnet IP', 'Modbus RTU', 'LonWorks', 'MQTT / IoT Cloud'],
        description: 'Building Management System automation interface protocol',
        defaultValue: 'BACnet IP',
        required: false
      }
    ],
    versionHistory: [
      {
        id: 'vr_1_hvac',
        version: 'v1.0',
        name: 'HVAC Turnkey System Installation',
        description: 'Initial release of HVAC MEP workflow template.',
        changeSummary: 'Initial Baseline Release with 9 core stages and Finish-to-Start linkages.',
        createdAt: '2026-06-15T09:00:00Z',
        createdBy: 'Pawan Kumar',
        tasksCount: 9,
        dependenciesCount: 9,
        estimatedBudget: 450000,
        estimatedDurationDays: 90,
        tasks: [],
        dependencies: []
      }
    ],
    tasks: [
      {
        tempId: 'tt_1',
        title: 'Site Survey & Thermal Load Verification',
        description: 'Conduct on-site engineering measurements and compute BTU cooling load requirements.',
        priority: 'High',
        estimatedHours: 40,
        tags: ['Site Work', 'Engineering'],
        dayOffset: 0,
        durationDays: 7,
        listName: '1. Engineering & Survey',
        customFields: {
          cf_cfm_capacity: 250,
          cf_refrigerant_type: 'R-410A'
        },
        subtasks: ['Measure ceiling height and solar heat gain', 'Calculate CFM airflow requirements', 'Draft survey report']
      },
      {
        tempId: 'tt_2',
        title: 'MEP BIM Modelling & Client Approval',
        description: 'Develop 3D Revit models, perform clash detection with structural beams, and submit shop drawings.',
        priority: 'Urgent',
        estimatedHours: 80,
        tags: ['BIM', 'Design'],
        dayOffset: 7,
        durationDays: 14,
        listName: '1. Engineering & Survey',
        customFields: {
          cf_bms_integration: 'BACnet IP'
        },
        subtasks: ['Review Architectural Drawings', '3D Clash Detection', 'Client Engineering Approval']
      },
      {
        tempId: 'tt_3',
        title: 'Ductwork & Piping Prefabrication',
        description: 'Off-site GI sheet metal fabrication and hydrostatic pre-testing of chilled water piping.',
        priority: 'Medium',
        estimatedHours: 120,
        tags: ['Fabrication', 'Offsite'],
        dayOffset: 21,
        durationDays: 21,
        listName: '2. BIM & Procurement',
        subtasks: ['Sheet Metal Fabrication', 'Pipe Hydrostatic Testing', 'Insulation Prep']
      },
      {
        tempId: 'tt_4',
        title: 'Chiller & AHU Equipment Procurement',
        description: 'Issue LCs and manage factory shipment of 150 TR water-cooled chillers and air handling units.',
        priority: 'High',
        estimatedHours: 60,
        tags: ['Procurement', 'Equipment'],
        dayOffset: 14,
        durationDays: 30,
        listName: '2. BIM & Procurement',
        customFields: {
          cf_cfm_capacity: 300,
          cf_refrigerant_type: 'R-134a'
        },
        subtasks: ['Issue PO to manufacturer', 'Customs clearance & transit', 'Offloading at site']
      },
      {
        tempId: 'tt_5',
        title: 'Structural Support Hoisting & Mounting',
        description: 'Crane hoisting of roof-top chiller units and vibration isolator mounting.',
        priority: 'High',
        estimatedHours: 35,
        tags: ['Civil', 'Rigging'],
        dayOffset: 42,
        durationDays: 10,
        listName: '3. Site Installation',
        subtasks: ['Crane permit approval', 'Rooftop steel frame inspection', 'Hoisting & bolting']
      },
      {
        tempId: 'tt_6',
        title: 'Main Duct & Chilled Water Pipe Routing',
        description: 'Erect galvanized steel ducts, dampers, diffusers, and insulated chilled water supply/return lines.',
        priority: 'High',
        estimatedHours: 160,
        tags: ['Installation', 'Site Work'],
        dayOffset: 45,
        durationDays: 25,
        listName: '3. Site Installation',
        subtasks: ['Hanger rod installation', 'Duct section joint sealing', 'Chilled water pipe insulation']
      },
      {
        tempId: 'tt_7',
        title: 'Electrical Hookup & VFD Control Panel Wiring',
        description: 'Connect main power cables, variable frequency drives, and BMS integration sensors.',
        priority: 'Medium',
        estimatedHours: 50,
        tags: ['Electrical', 'Controls'],
        dayOffset: 65,
        durationDays: 15,
        listName: '3. Site Installation',
        customFields: {
          cf_bms_integration: 'BACnet IP'
        },
        subtasks: ['Cable tray installation', 'VFD panel wiring', 'BMS sensor calibration']
      },
      {
        tempId: 'tt_8',
        title: 'Testing, Adjusting & Balancing (TAB)',
        description: 'Comprehensive water flow metering, duct pressure testing, and thermographic inspection.',
        priority: 'High',
        estimatedHours: 45,
        tags: ['Commissioning', 'QA/QC'],
        dayOffset: 75,
        durationDays: 10,
        listName: '4. Commissioning & TAB',
        subtasks: ['Air balancer instrument setup', 'Chilled water GPM verification', 'Sound & vibration test']
      },
      {
        tempId: 'tt_9',
        title: 'Final Civil Defence Inspection & Handover',
        description: 'Submit third-party safety compliance certificates and conduct client operations training.',
        priority: 'Urgent',
        estimatedHours: 30,
        tags: ['Handover', 'Compliance'],
        dayOffset: 82,
        durationDays: 8,
        listName: '5. Civil Defence Signoff',
        customFields: {
          cf_civil_defence_cert: true
        },
        subtasks: ['Civil Defence inspection walk', 'As-built drawing submission', 'Client O&M manual handover']
      }
    ],
    dependencies: [
      { taskTempId: 'tt_2', dependsOnTaskTempId: 'tt_1', type: 'finish_to_start' },
      { taskTempId: 'tt_3', dependsOnTaskTempId: 'tt_2', type: 'finish_to_start' },
      { taskTempId: 'tt_5', dependsOnTaskTempId: 'tt_2', type: 'finish_to_start' },
      { taskTempId: 'tt_6', dependsOnTaskTempId: 'tt_3', type: 'finish_to_start' },
      { taskTempId: 'tt_6', dependsOnTaskTempId: 'tt_5', type: 'finish_to_start' },
      { taskTempId: 'tt_7', dependsOnTaskTempId: 'tt_6', type: 'finish_to_start' },
      { taskTempId: 'tt_8', dependsOnTaskTempId: 'tt_6', type: 'finish_to_start' },
      { taskTempId: 'tt_8', dependsOnTaskTempId: 'tt_7', type: 'finish_to_start' },
      { taskTempId: 'tt_9', dependsOnTaskTempId: 'tt_8', type: 'finish_to_start' }
    ]
  },
  {
    id: 'tpl_rad_production',
    name: 'Industrial Radiator Line Expansion',
    description: 'Standard operational template for introducing a high-capacity heavy-equipment aluminum/copper radiator core manufacturing line.',
    category: 'Radiator Production',
    estimatedBudget: 850000,
    estimatedDurationDays: 120,
    tags: ['Manufacturing', 'Radiators', 'Heavy Machinery', 'Automated'],
    createdBy: 'David Ross',
    createdAt: '2026-05-10T14:30:00Z',
    lists: ['1. RFP & Civil Foundations', '2. Machinery Logistics', '3. CAB Furnace & Tube Mill', '4. QA & Pilot Run'],
    customFields: [
      {
        id: 'cf_core_material',
        name: 'Radiator Core Material',
        type: 'dropdown',
        options: ['High-Grade Aluminum (3003/4343)', 'Copper-Brass Heavy Duty', 'Stainless Steel (316L)'],
        description: 'Raw metal alloy metallurgy specification',
        defaultValue: 'High-Grade Aluminum (3003/4343)',
        required: true
      },
      {
        id: 'cf_daily_core_target',
        name: 'Daily Core Output Target',
        type: 'number',
        description: 'Target production volume of radiator blocks per shift',
        defaultValue: 150,
        required: true
      },
      {
        id: 'cf_iso_quality_lead',
        name: 'Lead Quality Inspector',
        type: 'text',
        description: 'Designated QA Engineer for ISO 9001 batch certification',
        defaultValue: 'Suhail Ahmed (QA/QC Lead)',
        required: false
      }
    ],
    tasks: [
      {
        tempId: 'rt_1',
        title: 'Machine Specification & Vendor RFP',
        description: 'Draft technical specs for automated tube mills, fin presses, and CNC header punching machines.',
        priority: 'High',
        estimatedHours: 50,
        tags: ['RFP', 'Engineering'],
        dayOffset: 0,
        durationDays: 14,
        listName: '1. RFP & Civil Foundations',
        customFields: {
          cf_core_material: 'High-Grade Aluminum (3003/4343)',
          cf_daily_core_target: 150
        },
        subtasks: ['Specify tube pitch and fin density', 'Issue RFP to German/Japanese vendors', 'Commercial bid comparison']
      },
      {
        tempId: 'rt_2',
        title: 'Factory Floor Civil Foundation Works',
        description: 'Excavate utility trenches and pour high-load reinforced concrete vibration pads.',
        priority: 'High',
        estimatedHours: 90,
        tags: ['Civil', 'Factory'],
        dayOffset: 14,
        durationDays: 21,
        listName: '1. RFP & Civil Foundations',
        subtasks: ['Reinforced Concrete Slab Pouring', 'Curing Period Monitoring', 'Utility Trenching']
      },
      {
        tempId: 'rt_3',
        title: 'Fin Press & Stamping Machine Delivery',
        description: 'Receive sea freight containers, customs clearance, and uncrating on factory floor.',
        priority: 'Medium',
        estimatedHours: 40,
        tags: ['Logistics', 'Machinery'],
        dayOffset: 28,
        durationDays: 45,
        listName: '2. Machinery Logistics'
      },
      {
        tempId: 'rt_4',
        title: 'Automated Tube Mill Line Installation',
        description: 'Align high-precision roller dies, install high-frequency induction welders, and wire power feeders.',
        priority: 'Urgent',
        estimatedHours: 110,
        tags: ['Installation', 'Automation'],
        dayOffset: 65,
        durationDays: 20,
        listName: '3. CAB Furnace & Tube Mill'
      },
      {
        tempId: 'rt_5',
        title: 'Controlled Atmosphere Brazing (CAB) Furnace Assembly',
        description: 'Assemble multi-zone nitrogen furnace, thermal insulation muffle, and flux spray chamber.',
        priority: 'High',
        estimatedHours: 130,
        tags: ['Furnace', 'Thermal'],
        dayOffset: 75,
        durationDays: 25,
        listName: '3. CAB Furnace & Tube Mill'
      },
      {
        tempId: 'rt_6',
        title: 'Pneumatic Leak Testing Rig Calibration',
        description: 'Calibrate automated underwater bubble leak test tanks and mass spectrometer helium detectors.',
        priority: 'Medium',
        estimatedHours: 45,
        tags: ['QA/QC', 'Testing'],
        dayOffset: 95,
        durationDays: 10,
        listName: '4. QA & Pilot Run'
      },
      {
        tempId: 'rt_7',
        title: 'ISO 9001 Batch Pilot Production Run',
        description: 'Manufacture 100 sample radiator cores for CAT/Komatsu engines and perform pressure cycle testing.',
        priority: 'High',
        estimatedHours: 70,
        tags: ['Pilot Run', 'Certification'],
        dayOffset: 105,
        durationDays: 15,
        listName: '4. QA & Pilot Run',
        customFields: {
          cf_iso_quality_lead: 'Suhail Ahmed (QA/QC Lead)',
          cf_daily_core_target: 150
        }
      }
    ],
    dependencies: [
      { taskTempId: 'rt_2', dependsOnTaskTempId: 'rt_1', type: 'finish_to_start' },
      { taskTempId: 'rt_4', dependsOnTaskTempId: 'rt_2', type: 'finish_to_start' },
      { taskTempId: 'rt_4', dependsOnTaskTempId: 'rt_3', type: 'finish_to_start' },
      { taskTempId: 'rt_5', dependsOnTaskTempId: 'rt_4', type: 'finish_to_start' },
      { taskTempId: 'rt_6', dependsOnTaskTempId: 'rt_5', type: 'finish_to_start' },
      { taskTempId: 'rt_7', dependsOnTaskTempId: 'rt_6', type: 'finish_to_start' }
    ]
  },
  {
    id: 'tpl_heat_exchanger',
    name: 'Shell & Tube Heat Exchanger Refurbishment',
    description: 'Turnkey overhaul template for refinery tube bundle pulling, hydro-blasting, tube bundle retubing, and ASME pressure vessel recertification.',
    category: 'Heat Exchanger',
    estimatedBudget: 180000,
    estimatedDurationDays: 45,
    tags: ['Refinery', 'Heat Exchanger', 'ASME', 'Maintenance'],
    createdBy: 'Pawan Kumar',
    createdAt: '2026-07-01T11:00:00Z',
    lists: ['1. Isolation & Bundle Pulling', '2. Hydro-blast & NDT', '3. Retubing & Hydro-test', '4. Box-up & Delivery'],
    customFields: [
      {
        id: 'cf_tpi_agency',
        name: 'Third-Party Inspection (TPI) Agency',
        type: 'dropdown',
        options: ['SLB / Schlumberger', 'TUV Rheinland', 'Bureau Veritas', 'DNV GL', 'Velosi / ABS'],
        description: 'Mandatory witness inspection certification agency',
        defaultValue: 'SLB / Schlumberger',
        required: true
      },
      {
        id: 'cf_asme_u_stamp',
        name: 'ASME "U" Stamp Certified',
        type: 'checkbox',
        description: 'ASME Section VIII Div 1 pressure vessel stamp signoff',
        defaultValue: true,
        required: true
      },
      {
        id: 'cf_test_pressure_bar',
        name: 'Hydro-test Pressure (Bar)',
        type: 'number',
        description: 'Design hydro-testing pressure rating in Bar gauge',
        defaultValue: 35,
        required: true
      }
    ],
    tasks: [
      {
        tempId: 'ht_1',
        title: 'Unit De-inventorying & Blind Insertion',
        description: 'Isolate hydrocarbon lines, steam purging, and install spectacle blinds.',
        priority: 'Urgent',
        estimatedHours: 30,
        tags: ['Safety', 'Shutdown'],
        dayOffset: 0,
        durationDays: 3,
        listName: '1. Isolation & Bundle Pulling'
      },
      {
        tempId: 'ht_2',
        title: 'Hydraulic Tube Bundle Extractor Pulling',
        description: 'Rig 25-ton hydraulic bundle extractor truck and pull 6-meter bundle onto transport saddle.',
        priority: 'High',
        estimatedHours: 40,
        tags: ['Rigging', 'Mechanical'],
        dayOffset: 3,
        durationDays: 4,
        listName: '1. Isolation & Bundle Pulling'
      },
      {
        tempId: 'ht_3',
        title: 'High-Pressure Water Jet Shell & Tube Cleaning',
        description: 'Hydro-blast shell internal ID at 1000 Bar and conduct NDT dye penetrant inspection of tube sheets.',
        priority: 'Medium',
        estimatedHours: 50,
        tags: ['Cleaning', 'NDT'],
        dayOffset: 6,
        durationDays: 5,
        listName: '2. Hydro-blast & NDT',
        customFields: {
          cf_tpi_agency: 'SLB / Schlumberger'
        },
        subtasks: ['Chemical Flushing', 'Ultrasonic Thickness Gauging', 'NDT Dye Penetrant Test']
      },
      {
        tempId: 'ht_4',
        title: 'Tube Bundle Retubing & Torque Expanding',
        description: 'Replace damaged titanium tubes and torque expand tube ends into tube sheet grooves.',
        priority: 'High',
        estimatedHours: 100,
        tags: ['Retubing', 'Machining'],
        dayOffset: 11,
        durationDays: 18,
        listName: '3. Retubing & Hydro-test'
      },
      {
        tempId: 'ht_5',
        title: 'Shell-Side Hydrostatic Pressure Test (35 Bar)',
        description: 'Fill shell with inhibited water, pressurize to 35 Bar, and hold for 4 hours with ASME inspector witness.',
        priority: 'Urgent',
        estimatedHours: 35,
        tags: ['Testing', 'ASME'],
        dayOffset: 28,
        durationDays: 5,
        listName: '3. Retubing & Hydro-test',
        customFields: {
          cf_asme_u_stamp: true,
          cf_test_pressure_bar: 35,
          cf_tpi_agency: 'SLB / Schlumberger'
        }
      },
      {
        tempId: 'ht_6',
        title: 'Final Box-up, Gasket Replacement & Commissioning',
        description: 'Insert bundle back into shell, install new spiral wound gaskets, torque flange bolts, and de-blind.',
        priority: 'High',
        estimatedHours: 45,
        tags: ['Commissioning', 'Handover'],
        dayOffset: 33,
        durationDays: 7,
        listName: '4. Box-up & Delivery',
        customFields: {
          cf_asme_u_stamp: true
        }
      }
    ],
    dependencies: [
      { taskTempId: 'ht_2', dependsOnTaskTempId: 'ht_1', type: 'finish_to_start' },
      { taskTempId: 'ht_3', dependsOnTaskTempId: 'ht_2', type: 'finish_to_start' },
      { taskTempId: 'ht_4', dependsOnTaskTempId: 'ht_3', type: 'finish_to_start' },
      { taskTempId: 'ht_5', dependsOnTaskTempId: 'ht_4', type: 'finish_to_start' },
      { taskTempId: 'ht_6', dependsOnTaskTempId: 'ht_5', type: 'finish_to_start' }
    ]
  }
];
