export type CompanyDomain = string;

export const APPROVED_DOMAINS: string[] = [
  'dghanalytics.com',
  'dolrad.ae',
  'dolheat.ae',
  'dolphingroup.ae',
];

export type CompanyType =
  | 'Internal Dolphin Entity'
  | 'External Partner'
  | 'Client'
  | 'Subcontractor'
  | 'Vendor';

export interface Company {
  id: string;
  name: string;
  code: string;
  domain: string;
  logo: string;
  description: string;
  type?: CompanyType;
  isExternal?: boolean;
  contactEmail?: string;
}

export type Role = 'Admin' | 'Project Manager' | 'Team Member' | 'Viewer';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  companyId: string;
  avatar: string;
  department: string;
  hourlyRate: number;
  maxWeeklyHours: number;
  status: 'Active' | 'Offline' | 'In Meeting' | 'On Leave';
}

export type ProjectStatus = 'Planning' | 'In Progress' | 'On Hold' | 'In Review' | 'Completed';
export type Priority = 'Urgent' | 'High' | 'Medium' | 'Low';

export interface Project {
  id: string;
  title: string;
  code: string;
  companyId: string;
  description: string;
  status: ProjectStatus;
  progress: number;
  managerId: string;
  startDate: string;
  dueDate: string;
  budget: number;
  spentBudget: number;
  category: 'Industrial Manufacturing' | 'HVAC Engineering' | 'Radiator Production' | 'Heat Exchanger' | 'Group IT';
  members: string[]; // user ids
}

export type TaskStatus = 'Backlog' | 'To Do' | 'In Progress' | 'In Review' | 'Done';

export interface Subtask {
  id: string;
  taskId: string;
  title: string;
  completed: boolean;
  assignedTo?: string;
}

export interface TaskDependency {
  id: string;
  taskId: string; // The task that is dependent
  dependsOnTaskId: string; // The prerequisite task
  type: 'finish_to_start' | 'start_to_start';
}

export interface Task {
  id: string;
  projectId: string;
  companyId: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: Priority;
  assigneeIds: string[];
  reporterId: string;
  startDate: string;
  dueDate: string;
  estimatedHours: number;
  loggedHours: number;
  tags: string[];
  subtaskCount?: number;
  completedSubtasks?: number;
  attachmentsCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface TaskComment {
  id: string;
  taskId: string;
  userId: string;
  userName: string;
  userAvatar: string;
  content: string;
  createdAt: string;
}

export interface TimeEntry {
  id: string;
  taskId: string;
  projectId: string;
  userId: string;
  userName: string;
  hours: number;
  date: string;
  description: string;
  billable: boolean;
  createdAt: string;
}

export interface ProjectFile {
  id: string;
  projectId: string;
  name: string;
  size: string;
  mimeType: string;
  uploadedBy: string;
  uploadedByName: string;
  uploadedAt: string;
  url: string;
  extractedTasksCount?: number;
}

export interface ActivityLog {
  id: string;
  companyId: string;
  projectId?: string;
  taskId?: string;
  userId: string;
  userName: string;
  userAvatar: string;
  action: string;
  target: string;
  timestamp: string;
  type: 'task' | 'project' | 'user' | 'system' | 'automation' | 'ai';
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'assignment' | 'completion' | 'due_reminder' | 'overdue' | 'system';
  read: boolean;
  link?: string;
  createdAt: string;
}

export interface AutomationRule {
  id: string;
  companyId: string;
  name: string;
  trigger: 'status_changed' | 'task_overdue' | 'task_created' | 'high_priority_assigned';
  condition: string;
  action: 'send_email' | 'change_priority' | 'assign_user' | 'log_activity';
  actionTarget: string;
  active: boolean;
  lastTriggered?: string;
}

export interface SystemMetrics {
  totalProjects: number;
  activeTasks: number;
  completedTasks: number;
  overdueTasks: number;
  totalTeamMembers: number;
  loggedHoursThisWeek: number;
  onTrackPercentage: number;
}
