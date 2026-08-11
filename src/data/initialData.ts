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
  TimeEntry,
  CustomFieldDefinition
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
    isEmailVerified: true,
    lastActive: new Date(Date.now() - 3 * 60000).toISOString()
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
    isEmailVerified: true,
    lastActive: new Date(Date.now() - 14 * 60000).toISOString()
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
    isEmailVerified: true,
    lastActive: new Date(Date.now() - 42 * 60000).toISOString()
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
    isEmailVerified: true,
    lastActive: new Date(Date.now() - 110 * 60000).toISOString()
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
    isEmailVerified: true,
    lastActive: new Date(Date.now() - 195 * 60000).toISOString()
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
    isEmailVerified: true,
    lastActive: new Date(Date.now() - 340 * 60000).toISOString()
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
    isEmailVerified: true,
    lastActive: new Date(Date.now() - 1440 * 60000).toISOString()
  },
  {
    id: 'usr_sys_analyst',
    name: 'System Analyst',
    email: 'sys_analyst@dolrad.ae',
    role: 'Project Manager',
    companyId: 'comp_dml',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150',
    department: 'Systems & Analytics',
    hourlyRate: 125,
    maxWeeklyHours: 40,
    status: 'Active',
    isEmailVerified: true,
    lastActive: new Date().toISOString()
  }
];

export const INITIAL_PROJECTS: Project[] = [];

export const INITIAL_TASKS: Task[] = [];

export const INITIAL_SUBTASKS: Subtask[] = [];

export const INITIAL_DEPENDENCIES: TaskDependency[] = [];

export const INITIAL_LOGS: ActivityLog[] = [];

export const INITIAL_NOTIFICATIONS: Notification[] = [];

export const INITIAL_AUTOMATIONS: AutomationRule[] = [];

export const INITIAL_FILES: ProjectFile[] = [];

export const INITIAL_TIME_ENTRIES: TimeEntry[] = [];

export const INITIAL_CUSTOM_FIELDS: CustomFieldDefinition[] = [
  {
    id: 'cf_cost_center',
    name: 'Cost Center Code',
    type: 'text',
    description: 'ERP Cost Center for accounting audit',
    defaultValue: 'CC-9001',
    required: false
  },
  {
    id: 'cf_risk_rating',
    name: 'Risk Level',
    type: 'dropdown',
    options: ['Low', 'Medium', 'High', 'Critical'],
    description: 'Project risk matrix level',
    defaultValue: 'Low',
    required: true
  },
  {
    id: 'cf_audit_id',
    name: 'Audit Reference No',
    type: 'number',
    description: 'Numeric audit compliance registration ID',
    defaultValue: 1001,
    required: false
  }
];

