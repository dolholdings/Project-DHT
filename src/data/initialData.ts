import {
  Company,
  User,
  Project,
  Task,
  Subtask,
  TaskDependency,
  ActivityLog,
  Notification,
  AutomationRule,
  ProjectFile,
  TimeEntry
} from '../types';

export const INITIAL_COMPANIES: Company[] = [
  {
    id: 'comp_1',
    name: 'DOLPHIN GLOBAL HOLDINGS',
    code: 'DGH',
    domain: 'dolphingroup.ae',
    logo: '🐬',
    description: 'Corporate Governance & Group Operations Center',
    type: 'Internal Dolphin Entity',
    isExternal: false
  },
  {
    id: 'comp_dgh',
    name: 'DGH Analytics',
    code: 'DGHA',
    domain: 'dghanalytics.com',
    logo: '📊',
    description: 'Project Management & Analytics Platform',
    type: 'Internal Dolphin Entity',
    isExternal: false
  },
  {
    id: 'comp_2',
    name: 'Dolphin Radiators & Oil Coolers',
    code: 'DROC',
    domain: 'dolrad.ae',
    logo: '⚡',
    description: 'Heavy Industrial Thermal Engineering & Radiator Manufacturing',
    type: 'Internal Dolphin Entity',
    isExternal: false
  },
  {
    id: 'comp_3',
    name: 'Dolphin Cool Equipment',
    code: 'DCOOL',
    domain: 'dolphingroup.ae',
    logo: '❄️',
    description: 'HVAC Chillers & Commercial Refrigeration Solutions',
    type: 'Internal Dolphin Entity',
    isExternal: false
  },
  {
    id: 'comp_4',
    name: 'Super Dolphin Trading',
    code: 'SDT',
    domain: 'dolrad.ae',
    logo: '📦',
    description: 'Automotive & Industrial Spare Parts Distribution Network',
    type: 'Internal Dolphin Entity',
    isExternal: false
  },
  {
    id: 'comp_5',
    name: 'Dolphin Heat Transfer SPS LLC',
    code: 'DHT',
    domain: 'dolheat.ae',
    logo: '🔥',
    description: 'Shell & Tube Heat Exchanger & Thermal Equipment Fabrication Plant',
    type: 'Internal Dolphin Entity',
    isExternal: false
  },
  {
    id: 'comp_6',
    name: 'Dolphin Holdings',
    code: 'DHOLD',
    domain: 'dolphingroup.ae',
    logo: '🏢',
    description: 'Asset Management & Real Estate Investment Division',
    type: 'Internal Dolphin Entity',
    isExternal: false
  },
  {
    id: 'comp_7',
    name: 'Petrofac International Engineering',
    code: 'PETRO',
    domain: 'petrofac.com',
    logo: '🏗️',
    description: 'EPC Subcontractor - Offshore Heat Exchanger Infrastructure Partner',
    type: 'Subcontractor',
    isExternal: true,
    contactEmail: 'projects@petrofac.com'
  },
  {
    id: 'comp_8',
    name: 'Al Futtaim HVAC Services LLC',
    code: 'AFH',
    domain: 'alfuttaim.ae',
    logo: '🔧',
    description: 'Client Entity - District Cooling & HVAC Maintenance Partner',
    type: 'Client',
    isExternal: true,
    contactEmail: 'contracts@alfuttaim.ae'
  }
];

export const INITIAL_USERS: User[] = [
  {
    id: 'usr_1',
    name: 'Tareq Al-Dolphin',
    email: 'tareq.aldolphin@dolphingroup.ae',
    role: 'Admin',
    companyId: 'comp_1',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150',
    department: 'Executive Board',
    hourlyRate: 250,
    maxWeeklyHours: 40,
    status: 'Active'
  },
  {
    id: 'usr_2',
    name: 'Suhail Ahmed',
    email: 'suhail.ahmed@dolrad.ae',
    role: 'Project Manager',
    companyId: 'comp_2',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150',
    department: 'Engineering & Fabrication',
    hourlyRate: 120,
    maxWeeklyHours: 40,
    status: 'Active'
  },
  {
    id: 'usr_3',
    name: 'Fatima Zohra',
    email: 'fatima.zohra@dolheat.ae',
    role: 'Project Manager',
    companyId: 'comp_5',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=150',
    department: 'HVAC Solutions',
    hourlyRate: 110,
    maxWeeklyHours: 40,
    status: 'In Meeting'
  },
  {
    id: 'usr_4',
    name: 'Rashed Al-Maktoum',
    email: 'rashed.m@dolrad.ae',
    role: 'Team Member',
    companyId: 'comp_2',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150',
    department: 'Supply Chain & Logistics',
    hourlyRate: 85,
    maxWeeklyHours: 40,
    status: 'Active'
  },
  {
    id: 'usr_5',
    name: 'Elena Rostova',
    email: 'elena.rostova@dolheat.ae',
    role: 'Team Member',
    companyId: 'comp_5',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=150',
    department: 'Quality Assurance & Thermal Testing',
    hourlyRate: 95,
    maxWeeklyHours: 40,
    status: 'Active'
  },
  {
    id: 'usr_6',
    name: 'Omar Mansoor',
    email: 'omar.mansoor@dolphingroup.ae',
    role: 'Viewer',
    companyId: 'comp_1',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=150',
    department: 'Financial Auditing',
    hourlyRate: 130,
    maxWeeklyHours: 35,
    status: 'Offline'
  }
];

export const INITIAL_PROJECTS: Project[] = [
  {
    id: 'proj_1',
    title: 'Sharjah Industrial Plant 4 Expansion',
    code: 'SIP4-EXP',
    companyId: 'comp_2',
    description: 'Turnkey installation of automated robotic welding and copper radiator core assembly lines.',
    status: 'In Progress',
    progress: 68,
    managerId: 'usr_2',
    startDate: '2026-06-01',
    dueDate: '2026-10-15',
    budget: 1850000,
    spentBudget: 1120000,
    category: 'Radiator Production',
    members: ['usr_1', 'usr_2', 'usr_5']
  },
  {
    id: 'proj_2',
    title: 'Dubai Metro HVAC Chiller Modernization',
    code: 'DM-HVAC26',
    companyId: 'comp_3',
    description: 'Retrofitting eco-friendly dual-compressor chillers across 12 underground red-line stations.',
    status: 'In Progress',
    progress: 45,
    managerId: 'usr_3',
    startDate: '2026-07-10',
    dueDate: '2026-11-30',
    budget: 2400000,
    spentBudget: 980000,
    category: 'HVAC Engineering',
    members: ['usr_3', 'usr_4']
  },
  {
    id: 'proj_3',
    title: 'GCC Automotive Spare Parts ERP Migration',
    code: 'GCC-ERP',
    companyId: 'comp_4',
    description: 'Cloud supply chain and multi-warehouse SAP S/4HANA rollout across UAE, Oman, and KSA hubs.',
    status: 'Planning',
    progress: 20,
    managerId: 'usr_4',
    startDate: '2026-08-01',
    dueDate: '2026-12-20',
    budget: 950000,
    spentBudget: 150000,
    category: 'Industrial Manufacturing',
    members: ['usr_1', 'usr_4', 'usr_6']
  },
  {
    id: 'proj_4',
    title: 'Aramco Offshore Heat Exchanger Fabrication',
    code: 'ARAM-HEX',
    companyId: 'comp_5',
    description: 'ASME-certified titanium tubular heat exchangers for offshore oil rig cooling systems.',
    status: 'In Review',
    progress: 90,
    managerId: 'usr_2',
    startDate: '2026-04-15',
    dueDate: '2026-08-30',
    budget: 3100000,
    spentBudget: 2890000,
    category: 'Heat Exchanger',
    members: ['usr_2', 'usr_5']
  }
];

export const INITIAL_TASKS: Task[] = [
  {
    id: 'task_101',
    projectId: 'proj_1',
    companyId: 'comp_2',
    title: 'Robotic Arm Calibrations & PLC Programming',
    description: 'Configure 6-axis ABB welding robots for high-precision radiator fin soldering.',
    status: 'In Progress',
    priority: 'Urgent',
    assigneeIds: ['usr_2', 'usr_5'],
    reporterId: 'usr_1',
    startDate: '2026-07-20',
    dueDate: '2026-08-10',
    estimatedHours: 45,
    loggedHours: 32,
    tags: ['Robotics', 'PLC', 'Quality'],
    createdAt: '2026-07-15T08:00:00Z',
    updatedAt: '2026-08-01T14:30:00Z'
  },
  {
    id: 'task_102',
    projectId: 'proj_1',
    companyId: 'comp_2',
    title: 'Factory Hydrostatic Pressure Test Protocol',
    description: 'Perform 150 PSI leak test on core matrix units under ISO 9001 standards.',
    status: 'To Do',
    priority: 'High',
    assigneeIds: ['usr_5'],
    reporterId: 'usr_2',
    startDate: '2026-08-11',
    dueDate: '2026-08-25',
    estimatedHours: 25,
    loggedHours: 4,
    tags: ['Safety', 'Testing', 'ISO'],
    createdAt: '2026-07-18T09:00:00Z',
    updatedAt: '2026-07-28T10:00:00Z'
  },
  {
    id: 'task_201',
    projectId: 'proj_2',
    companyId: 'comp_3',
    title: 'Chiller Compressor R-1234yf Refrigerant Specs',
    description: 'Verification of zero-ODP low GWP refrigerant thermal equilibrium curves.',
    status: 'Done',
    priority: 'High',
    assigneeIds: ['usr_3'],
    reporterId: 'usr_1',
    startDate: '2026-07-12',
    dueDate: '2026-07-28',
    estimatedHours: 30,
    loggedHours: 28,
    tags: ['HVAC', 'Refrigerant', 'Eco'],
    createdAt: '2026-07-10T11:00:00Z',
    updatedAt: '2026-07-28T17:00:00Z'
  },
  {
    id: 'task_202',
    projectId: 'proj_2',
    companyId: 'comp_3',
    title: 'Underground Station 4 Piping Hookup',
    description: 'Install insulated 10-inch stainless steel chilled water pipe loops.',
    status: 'In Progress',
    priority: 'Urgent',
    assigneeIds: ['usr_3', 'usr_4'],
    reporterId: 'usr_3',
    startDate: '2026-07-29',
    dueDate: '2026-08-18',
    estimatedHours: 60,
    loggedHours: 22,
    tags: ['Piping', 'Piping Installation', 'Site'],
    createdAt: '2026-07-25T13:00:00Z',
    updatedAt: '2026-08-02T16:00:00Z'
  },
  {
    id: 'task_301',
    projectId: 'proj_3',
    companyId: 'comp_4',
    title: 'SAP Warehouse Master Data Mapping',
    description: 'Cleanse and map 45,000 SKU spare part entries across Jebel Ali Freezone warehouse.',
    status: 'In Progress',
    priority: 'Medium',
    assigneeIds: ['usr_4'],
    reporterId: 'usr_1',
    startDate: '2026-08-01',
    dueDate: '2026-08-20',
    estimatedHours: 80,
    loggedHours: 18,
    tags: ['ERP', 'Data', 'Inventory'],
    createdAt: '2026-07-29T10:00:00Z',
    updatedAt: '2026-08-02T09:00:00Z'
  },
  {
    id: 'task_401',
    projectId: 'proj_4',
    companyId: 'comp_5',
    title: 'ASME Section VIII Div 1 Vessel Inspection',
    description: 'Final Third Party inspection certification with Lloyd\'s Register surveyor.',
    status: 'In Review',
    priority: 'Urgent',
    assigneeIds: ['usr_2', 'usr_5'],
    reporterId: 'usr_1',
    startDate: '2026-07-25',
    dueDate: '2026-08-05',
    estimatedHours: 35,
    loggedHours: 34,
    tags: ['ASME', 'Audit', 'Certification'],
    createdAt: '2026-07-20T14:00:00Z',
    updatedAt: '2026-08-02T11:00:00Z'
  }
];

export const INITIAL_SUBTASKS: Subtask[] = [
  { id: 'sub_1', taskId: 'task_101', title: 'Upload inverse kinematics software patch v4.2', completed: true, assignedTo: 'usr_2' },
  { id: 'sub_2', taskId: 'task_101', title: 'Mount optical positioning laser sensors', completed: true, assignedTo: 'usr_5' },
  { id: 'sub_3', taskId: 'task_101', title: 'Run 100-cycle dry run without thermal load', completed: false, assignedTo: 'usr_2' },
  { id: 'sub_4', taskId: 'task_202', title: 'Deliver pre-fabricated piping flanges to Station 4', completed: true, assignedTo: 'usr_4' },
  { id: 'sub_5', taskId: 'task_202', title: 'TIG Weld joint couplings 1 to 24', completed: false, assignedTo: 'usr_3' }
];

export const INITIAL_DEPENDENCIES: TaskDependency[] = [
  { id: 'dep_1', taskId: 'task_102', dependsOnTaskId: 'task_101', type: 'finish_to_start' }
];

export const INITIAL_LOGS: ActivityLog[] = [
  {
    id: 'log_1',
    companyId: 'comp_2',
    projectId: 'proj_1',
    taskId: 'task_101',
    userId: 'usr_2',
    userName: 'Suhail Ahmed',
    userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150',
    action: 'updated status of task',
    target: 'Robotic Arm Calibrations & PLC Programming to In Progress',
    timestamp: '2026-08-02T14:30:00Z',
    type: 'task'
  },
  {
    id: 'log_2',
    companyId: 'comp_3',
    projectId: 'proj_2',
    taskId: 'task_201',
    userId: 'usr_3',
    userName: 'Fatima Zohra',
    userAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=150',
    action: 'marked task completed',
    target: 'Chiller Compressor R-1234yf Refrigerant Specs',
    timestamp: '2026-07-28T17:00:00Z',
    type: 'task'
  },
  {
    id: 'log_3',
    companyId: 'comp_1',
    userId: 'usr_1',
    userName: 'Tareq Al-Dolphin',
    userAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150',
    action: 'created new project',
    target: 'GCC Automotive Spare Parts ERP Migration',
    timestamp: '2026-07-29T10:00:00Z',
    type: 'project'
  }
];

export const INITIAL_NOTIFICATIONS: Notification[] = [
  {
    id: 'notif_1',
    userId: 'usr_1',
    title: 'Overdue Task Alert',
    message: 'Task "ASME Section VIII Div 1 Vessel Inspection" due date is approaching (Aug 05).',
    type: 'due_reminder',
    read: false,
    createdAt: '2026-08-02T11:00:00Z'
  },
  {
    id: 'notif_2',
    userId: 'usr_2',
    title: 'New Task Assignment',
    message: 'Tareq Al-Dolphin assigned you to "Robotic Arm Calibrations & PLC Programming".',
    type: 'assignment',
    read: true,
    createdAt: '2026-07-20T08:00:00Z'
  }
];

export const INITIAL_AUTOMATIONS: AutomationRule[] = [
  {
    id: 'auto_1',
    companyId: 'comp_2',
    name: 'Notify Manager on Task Completion',
    trigger: 'status_changed',
    condition: 'Status changes to Done',
    action: 'send_email',
    actionTarget: 'Project Manager',
    active: true,
    lastTriggered: '2026-07-28T17:00:00Z'
  },
  {
    id: 'auto_2',
    companyId: 'comp_1',
    name: 'Escalate Priority when Overdue',
    trigger: 'task_overdue',
    condition: 'Due date passed & status != Done',
    action: 'change_priority',
    actionTarget: 'Urgent',
    active: true,
    lastTriggered: '2026-08-01T00:00:00Z'
  }
];

export const INITIAL_FILES: ProjectFile[] = [
  {
    id: 'file_1',
    projectId: 'proj_1',
    name: 'Sharjah_Plant4_Robotics_Spec.pdf',
    size: '3.4 MB',
    mimeType: 'application/pdf',
    uploadedBy: 'usr_2',
    uploadedByName: 'Suhail Ahmed',
    uploadedAt: '2026-07-15T09:30:00Z',
    url: '#',
    extractedTasksCount: 4
  },
  {
    id: 'file_2',
    projectId: 'proj_2',
    name: 'Metro_Chiller_BoQ_Schedule.xlsx',
    size: '1.2 MB',
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    uploadedBy: 'usr_3',
    uploadedByName: 'Fatima Zohra',
    uploadedAt: '2026-07-12T14:15:00Z',
    url: '#',
    extractedTasksCount: 8
  }
];

export const INITIAL_TIME_ENTRIES: TimeEntry[] = [
  {
    id: 'time_1',
    taskId: 'task_101',
    projectId: 'proj_1',
    userId: 'usr_2',
    userName: 'Suhail Ahmed',
    hours: 4.5,
    date: '2026-08-02',
    description: 'Configured ABB robot tool center point and position safety limits',
    billable: true,
    createdAt: '2026-08-02T16:00:00Z'
  },
  {
    id: 'time_2',
    taskId: 'task_202',
    projectId: 'proj_2',
    userId: 'usr_3',
    userName: 'Fatima Zohra',
    hours: 6.0,
    date: '2026-08-01',
    description: 'On-site measurement and isometric drawing review at Station 4',
    billable: true,
    createdAt: '2026-08-01T17:30:00Z'
  }
];
