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
  lastActive?: string;
  theme?: DolphinTheme;
}

export type ProjectStatus = 'Planning' | 'In Progress' | 'On Hold' | 'In Review' | 'Completed';
export type Priority = 'Urgent' | 'High' | 'Medium' | 'Low';

export type SpaceRole = 'Admin' | 'Editor' | 'Viewer';

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
  category: 'Industrial Manufacturing' | 'HVAC Engineering' | 'Radiator Production' | 'Heat Exchanger' | 'Group IT' | 'Digital Marketing' | 'Commercial Refrigeration' | 'Corporate Strategy' | 'Analytics & BI';
  members: string[]; // user ids
  memberRoles?: Record<string, SpaceRole>; // map of userId -> SpaceRole
  lists?: string[]; // Array of list names under this Space/Project (e.g., 'Chairman', 'SEO & Google Ads', etc.)
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

export type CustomFieldType = 'text' | 'number' | 'dropdown' | 'checkbox' | 'date' | 'rating';

export interface CustomFieldDefinition {
  id: string;
  name: string;
  type: CustomFieldType;
  options?: string[]; // for dropdown
  required?: boolean;
  description?: string;
  defaultValue?: string | number | boolean;
}

export interface Sprint {
  id: string;
  projectId: string;
  name: string;
  goal?: string;
  status: 'active' | 'future' | 'completed';
  startDate: string;
  endDate: string;
  targetStoryPoints?: number;
  completedStoryPoints?: number;
  createdAt: string;
  updatedAt: string;
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
  sprintId?: string | null;  // Linked sprint ID (null or undefined for Backlog)
  storyPoints?: number;     // Agile story points estimate (1, 2, 3, 5, 8, 13)
  slackDays?: number;       // Calculated float/slack days from Critical Path Method
  earliestStart?: string;   // CPM computed Earliest Start date
  latestFinish?: string;    // CPM computed Latest Finish date
  recurrence?: RecurrenceConfig;
  listName?: string; // ClickUp list name within the space (e.g., 'Website Development', 'SEO & Google Ads')
  progress?: number; // Completion percentage (0 - 100)
  customFields?: Record<string, any>; // Mapping fieldId -> value
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  isDeleted?: boolean;
  deletedAt?: string;
  deletedBy?: string;
  deletedByName?: string;
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
  protocol: 'IMAP/SMTP' | 'Gmail Workspace API' | 'Outlook Graph API' | 'Exchange Server' | 'Microsoft Office 365 (IMAP/OAuth2)';
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

export type DolphinTheme = 'ocean-deep' | 'abyssal' | 'midnight-teal' | 'deep-sea' | 'light';

export interface TemplateCleanupRules {
  clearAssignments?: boolean;       // Clear assignees from tasks & subtasks
  resetTaskStatuses?: boolean;      // Reset all task statuses strictly to 'To Do' & reset logged hours
  resetSubtasksCompletion?: boolean;// Reset all subtask completed flags to false
  clearCustomTags?: boolean;        // Strip custom tags from tasks
  clearDependencies?: boolean;      // Remove task dependency linkages
  resetEstimatedHours?: boolean;    // Clear or reset estimated hours
  clearDescriptionNotes?: boolean;  // Clear detailed description strings
}

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
  customFields?: Record<string, any>;
  listName?: string;
}

export interface TemplateDependency {
  taskTempId: string;
  dependsOnTaskTempId: string;
  type: 'finish_to_start' | 'start_to_start';
}

export interface TemplateVersionRecord {
  id: string;
  version: string;
  name: string;
  description: string;
  changeSummary: string;
  createdAt: string;
  createdBy: string;
  tasksCount: number;
  dependenciesCount: number;
  estimatedBudget: number;
  estimatedDurationDays: number;
  tasks: TemplateTask[];
  dependencies: TemplateDependency[];
  customFields?: CustomFieldDefinition[];
  defaultCleanupRules?: TemplateCleanupRules;
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
  updatedAt?: string;
  sourceProjectId?: string;
  tasks: TemplateTask[];
  dependencies: TemplateDependency[];
  customFields?: CustomFieldDefinition[];
  lists?: string[];
  version?: string;
  versionHistory?: TemplateVersionRecord[];
  defaultCleanupRules?: TemplateCleanupRules;
  usageCount?: number;
  lastUsedAt?: string;
  avgTaskCompletionRate?: number;
  totalTasksSpawned?: number;
}

export interface AIDailyBrief {
  summary: string;
  urgentBlockers: string[];
  keyMilestones?: string[];
  keyProgress?: string[];
  upcomingDeadlines?: string[];
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  suggestedActions?: string[];
}
