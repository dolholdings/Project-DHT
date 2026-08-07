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
    id: 'comp_corp',
    name: 'Corporate',
    code: 'CORP',
    domain: 'dolphingroup.ae',
    logo: '🏢',
    description: 'Corporate Governance & Group Operations Center',
    type: 'Internal Dolphin Entity',
    isExternal: false
  },
  {
    id: 'comp_drcs',
    name: 'DRCS SHJ',
    code: 'DRCS',
    domain: 'dolcool.ae',
    logo: '❄️',
    description: 'Dolphin Refrigeration & Cooling Systems - Sharjah',
    type: 'Internal Dolphin Entity',
    isExternal: false
  },
  {
    id: 'comp_dml',
    name: 'DML',
    code: 'DML',
    domain: 'dolrad.ae',
    logo: '⚡',
    description: 'Dolphin Manufacturing Limited - Radiator & Thermal Engineering',
    type: 'Internal Dolphin Entity',
    isExternal: false
  },
  {
    id: 'comp_dht',
    name: 'DHT-Ajman',
    code: 'DHT',
    domain: 'dolheat.ae',
    logo: '🔥',
    description: 'Dolphin Heat Transfer - Ajman Fabrication Plant',
    type: 'Internal Dolphin Entity',
    isExternal: false
  },
  {
    id: 'comp_dgha',
    name: 'DGH Analytics',
    code: 'DGHA',
    domain: 'p.dghanalytics.com',
    logo: '📊',
    description: 'DGH Analytics Portal & Enterprise Business Intelligence',
    type: 'Internal Dolphin Entity',
    isExternal: false
  }
];

export const INITIAL_USERS: User[] = [
  {
    id: 'usr_1',
    name: 'Tareq Al-Dolphin',
    email: 'tareq.aldolphin@dolphingroup.ae',
    role: 'Admin',
    companyId: 'comp_corp',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150',
    department: 'Executive Board',
    hourlyRate: 250,
    maxWeeklyHours: 40,
    status: 'Active',
    isEmailVerified: true
  },
  {
    id: 'usr_pk',
    name: 'Parvez Khan',
    email: 'parvez.khan@dolphingroup.ae',
    role: 'Team Member',
    companyId: 'comp_corp',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150',
    department: 'Digital Marketing',
    hourlyRate: 100,
    maxWeeklyHours: 40,
    status: 'Active',
    isEmailVerified: true
  },
  {
    id: 'usr_2',
    name: 'Suhail Ahmed',
    email: 'suhail.ahmed@dolrad.ae',
    role: 'Project Manager',
    companyId: 'comp_dml',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150',
    department: 'Engineering & Fabrication',
    hourlyRate: 120,
    maxWeeklyHours: 40,
    status: 'Active',
    isEmailVerified: true
  },
  {
    id: 'usr_3',
    name: 'Fatima Zohra',
    email: 'fatima.zohra@dolheat.ae',
    role: 'Project Manager',
    companyId: 'comp_dht',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=150',
    department: 'HVAC Solutions',
    hourlyRate: 110,
    maxWeeklyHours: 40,
    status: 'In Meeting',
    isEmailVerified: true
  },
  {
    id: 'usr_4',
    name: 'Rashed Al-Maktoum',
    email: 'rashed.m@dolcool.ae',
    role: 'Team Member',
    companyId: 'comp_drcs',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150',
    department: 'Supply Chain & Logistics',
    hourlyRate: 85,
    maxWeeklyHours: 40,
    status: 'Active',
    isEmailVerified: true
  },
  {
    id: 'usr_5',
    name: 'Elena Rostova',
    email: 'elena.rostova@dolheat.ae',
    role: 'Team Member',
    companyId: 'comp_dht',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=150',
    department: 'Quality Assurance & Thermal Testing',
    hourlyRate: 95,
    maxWeeklyHours: 40,
    status: 'Active',
    isEmailVerified: true
  },
  {
    id: 'usr_6',
    name: 'Omar Mansoor',
    email: 'omar.mansoor@dolphingroup.ae',
    role: 'Viewer',
    companyId: 'comp_corp',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=150',
    department: 'Financial Auditing',
    hourlyRate: 130,
    maxWeeklyHours: 35,
    status: 'Offline',
    isEmailVerified: true
  }
];

export const INITIAL_PROJECTS: Project[] = [
  {
    id: 'proj_1',
    title: 'Substation Cooling System Retrofit',
    code: 'DOL-SUB-01',
    companyId: 'comp_corp',
    description: 'Engineering, fabrication, and installation of high-capacity cooling radiators for power substation.',
    status: 'In Progress',
    progress: 45,
    managerId: 'usr_2',
    startDate: '2026-08-01',
    dueDate: '2026-09-30',
    budget: 450000,
    spentBudget: 180000,
    category: 'Industrial Manufacturing',
    members: ['usr_1', 'usr_2', 'usr_pk', 'usr_5']
  },
  {
    id: 'proj_2',
    title: 'Radiator Production Line Automation',
    code: 'DOL-RAD-02',
    companyId: 'comp_dml',
    description: 'Upgrading heat exchanger assembly line with robotic welding and automated leak testing.',
    status: 'In Progress',
    progress: 30,
    managerId: 'usr_2',
    startDate: '2026-08-05',
    dueDate: '2026-10-15',
    budget: 320000,
    spentBudget: 95000,
    category: 'Radiator Production',
    members: ['usr_2', 'usr_3', 'usr_4']
  },
  {
    id: 'proj_3',
    title: 'Heat Exchanger Thermal Calculations',
    code: 'DOL-HEX-03',
    companyId: 'comp_dht',
    description: 'Thermal modeling, CFD flow analysis, and prototype stress testing for oil & gas client.',
    status: 'Planning',
    progress: 15,
    managerId: 'usr_3',
    startDate: '2026-08-10',
    dueDate: '2026-11-01',
    budget: 210000,
    spentBudget: 35000,
    category: 'Heat Exchanger',
    members: ['usr_3', 'usr_5', 'usr_6']
  }
];

export const INITIAL_TASKS: Task[] = [
  {
    id: 'task_sub_1',
    projectId: 'proj_1',
    companyId: 'comp_corp',
    title: 'CAD Engineering & Structural Blueprints',
    description: 'Complete 3D CAD modeling and structural load calculations for substation cooling rack.',
    status: 'Done',
    priority: 'High',
    assigneeIds: ['usr_2'],
    reporterId: 'usr_1',
    startDate: '2026-08-01',
    dueDate: '2026-08-08',
    estimatedHours: 40,
    loggedHours: 42,
    tags: ['CAD', 'Engineering', 'Phase1'],
    successors: ['task_sub_2'],
    createdAt: '2026-08-01T08:00:00Z',
    updatedAt: '2026-08-08T17:00:00Z'
  },
  {
    id: 'task_sub_2',
    projectId: 'proj_1',
    companyId: 'comp_corp',
    title: 'Structural Steel Frame Fabrication',
    description: 'Precision cutting, welding, and anti-corrosion coating of support frame.',
    status: 'In Progress',
    priority: 'Urgent',
    assigneeIds: ['usr_pk', 'usr_5'],
    reporterId: 'usr_2',
    startDate: '2026-08-09',
    dueDate: '2026-08-18',
    estimatedHours: 60,
    loggedHours: 35,
    tags: ['Fabrication', 'Steel', 'Critical Path'],
    isCriticalPath: true,
    predecessors: ['task_sub_1'],
    dependencies: ['task_sub_1'],
    successors: ['task_sub_3'],
    createdAt: '2026-08-01T08:00:00Z',
    updatedAt: '2026-08-09T09:00:00Z'
  },
  {
    id: 'task_sub_3',
    projectId: 'proj_1',
    companyId: 'comp_corp',
    title: 'HVAC Piping & Hydrostatic Pressure Testing',
    description: 'Install coolant distribution manifolds and execute 1.5x working pressure hydrostatic test.',
    status: 'To Do',
    priority: 'High',
    assigneeIds: ['usr_5'],
    reporterId: 'usr_2',
    startDate: '2026-08-19',
    dueDate: '2026-08-27',
    estimatedHours: 45,
    loggedHours: 0,
    tags: ['Piping', 'Testing', 'QA'],
    predecessors: ['task_sub_2'],
    dependencies: ['task_sub_2'],
    successors: ['task_sub_4'],
    createdAt: '2026-08-01T08:00:00Z',
    updatedAt: '2026-08-01T08:00:00Z'
  },
  {
    id: 'task_sub_4',
    projectId: 'proj_1',
    companyId: 'comp_corp',
    title: 'Final Quality Sign-off & Client Commissioning',
    description: 'Joint site inspection with DEWA/ADDC inspectors and formal handover sign-off.',
    status: 'Backlog',
    priority: 'Medium',
    assigneeIds: ['usr_1', 'usr_2'],
    reporterId: 'usr_1',
    startDate: '2026-08-28',
    dueDate: '2026-09-05',
    estimatedHours: 25,
    loggedHours: 0,
    tags: ['Commissioning', 'Signoff', 'Milestone', 'Critical Path'],
    isMilestone: true,
    isCriticalPath: true,
    predecessors: ['task_sub_3'],
    dependencies: ['task_sub_3'],
    createdAt: '2026-08-01T08:00:00Z',
    updatedAt: '2026-08-01T08:00:00Z'
  },
  {
    id: 'task_rad_1',
    projectId: 'proj_2',
    companyId: 'comp_dml',
    title: 'Robotic Arm Rail Alignment & Electrical Feed',
    description: 'Mount linear guide rails and connect 480V 3-phase industrial power supply.',
    status: 'In Progress',
    priority: 'High',
    assigneeIds: ['usr_3'],
    reporterId: 'usr_2',
    startDate: '2026-08-05',
    dueDate: '2026-08-15',
    estimatedHours: 50,
    loggedHours: 20,
    tags: ['Automation', 'Robotics'],
    successors: ['task_rad_2'],
    createdAt: '2026-08-05T08:00:00Z',
    updatedAt: '2026-08-05T08:00:00Z'
  },
  {
    id: 'task_rad_2',
    projectId: 'proj_2',
    companyId: 'comp_dml',
    title: 'PLC Logic Programming & Sensor Calibration',
    description: 'Develop Siemens S7 PLC code for automated fin insertion and optical inspection.',
    status: 'To Do',
    priority: 'Urgent',
    assigneeIds: ['usr_4'],
    reporterId: 'usr_3',
    startDate: '2026-08-16',
    dueDate: '2026-08-28',
    estimatedHours: 70,
    loggedHours: 0,
    tags: ['PLC', 'Software', 'Critical Path'],
    isCriticalPath: true,
    isMilestone: true,
    predecessors: ['task_rad_1'],
    dependencies: ['task_rad_1'],
    createdAt: '2026-08-05T08:00:00Z',
    updatedAt: '2026-08-05T08:00:00Z'
  }
];

export const INITIAL_SUBTASKS: Subtask[] = [
  { id: 'sub_1', taskId: 'task_sub_1', title: 'Verify thermal dissipation parameters', completed: true },
  { id: 'sub_2', taskId: 'task_sub_1', title: 'Export STEP & DXF cutting files', completed: true },
  { id: 'sub_3', taskId: 'task_sub_2', title: 'Cut I-beams and gusset plates', completed: true },
  { id: 'sub_4', taskId: 'task_sub_2', title: 'MIG welding of outer frame', completed: false }
];

export const INITIAL_DEPENDENCIES: TaskDependency[] = [
  { id: 'dep_1', taskId: 'task_sub_2', dependsOnTaskId: 'task_sub_1', type: 'finish_to_start' },
  { id: 'dep_2', taskId: 'task_sub_3', dependsOnTaskId: 'task_sub_2', type: 'finish_to_start' },
  { id: 'dep_3', taskId: 'task_sub_4', dependsOnTaskId: 'task_sub_3', type: 'finish_to_start' },
  { id: 'dep_4', taskId: 'task_rad_2', dependsOnTaskId: 'task_rad_1', type: 'finish_to_start' }
];

export const INITIAL_LOGS: ActivityLog[] = [
  {
    id: 'log_audit_0a',
    companyId: 'comp_corp',
    projectId: 'proj_1',
    userId: 'usr_2',
    userName: 'Sarah Jenkins',
    userAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150',
    action: 'completed task',
    target: 'Substation Transformer Load Testing',
    timestamp: new Date(Date.now() - 5 * 60000).toISOString(),
    type: 'task',
    severity: 'info',
    ipAddress: '86.96.14.88 (Abu Dhabi, UAE)',
    details: 'Verified voltage balance across 3-phase grid. 100% compliance achieved.'
  },
  {
    id: 'log_audit_0b',
    companyId: 'comp_corp',
    projectId: 'proj_2',
    userId: 'usr_3',
    userName: 'Vikram Patel',
    userAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150',
    action: 'uploaded document',
    target: 'Solar_Inverter_Schematics_2026.pdf',
    timestamp: new Date(Date.now() - 12 * 60000).toISOString(),
    type: 'document',
    severity: 'info',
    ipAddress: '194.170.42.15 (Sharjah, UAE)',
    details: 'Size: 4.8 MB • Cloud OCR indexed 14 pages & extracted 4 action items'
  },
  {
    id: 'log_audit_0c',
    companyId: 'comp_corp',
    projectId: 'proj_1',
    userId: 'usr_1',
    userName: 'Tariq Al-Mansoori',
    userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150',
    action: 'changed task status',
    target: 'Moved "HVAC Chiller Piping Inspection" to In Review',
    timestamp: new Date(Date.now() - 22 * 60000).toISOString(),
    type: 'task',
    severity: 'info',
    ipAddress: '194.170.42.12 (Dubai, UAE)',
    details: 'Status transitioned from In Progress to In Review for final sign-off'
  },
  {
    id: 'log_audit_1',
    companyId: 'comp_corp',
    userId: 'usr_1',
    userName: 'Tariq Al-Mansoori',
    userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150',
    action: 'corporate SSO authentication succeeded',
    target: 'tariq.m@dolphingroup.ae',
    timestamp: new Date(Date.now() - 35 * 60000).toISOString(),
    type: 'auth',
    severity: 'info',
    ipAddress: '194.170.42.12 (Dubai, UAE)',
    details: 'Verified corporate domain @dolphingroup.ae via Google OAuth 2.0 SSL'
  },
  {
    id: 'log_audit_2',
    companyId: 'comp_corp',
    userId: 'usr_1',
    userName: 'Tariq Al-Mansoori',
    userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150',
    action: 'updated user permission level',
    target: 'Promoted Sarah Jenkins to Project Manager',
    timestamp: new Date(Date.now() - 45 * 60000).toISOString(),
    type: 'permission',
    severity: 'warning',
    ipAddress: '194.170.42.12 (Dubai, UAE)',
    details: 'Granted write and budget allocation privileges on comp_dht'
  },
  {
    id: 'log_audit_3',
    companyId: 'comp_corp',
    userId: 'usr_2',
    userName: 'Sarah Jenkins',
    userAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150',
    action: 'uploaded document',
    target: 'HVAC_Thermal_Spec_v3.pdf',
    timestamp: new Date(Date.now() - 120 * 60000).toISOString(),
    type: 'document',
    severity: 'info',
    ipAddress: '86.96.14.88 (Abu Dhabi, UAE)',
    details: 'Uploaded updated technical specification & revised engineering annex'
  },
  {
    id: 'log_audit_4',
    companyId: 'comp_corp',
    userId: 'usr_3',
    userName: 'Vikram Patel',
    userAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150',
    action: 'dispatched password reset email',
    target: 'vikram.p@drc.ae',
    timestamp: new Date(Date.now() - 240 * 60000).toISOString(),
    type: 'security',
    severity: 'warning',
    ipAddress: '194.170.42.15 (Sharjah, UAE)',
    details: 'Triggered Firebase Auth password reset flow via corporate portal'
  },
  {
    id: 'log_audit_5',
    companyId: 'comp_corp',
    userId: 'usr_1',
    userName: 'Tariq Al-Mansoori',
    userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150',
    action: 'completed task',
    target: 'Site Safety Environmental Impact Report',
    timestamp: new Date(Date.now() - 360 * 60000).toISOString(),
    type: 'task',
    severity: 'info',
    ipAddress: '194.170.42.12 (Dubai, UAE)',
    details: 'Approved by Dubai Municipality Inspector.'
  }
];

export const INITIAL_NOTIFICATIONS: Notification[] = [];

export const INITIAL_AUTOMATIONS: AutomationRule[] = [];

export const INITIAL_FILES: ProjectFile[] = [
  {
    id: 'file_sub_spec',
    projectId: 'proj_1',
    name: 'DOL-SUB-01_Cooling_System_Spec.pdf',
    size: '4.8 MB',
    mimeType: 'application/pdf',
    uploadedBy: 'usr_2',
    uploadedByName: 'Suhail Ahmed',
    uploadedAt: '2026-08-04T14:30:00Z',
    url: '#',
    extractedTasksCount: 4,
    currentVersion: 3,
    contentSnippet: 'Engineering specification for substation radiator cooling loops. Includes 480V electrical connections, pressure ratings up to 15 bar, and anti-corrosion coating guidelines.',
    versions: [
      {
        versionId: 'ver_sub_3',
        fileId: 'file_sub_spec',
        versionNumber: 3,
        name: 'DOL-SUB-01_Cooling_System_Spec.pdf',
        size: '4.8 MB',
        uploadedBy: 'usr_2',
        uploadedByName: 'Suhail Ahmed',
        uploadedAt: '2026-08-04T14:30:00Z',
        changesDescription: 'v3: Updated thermal dissipation thresholds and DEWA inspector compliance annex.',
        contentSnippet: 'Engineering specification for substation radiator cooling loops. Includes 480V electrical connections, pressure ratings up to 15 bar, and anti-corrosion coating guidelines.'
      },
      {
        versionId: 'ver_sub_2',
        fileId: 'file_sub_spec',
        versionNumber: 2,
        name: 'DOL-SUB-01_Cooling_System_Spec_v2.pdf',
        size: '4.2 MB',
        uploadedBy: 'usr_pk',
        uploadedByName: 'Parvez Khan',
        uploadedAt: '2026-08-02T11:15:00Z',
        changesDescription: 'v2: Added hydrostatic pressure test procedure and MIG weld joint standards.',
        contentSnippet: 'Engineering specification draft v2. Added 1.5x working pressure hydrostatic test guidelines and weld joint quality specs.'
      },
      {
        versionId: 'ver_sub_1',
        fileId: 'file_sub_spec',
        versionNumber: 1,
        name: 'DOL-SUB-01_Cooling_System_Spec_v1.pdf',
        size: '3.5 MB',
        uploadedBy: 'usr_1',
        uploadedByName: 'Tareq Al-Dolphin',
        uploadedAt: '2026-08-01T09:00:00Z',
        changesDescription: 'v1: Initial tender requirements and baseline technical drawings.',
        contentSnippet: 'Initial tender specification baseline requirements for Substation Cooling Retrofit.'
      }
    ]
  },
  {
    id: 'file_rad_cad',
    projectId: 'proj_2',
    name: 'Automated_Assembly_CAD_v2.dxf',
    size: '12.4 MB',
    mimeType: 'application/dxf',
    uploadedBy: 'usr_3',
    uploadedByName: 'Fatima Zohra',
    uploadedAt: '2026-08-03T16:45:00Z',
    url: '#',
    currentVersion: 2,
    contentSnippet: '3D CAD blueprint for Siemens robotic arm mounting rails and fin insertion assembly line.',
    versions: [
      {
        versionId: 'ver_rad_2',
        fileId: 'file_rad_cad',
        versionNumber: 2,
        name: 'Automated_Assembly_CAD_v2.dxf',
        size: '12.4 MB',
        uploadedBy: 'usr_3',
        uploadedByName: 'Fatima Zohra',
        uploadedAt: '2026-08-03T16:45:00Z',
        changesDescription: 'v2: Corrected linear rail mounting hole offsets to match 480V motor base.',
        contentSnippet: '3D CAD blueprint for Siemens robotic arm mounting rails and fin insertion assembly line.'
      },
      {
        versionId: 'ver_rad_1',
        fileId: 'file_rad_cad',
        versionNumber: 1,
        name: 'Automated_Assembly_CAD_v1.dxf',
        size: '11.8 MB',
        uploadedBy: 'usr_2',
        uploadedByName: 'Suhail Ahmed',
        uploadedAt: '2026-08-01T14:00:00Z',
        changesDescription: 'v1: Initial CAD geometry layout for automation cell.',
        contentSnippet: 'Initial 3D CAD draft geometry for assembly line automation.'
      }
    ]
  },
  {
    id: 'file_hex_calc',
    projectId: 'proj_3',
    name: 'Thermal_CFD_Flow_Calculation.xlsx',
    size: '2.1 MB',
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    uploadedBy: 'usr_3',
    uploadedByName: 'Fatima Zohra',
    uploadedAt: '2026-08-04T10:00:00Z',
    url: '#',
    currentVersion: 1,
    contentSnippet: 'CFD flow rate calculations, heat exchanger delta-T values, and oil & gas client thermal load matrix.',
    versions: [
      {
        versionId: 'ver_hex_1',
        fileId: 'file_hex_calc',
        versionNumber: 1,
        name: 'Thermal_CFD_Flow_Calculation.xlsx',
        size: '2.1 MB',
        uploadedBy: 'usr_3',
        uploadedByName: 'Fatima Zohra',
        uploadedAt: '2026-08-04T10:00:00Z',
        changesDescription: 'v1: Baseline thermal flow calculations and pressure drop simulations.',
        contentSnippet: 'CFD flow rate calculations, heat exchanger delta-T values, and oil & gas client thermal load matrix.'
      }
    ]
  }
];

export const INITIAL_TIME_ENTRIES: TimeEntry[] = [];

