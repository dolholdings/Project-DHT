import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut, User as FirebaseUser } from 'firebase/auth';
import { auth, googleProvider, testFirestoreConnection, handleFirestoreError, OperationType } from '../lib/firebase';
import firebaseConfig from '../../firebase-applet-config.json';
import {
  Company,
  User,
  Project,
  Task,
  Subtask,
  TaskComment,
  TaskDependency,
  ActivityLog,
  Notification,
  SnoozeRecord,
  NotificationSettings,
  AutomationRule,
  ProjectFile,
  TimeEntry,
  APPROVED_DOMAINS,
  CompanyDomain,
  TaskStatus,
  EmailThread,
  EmailConfig,
  Priority,
  DolphinTheme,
  ProjectTemplate,
  TemplateTask,
  TemplateDependency
} from '../types';

import { INITIAL_TEMPLATES } from '../data/initialTemplates';
import {
  INITIAL_COMPANIES,
  INITIAL_USERS,
  INITIAL_PROJECTS,
  INITIAL_TASKS,
  INITIAL_SUBTASKS,
  INITIAL_DEPENDENCIES,
  INITIAL_LOGS,
  INITIAL_NOTIFICATIONS,
  INITIAL_AUTOMATIONS,
  INITIAL_FILES,
  INITIAL_TIME_ENTRIES
} from '../data/initialData';
import { INITIAL_EMAIL_THREADS, INITIAL_EMAIL_CONFIG } from '../data/initialEmailData';
import {
  createProjectInFirestore,
  updateProjectInFirestore,
  deleteProjectFromFirestore,
  createTaskInFirestore,
  updateTaskInFirestore,
  deleteTaskFromFirestore,
  createFileInFirestore,
  updateFileInFirestore,
  deleteFileFromFirestore,
  subscribeToProjects,
  subscribeToTasks,
  subscribeToFiles,
  seedInitialFirestoreData,
  clearAllFirestoreData,
} from '../services/dataService';
import { sendTransactionalEmail } from '../services/emailNotificationService';

interface TimerState {
  active: boolean;
  taskId: string | null;
  taskTitle: string | null;
  seconds: number;
  startTime: number | null;
}

interface AppContextType {
  // Theme Management (Light & Dark mode variations)
  theme: 'dark' | 'light';
  setTheme: (theme: 'dark' | 'light') => void;
  toggleTheme: () => void;
  dolphinTheme: DolphinTheme;
  setDolphinTheme: (theme: DolphinTheme) => void;

  // Auth & Workspace
  currentUser: User;
  setCurrentUser: (user: User) => void;
  activeCompany: Company;
  setActiveCompany: (company: Company) => void;
  companies: Company[];
  addCompany: (company: Omit<Company, 'id'>) => Company;
  updateCompany: (id: string, updates: Partial<Company>) => void;
  deleteCompany: (id: string) => void;
  users: User[];
  updateUser: (userId: string, updates: Partial<User>) => void;
  deleteUser: (userId: string) => void;

  // Email Control & Domain Validation
  authorizedDomains: string[];
  addAuthorizedDomain: (domain: string) => void;
  removeAuthorizedDomain: (domain: string) => void;
  validateDomain: (email: string, targetCompanyId?: string) => { valid: boolean; error?: string; domain?: string; isDolphinDomain?: boolean; registeredCompany?: Company };
  inviteUser: (name: string, email: string, role: User['role'], department: string, companyId?: string, password?: string) => { success: boolean; error?: string; user?: User };
  dispatchEmailNotification: (params: {
    toEmail: string;
    toName?: string;
    subject: string;
    body: string;
    category: 'Invitation' | 'Task Assignment' | 'Task Completion' | 'System Activity' | 'Overdue Alert';
    relatedTaskId?: string;
    relatedProjectId?: string;
  }) => void;

  // Projects & Templates
  projects: Project[];
  addProject: (project: Omit<Project, 'id' | 'progress' | 'spentBudget'>) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  projectTemplates: ProjectTemplate[];
  saveProjectAsTemplate: (projectId: string, name: string, description?: string, category?: Project['category']) => ProjectTemplate;
  instantiateProjectFromTemplate: (templateId: string, params: { title: string; code: string; companyId: string; managerId: string; startDate: string; budget?: number; description?: string }) => Project;
  deleteProjectTemplate: (templateId: string) => void;
  
  // Tasks & Subtasks
  tasks: Task[];
  subtasks: Subtask[];
  taskComments: TaskComment[];
  dependencies: TaskDependency[];
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'loggedHours'>) => Task;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  addSubtask: (taskId: string, title: string, assignedTo?: string) => void;
  toggleSubtask: (subtaskId: string) => void;
  addTaskComment: (taskId: string, content: string) => void;
  addDependency: (taskId: string, dependsOnTaskId: string) => boolean;
  removeDependency: (depId: string) => void;
  recalculateProjectTimeline: (projectId?: string) => { adjustedCount: number; updatedTasks: Task[] };

  // Time Tracking
  timer: TimerState;
  startTimer: (taskId: string, taskTitle: string) => void;
  stopTimer: (description?: string) => void;
  logTimeManual: (taskId: string, hours: number, description: string, date?: string) => void;
  timeEntries: TimeEntry[];

  // Files & AI
  files: ProjectFile[];
  addFile: (file: Omit<ProjectFile, 'id' | 'uploadedAt'>) => void;
  uploadFileVersion: (fileId: string, versionData: { name?: string; size?: string; changesDescription?: string; contentSnippet?: string }) => void;
  revertFileVersion: (fileId: string, versionId: string) => void;
  deleteFile: (fileId: string) => void;
  importTasksFromAI: (extractedTasks: any[], projectId: string) => number;

  // Logs & Notifications & Rules
  activityLogs: ActivityLog[];
  logActivity: (action: string, target: string, type?: ActivityLog['type'], projectId?: string, taskId?: string) => void;
  notifications: Notification[];
  snoozedTasks: Record<string, SnoozeRecord>;
  notificationSettings: NotificationSettings;
  markNotificationRead: (id: string) => void;
  dismissNotification: (id: string) => void;
  clearAllNotifications: () => void;
  snoozeTaskNotification: (taskId: string, durationPresetOrMins: number | string, customIsoDate?: string, snoozeReason?: string) => void;
  unsnoozeTaskNotification: (taskId: string) => void;
  updateNotificationSettings: (updates: Partial<NotificationSettings>) => void;
  requestBrowserNotificationPermission: () => Promise<NotificationPermission | 'unsupported'>;
  triggerUpcomingDueCheck: () => void;
  automations: AutomationRule[];
  toggleAutomation: (id: string) => void;
  addAutomation: (rule: Omit<AutomationRule, 'id'>) => void;

  // Workspace Reset / Clear Sample Data
  clearAllData: () => void;

  // Email Inbox & Task Linking
  emailThreads: EmailThread[];
  emailConfig: EmailConfig;
  updateEmailConfig: (updates: Partial<EmailConfig>) => void;
  linkEmailToTask: (emailId: string, taskId: string, projectId?: string) => void;
  unlinkEmailFromTask: (emailId: string) => void;
  convertEmailToTask: (emailId: string, projectId: string, customTitle?: string, customPriority?: Priority) => Task;
  sendEmailReply: (emailId: string, replyBody: string) => void;
  composeNewEmail: (newEmail: Omit<EmailThread, 'id' | 'timestamp' | 'isUnread' | 'isStarred' | 'folder'>) => EmailThread;
  toggleStarEmail: (emailId: string) => void;
  toggleUnreadEmail: (emailId: string) => void;
  deleteEmailThread: (emailId: string) => void;

  // Active View State
  activeTab: string;
  setActiveTab: (tab: string) => void;
  selectedProjectId: string | null;
  setSelectedProjectId: (id: string | null) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;

  // Command Palette State
  isCommandPaletteOpen: boolean;
  setCommandPaletteOpen: (open: boolean) => void;
  toggleCommandPalette: () => void;

  // Firebase Backend Status & Auth
  firebaseConnected: boolean;
  firebaseProjectId: string;
  firebaseUser: FirebaseUser | null;
  signInWithGoogle: () => Promise<void>;
  signOutFirebase: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch (e) {
    return fallback;
  }
}

function saveToStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn(`Failed to save ${key} to localStorage`, e);
  }
}

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [dolphinTheme, setDolphinThemeState] = useState<DolphinTheme>(() => loadFromStorage<DolphinTheme>('dolphin_theme_mode', 'ocean-deep'));
  const [theme, setThemeState] = useState<'dark' | 'light'>(() => {
    const saved = loadFromStorage<DolphinTheme>('dolphin_theme_mode', 'ocean-deep');
    return saved === 'light' ? 'light' : 'dark';
  });
  const [authorizedDomains, setAuthorizedDomains] = useState<string[]>(() => loadFromStorage('pm_auth_domains', [...APPROVED_DOMAINS, 'gmail.com']));

  const setDolphinTheme = (newDolphinTheme: DolphinTheme) => {
    setDolphinThemeState(newDolphinTheme);
    localStorage.setItem('dolphin_theme_mode', JSON.stringify(newDolphinTheme));
    const isLight = newDolphinTheme === 'light';
    const baseTheme = isLight ? 'light' : 'dark';
    setThemeState(baseTheme);
    localStorage.setItem('pm_theme', JSON.stringify(baseTheme));
  };

  const setTheme = (newTheme: 'dark' | 'light') => {
    setThemeState(newTheme);
    localStorage.setItem('pm_theme', JSON.stringify(newTheme));
    if (newTheme === 'light') {
      setDolphinThemeState('light');
      localStorage.setItem('dolphin_theme_mode', JSON.stringify('light'));
    } else if (dolphinTheme === 'light') {
      setDolphinThemeState('ocean-deep');
      localStorage.setItem('dolphin_theme_mode', JSON.stringify('ocean-deep'));
    }
  };

  const toggleTheme = () => {
    const nextDolphin = dolphinTheme === 'light' ? 'ocean-deep' : 'light';
    setDolphinTheme(nextDolphin);
  };

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', dolphinTheme);
    if (dolphinTheme === 'light') {
      document.documentElement.classList.add('light-theme');
    } else {
      document.documentElement.classList.remove('light-theme');
    }
  }, [dolphinTheme]);

  const addAuthorizedDomain = (domain: string) => {
    const clean = domain.toLowerCase().trim().replace(/^@/, '');
    if (clean && !authorizedDomains.includes(clean)) {
      const updated = [...authorizedDomains, clean];
      setAuthorizedDomains(updated);
      localStorage.setItem('pm_auth_domains', JSON.stringify(updated));
    }
  };

  const removeAuthorizedDomain = (domain: string) => {
    const clean = domain.toLowerCase().trim().replace(/^@/, '');
    const updated = authorizedDomains.filter((d) => d !== clean);
    setAuthorizedDomains(updated);
    localStorage.setItem('pm_auth_domains', JSON.stringify(updated));
  };

  const [companies, setCompanies] = useState<Company[]>(() => {
    const stored = loadFromStorage('dolphin_companies', INITIAL_COMPANIES);
    const hasCorp = stored.some((c) => c.domain === 'dolphingroup.ae');
    const hasDrcs = stored.some((c) => c.domain === 'dolcool.ae');
    const hasDml = stored.some((c) => c.domain === 'dolrad.ae');
    const hasDht = stored.some((c) => c.domain === 'dolheat.ae');
    if (!hasCorp || !hasDrcs || !hasDml || !hasDht || stored.length > 4) {
      return INITIAL_COMPANIES;
    }
    return stored;
  });
  const [activeCompany, setActiveCompany] = useState<Company>(() => {
    const storedActive = loadFromStorage('dolphin_active_company', INITIAL_COMPANIES[0]);
    const match = INITIAL_COMPANIES.find((c) => c.id === storedActive.id || c.domain === storedActive.domain);
    return match || INITIAL_COMPANIES[0];
  });
  const [users, setUsers] = useState<User[]>(() => loadFromStorage('dolphin_users', INITIAL_USERS));
  const [currentUser, setCurrentUser] = useState<User>(() => loadFromStorage('dolphin_current_user', INITIAL_USERS[0]));

  const [projects, setProjects] = useState<Project[]>(() => loadFromStorage('dolphin_projects', INITIAL_PROJECTS));
  const [projectTemplates, setProjectTemplates] = useState<ProjectTemplate[]>(() => loadFromStorage('dolphin_project_templates', INITIAL_TEMPLATES));
  const [tasks, setTasks] = useState<Task[]>(() => loadFromStorage('dolphin_tasks', INITIAL_TASKS));
  const [subtasks, setSubtasks] = useState<Subtask[]>(() => loadFromStorage('dolphin_subtasks', INITIAL_SUBTASKS));
  const [taskComments, setTaskComments] = useState<TaskComment[]>(() => loadFromStorage('dolphin_task_comments', [
    {
      id: 'cmt_1',
      taskId: 'task_cm_1',
      userId: 'usr_pk',
      userName: 'Pawan Kumar',
      userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150',
      content: 'Uploaded the latest 4K video draft for review.',
      createdAt: '2026-08-03T10:15:00Z'
    }
  ]));
  const [dependencies, setDependencies] = useState<TaskDependency[]>(() => loadFromStorage('dolphin_dependencies', INITIAL_DEPENDENCIES));
  const [files, setFiles] = useState<ProjectFile[]>(() => loadFromStorage('dolphin_files', INITIAL_FILES));
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>(() => loadFromStorage('dolphin_time_entries', INITIAL_TIME_ENTRIES));
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>(() => loadFromStorage('dolphin_logs', INITIAL_LOGS));
  const [notifications, setNotifications] = useState<Notification[]>(() => loadFromStorage('dolphin_notifs', INITIAL_NOTIFICATIONS));
  const [snoozedTasks, setSnoozedTasks] = useState<Record<string, SnoozeRecord>>(() => loadFromStorage('dolphin_snoozed_notifs', {}));
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>(() =>
    loadFromStorage('dolphin_notif_settings', {
      leadDays: 3,
      enableBrowserNotifs: true,
      defaultSnoozeMinutes: 60,
      soundAlerts: true,
    })
  );
  const [automations, setAutomations] = useState<AutomationRule[]>(() => loadFromStorage('dolphin_automations', INITIAL_AUTOMATIONS));

  // Company Email Inbox & Integration State
  const [emailThreads, setEmailThreads] = useState<EmailThread[]>(() => loadFromStorage('dolphin_emails', INITIAL_EMAIL_THREADS));
  const [emailConfig, setEmailConfig] = useState<EmailConfig>(() => loadFromStorage('dolphin_email_config', INITIAL_EMAIL_CONFIG));

  // Firebase Auth & Firestore Connection State
  const [firebaseConnected, setFirebaseConnected] = useState<boolean>(true);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const firebaseProjectId = firebaseConfig.projectId;

  useEffect(() => {
    testFirestoreConnection();
    const unsubscribeAuth = onAuthStateChanged(auth, (u) => {
      setFirebaseUser(u);
    });

    // Seed initial data to Firestore if Firestore is empty
    seedInitialFirestoreData(INITIAL_PROJECTS, INITIAL_TASKS, INITIAL_FILES);

    // Subscribe to real-time Firestore updates for Projects
    const unsubscribeProjects = subscribeToProjects((remoteProjects) => {
      if (remoteProjects && remoteProjects.length > 0) {
        setProjects(remoteProjects);
      }
    });

    // Subscribe to real-time Firestore updates for Tasks
    const unsubscribeTasks = subscribeToTasks((remoteTasks) => {
      if (remoteTasks && remoteTasks.length > 0) {
        setTasks(remoteTasks);
      }
    });

    // Subscribe to real-time Firestore updates for Files
    const unsubscribeFiles = subscribeToFiles((remoteFiles) => {
      if (remoteFiles && remoteFiles.length > 0) {
        setFiles(remoteFiles);
      }
    });

    return () => {
      unsubscribeAuth();
      unsubscribeProjects();
      unsubscribeTasks();
      unsubscribeFiles();
    };
  }, []);

  const signInWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      console.error('Firebase Auth Error:', err);
    }
  };

  const signOutFirebase = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error('Firebase Signout Error:', err);
    }
  };

  // Auto-sync state to localStorage for 100% data preservation
  useEffect(() => {
    localStorage.setItem('dolphin_companies', JSON.stringify(companies));
  }, [companies]);

  // Auto-sync state to localStorage for 100% data preservation
  useEffect(() => {
    localStorage.setItem('dolphin_projects', JSON.stringify(projects));
  }, [projects]);

  useEffect(() => {
    localStorage.setItem('dolphin_project_templates', JSON.stringify(projectTemplates));
  }, [projectTemplates]);

  useEffect(() => {
    localStorage.setItem('dolphin_tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem('dolphin_subtasks', JSON.stringify(subtasks));
  }, [subtasks]);

  useEffect(() => {
    localStorage.setItem('dolphin_dependencies', JSON.stringify(dependencies));
  }, [dependencies]);

  useEffect(() => {
    localStorage.setItem('dolphin_files', JSON.stringify(files));
  }, [files]);

  useEffect(() => {
    localStorage.setItem('dolphin_time_entries', JSON.stringify(timeEntries));
  }, [timeEntries]);

  useEffect(() => {
    localStorage.setItem('dolphin_logs', JSON.stringify(activityLogs));
  }, [activityLogs]);

  useEffect(() => {
    localStorage.setItem('dolphin_users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem('dolphin_automations', JSON.stringify(automations));
  }, [automations]);

  useEffect(() => {
    localStorage.setItem('dolphin_emails', JSON.stringify(emailThreads));
  }, [emailThreads]);

  useEffect(() => {
    localStorage.setItem('dolphin_email_config', JSON.stringify(emailConfig));
  }, [emailConfig]);

  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isCommandPaletteOpen, setCommandPaletteOpen] = useState<boolean>(false);

  const toggleCommandPalette = () => setCommandPaletteOpen((prev) => !prev);

  // Global Ctrl+K / Cmd+K listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Live Stopwatch Timer
  const [timer, setTimer] = useState<TimerState>({
    active: false,
    taskId: null,
    taskTitle: null,
    seconds: 0,
    startTime: null,
  });

  useEffect(() => {
    let interval: any = null;
    if (timer.active) {
      interval = setInterval(() => {
        setTimer((prev) => ({ ...prev, seconds: prev.seconds + 1 }));
      }, 1000);
    } else if (!timer.active && interval) {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [timer.active]);

  // Add Company (Register External Partner / Client / Subcontractor or Entity)
  const addCompany = (newComp: Omit<Company, 'id'>) => {
    const created: Company = {
      ...newComp,
      id: `comp_${Date.now()}`
    };
    setCompanies((prev) => [...prev, created]);
    logActivity('registered company', `${created.name} (${created.domain})`, 'system');
    return created;
  };

  const updateCompany = (id: string, updates: Partial<Company>) => {
    setCompanies((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updates } : c))
    );
    if (activeCompany.id === id) {
      setActiveCompany((prev) => ({ ...prev, ...updates }));
    }
    logActivity('updated space config', updates.name || 'Space settings', 'system');
  };

  const deleteCompany = (id: string) => {
    if (companies.length <= 1) {
      alert('Cannot delete the last remaining Space/Workspace.');
      return;
    }
    const compToDelete = companies.find((c) => c.id === id);
    const remaining = companies.filter((c) => c.id !== id);
    setCompanies(remaining);
    setProjects((prev) => prev.filter((p) => p.companyId !== id));
    setTasks((prev) => prev.filter((t) => t.companyId !== id));

    if (activeCompany.id === id && remaining.length > 0) {
      setActiveCompany(remaining[0]);
      localStorage.setItem('dolphin_active_company', JSON.stringify(remaining[0]));
    }

    if (compToDelete) {
      logActivity('deleted space', compToDelete.name, 'system');
    }
  };

  // Domain & Email Validation helper (Project Management email address access control)
  const validateDomain = (email: string, targetCompanyId?: string) => {
    if (!email || !email.includes('@')) {
      return { valid: false, error: 'Please enter a valid email address.' };
    }
    const cleanEmail = email.toLowerCase().trim();
    const domain = cleanEmail.split('@')[1];
    
    // Check if domain is in authorized list or APPROVED_DOMAINS
    const isDomainAuthorized = authorizedDomains.includes(domain) || APPROVED_DOMAINS.includes(domain);

    // Check if user is registered in users list
    const registeredUser = users.find((u) => u.email.toLowerCase() === cleanEmail);

    // Find registered company by domain or target id
    const registeredCompany =
      companies.find((c) => c.domain.toLowerCase() === domain) ||
      (targetCompanyId ? companies.find((c) => c.id === targetCompanyId) : undefined);

    if (isDomainAuthorized || registeredUser || registeredCompany) {
      return { valid: true, domain, isDolphinDomain: isDomainAuthorized, registeredCompany };
    }

    return {
      valid: false,
      domain,
      isDolphinDomain: false,
      error: `Access Denied: Email domain '@${domain}' is not authorized in Project Management settings.`
    };
  };

  // Logging Activity
  const logActivity = useCallback((
    action: string,
    target: string,
    type: ActivityLog['type'] = 'task',
    projectId?: string,
    taskId?: string,
    details?: string,
    severity?: ActivityLog['severity'],
    ipAddress?: string
  ) => {
    const newLog: ActivityLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      companyId: activeCompany ? activeCompany.id : 'comp_corp',
      projectId,
      taskId,
      userId: currentUser ? currentUser.id : 'usr_1',
      userName: currentUser ? currentUser.name : 'System Auditor',
      userAvatar: currentUser ? currentUser.avatar : 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      action,
      target,
      type,
      timestamp: new Date().toISOString(),
      details,
      severity: severity || 'info',
      ipAddress: ipAddress || '10.240.0.18'
    };

    setActivityLogs((prev) => [newLog, ...prev]);
    saveToStorage('dolphin_logs', [newLog, ...activityLogs]);
  }, [activeCompany, currentUser, activityLogs]);

  // Automated Email Notification Dispatcher
  const dispatchEmailNotification = useCallback(({
    toEmail,
    toName,
    subject,
    body,
    category,
    relatedTaskId,
    relatedProjectId
  }: {
    toEmail: string;
    toName?: string;
    subject: string;
    body: string;
    category: 'Invitation' | 'Task Assignment' | 'Task Completion' | 'System Activity' | 'Overdue Alert';
    relatedTaskId?: string;
    relatedProjectId?: string;
  }) => {
    if (!toEmail) return;

    const emailId = `email_out_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
    const now = new Date().toISOString();

    const dispatchedEmail: EmailThread = {
      id: emailId,
      senderName: emailConfig.username || emailConfig.email || `${activeCompany?.name || 'Dolphin'} Dispatcher`,
      senderEmail: emailConfig.email || `notifications@${activeCompany?.domain || 'dolphingroup.ae'}`,
      recipientEmail: toEmail,
      subject: `[${category}] ${subject}`,
      snippet: body.slice(0, 100) + (body.length > 100 ? '...' : ''),
      body: `AUTOMATED EMAIL DISPATCH VIA SMTP (${emailConfig.outgoingHost || 'smtp.dolphingroup.ae'}:${emailConfig.outgoingPort || 465})

To: ${toName ? `${toName} <${toEmail}>` : toEmail}
Date: ${new Date().toLocaleString()}
Category: ${category}
Status: DISPATCHED / DELIVERED VIA SMTP

---

${body}

--
This notification was automatically generated & dispatched by ${activeCompany?.name || 'Dolphin'} Mail Server.`,
      timestamp: now,
      isUnread: false,
      isStarred: false,
      folder: 'sent',
      priority: category === 'Overdue Alert' ? 'Urgent' : 'High',
      tags: ['Automated-Dispatch', category, 'SMTP-Sent'],
      linkedTaskId: relatedTaskId,
      linkedProjectId: relatedProjectId,
      companyId: activeCompany?.id
    };

    // Trigger serverless backend transactional email service
    const mappedCategory = category === 'Task Assignment' ? 'task_assigned'
      : category === 'Task Completion' ? 'task_completed'
      : category === 'Invitation' ? 'user_invited'
      : category === 'Overdue Alert' ? 'task_updated'
      : 'activity_alert';

    const projForNotif = projects.find((p) => p.id === relatedProjectId);
    const taskForNotif = tasks.find((t) => t.id === relatedTaskId);

    sendTransactionalEmail({
      toEmail,
      toName,
      subject,
      category: mappedCategory,
      templateData: {
        taskTitle: taskForNotif?.title || subject,
        taskId: relatedTaskId,
        projectTitle: projForNotif?.title || activeCompany?.name || 'Dolphin Workspace',
        projectId: relatedProjectId,
        description: body,
        assignerName: currentUser?.name || 'Workspace Manager',
        dueDate: taskForNotif?.dueDate,
        priority: taskForNotif?.priority || 'Medium',
        status: taskForNotif?.status || 'Active',
      },
      smtpConfig: {
        host: emailConfig.outgoingHost,
        port: emailConfig.outgoingPort,
        user: emailConfig.username,
        pass: emailConfig.appToken,
        fromEmail: emailConfig.email,
        secure: emailConfig.useSSL
      }
    }).catch((err) => console.warn('Background email dispatch note:', err));

    setEmailThreads((prev) => [dispatchedEmail, ...prev]);
    logActivity(
      'dispatched automated email notification via SMTP',
      `Sent ${category} email to ${toEmail} ("${subject}")`,
      'system',
      relatedProjectId,
      relatedTaskId
    );

    // Create target user in-app notification if user registered
    const targetUser = users.find((u) => u.email.toLowerCase() === toEmail.toLowerCase());
    if (targetUser) {
      const notif: Notification = {
        id: `notif_email_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        userId: targetUser.id,
        title: `${category}: ${subject}`,
        message: body.slice(0, 140) + (body.length > 140 ? '...' : ''),
        type: category === 'Invitation' ? 'system' : category === 'Overdue Alert' ? 'overdue' : category === 'Task Completion' ? 'completion' : 'assignment',
        read: false,
        taskId: relatedTaskId,
        projectId: relatedProjectId,
        createdAt: now
      };
      setNotifications((prev) => [notif, ...prev]);
    }
  }, [activeCompany, emailConfig, users, logActivity]);

  // Invite User with Domain & Company Association
  const inviteUser = (name: string, email: string, role: User['role'], department: string, companyId?: string, password?: string) => {
    const targetComp = companyId ? companies.find((c) => c.id === companyId) : undefined;

    const val = validateDomain(email, companyId);
    if (!val.valid) {
      return { success: false, error: val.error };
    }

    const assignedPassword = password || 'Dolphin@123';

    const newUser: User = {
      id: `usr_${Date.now()}`,
      name,
      email,
      role,
      companyId: targetComp ? targetComp.id : (activeCompany ? activeCompany.id : 'comp_corp'),
      avatar: `https://images.unsplash.com/photo-${1500000000000 + Math.floor(Math.random() * 1000000)}?auto=format&fit=crop&q=80&w=150`,
      department: department || (targetComp?.isExternal ? 'External Collaborator' : 'Engineering'),
      hourlyRate: role === 'Admin' ? 200 : role === 'Project Manager' ? 120 : 90,
      maxWeeklyHours: 40,
      status: 'Active',
      password: assignedPassword
    };

    setUsers((prev) => [...prev, newUser]);
    logActivity('invited user', `${name} (${email}) to ${targetComp?.name || activeCompany?.name || 'Workspace'}`, 'user');
    
    // Trigger in-app notification
    const newNotif: Notification = {
      id: `notif_${Date.now()}`,
      userId: currentUser ? currentUser.id : newUser.id,
      title: 'User Created',
      message: `${name} (${email}) was created with access role ${role} for ${targetComp?.name || activeCompany?.name || 'Workspace'}.`,
      type: 'assignment',
      read: false,
      createdAt: new Date().toISOString()
    };
    setNotifications((prev) => [newNotif, ...prev]);

    // Dispatch real email notification to recipient email ID
    dispatchEmailNotification({
      toEmail: email,
      toName: name,
      subject: `Account Provisioned for ${targetComp?.name || activeCompany?.name || 'Workspace'}`,
      body: `Hello ${name},

Your user account has been created for the ${targetComp?.name || activeCompany?.name || 'Workspace'} workspace.

Workspace: ${targetComp?.name || activeCompany?.name || 'Workspace'} (@${targetComp?.domain || activeCompany?.domain || 'dolphingroup.ae'})
Assigned Access Role: ${role}
Department: ${department}
Email ID: ${email}
Assigned Password: ${assignedPassword}

Please log in to your Dolphin project management dashboard using your corporate email address (${email}) and assigned password to access your team projects and tasks.

Best regards,
${currentUser?.name || 'Workspace Administrator'}`,
      category: 'Invitation'
    });

    return { success: true, user: newUser };
  };

  const updateUser = (userId: string, updates: Partial<User>) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === userId) {
          const updated = { ...u, ...updates };
          if (currentUser && currentUser.id === userId) {
            setCurrentUser(updated);
          }
          return updated;
        }
        return u;
      })
    );
    const u = users.find((x) => x.id === userId);
    logActivity('updated user profile / role', u ? `${u.name} (${u.email})` : userId, 'permission', undefined, undefined, `Updated attributes: ${Object.keys(updates).join(', ')}`, 'warning');
  };

  const deleteUser = (userId: string) => {
    const u = users.find((x) => x.id === userId);
    setUsers((prev) => prev.filter((x) => x.id !== userId));
    if (u) {
      logActivity('deactivated tenant user', `${u.name} (${u.email})`, 'permission', undefined, undefined, 'User account removed from tenant directory', 'warning');
    }
  };

  // Projects
  const addProject = (projectData: Omit<Project, 'id' | 'progress' | 'spentBudget'>) => {
    const newProj: Project = {
      ...projectData,
      id: `proj_${Date.now()}`,
      progress: 0,
      spentBudget: 0
    };
    setProjects((prev) => [newProj, ...prev]);
    logActivity('created project', newProj.title, 'project', newProj.id);
    createProjectInFirestore(newProj);
  };

  const updateProject = (id: string, updates: Partial<Project>) => {
    setProjects((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updates } : p))
    );
    const p = projects.find((x) => x.id === id);
    if (p) {
      logActivity('updated project details for', p.title, 'project', id);
    }
    updateProjectInFirestore(id, updates);
  };

  const deleteProject = (id: string) => {
    const p = projects.find((x) => x.id === id);
    setProjects((prev) => prev.filter((x) => x.id !== id));
    if (p) {
      logActivity('deleted project', p.title, 'project', id);
    }
    deleteProjectFromFirestore(id);
  };

  // Project Templates
  const saveProjectAsTemplate = (
    projectId: string,
    name: string,
    description?: string,
    category?: Project['category']
  ): ProjectTemplate => {
    const proj = projects.find((p) => p.id === projectId);
    if (!proj) throw new Error('Project not found');

    const projTasks = tasks.filter((t) => t.projectId === projectId);
    const projTaskIds = new Set(projTasks.map((t) => t.id));
    const projStartDate = new Date(proj.startDate).getTime();

    const taskIdToTempId: Record<string, string> = {};
    const templateTasks: TemplateTask[] = projTasks.map((t, idx) => {
      const tempId = `tt_${idx + 1}`;
      taskIdToTempId[t.id] = tempId;

      const taskStart = new Date(t.startDate).getTime();
      const taskDue = new Date(t.dueDate).getTime();

      const dayOffset = Math.max(0, Math.round((taskStart - projStartDate) / (1000 * 60 * 60 * 24)));
      const durationDays = Math.max(1, Math.round((taskDue - taskStart) / (1000 * 60 * 60 * 24)));

      const taskSubs = subtasks.filter((s) => s.taskId === t.id).map((s) => s.title);

      return {
        tempId,
        title: t.title,
        description: t.description || '',
        priority: t.priority,
        estimatedHours: t.estimatedHours || 10,
        tags: t.tags || [],
        dayOffset: isNaN(dayOffset) ? 0 : dayOffset,
        durationDays: isNaN(durationDays) ? 5 : durationDays,
        subtasks: taskSubs
      };
    });

    const projDeps = dependencies.filter(
      (d) => projTaskIds.has(d.taskId) && projTaskIds.has(d.dependsOnTaskId)
    );

    const templateDeps: TemplateDependency[] = projDeps.map((d) => ({
      taskTempId: taskIdToTempId[d.taskId],
      dependsOnTaskTempId: taskIdToTempId[d.dependsOnTaskId],
      type: d.type || 'finish_to_start'
    }));

    const projDueDate = new Date(proj.dueDate).getTime();
    const durationMs = projDueDate - projStartDate;
    const estDurationDays = Math.max(1, Math.round(durationMs / (1000 * 60 * 60 * 24))) || 30;

    const newTemplate: ProjectTemplate = {
      id: `tpl_${Date.now()}`,
      name: name || `${proj.title} Template`,
      description: description || proj.description || `Template generated from ${proj.title}`,
      category: category || proj.category || 'Industrial Manufacturing',
      estimatedBudget: proj.budget || 100000,
      estimatedDurationDays: estDurationDays,
      tags: [proj.category, 'Custom Template'],
      createdBy: currentUser?.name || 'Workspace User',
      createdAt: new Date().toISOString(),
      sourceProjectId: projectId,
      tasks: templateTasks,
      dependencies: templateDeps
    };

    setProjectTemplates((prev) => [newTemplate, ...prev]);
    logActivity('saved project as template', newTemplate.name, 'project', proj.id);
    return newTemplate;
  };

  const instantiateProjectFromTemplate = (
    templateId: string,
    params: {
      title: string;
      code: string;
      companyId: string;
      managerId: string;
      startDate: string;
      budget?: number;
      description?: string;
    }
  ): Project => {
    const tpl = projectTemplates.find((t) => t.id === templateId);
    if (!tpl) throw new Error('Template not found');

    const projStartMs = new Date(params.startDate).getTime();
    const estDurationDays = tpl.estimatedDurationDays || 30;
    const projDueMs = projStartMs + estDurationDays * 24 * 60 * 60 * 1000;
    const projDueDateStr = new Date(projDueMs).toISOString().split('T')[0];

    const newProjId = `proj_${Date.now()}`;
    const newProject: Project = {
      id: newProjId,
      title: params.title,
      code: params.code.toUpperCase(),
      companyId: params.companyId,
      description: params.description || tpl.description,
      status: 'Planning',
      progress: 0,
      managerId: params.managerId,
      startDate: params.startDate,
      dueDate: projDueDateStr,
      budget: params.budget ?? tpl.estimatedBudget ?? 100000,
      spentBudget: 0,
      category: tpl.category,
      members: [params.managerId]
    };

    const tempIdToNewTaskId: Record<string, string> = {};
    const createdTasks: Task[] = [];
    const createdSubtasks: Subtask[] = [];

    tpl.tasks.forEach((tt, idx) => {
      const newTaskId = `task_${Date.now()}_${idx}_${Math.floor(Math.random() * 1000)}`;
      tempIdToNewTaskId[tt.tempId] = newTaskId;

      const tStartMs = projStartMs + (tt.dayOffset || 0) * 24 * 60 * 60 * 1000;
      const tDueMs = tStartMs + (tt.durationDays || 5) * 24 * 60 * 60 * 1000;

      const newTask: Task = {
        id: newTaskId,
        projectId: newProjId,
        companyId: params.companyId,
        title: tt.title,
        description: tt.description,
        status: 'To Do',
        priority: tt.priority || 'Medium',
        assigneeIds: [params.managerId],
        reporterId: currentUser.id,
        startDate: new Date(tStartMs).toISOString().split('T')[0],
        dueDate: new Date(tDueMs).toISOString().split('T')[0],
        estimatedHours: tt.estimatedHours || 10,
        loggedHours: 0,
        tags: tt.tags || [],
        subtaskCount: tt.subtasks?.length || 0,
        completedSubtasks: 0,
        dependencies: [],
        predecessors: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      createdTasks.push(newTask);

      if (tt.subtasks && tt.subtasks.length > 0) {
        tt.subtasks.forEach((stTitle, sIdx) => {
          createdSubtasks.push({
            id: `sub_${Date.now()}_${idx}_${sIdx}`,
            taskId: newTaskId,
            title: stTitle,
            completed: false,
            assignedTo: params.managerId
          });
        });
      }
    });

    const createdDependencies: TaskDependency[] = [];
    tpl.dependencies.forEach((td, dIdx) => {
      const depTaskId = tempIdToNewTaskId[td.taskTempId];
      const dependsOnTaskId = tempIdToNewTaskId[td.dependsOnTaskTempId];

      if (depTaskId && dependsOnTaskId) {
        createdDependencies.push({
          id: `dep_${Date.now()}_${dIdx}`,
          taskId: depTaskId,
          dependsOnTaskId: dependsOnTaskId,
          type: td.type || 'finish_to_start'
        });

        const taskObj = createdTasks.find((t) => t.id === depTaskId);
        if (taskObj) {
          taskObj.dependencies = Array.from(new Set([...(taskObj.dependencies || []), dependsOnTaskId]));
          taskObj.predecessors = Array.from(new Set([...(taskObj.predecessors || []), dependsOnTaskId]));
        }
      }
    });

    setProjects((prev) => [newProject, ...prev]);
    setTasks((prev) => [...createdTasks, ...prev]);
    if (createdSubtasks.length > 0) {
      setSubtasks((prev) => [...createdSubtasks, ...prev]);
    }
    if (createdDependencies.length > 0) {
      setDependencies((prev) => [...createdDependencies, ...prev]);
    }

    logActivity('instantiated project from template', `${newProject.title} (${tpl.name})`, 'project', newProject.id);
    createProjectInFirestore(newProject);

    return newProject;
  };

  const deleteProjectTemplate = (templateId: string) => {
    setProjectTemplates((prev) => prev.filter((t) => t.id !== templateId));
    logActivity('deleted project template', templateId, 'project');
  };

  // Tasks
  const addTask = (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'loggedHours'>) => {
    const newTask: Task = {
      ...taskData,
      id: `task_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      loggedHours: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setTasks((prev) => [newTask, ...prev]);
    logActivity('created task', newTask.title, 'task', newTask.projectId, newTask.id);

    // Dispatch Email Notification to Assignees
    if (newTask.assigneeIds && newTask.assigneeIds.length > 0) {
      const proj = projects.find((p) => p.id === newTask.projectId);
      newTask.assigneeIds.forEach((assigneeId) => {
        const targetUser = users.find((u) => u.id === assigneeId);
        if (targetUser) {
          dispatchEmailNotification({
            toEmail: targetUser.email,
            toName: targetUser.name,
            subject: `New Task Assigned: "${newTask.title}"`,
            body: `Hello ${targetUser.name},

You have been assigned to a new task in project "${proj?.title || 'Workspace'}".

Task Title: ${newTask.title}
Priority: ${newTask.priority}
Start Date: ${newTask.startDate || 'Immediate'}
Due Date: ${newTask.dueDate || 'N/A'}

Description:
${newTask.description || 'No detailed description provided.'}

Log in to your workspace dashboard to view full details and track progress.`,
            category: 'Task Assignment',
            relatedTaskId: newTask.id,
            relatedProjectId: newTask.projectId
          });
        }
      });
    }

    // Check Automation Rules
    automations.forEach((rule) => {
      if (rule.active && rule.trigger === 'task_created') {
        logActivity('triggered automation', `"${rule.name}" on task "${newTask.title}"`, 'automation');
      }
    });

    createTaskInFirestore(newTask);
    return newTask;
  };

  const calculateNextRecurrenceDate = (baseDateStr?: string, type?: string, interval: number = 1): string => {
    const base = baseDateStr ? new Date(baseDateStr) : new Date();
    const date = isNaN(base.getTime()) ? new Date() : base;
    if (type === 'daily') {
      date.setDate(date.getDate() + interval);
    } else if (type === 'weekly') {
      date.setDate(date.getDate() + (interval * 7));
    } else if (type === 'monthly') {
      date.setMonth(date.getMonth() + interval);
    }
    return date.toISOString().split('T')[0];
  };

  const updateTask = (id: string, updates: Partial<Task>) => {
    let regeneratedTaskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'loggedHours'> | null = null;
    const oldTask = tasks.find((t) => t.id === id);

    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          const updated = { ...t, ...updates, updatedAt: new Date().toISOString() };
          if (updates.status && updates.status !== t.status) {
            logActivity(`changed status of task "${t.title}" to`, updates.status, 'task', t.projectId, t.id);

            // Trigger Email Notification if marked Done
            if (updates.status === 'Done') {
              const proj = projects.find((p) => p.id === t.projectId);
              const manager = users.find((u) => u.id === proj?.managerId) || currentUser;
              const assigneeEmails = (t.assigneeIds || []).map((aid) => users.find((u) => u.id === aid)?.email).filter(Boolean) as string[];
              const recipientEmails = Array.from(new Set([manager.email, ...assigneeEmails]));

              recipientEmails.forEach((targetEmail) => {
                const targetUser = users.find((u) => u.email === targetEmail);
                dispatchEmailNotification({
                  toEmail: targetEmail,
                  toName: targetUser?.name,
                  subject: `Task Completed: "${t.title}"`,
                  body: `Hello ${targetUser?.name || 'Team Member'},

Task "${t.title}" has been completed and marked as Done!

Project: ${proj?.title || 'Workspace'}
Completed By: ${currentUser?.name || 'Team Member'}
Date Completed: ${new Date().toLocaleDateString()}

Dependencies and project progress meters have been updated.`,
                  category: 'Task Completion',
                  relatedTaskId: t.id,
                  relatedProjectId: t.projectId
                });
              });
            }

            // Check automation triggers
            automations.forEach((rule) => {
              if (rule.active && rule.trigger === 'status_changed') {
                logActivity('triggered automation', `Rule "${rule.name}" triggered by status change to ${updates.status}`, 'automation');
              }
            });

            // Handle recurring task auto-regeneration when completed
            if (
              updates.status === 'Done' &&
              t.recurrence &&
              t.recurrence.type !== 'none' &&
              t.recurrence.autoRegenerateOnComplete !== false
            ) {
              const interval = t.recurrence.interval || 1;
              const nextDueDate = calculateNextRecurrenceDate(t.dueDate, t.recurrence.type, interval);
              const nextStartDate = calculateNextRecurrenceDate(t.startDate, t.recurrence.type, interval);

              if (!t.recurrence.endDate || nextDueDate <= t.recurrence.endDate) {
                regeneratedTaskData = {
                  projectId: t.projectId,
                  companyId: t.companyId,
                  title: t.title,
                  description: t.description,
                  status: 'To Do',
                  priority: t.priority,
                  assigneeIds: t.assigneeIds,
                  reporterId: t.reporterId,
                  startDate: nextStartDate,
                  dueDate: nextDueDate,
                  estimatedHours: t.estimatedHours,
                  tags: Array.from(new Set([...(t.tags || []), 'Recurring'])),
                  recurrence: t.recurrence
                };
              }
            }
          }

          // Check for newly assigned users
          if (updates.assigneeIds && oldTask) {
            const oldAssignees = new Set(oldTask.assigneeIds || []);
            const newlyAdded = updates.assigneeIds.filter((aid) => !oldAssignees.has(aid));
            if (newlyAdded.length > 0) {
              const proj = projects.find((p) => p.id === t.projectId);
              newlyAdded.forEach((aid) => {
                const targetUser = users.find((u) => u.id === aid);
                if (targetUser) {
                  dispatchEmailNotification({
                    toEmail: targetUser.email,
                    toName: targetUser.name,
                    subject: `Task Assigned: "${t.title}"`,
                    body: `Hello ${targetUser.name},

You have been assigned to task "${t.title}" in project "${proj?.title || 'Workspace'}".

Priority: ${t.priority}
Due Date: ${t.dueDate || 'N/A'}

Log into your Dolphin workspace dashboard to review the task.`,
                    category: 'Task Assignment',
                    relatedTaskId: t.id,
                    relatedProjectId: t.projectId
                  });
                }
              });
            }
          }

          return updated;
        }
        return t;
      })
    );
    updateTaskInFirestore(id, updates);

    if (regeneratedTaskData) {
      const taskToCreate = regeneratedTaskData;
      setTimeout(() => {
        addTask(taskToCreate);
        logActivity(
          'automatically regenerated task on schedule',
          `Created next recurring instance for "${taskToCreate.title}" (Due: ${taskToCreate.dueDate})`,
          'automation',
          taskToCreate.projectId
        );
      }, 50);
    }
  };

  const deleteTask = (id: string) => {
    const t = tasks.find((x) => x.id === id);
    setTasks((prev) => prev.filter((x) => x.id !== id));
    setSubtasks((prev) => prev.filter((s) => s.taskId !== id));
    setDependencies((prev) => prev.filter((d) => d.taskId !== id && d.dependsOnTaskId !== id));
    if (t) {
      logActivity('deleted task', t.title, 'task', t.projectId);
    }
    deleteTaskFromFirestore(id);
  };

  // Subtasks
  const addSubtask = (taskId: string, title: string, assignedTo?: string) => {
    const newSub: Subtask = {
      id: `sub_${Date.now()}`,
      taskId,
      title,
      completed: false,
      assignedTo,
    };
    setSubtasks((prev) => [...prev, newSub]);
  };

  const toggleSubtask = (subtaskId: string) => {
    setSubtasks((prev) =>
      prev.map((s) => (s.id === subtaskId ? { ...s, completed: !s.completed } : s))
    );
  };

  // Dependencies & Predecessors / Successors
  const addDependency = (taskId: string, dependsOnTaskId: string) => {
    if (taskId === dependsOnTaskId) return false;
    // Check circular dependency
    const isCircular = dependencies.some(
      (d) => d.taskId === dependsOnTaskId && d.dependsOnTaskId === taskId
    );
    if (isCircular) return false;

    // Check if link already exists
    const exists = dependencies.some(
      (d) => d.taskId === taskId && d.dependsOnTaskId === dependsOnTaskId
    );
    if (exists) return true;

    const newDep: TaskDependency = {
      id: `dep_${Date.now()}`,
      taskId,
      dependsOnTaskId,
      type: 'finish_to_start',
    };
    setDependencies((prev) => [...prev, newDep]);

    // Update task object fields for predecessors and successors
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          const preds = Array.from(new Set([...(t.predecessors || []), dependsOnTaskId]));
          const deps = Array.from(new Set([...(t.dependencies || []), dependsOnTaskId]));
          return { ...t, predecessors: preds, dependencies: deps, updatedAt: new Date().toISOString() };
        }
        if (t.id === dependsOnTaskId) {
          const succs = Array.from(new Set([...(t.successors || []), taskId]));
          return { ...t, successors: succs, updatedAt: new Date().toISOString() };
        }
        return t;
      })
    );

    logActivity('added dependency link between tasks', `${taskId} -> ${dependsOnTaskId}`, 'task');
    return true;
  };

  const removeDependency = (depId: string) => {
    const dep = dependencies.find((d) => d.id === depId);
    setDependencies((prev) => prev.filter((d) => d.id !== depId));

    if (dep) {
      const { taskId, dependsOnTaskId } = dep;
      setTasks((prev) =>
        prev.map((t) => {
          if (t.id === taskId) {
            const preds = (t.predecessors || []).filter((id) => id !== dependsOnTaskId);
            const deps = (t.dependencies || []).filter((id) => id !== dependsOnTaskId);
            return { ...t, predecessors: preds, dependencies: deps, updatedAt: new Date().toISOString() };
          }
          if (t.id === dependsOnTaskId) {
            const succs = (t.successors || []).filter((id) => id !== taskId);
            return { ...t, successors: succs, updatedAt: new Date().toISOString() };
          }
          return t;
        })
      );
    }
  };

  // Finish-to-Start Project Timeline Recalculation Engine
  const recalculateProjectTimeline = (targetProjectId?: string): { adjustedCount: number; updatedTasks: Task[] } => {
    let currentTasks = [...tasks];
    let adjustedCount = 0;
    let hasChanges = true;
    let iteration = 0;
    const maxIterations = 20;

    const addDaysHelper = (dateStr: string, days: number): string => {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      d.setDate(d.getDate() + days);
      return d.toISOString().split('T')[0];
    };

    while (hasChanges && iteration < maxIterations) {
      hasChanges = false;
      iteration++;

      const taskMap = new Map<string, Task>(currentTasks.map((t) => [t.id, t]));

      currentTasks = currentTasks.map((task) => {
        if (targetProjectId && task.projectId !== targetProjectId) return task;

        const directPreds = task.predecessors || [];
        const depPreds = dependencies.filter((d) => d.taskId === task.id).map((d) => d.dependsOnTaskId);
        const allPredIds = Array.from(new Set([...directPreds, ...depPreds]));

        if (allPredIds.length === 0) return task;

        let latestPredDueDate: string | null = null;
        for (const predId of allPredIds) {
          const predTask = taskMap.get(predId);
          if (predTask && predTask.dueDate) {
            if (!latestPredDueDate || new Date(predTask.dueDate).getTime() > new Date(latestPredDueDate).getTime()) {
              latestPredDueDate = predTask.dueDate;
            }
          }
        }

        if (!latestPredDueDate) return task;

        // Finish-to-Start constraint: Task starts the day after predecessor finishes
        const earliestAllowedStartDate = addDaysHelper(latestPredDueDate, 1);

        if (new Date(task.startDate).getTime() < new Date(earliestAllowedStartDate).getTime()) {
          const currentStart = new Date(task.startDate).getTime();
          const currentDue = new Date(task.dueDate).getTime();
          const durationDays = Math.max(1, Math.round((currentDue - currentStart) / (1000 * 3600 * 24)));

          const newStartDate = earliestAllowedStartDate;
          const newDueDate = addDaysHelper(newStartDate, durationDays);

          hasChanges = true;
          adjustedCount++;

          const updatedTask = {
            ...task,
            startDate: newStartDate,
            dueDate: newDueDate,
            updatedAt: new Date().toISOString()
          };
          updateTaskInFirestore(updatedTask.id, { startDate: newStartDate, dueDate: newDueDate });
          return updatedTask;
        }

        return task;
      });
    }

    if (adjustedCount > 0) {
      setTasks(currentTasks);
      logActivity(
        'recalculated project timeline (Finish-to-Start)',
        `Auto-adjusted ${adjustedCount} task schedules based on Finish-to-Start dependencies`,
        'task',
        targetProjectId
      );
    }

    return { adjustedCount, updatedTasks: currentTasks };
  };

  // Timer & Time tracking
  const startTimer = (taskId: string, taskTitle: string) => {
    setTimer({
      active: true,
      taskId,
      taskTitle,
      seconds: 0,
      startTime: Date.now(),
    });
    logActivity('started stopwatch timer for task', taskTitle, 'task', undefined, taskId);
  };

  const stopTimer = (description: string = 'Work completed') => {
    if (!timer.active || !timer.taskId) return;
    const hours = Math.round((timer.seconds / 3600) * 100) / 100 || 0.1;
    const task = tasks.find((t) => t.id === timer.taskId);

    if (task) {
      const newEntry: TimeEntry = {
        id: `time_${Date.now()}`,
        taskId: task.id,
        projectId: task.projectId,
        userId: currentUser.id,
        userName: currentUser.name,
        hours,
        date: new Date().toISOString().split('T')[0],
        description,
        billable: true,
        createdAt: new Date().toISOString(),
      };

      setTimeEntries((prev) => [newEntry, ...prev]);
      updateTask(task.id, { loggedHours: (task.loggedHours || 0) + hours });
      logActivity('logged time', `${hours} hrs on "${task.title}"`, 'task', task.projectId, task.id);
    }

    setTimer({
      active: false,
      taskId: null,
      taskTitle: null,
      seconds: 0,
      startTime: null,
    });
  };

  const logTimeManual = (taskId: string, hours: number, description: string, date?: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    const newEntry: TimeEntry = {
      id: `time_${Date.now()}`,
      taskId,
      projectId: task.projectId,
      userId: currentUser.id,
      userName: currentUser.name,
      hours,
      date: date || new Date().toISOString().split('T')[0],
      description,
      billable: true,
      createdAt: new Date().toISOString(),
    };

    setTimeEntries((prev) => [newEntry, ...prev]);
    updateTask(taskId, { loggedHours: (task.loggedHours || 0) + hours });
    logActivity('logged manual time', `${hours} hrs on "${task.title}"`, 'task', task.projectId, taskId);
  };

  // Files & Version History
  const addFile = (fileData: Omit<ProjectFile, 'id' | 'uploadedAt'>) => {
    const fileId = `file_${Date.now()}`;
    const nowIso = new Date().toISOString();
    const initialVersion = {
      versionId: `ver_${Date.now()}_1`,
      fileId,
      versionNumber: 1,
      name: fileData.name,
      size: fileData.size || '1.0 MB',
      uploadedBy: fileData.uploadedBy || currentUser.id,
      uploadedByName: fileData.uploadedByName || currentUser.name,
      uploadedAt: nowIso,
      changesDescription: 'v1: Initial document upload',
      url: fileData.url || '#',
      contentSnippet: fileData.contentSnippet || `Initial version of ${fileData.name}`,
    };

    const newFile: ProjectFile = {
      ...fileData,
      id: fileId,
      uploadedAt: nowIso,
      currentVersion: 1,
      versions: [initialVersion],
      contentSnippet: fileData.contentSnippet || initialVersion.contentSnippet,
    };

    setFiles((prev) => [newFile, ...prev]);
    createFileInFirestore(newFile);
    logActivity('uploaded document', newFile.name, 'document', newFile.projectId);
  };

  const uploadFileVersion = (
    fileId: string,
    versionData: { name?: string; size?: string; changesDescription?: string; contentSnippet?: string }
  ) => {
    const file = files.find((f) => f.id === fileId);
    if (!file) return;

    const currentVerNumber = file.currentVersion || file.versions?.length || 1;
    const nextVersionNumber = currentVerNumber + 1;
    const nowIso = new Date().toISOString();

    const newVersion = {
      versionId: `ver_${Date.now()}_${nextVersionNumber}`,
      fileId,
      versionNumber: nextVersionNumber,
      name: versionData.name || file.name,
      size: versionData.size || file.size,
      uploadedBy: currentUser.id,
      uploadedByName: currentUser.name,
      uploadedAt: nowIso,
      changesDescription: versionData.changesDescription || `v${nextVersionNumber}: Revised document version uploaded.`,
      url: file.url || '#',
      contentSnippet: versionData.contentSnippet || file.contentSnippet,
    };

    const updatedVersions = [newVersion, ...(file.versions || [])];
    const updatedFile: ProjectFile = {
      ...file,
      name: newVersion.name,
      size: newVersion.size,
      uploadedBy: currentUser.id,
      uploadedByName: currentUser.name,
      uploadedAt: nowIso,
      currentVersion: nextVersionNumber,
      contentSnippet: newVersion.contentSnippet,
      versions: updatedVersions,
    };

    setFiles((prev) => prev.map((f) => (f.id === fileId ? updatedFile : f)));
    updateFileInFirestore(fileId, updatedFile);
    logActivity(
      'uploaded new document version',
      `Uploaded v${nextVersionNumber} for "${updatedFile.name}"`,
      'document',
      file.projectId
    );
  };

  const revertFileVersion = (fileId: string, versionId: string) => {
    const file = files.find((f) => f.id === fileId);
    if (!file || !file.versions) return;

    const targetVer = file.versions.find((v) => v.versionId === versionId);
    if (!targetVer) return;

    const currentVerNumber = file.currentVersion || file.versions.length;
    const nextVersionNumber = currentVerNumber + 1;
    const nowIso = new Date().toISOString();

    const revertRecord = {
      versionId: `ver_${Date.now()}_revert_${nextVersionNumber}`,
      fileId,
      versionNumber: nextVersionNumber,
      name: targetVer.name,
      size: targetVer.size,
      uploadedBy: currentUser.id,
      uploadedByName: currentUser.name,
      uploadedAt: nowIso,
      changesDescription: `Reverted to v${targetVer.versionNumber} (${targetVer.uploadedAt.split('T')[0]}) by ${currentUser.name}`,
      url: targetVer.url || file.url,
      contentSnippet: targetVer.contentSnippet || file.contentSnippet,
    };

    const updatedVersions = [revertRecord, ...file.versions];
    const updatedFile: ProjectFile = {
      ...file,
      name: targetVer.name,
      size: targetVer.size,
      uploadedBy: currentUser.id,
      uploadedByName: currentUser.name,
      uploadedAt: nowIso,
      currentVersion: nextVersionNumber,
      contentSnippet: targetVer.contentSnippet,
      versions: updatedVersions,
    };

    setFiles((prev) => prev.map((f) => (f.id === fileId ? updatedFile : f)));
    updateFileInFirestore(fileId, updatedFile);
    logActivity(
      'reverted document version',
      `Restored "${file.name}" back to v${targetVer.versionNumber} parameters (New release: v${nextVersionNumber})`,
      'document',
      file.projectId
    );
  };

  const deleteFile = (fileId: string) => {
    const f = files.find((x) => x.id === fileId);
    setFiles((prev) => prev.filter((x) => x.id !== fileId));
    if (f) {
      logActivity('deleted document', f.name, 'document', f.projectId);
    }
    deleteFileFromFirestore(fileId);
  };

  // AI Task Import from Gemini PDF/Document Extraction
  const importTasksFromAI = (extractedTasks: any[], projectId: string) => {
    let count = 0;
    const project = projects.find((p) => p.id === projectId);
    if (!project) return 0;

    const todayStr = new Date().toISOString().split('T')[0];

    extractedTasks.forEach((et, idx) => {
      // Find matching user from workspace users if suggestedAssignee is present
      let assignedUserIds: string[] = [currentUser.id];
      if (et.suggestedAssignee) {
        const query = et.suggestedAssignee.toLowerCase();
        const matched = users.find(
          (u) =>
            u.name.toLowerCase().includes(query) ||
            u.department?.toLowerCase().includes(query) ||
            u.email.toLowerCase().includes(query)
        );
        if (matched) {
          assignedUserIds = [matched.id];
        }
      }

      // Calculate sequential or provided due date
      let calculatedDueDate = et.dueDate;
      if (!calculatedDueDate) {
        const daysAhead = (idx + 1) * 5;
        calculatedDueDate = new Date(Date.now() + daysAhead * 86400000).toISOString().split('T')[0];
      }

      const newTask: Task = {
        id: `task_ai_${Date.now()}_${idx}_${Math.floor(Math.random() * 1000)}`,
        projectId,
        companyId: project.companyId,
        title: et.title || 'AI Task',
        description: et.description || 'Imported via Gemini AI Document Extraction',
        status: (et.status as TaskStatus) || 'To Do',
        priority: (et.priority as Task['priority']) || 'Medium',
        assigneeIds: assignedUserIds,
        reporterId: currentUser.id,
        startDate: todayStr,
        dueDate: calculatedDueDate,
        estimatedHours: et.estimatedHours || 20,
        loggedHours: 0,
        tags: et.tags || ['AI-Extracted', 'Gemini'],
        isMilestone: Boolean(et.isMilestone),
        isCriticalPath: Boolean(et.isCriticalPath),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setTasks((prev) => [newTask, ...prev]);
      createTaskInFirestore(newTask);
      count++;
    });

    logActivity('imported AI tasks', `${count} tasks extracted from PDF/Spec document for "${project.title}"`, 'ai', projectId);
    return count;
  };

  // Notifications & Snooze Engine
  const markNotificationRead = (id: string) => {
    setNotifications((prev) => {
      const updated = prev.map((n) => (n.id === id ? { ...n, read: true } : n));
      saveToStorage('dolphin_notifs', updated);
      return updated;
    });
  };

  const dismissNotification = (id: string) => {
    markNotificationRead(id);
  };

  const clearAllNotifications = () => {
    setNotifications([]);
    saveToStorage('dolphin_notifs', []);
  };

  const calculateSnooze = (presetOrMins: number | string, customIsoDate?: string) => {
    const now = new Date();
    if (customIsoDate) {
      const until = new Date(customIsoDate);
      return {
        until,
        label: `Until ${until.toLocaleDateString([], { month: 'short', day: 'numeric' })} ${until.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
      };
    }
    if (typeof presetOrMins === 'number') {
      const until = new Date(now.getTime() + presetOrMins * 60 * 1000);
      return { until, label: `Snoozed ${presetOrMins}m` };
    }
    switch (presetOrMins) {
      case '15m': {
        const until = new Date(now.getTime() + 15 * 60 * 1000);
        return { until, label: 'Snoozed 15m' };
      }
      case '1h': {
        const until = new Date(now.getTime() + 60 * 60 * 1000);
        return { until, label: 'Snoozed 1h' };
      }
      case '4h': {
        const until = new Date(now.getTime() + 4 * 60 * 60 * 1000);
        return { until, label: 'Snoozed 4h' };
      }
      case '1d': {
        const until = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        return { until, label: 'Snoozed 1d' };
      }
      case '2d': {
        const until = new Date(now.getTime() + 48 * 60 * 60 * 1000);
        return { until, label: 'Snoozed 2d' };
      }
      case '1w': {
        const until = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        return { until, label: 'Snoozed 1w' };
      }
      default: {
        const mins = parseInt(String(presetOrMins), 10) || 60;
        const until = new Date(now.getTime() + mins * 60 * 1000);
        return { until, label: `Snoozed ${mins}m` };
      }
    }
  };

  const snoozeTaskNotification = (
    taskId: string,
    durationPresetOrMins: number | string,
    customIsoDate?: string,
    snoozeReason?: string
  ) => {
    const task = tasks.find((t) => t.id === taskId);
    const { until, label } = calculateSnooze(durationPresetOrMins, customIsoDate);

    const record: SnoozeRecord = {
      taskId,
      taskTitle: task?.title || 'Task',
      snoozedAt: new Date().toISOString(),
      snoozedUntil: until.toISOString(),
      snoozeDurationLabel: label,
    };

    setSnoozedTasks((prev) => {
      const next = { ...prev, [taskId]: record };
      saveToStorage('dolphin_snoozed_notifs', next);
      return next;
    });

    setNotifications((prev) => {
      const updated = prev.map((n) =>
        n.taskId === taskId ? { ...n, read: true, snoozedUntil: until.toISOString() } : n
      );
      saveToStorage('dolphin_notifs', updated);
      return updated;
    });

    logActivity(
      'snoozed task notification',
      `Task "${task?.title || taskId}" snoozed (${label})`,
      'task',
      task?.projectId,
      taskId
    );
  };

  const unsnoozeTaskNotification = (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    setSnoozedTasks((prev) => {
      const next = { ...prev };
      delete next[taskId];
      saveToStorage('dolphin_snoozed_notifs', next);
      return next;
    });

    setNotifications((prev) => {
      const updated = prev.map((n) =>
        n.taskId === taskId ? { ...n, read: false, snoozedUntil: undefined } : n
      );
      saveToStorage('dolphin_notifs', updated);
      return updated;
    });

    logActivity(
      'unsnoozed task notification',
      `Alerts resumed for task "${task?.title || taskId}"`,
      'task',
      task?.projectId,
      taskId
    );
  };

  const updateNotificationSettings = (updates: Partial<NotificationSettings>) => {
    setNotificationSettings((prev) => {
      const next = { ...prev, ...updates };
      saveToStorage('dolphin_notif_settings', next);
      return next;
    });
    logActivity('updated notification settings', 'Modified lead time and browser notification options', 'system');
  };

  const requestBrowserNotificationPermission = async (): Promise<NotificationPermission | 'unsupported'> => {
    if (!('Notification' in window)) {
      return 'unsupported';
    }
    try {
      const perm = await window.Notification.requestPermission();
      if (perm === 'granted') {
        updateNotificationSettings({ enableBrowserNotifs: true });
      } else {
        updateNotificationSettings({ enableBrowserNotifs: false });
      }
      return perm;
    } catch {
      return 'denied';
    }
  };

  const triggerUpcomingDueCheck = useCallback(() => {
    const now = new Date();
    const leadMs = (notificationSettings.leadDays || 3) * 24 * 60 * 60 * 1000;

    tasks.forEach((task) => {
      if (task.status === 'Done' || !task.dueDate) return;

      // Check if snoozed
      const snoozeRecord = snoozedTasks[task.id];
      if (snoozeRecord) {
        if (new Date(snoozeRecord.snoozedUntil) > now) {
          // Still snoozed, skip alert
          return;
        } else {
          // Snooze expired! Unsnooze automatically
          unsnoozeTaskNotification(task.id);
        }
      }

      const due = new Date(task.dueDate);
      const isOverdue = due.getTime() < now.getTime();
      const isUpcoming = due.getTime() >= now.getTime() && (due.getTime() - now.getTime() <= leadMs);

      if (isOverdue || isUpcoming) {
        // Check if we already have a notification for this task
        const existing = notifications.find((n) => n.taskId === task.id && !n.read);
        if (!existing) {
          const type = isOverdue ? 'overdue' : 'due_reminder';
          const title = isOverdue ? `Overdue Task: ${task.title}` : `Upcoming Due Date: ${task.title}`;
          const message = isOverdue
            ? `Task "${task.title}" was due on ${task.dueDate}. Priority: ${task.priority}.`
            : `Task "${task.title}" is due on ${task.dueDate} (${task.priority} priority).`;

          const newNotif: Notification = {
            id: `notif_due_${task.id}_${Date.now()}`,
            userId: currentUser?.id || 'usr_1',
            title,
            message,
            type,
            read: false,
            taskId: task.id,
            projectId: task.projectId,
            createdAt: now.toISOString(),
          };

          setNotifications((prev) => {
            const updated = [newNotif, ...prev];
            saveToStorage('dolphin_notifs', updated);
            return updated;
          });

          // Trigger native browser notification if allowed
          if (notificationSettings.enableBrowserNotifs && 'Notification' in window && window.Notification.permission === 'granted') {
            try {
              new window.Notification(title, {
                body: message,
                icon: '/favicon.ico',
              });
            } catch (e) {
              console.warn('Browser notification trigger warning:', e);
            }
          }
        }
      }
    });
  }, [tasks, snoozedTasks, notificationSettings, notifications, currentUser]);

  useEffect(() => {
    triggerUpcomingDueCheck();
    const interval = setInterval(triggerUpcomingDueCheck, 45000);
    return () => clearInterval(interval);
  }, [triggerUpcomingDueCheck]);

  // Automations
  const toggleAutomation = (id: string) => {
    setAutomations((prev) =>
      prev.map((a) => (a.id === id ? { ...a, active: !a.active } : a))
    );
  };

  const addAutomation = (ruleData: Omit<AutomationRule, 'id'>) => {
    const newRule: AutomationRule = {
      ...ruleData,
      id: `auto_${Date.now()}`,
    };
    setAutomations((prev) => [...prev, newRule]);
    logActivity('configured new automation rule', newRule.name, 'automation');
  };

  // Company Email Functions
  const updateEmailConfig = (updates: Partial<EmailConfig>) => {
    setEmailConfig((prev) => ({ ...prev, ...updates }));
    logActivity('updated company email integration settings', updates.email || 'Email config', 'system');
  };

  const linkEmailToTask = (emailId: string, taskId: string, targetProjectId?: string) => {
    const task = tasks.find((t) => t.id === taskId);
    setEmailThreads((prev) =>
      prev.map((e) => {
        if (e.id === emailId) {
          return {
            ...e,
            linkedTaskId: taskId,
            linkedProjectId: targetProjectId || task?.projectId || e.linkedProjectId
          };
        }
        return e;
      })
    );

    const email = emailThreads.find((e) => e.id === emailId);
    if (email && task) {
      logActivity(
        'linked email thread to task',
        `Linked email "${email.subject.slice(0, 30)}..." to task "${task.title}"`,
        'task',
        task.projectId,
        task.id
      );
    }
  };

  const unlinkEmailFromTask = (emailId: string) => {
    const email = emailThreads.find((e) => e.id === emailId);
    setEmailThreads((prev) =>
      prev.map((e) => (e.id === emailId ? { ...e, linkedTaskId: undefined } : e))
    );
    if (email) {
      logActivity('unlinked email thread', `Removed task link from "${email.subject.slice(0, 30)}..."`, 'task');
    }
  };

  const convertEmailToTask = (
    emailId: string,
    projectId: string,
    customTitle?: string,
    customPriority?: Priority
  ): Task => {
    const email = emailThreads.find((e) => e.id === emailId);
    const targetProject = projects.find((p) => p.id === projectId) || projects[0];

    const title = customTitle || (email ? email.subject : 'New Task from Email');
    const description = email
      ? `Extracted from email thread:\n\nSender: ${email.senderName} (${email.senderEmail})\nSubject: ${email.subject}\nReceived: ${new Date(email.timestamp).toLocaleString()}\n\n---\n${email.body}`
      : 'Converted from email inbox';

    const newTask: Task = {
      id: `task_email_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      projectId: targetProject?.id || 'proj_chairman',
      companyId: targetProject?.companyId || activeCompany.id,
      title,
      description,
      status: 'To Do',
      priority: customPriority || email?.priority || 'High',
      assigneeIds: [currentUser.id],
      reporterId: currentUser.id,
      startDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      estimatedHours: 16,
      loggedHours: 0,
      tags: ['Email-Linked', 'Inbox', ...(email?.tags || [])],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setTasks((prev) => [newTask, ...prev]);
    createTaskInFirestore(newTask);

    // Link the email thread to this newly created task
    linkEmailToTask(emailId, newTask.id, targetProject?.id);

    logActivity('converted email thread to task', `Created task "${newTask.title}" from email`, 'task', targetProject?.id, newTask.id);
    return newTask;
  };

  const sendEmailReply = (emailId: string, replyBody: string) => {
    const nowIso = new Date().toISOString();
    const newReply = {
      id: `rep_${Date.now()}`,
      senderName: currentUser.name,
      senderEmail: currentUser.email,
      body: replyBody,
      timestamp: nowIso
    };

    setEmailThreads((prev) =>
      prev.map((e) => {
        if (e.id === emailId) {
          return {
            ...e,
            isUnread: false,
            replies: [...(e.replies || []), newReply]
          };
        }
        return e;
      })
    );

    const email = emailThreads.find((e) => e.id === emailId);
    logActivity('sent email reply', `Replied to thread "${email?.subject || emailId}"`, 'system');
  };

  const composeNewEmail = (newEmailData: Omit<EmailThread, 'id' | 'timestamp' | 'isUnread' | 'isStarred' | 'folder'>) => {
    const created: EmailThread = {
      ...newEmailData,
      id: `email_${Date.now()}`,
      timestamp: new Date().toISOString(),
      isUnread: false,
      isStarred: false,
      folder: 'sent'
    };

    setEmailThreads((prev) => [created, ...prev]);
    logActivity('sent company email', `Sent email to ${created.recipientEmail} (${created.subject})`, 'system');
    return created;
  };

  const toggleStarEmail = (emailId: string) => {
    setEmailThreads((prev) =>
      prev.map((e) => (e.id === emailId ? { ...e, isStarred: !e.isStarred } : e))
    );
  };

  const toggleUnreadEmail = (emailId: string) => {
    setEmailThreads((prev) =>
      prev.map((e) => (e.id === emailId ? { ...e, isUnread: !e.isUnread } : e))
    );
  };

  const deleteEmailThread = (emailId: string) => {
    setEmailThreads((prev) => prev.filter((e) => e.id !== emailId));
    logActivity('deleted email thread', emailId, 'system');
  };

  // Clear all old sample data to start fresh with real projects and activities
  const clearAllData = () => {
    setProjects([]);
    setTasks([]);
    setSubtasks([]);
    setDependencies([]);
    setFiles([]);
    setTimeEntries([]);
    setActivityLogs([]);
    setNotifications([]);
    setSelectedProjectId(null);

    // Clear local storage
    localStorage.removeItem('dolphin_projects');
    localStorage.removeItem('dolphin_tasks');
    localStorage.removeItem('dolphin_subtasks');
    localStorage.removeItem('dolphin_dependencies');
    localStorage.removeItem('dolphin_files');
    localStorage.removeItem('dolphin_time_entries');
    localStorage.removeItem('dolphin_logs');
    localStorage.removeItem('dolphin_notifs');

    // Clear Firestore if connected
    clearAllFirestoreData();

    logActivity('cleared old sample data', 'Workspace reset for fresh real data entry', 'system');
  };

  return (
    <AppContext.Provider
      value={{
        clearAllData,
        theme,
        setTheme,
        toggleTheme,
        dolphinTheme,
        setDolphinTheme,
        authorizedDomains,
        addAuthorizedDomain,
        removeAuthorizedDomain,
        currentUser,
        setCurrentUser,
        activeCompany,
        setActiveCompany,
        companies,
        addCompany,
        updateCompany,
        deleteCompany,
        users,
        updateUser,
        deleteUser,
        validateDomain,
        inviteUser,
        dispatchEmailNotification,
        projects,
        addProject,
        updateProject,
        deleteProject,
        projectTemplates,
        saveProjectAsTemplate,
        instantiateProjectFromTemplate,
        deleteProjectTemplate,
        tasks,
        subtasks,
        dependencies,
        addTask,
        updateTask,
        deleteTask,
        addSubtask,
        toggleSubtask,
        addDependency,
        removeDependency,
        recalculateProjectTimeline,
        timer,
        startTimer,
        stopTimer,
        logTimeManual,
        timeEntries,
        files,
        addFile,
        uploadFileVersion,
        revertFileVersion,
        deleteFile,
        importTasksFromAI,
        activityLogs,
        logActivity,
        notifications,
        snoozedTasks,
        notificationSettings,
        markNotificationRead,
        dismissNotification,
        clearAllNotifications,
        snoozeTaskNotification,
        unsnoozeTaskNotification,
        updateNotificationSettings,
        requestBrowserNotificationPermission,
        triggerUpcomingDueCheck,
        automations,
        toggleAutomation,
        addAutomation,
        emailThreads,
        emailConfig,
        updateEmailConfig,
        linkEmailToTask,
        unlinkEmailFromTask,
        convertEmailToTask,
        sendEmailReply,
        composeNewEmail,
        toggleStarEmail,
        toggleUnreadEmail,
        deleteEmailThread,
        activeTab,
        setActiveTab,
        selectedProjectId,
        setSelectedProjectId,
        searchQuery,
        setSearchQuery,
        isCommandPaletteOpen,
        setCommandPaletteOpen,
        toggleCommandPalette,
        firebaseConnected,
        firebaseProjectId,
        firebaseUser,
        signInWithGoogle,
        signOutFirebase,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
