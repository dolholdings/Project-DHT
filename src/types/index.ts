import { COMPANY_DOMAIN_MAPPINGS } from '../config/auth';

export type CompanyDomain = string;

export const APPROVED_DOMAINS: string[] = Object.keys(COMPANY_DOMAIN_MAPPINGS);

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
  isEmailVerified?: boolean;
  password?: string;
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
  category: 'Industrial Manufacturing' | 'HVAC Engineering' | 'Radiator Production' | 'Heat Exchanger' | 'Group IT' | 'Digital Marketing';
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

export type RecurrenceType = 'none' | 'daily' | 'weekly' | 'monthly';

export interface RecurrenceConfig {
  type: RecurrenceType;
  interval?: number; // e.g. every 1, 2, or 3 days/weeks/months
  daysOfWeek?: string[]; // e.g., ['Mon', 'Wed', 'Fri']
  dayOfMonth?: number; // e.g., 15
  endDate?: string;
  autoRegenerateOnComplete?: boolean;
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
  dependencies?: string[]; // Array of prerequisite task IDs that this task depends on
  predecessors?: string[]; // Array of prerequisite task IDs that must be completed before this task
  successors?: string[];   // Array of task IDs that depend on this task
  isCriticalPath?: boolean; // Flagged as Critical Path
  isMilestone?: boolean;    // Flagged as Milestone
  recurrence?: RecurrenceConfig;
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

export interface FileVersion {
  versionId: string;
  fileId: string;
  versionNumber: number;
  name: string;
  size: string;
  uploadedBy: string;
  uploadedByName: string;
  uploadedAt: string;
  changesDescription?: string;
  url?: string;
  contentSnippet?: string;
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
  currentVersion?: number;
  versions?: FileVersion[];
  contentSnippet?: string;
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
  type: 'task' | 'project' | 'user' | 'system' | 'automation' | 'ai' | 'auth' | 'security' | 'permission' | 'document';
  ipAddress?: string;
  severity?: 'info' | 'warning' | 'critical';
  details?: string;
}

export interface SnoozeRecord {
  taskId: string;
  taskTitle?: string;
  snoozedAt: string;
  snoozedUntil: string;
  snoozeDurationLabel?: string;
}

export interface NotificationSettings {
  leadDays: number; // Notify X days before due date
  enableBrowserNotifs: boolean;
  defaultSnoozeMinutes: number; // Default 60 mins
  soundAlerts: boolean;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'assignment' | 'completion' | 'due_reminder' | 'overdue' | 'system';
  read: boolean;
  link?: string;
  taskId?: string;
  projectId?: string;
  snoozedUntil?: string;
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

export interface EmailAttachment {
  id: string;
  name: string;
  size: string;
  type: string;
  url?: string;
}

export interface EmailReply {
  id: string;
  senderName: string;
  senderEmail: string;
  body: string;
  timestamp: string;
  attachments?: EmailAttachment[];
}

export interface EmailThread {
  id: string;
  senderName: string;
  senderEmail: string;
  recipientEmail: string;
  subject: string;
  snippet: string;
  body: string;
  timestamp: string;
  isUnread: boolean;
  isStarred: boolean;
  folder: 'inbox' | 'sent' | 'archived' | 'trash';
  linkedTaskId?: string;
  linkedProjectId?: string;
  companyId?: string;
  tags?: string[];
  priority?: Priority;
  attachments?: EmailAttachment[];
  replies?: EmailReply[];
}

export interface EmailConfig {
  email: string;
  protocol: 'IMAP/SMTP' | 'Gmail Workspace API' | 'Outlook Graph API' | 'Exchange Server';
  incomingHost: string;
  incomingPort: number;
  outgoingHost: string;
  outgoingPort: number;
  useSSL: boolean;
  username: string;
  appToken?: string;
  isConnected: boolean;
  lastSyncedAt?: string;
}

export type DolphinTheme = 'ocean-deep' | 'abyssal' | 'midnight-teal' | 'light';

export interface TemplateTask {
  tempId: string;
  title: string;
  description: string;
  priority: Priority;
  estimatedHours: number;
  tags: string[];
  dayOffset: number;
  durationDays: number;
  subtasks?: string[];
}

export interface TemplateDependency {
  taskTempId: string;
  dependsOnTaskTempId: string;
  type: 'finish_to_start' | 'start_to_start';
}

export interface ProjectTemplate {
  id: string;
  name: string;
  description: string;
  category: Project['category'];
  estimatedBudget: number;
  estimatedDurationDays: number;
  tags: string[];
  createdBy: string;
  createdAt: string;
  sourceProjectId?: string;
  tasks: TemplateTask[];
  dependencies: TemplateDependency[];
}
