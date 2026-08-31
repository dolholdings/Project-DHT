import React, { createContext, useContext, useState, useEffect, useLayoutEffect, useCallback, useMemo } from 'react';
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
  TemplateDependency,
  TemplateVersionRecord,
  TemplateCleanupRules,
  CustomFieldDefinition,
  Sprint
} from '../types';

import { INITIAL_TEMPLATES } from '../data/initialTemplates';
import {
  getUserInboxConfig,
  saveUserInboxConfig,
  initializeUserInboxOnSignup,
  UserInboxConfig
} from '../services/inboxConfigService';
import {
  canCreateUser,
  canDeleteUser,
  canCreateSpace,
  canDeleteSpace,
  canDeleteTask
} from '../lib/permissions';
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
  INITIAL_TIME_ENTRIES,
  INITIAL_CUSTOM_FIELDS,
  INITIAL_SPRINTS
} from '../data/initialData';
import { INITIAL_EMAIL_THREADS, INITIAL_EMAIL_CONFIG } from '../data/initialEmailData';
import {
  createCompanyInFirestore,
  updateCompanyInFirestore,
  deleteCompanyFromFirestore,
  subscribeToCompanies,
  createProjectInFirestore,
  updateProjectInFirestore,
  deleteProjectFromFirestore,
  createTaskInFirestore,
  updateTaskInFirestore,
  softDeleteTaskInFirestore,
  restoreTaskInFirestore,
  deleteTaskFromFirestore,
  purgeExpiredTasksFromFirestore,
  createFileInFirestore,
  updateFileInFirestore,
  deleteFileFromFirestore,
  subscribeToProjects,
  subscribeToTasks,
  subscribeToFiles,
  subscribeToUsers,
  createUserInFirestore,
  updateUserInFirestore,
  deleteUserFromFirestore,
  syncAllLocalUsersToFirestore,
  seedInitialFirestoreData,
  clearAllFirestoreData,
  forceRestoreFirestoreData,
} from '../services/dataService';
import { sendTransactionalEmail } from '../services/emailNotificationService';
import { validatePasswordPolicy, generateSecureCompliantPassword } from '../config/auth';

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
  isAuthenticated: boolean;
  setIsAuthenticated: (auth: boolean) => void;
  logout: () => void;
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
  syncAllUsersToFirestore: () => Promise<{ success: boolean; count: number; error?: string }>;

  // Email Control & Domain Validation
  authorizedDomains: string[];
  addAuthorizedDomain: (domain: string) => void;
  removeAuthorizedDomain: (domain: string) => void;
  validateDomain: (email: string, targetCompanyId?: string) => { valid: boolean; error?: string; domain?: string; isDolphinDomain?: boolean; registeredCompany?: Company };
  inviteUser: (name: string, email: string, role: User['role'], department: string, companyId?: string, password?: string, assignedSpaceIds?: string[]) => { success: boolean; error?: string; user?: User };
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
  addProject: (project: Omit<Project, 'id' | 'progress' | 'spentBudget'> | Project) => Project;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  addListToProject: (projectId: string, listName: string) => void;
  projectTemplates: ProjectTemplate[];
  saveProjectAsTemplate: (
    projectId: string,
    name: string,
    description?: string,
    category?: Project['category'],
    versionOptions?: {
      targetTemplateId?: string;
      versionNote?: string;
      isMajorVersion?: boolean;
    },
    customFieldIds?: string[],
    cleanupRules?: TemplateCleanupRules
  ) => ProjectTemplate;
  createProjectTemplate: (template: Omit<ProjectTemplate, 'id' | 'createdAt'>) => ProjectTemplate;
  updateProjectTemplate: (id: string, updates: Partial<ProjectTemplate>) => void;
  duplicateProjectTemplate: (templateId: string) => ProjectTemplate;
  instantiateProjectFromTemplate: (
    templateId: string,
    params: {
      title: string;
      code: string;
      companyId: string;
      managerId: string;
      startDate: string;
      budget?: number;
      description?: string;
      versionRecordId?: string;
      cleanupRules?: TemplateCleanupRules;
    }
  ) => Project;
  deleteProjectTemplate: (templateId: string) => void;
  rollbackTemplateVersion: (templateId: string, versionRecordId: string) => void;
  
  // Tasks & Subtasks
  tasks: Task[];
  deletedTasks: Task[];
  allTasks: Task[];
  subtasks: Subtask[];
  taskComments: TaskComment[];
  dependencies: TaskDependency[];
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'loggedHours'>) => Task;
  updateTask: (id: string, updates: Partial<Task>) => void;
  reorderTasks: (newTasks: Task[]) => void;
  deleteTask: (id: string) => void;
  restoreTask: (id: string) => void;
  bulkRestoreTasks: (ids: string[]) => void;
  purgeTask: (id: string) => void;
  bulkPurgeTasks: (ids: string[]) => void;
  emptyRecycleBin: () => void;
  purgeExpiredTasks: () => Promise<number>;
  addSubtask: (taskId: string, title: string, assignedTo?: string) => void;
  toggleSubtask: (subtaskId: string) => void;
  addTaskComment: (taskId: string, content: string) => void;
  addDependency: (taskId: string, dependsOnTaskId: string) => boolean;
  removeDependency: (depId: string) => void;
  recalculateProjectTimeline: (projectId?: string) => { adjustedCount: number; updatedTasks: Task[] };
  seedDemoTasksForProject: (targetProjectId?: string) => void;

  // Custom Fields
  customFields: CustomFieldDefinition[];
  addCustomField: (field: Omit<CustomFieldDefinition, 'id'>) => void;
  updateCustomField: (id: string, updates: Partial<CustomFieldDefinition>) => void;
  deleteCustomField: (id: string) => void;

  // Sprints & Agile Planning
  sprints: Sprint[];
  addSprint: (sprint: Omit<Sprint, 'id' | 'createdAt' | 'updatedAt'>) => Sprint;
  updateSprint: (id: string, updates: Partial<Sprint>) => void;
  deleteSprint: (id: string) => void;
  completeSprint: (id: string, rolloverToSprintId?: string | null) => void;
  moveTaskToSprint: (taskId: string, sprintId: string | null) => void;

  // Time Tracking
  timer: TimerState;
  startTimer: (taskId: string, taskTitle: string) => void;
  stopTimer: (description?: string) => void;
  discardTimer: () => void;
  logTimeManual: (taskId: string, hours: number, description: string, date?: string) => void;
  deleteTimeEntry: (id: string) => void;
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
  logActivity: (action: string, target: string, type?: ActivityLog['type'], projectId?: string, taskId?: string, details?: string, severity?: ActivityLog['severity'], ipAddress?: string) => void;
  clearActivityLogs: () => void;
  isActivityDrawerOpen: boolean;
  setIsActivityDrawerOpen: (open: boolean) => void;
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
  triggerDailyOverdueCheck: (forceSend?: boolean) => { success: boolean; count: number; emailsSent: number; message: string };
  automations: AutomationRule[];
  toggleAutomation: (id: string) => void;
  addAutomation: (rule: Omit<AutomationRule, 'id'>) => void;

  // Workspace Reset / Clear Sample Data
  clearAllData: () => void;
  restoreAllWorkspaceData: () => Promise<void>;

  // Email Inbox & Task Linking
  emailThreads: EmailThread[];
  emailConfig: EmailConfig;
  userInboxConfig: UserInboxConfig;
  updateEmailConfig: (updates: Partial<EmailConfig>) => void;
  updateUserInboxConfig: (updates: Partial<UserInboxConfig>) => void;
  initializeUserInboxForUser: (user: { id: string; email: string; name: string }) => UserInboxConfig;
  linkEmailToTask: (emailId: string, taskId: string, projectId?: string) => void;
  unlinkEmailFromTask: (emailId: string) => void;
  convertEmailToTask: (emailId: string, projectId: string, customTitle?: string, customPriority?: Priority) => Task;
  sendEmailReply: (emailId: string, replyBody: string) => void;
  composeNewEmail: (newEmail: Omit<EmailThread, 'id' | 'timestamp' | 'isUnread' | 'isStarred' | 'folder'>) => EmailThread;
  toggleStarEmail: (emailId: string) => void;
  toggleUnreadEmail: (emailId: string) => void;
  deleteEmailThread: (emailId: string) => void;
  clearEmailThreads: () => void;
  cleanupOldInboxNotifications: (maxAgeDays?: number) => { archivedCount: number; deletedCount: number };

  // Active View State
  activeTab: string;
  setActiveTab: (tab: string) => void;
  selectedProjectId: string | null;
  setSelectedProjectId: (id: string | null) => void;
  selectedListFilter: string | null;
  setSelectedListFilter: (listName: string | null) => void;
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
  } catch (e: any) {
    console.warn(`Failed to save ${key} to localStorage:`, e);
    try {
      // Clear non-critical cached data to free up space
      ['dolphin_logs', 'dolphin_files', 'dolphin_recent_searches', 'dolphin_emails', 'dolphin_calendar_meetings', 'dolphin_pinned_widgets'].forEach((k) => {
        if (k !== key) {
          try {
            localStorage.removeItem(k);
          } catch (_) {}
        }
      });
      localStorage.setItem(key, JSON.stringify(value));
    } catch (_) {
      try {
        if (Array.isArray(value)) {
          const lightweight = value.map((item: any) => {
            if (item && typeof item === 'object') {
              const { fileContent, content, logs, history, ...rest } = item;
              return rest;
            }
            return item;
          });
          localStorage.setItem(key, JSON.stringify(lightweight));
        }
      } catch (innerErr) {
        console.warn(`localStorage quota exceeded for ${key}; application state retained in memory.`);
      }
    }
  }
}

// Synchronous DOM theme modifier to eliminate Flash of Unstyled Content (FOUC)
function applyThemeToDOM(dolphinTheme: DolphinTheme, theme: 'dark' | 'light') {
  if (typeof document === 'undefined') return;
  const isLight = dolphinTheme === 'light' || theme === 'light';
  const activeDolphin = isLight ? 'light' : dolphinTheme;

  document.documentElement.setAttribute('data-theme', activeDolphin);
  if (isLight) {
    document.documentElement.classList.add('light-theme', 'light');
  } else {
    document.documentElement.classList.remove('light-theme', 'light');
  }
}

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [dolphinTheme, setDolphinThemeState] = useState<DolphinTheme>(() => {
    const savedDolphin = loadFromStorage<DolphinTheme>('dolphin_theme_mode', 'ocean-deep');
    const savedPm = loadFromStorage<'dark' | 'light'>('pm_theme', 'dark');
    const currentUserStored = loadFromStorage<User | null>('dolphin_current_user', null);
    const userTheme = currentUserStored?.id
      ? loadFromStorage<DolphinTheme | null>(`dolphin_user_theme_${currentUserStored.id}`, null) || currentUserStored.theme
      : null;

    let resolvedDolphin: DolphinTheme = userTheme || savedDolphin;
    if (!userTheme && (savedPm === 'light' || savedDolphin === 'light')) {
      resolvedDolphin = 'light';
    }

    const resolvedBase = resolvedDolphin === 'light' ? 'light' : 'dark';
    // Synchronously mutate document attributes prior to initial component tree render
    applyThemeToDOM(resolvedDolphin, resolvedBase);
    return resolvedDolphin;
  });

  const [theme, setThemeState] = useState<'dark' | 'light'>(() => {
    const isLight = dolphinTheme === 'light';
    const resolvedBase = isLight ? 'light' : 'dark';
    applyThemeToDOM(dolphinTheme, resolvedBase);
    return resolvedBase;
  });
  const [authorizedDomains, setAuthorizedDomains] = useState<string[]>(() => {
    const loaded = loadFromStorage<string[]>('pm_auth_domains', APPROVED_DOMAINS);
    const domainList = Array.isArray(loaded) && loaded.length > 0 ? loaded : APPROVED_DOMAINS;
    const cleanList = Array.from(
      new Set(domainList.map((d) => (typeof d === 'string' ? d.toLowerCase().trim().replace(/^@/, '') : '')).filter(Boolean))
    );
    return cleanList.length > 0 ? cleanList : APPROVED_DOMAINS;
  });

  const setDolphinTheme = (newDolphinTheme: DolphinTheme) => {
    setDolphinThemeState(newDolphinTheme);
    const isLight = newDolphinTheme === 'light';
    const baseTheme = isLight ? 'light' : 'dark';
    setThemeState(baseTheme);

    applyThemeToDOM(newDolphinTheme, baseTheme);

    saveToStorage('dolphin_theme_mode', newDolphinTheme);
    saveToStorage('pm_theme', baseTheme);

    if (currentUser?.id) {
      saveToStorage(`dolphin_user_theme_${currentUser.id}`, newDolphinTheme);
      setCurrentUser((prev) => (prev ? { ...prev, theme: newDolphinTheme } : prev));
      updateUserInFirestore(currentUser.id, { theme: newDolphinTheme }).catch((err) => {
        console.warn('Firestore user theme sync notice:', err);
      });
    }
  };

  const setTheme = (newTheme: 'dark' | 'light') => {
    setThemeState(newTheme);
    const nextDolphin = newTheme === 'light' ? 'light' : (dolphinTheme === 'light' ? 'ocean-deep' : dolphinTheme);
    setDolphinThemeState(nextDolphin);

    applyThemeToDOM(nextDolphin, newTheme);

    saveToStorage('pm_theme', newTheme);
    saveToStorage('dolphin_theme_mode', nextDolphin);

    if (currentUser?.id) {
      saveToStorage(`dolphin_user_theme_${currentUser.id}`, nextDolphin);
      setCurrentUser((prev) => (prev ? { ...prev, theme: nextDolphin } : prev));
      updateUserInFirestore(currentUser.id, { theme: nextDolphin }).catch((err) => {
        console.warn('Firestore user theme sync notice:', err);
      });
    }
  };

  const toggleTheme = () => {
    const isCurrentlyLight = dolphinTheme === 'light' || theme === 'light';
    const nextDolphin = isCurrentlyLight ? 'ocean-deep' : 'light';
    setDolphinTheme(nextDolphin);
  };

  // Synchronize theme to DOM synchronously before browser paint cycle (prevents FOUC)
  useLayoutEffect(() => {
    applyThemeToDOM(dolphinTheme, theme);
  }, [dolphinTheme, theme]);

  const addAuthorizedDomain = (domain: string) => {
    const clean = domain.toLowerCase().trim().replace(/^@/, '');
    if (clean && !authorizedDomains.includes(clean)) {
      const updated = [...authorizedDomains, clean];
      setAuthorizedDomains(updated);
      saveToStorage('pm_auth_domains', updated);
    }
  };

  const removeAuthorizedDomain = (domain: string) => {
    const clean = domain.toLowerCase().trim().replace(/^@/, '');
    const updated = authorizedDomains.filter((d) => d !== clean);
    setAuthorizedDomains(updated);
    saveToStorage('pm_auth_domains', updated);
  };

  const [companies, setCompanies] = useState<Company[]>(() => {
    const stored: Company[] = loadFromStorage('dolphin_companies', INITIAL_COMPANIES);
    const compMap = new Map<string, Company>();
    INITIAL_COMPANIES.forEach((c) => compMap.set(c.id, c));
    if (Array.isArray(stored)) {
      stored.forEach((c) => {
        if (c && c.id) compMap.set(c.id, c);
      });
    }
    return Array.from(compMap.values());
  });
  const [activeCompany, setActiveCompany] = useState<Company>(() => {
    const storedActive = loadFromStorage<Company | null>('dolphin_active_company', null);
    const storedCompanies: Company[] = loadFromStorage('dolphin_companies', INITIAL_COMPANIES);
    if (storedActive && Array.isArray(storedCompanies) && storedCompanies.length > 0) {
      const matchStored = storedCompanies.find(
        (c) => c.id === storedActive.id || c.domain === storedActive.domain || c.code === storedActive.code
      );
      if (matchStored) return matchStored;
    }
    const dhtCompany = (storedCompanies || INITIAL_COMPANIES).find((c) => c.id === 'comp_dht') || INITIAL_COMPANIES[3];
    return storedActive || dhtCompany || INITIAL_COMPANIES[0];
  });
  const [deletedUserIds, setDeletedUserIds] = useState<string[]>(() =>
    loadFromStorage('dolphin_deleted_user_ids', [])
  );
  const [users, setUsers] = useState<User[]>(() => {
    const deleted: string[] = loadFromStorage('dolphin_deleted_user_ids', []);
    const loaded: User[] = loadFromStorage('dolphin_users', INITIAL_USERS);
    const legacyEmails = [
      'tareq.aldolphin@dolphingroup.ae',
      'parvez.khan@dolphingroup.ae',
      'suhail.ahmed@dolrad.ae',
      'fatima.zohra@dolheat.ae',
      'rashed.m@dolcool.ae',
      'elena.rostova@dolheat.ae',
      'omar.mansoor@dolphingroup.ae',
      'sys_analyst@dolrad.ae',
      'proj@dolheat.ae',
      'prog.mgr@dolheat.ae'
    ];
    
    const valid = loaded.filter((u) => !deleted.includes(u.id) && !legacyEmails.includes((u?.email || '').toLowerCase()));
    const merged = [...valid];
    INITIAL_USERS.forEach((iu) => {
      if (!merged.some((u) => (u?.email || '').toLowerCase() === (iu?.email || '').toLowerCase())) {
        merged.push(iu);
      }
    });

    saveToStorage('dolphin_users', merged);
    return merged;
  });
  const [currentUser, setCurrentUser] = useState<User>(() => {
    const loaded = loadFromStorage<User>('dolphin_current_user', INITIAL_USERS[0]);
    const legacyEmails = [
      'tareq.aldolphin@dolphingroup.ae',
      'parvez.khan@dolphingroup.ae',
      'suhail.ahmed@dolrad.ae',
      'fatima.zohra@dolheat.ae',
      'rashed.m@dolcool.ae',
      'elena.rostova@dolheat.ae',
      'omar.mansoor@dolphingroup.ae',
      'sys_analyst@dolrad.ae',
      'proj@dolheat.ae',
      'prog.mgr@dolheat.ae'
    ];
    if (!loaded?.email || legacyEmails.includes((loaded.email || '').toLowerCase())) {
      saveToStorage('dolphin_current_user', INITIAL_USERS[0]);
      return INITIAL_USERS[0];
    }
    return loaded;
  });
  const [isAuthenticated, setIsAuthenticatedState] = useState<boolean>(() => {
    try {
      const sessionAuth = sessionStorage.getItem('dolphin_is_authenticated');
      if (sessionAuth !== null) {
        return JSON.parse(sessionAuth);
      }
      const localAuth = localStorage.getItem('dolphin_is_authenticated');
      if (localAuth !== null) {
        return JSON.parse(localAuth);
      }
    } catch (e) {
      // Fallback
    }
    return true;
  });

  // Synchronize theme with user profile & database preferences when currentUser is updated
  useLayoutEffect(() => {
    if (currentUser?.id) {
      const userThemeKey = `dolphin_user_theme_${currentUser.id}`;
      const savedUserTheme = loadFromStorage<DolphinTheme | null>(userThemeKey, null) || currentUser.theme;
      if (savedUserTheme && savedUserTheme !== dolphinTheme) {
        setDolphinThemeState(savedUserTheme);
        const isLight = savedUserTheme === 'light';
        const baseTheme = isLight ? 'light' : 'dark';
        setThemeState(baseTheme);
        applyThemeToDOM(savedUserTheme, baseTheme);
        saveToStorage('dolphin_theme_mode', savedUserTheme);
        saveToStorage('pm_theme', baseTheme);
      }
    }
  }, [currentUser?.id]);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.location && window.location.hostname) {
      const host = (window.location.hostname || '').toLowerCase();
      const matchedComp = companies.find(
        (c) => {
          const compDomain = (c?.domain || '').toLowerCase();
          return (compDomain && host.includes(compDomain)) || (compDomain && compDomain.includes(host)) || (host.includes('dghanalytics') && c?.code === 'DGHA');
        }
      );
      if (matchedComp) {
        setActiveCompany(matchedComp);
      }
    }
  }, [companies]);

  const setIsAuthenticated = (authStatus: boolean) => {
    setIsAuthenticatedState(authStatus);
    if (authStatus && currentUser?.id) {
      const userThemeKey = `dolphin_user_theme_${currentUser.id}`;
      const savedUserTheme = loadFromStorage<DolphinTheme | null>(userThemeKey, null) || currentUser.theme;
      if (savedUserTheme) {
        setDolphinThemeState(savedUserTheme);
        const isLight = savedUserTheme === 'light';
        const baseTheme = isLight ? 'light' : 'dark';
        setThemeState(baseTheme);
        applyThemeToDOM(savedUserTheme, baseTheme);
        saveToStorage('dolphin_theme_mode', savedUserTheme);
        saveToStorage('pm_theme', baseTheme);
      }
    }
    try {
      sessionStorage.setItem('dolphin_is_authenticated', JSON.stringify(authStatus));
      saveToStorage('dolphin_is_authenticated', authStatus);
    } catch (e) {
      console.warn('Failed to save auth state to storage', e);
    }
  };

  const [projects, setProjects] = useState<Project[]>(() => {
    const loaded: Project[] = loadFromStorage('dolphin_projects', INITIAL_PROJECTS);
    if (!Array.isArray(loaded) || loaded.length === 0) {
      saveToStorage('dolphin_projects', INITIAL_PROJECTS);
      return INITIAL_PROJECTS;
    }
    const merged = [...loaded];
    INITIAL_PROJECTS.forEach((ip) => {
      if (!merged.some((p) => p.id === ip.id)) {
        merged.push(ip);
      }
    });
    return merged;
  });
  const [projectTemplates, setProjectTemplates] = useState<ProjectTemplate[]>(() => loadFromStorage('dolphin_project_templates', INITIAL_TEMPLATES));
  const [allTasks, setAllTasks] = useState<Task[]>(() => {
    const loaded: Task[] = loadFromStorage('dolphin_tasks', INITIAL_TASKS);
    if (!Array.isArray(loaded) || loaded.length === 0) {
      saveToStorage('dolphin_tasks', INITIAL_TASKS);
      return INITIAL_TASKS;
    }
    const merged = [...loaded];
    INITIAL_TASKS.forEach((it) => {
      if (!merged.some((t) => t.id === it.id)) {
        merged.push(it);
      }
    });
    return merged;
  });

  // Active tasks (excluding soft-deleted items)
  const tasks = useMemo(() => allTasks.filter((t) => !t.isDeleted), [allTasks]);
  // Soft-deleted tasks for Recycle Bin
  const deletedTasks = useMemo(() => allTasks.filter((t) => !!t.isDeleted), [allTasks]);
  const [subtasks, setSubtasks] = useState<Subtask[]>(() => loadFromStorage('dolphin_subtasks', INITIAL_SUBTASKS));
  const [taskComments, setTaskComments] = useState<TaskComment[]>(() => loadFromStorage('dolphin_task_comments', []));
  const [dependencies, setDependencies] = useState<TaskDependency[]>(() => loadFromStorage('dolphin_dependencies', INITIAL_DEPENDENCIES));
  const [files, setFiles] = useState<ProjectFile[]>(() => loadFromStorage('dolphin_files', INITIAL_FILES));
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>(() => loadFromStorage('dolphin_time_entries', INITIAL_TIME_ENTRIES));
  const [customFields, setCustomFields] = useState<CustomFieldDefinition[]>(() => {
    const loaded: CustomFieldDefinition[] = loadFromStorage('dolphin_custom_fields', INITIAL_CUSTOM_FIELDS);
    const hiddenIds = new Set(['cf_cost_center', 'cf_risk_rating', 'cf_audit_id', 'cf_approved_qa']);
    const hiddenNames = new Set(['cost center code', 'cost center', 'risk level', 'audit reference no', 'qa approved']);
    return (loaded || []).filter(
      (cf) => !hiddenIds.has(cf.id) && !hiddenNames.has(cf.name?.toLowerCase()?.trim())
    );
  });
  const [sprints, setSprints] = useState<Sprint[]>(() =>
    loadFromStorage('dolphin_sprints', INITIAL_SPRINTS)
  );
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>(() => {
    const loaded: ActivityLog[] = loadFromStorage('dolphin_logs', INITIAL_LOGS);
    // Filter out any legacy embedded mock audit logs
    const cleanLogs = (loaded || []).filter(
      (l) => !l.id?.startsWith('log_audit_') && l.userName !== 'Rohan (Admin)' && l.userName !== 'Tariq Al-Mansoor'
    );
    return cleanLogs;
  });
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
  const [userInboxConfig, setUserInboxConfig] = useState<UserInboxConfig>(() =>
    getUserInboxConfig(currentUser?.id || 'usr_pk', currentUser?.email || 'pawan.kumar@dolphingroup.ae', currentUser?.name || 'Pawan Kumar')
  );
  const [emailConfig, setEmailConfig] = useState<EmailConfig>(() => userInboxConfig.emailConfig);

  // Sync userInboxConfig whenever currentUser changes
  useEffect(() => {
    if (currentUser) {
      const cfg = getUserInboxConfig(currentUser.id, currentUser.email, currentUser.name);
      setUserInboxConfig(cfg);
      setEmailConfig(cfg.emailConfig);
    }
  }, [currentUser?.id, currentUser?.email, currentUser?.name]);

  // Firebase Auth & Firestore Connection State
  const [firebaseConnected, setFirebaseConnected] = useState<boolean>(true);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const firebaseProjectId = firebaseConfig.projectId;

  useEffect(() => {
    testFirestoreConnection();
    const unsubscribeAuth = onAuthStateChanged(auth, (u) => {
      setFirebaseUser(u);
    });

    // Seed initial data to Firestore and sync all local users to Firestore
    const localUsersOnBoot = loadFromStorage<User[]>('dolphin_users', INITIAL_USERS);
    seedInitialFirestoreData(INITIAL_PROJECTS, INITIAL_TASKS, INITIAL_FILES, localUsersOnBoot, INITIAL_COMPANIES);
    syncAllLocalUsersToFirestore(localUsersOnBoot);

    // Subscribe to real-time Firestore updates for Companies/Workspaces
    const unsubscribeCompanies = subscribeToCompanies((remoteCompanies) => {
      if (remoteCompanies && remoteCompanies.length > 0) {
        setCompanies((prev) => {
          const compMap = new Map<string, Company>();
          INITIAL_COMPANIES.forEach((c) => compMap.set(c.id, c));
          prev.forEach((c) => compMap.set(c.id, c));
          remoteCompanies.forEach((c) => compMap.set(c.id, c));
          const merged = Array.from(compMap.values());
          saveToStorage('dolphin_companies', merged);
          return merged;
        });
      }
    });

    // Subscribe to real-time Firestore updates for Users
    const unsubscribeUsers = subscribeToUsers((remoteUsers) => {
      const currentDeletedIds: string[] = loadFromStorage('dolphin_deleted_user_ids', []);
      const legacyEmails = [
        'tareq.aldolphin@dolphingroup.ae',
        'parvez.khan@dolphingroup.ae',
        'suhail.ahmed@dolrad.ae',
        'fatima.zohra@dolheat.ae',
        'rashed.m@dolcool.ae',
        'elena.rostova@dolheat.ae',
        'omar.mansoor@dolphingroup.ae',
        'sys_analyst@dolrad.ae',
        'proj@dolheat.ae',
        'prog.mgr@dolheat.ae'
      ];

      const validRemote = (remoteUsers || []).filter(
        (u) => u && !currentDeletedIds.includes(u.id) && !legacyEmails.includes((u.email || '').toLowerCase())
      );

      setUsers((prev) => {
        const userMap = new Map<string, User>();
        
        INITIAL_USERS.forEach((u) => {
          if (u && !currentDeletedIds.includes(u.id)) {
            userMap.set(u.id, u);
          }
        });

        prev.forEach((u) => {
          if (u && !currentDeletedIds.includes(u.id) && !legacyEmails.includes((u.email || '').toLowerCase())) {
            userMap.set(u.id, u);
          }
        });

        validRemote.forEach((u) => {
          userMap.set(u.id, u);
        });

        const updatedList = Array.from(userMap.values());
        saveToStorage('dolphin_users', updatedList);
        return updatedList;
      });

      if (currentUser?.id) {
        const matchedRemote = validRemote.find((ru) => ru.id === currentUser.id);
        if (matchedRemote?.theme) {
          const userThemeKey = `dolphin_user_theme_${currentUser.id}`;
          saveToStorage(userThemeKey, matchedRemote.theme);
          setDolphinThemeState(matchedRemote.theme);
          const isLight = matchedRemote.theme === 'light';
          const baseTheme = isLight ? 'light' : 'dark';
          setThemeState(baseTheme);
          applyThemeToDOM(matchedRemote.theme, baseTheme);
        }
      }
    });

    // Subscribe to real-time Firestore updates for Projects
    const unsubscribeProjects = subscribeToProjects((remoteProjects) => {
      if (remoteProjects && remoteProjects.length > 0) {
        setProjects(remoteProjects);
      }
    });

    // Subscribe to real-time Firestore updates for Tasks
    const unsubscribeTasks = subscribeToTasks((remoteTasks) => {
      if (remoteTasks && remoteTasks.length > 0) {
        setAllTasks(remoteTasks);
        // Automatically check and purge any items older than 30 days
        purgeExpiredTasksFromFirestore(remoteTasks);
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
      unsubscribeCompanies();
      unsubscribeUsers();
      unsubscribeProjects();
      unsubscribeTasks();
      unsubscribeFiles();
    };
  }, []);

  const signInWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      console.warn('Firebase Auth Note:', err?.message || err);
    }
  };

  const signOutFirebase = async () => {
    try {
      if (auth.currentUser) {
        await signOut(auth);
      }
    } catch (err: any) {
      const msg = err?.message || String(err);
      console.warn('Firebase Signout Note:', msg);
    }
    logout();
  };

  // Auto-sync state to localStorage for 100% data preservation
  useEffect(() => {
    saveToStorage('dolphin_companies', companies);
  }, [companies]);

  // Auto-sync state to localStorage for 100% data preservation
  useEffect(() => {
    saveToStorage('dolphin_projects', projects);
  }, [projects]);

  useEffect(() => {
    saveToStorage('dolphin_project_templates', projectTemplates);
  }, [projectTemplates]);

  useEffect(() => {
    saveToStorage('dolphin_tasks', allTasks);
  }, [allTasks]);

  useEffect(() => {
    saveToStorage('dolphin_subtasks', subtasks);
  }, [subtasks]);

  useEffect(() => {
    saveToStorage('dolphin_dependencies', dependencies);
  }, [dependencies]);

  useEffect(() => {
    saveToStorage('dolphin_files', files);
  }, [files]);

  useEffect(() => {
    saveToStorage('dolphin_time_entries', timeEntries);
  }, [timeEntries]);

  useEffect(() => {
    saveToStorage('dolphin_custom_fields', customFields);
  }, [customFields]);

  useEffect(() => {
    saveToStorage('dolphin_logs', activityLogs);
  }, [activityLogs]);

  useEffect(() => {
    saveToStorage('dolphin_users', users);
  }, [users]);

  useEffect(() => {
    if (currentUser) {
      saveToStorage('dolphin_current_user', currentUser);
    }
  }, [currentUser]);

  useEffect(() => {
    saveToStorage('dolphin_automations', automations);
  }, [automations]);

  useEffect(() => {
    saveToStorage('dolphin_emails', emailThreads);
  }, [emailThreads]);

  useEffect(() => {
    saveToStorage('dolphin_email_config', emailConfig);
  }, [emailConfig]);

  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedListFilter, setSelectedListFilter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const addListToProject = (projectId: string, listName: string) => {
    const trimmed = listName.trim();
    if (!trimmed) return;
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id === projectId) {
          const currentLists = p.lists || [];
          if (!currentLists.includes(trimmed)) {
            const updatedLists = [...currentLists, trimmed];
            const updatedProj = { ...p, lists: updatedLists };
            if (firebaseConnected) {
              updateProjectInFirestore(projectId, { lists: updatedLists }).catch(console.error);
            }
            return updatedProj;
          }
        }
        return p;
      })
    );
  };
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
  const [timer, setTimer] = useState<TimerState>(() => {
    const saved = loadFromStorage<TimerState>('dolphin_active_timer', {
      active: false,
      taskId: null,
      taskTitle: null,
      seconds: 0,
      startTime: null,
    });
    if (saved.active && saved.startTime) {
      const elapsed = Math.max(0, Math.floor((Date.now() - saved.startTime) / 1000));
      return {
        ...saved,
        seconds: Math.max(saved.seconds, elapsed)
      };
    }
    return saved;
  });

  useEffect(() => {
    if (timer.active) {
      saveToStorage('dolphin_active_timer', timer);
    } else {
      localStorage.removeItem('dolphin_active_timer');
    }
  }, [timer]);

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
    setCompanies((prev) => {
      const next = [...prev, created];
      saveToStorage('dolphin_companies', next);
      return next;
    });
    createCompanyInFirestore(created).catch((err) => console.warn('Company Firestore sync error:', err));
    logActivity('registered company', `${created.name} (${created.domain})`, 'system');
    return created;
  };

  const updateCompany = (id: string, updates: Partial<Company>) => {
    setCompanies((prev) => {
      const next = prev.map((c) => (c.id === id ? { ...c, ...updates } : c));
      saveToStorage('dolphin_companies', next);
      return next;
    });
    if (activeCompany.id === id) {
      setActiveCompany((prev) => {
        const next = { ...prev, ...updates };
        saveToStorage('dolphin_active_company', next);
        return next;
      });
    }
    updateCompanyInFirestore(id, updates).catch((err) => console.warn('Company Firestore update error:', err));
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
    saveToStorage('dolphin_companies', remaining);
    setProjects((prev) => prev.filter((p) => p.companyId !== id));
    setAllTasks((prev) => prev.filter((t) => t.companyId !== id));

    if (activeCompany.id === id && remaining.length > 0) {
      setActiveCompany(remaining[0]);
      saveToStorage('dolphin_active_company', remaining[0]);
    }

    deleteCompanyFromFirestore(id).catch((err) => console.warn('Company Firestore delete error:', err));

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
    const registeredUser = users.find((u) => (u?.email || '').toLowerCase() === cleanEmail);

    // Find registered company by domain or target id
    const registeredCompany =
      companies.find((c) => (c?.domain || '').toLowerCase() === domain) ||
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

  // Logging Activity - stabilized callback to prevent dependency cascading loops
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

    setActivityLogs((prev) => [newLog, ...prev.slice(0, 199)]);
  }, [activeCompany?.id, currentUser?.id, currentUser?.name, currentUser?.avatar]);

  const [isActivityDrawerOpen, setIsActivityDrawerOpen] = useState(false);

  const logout = useCallback(() => {
    try {
      if (auth.currentUser) {
        signOut(auth).catch((err) => console.warn('Firebase signout note:', err));
      }
      setFirebaseUser(null);
    } catch (e) {
      console.warn('Firebase logout note', e);
    }

    try {
      if (currentUser?.email) {
        logActivity(
          'user signed out',
          currentUser.email,
          'auth',
          undefined,
          undefined,
          `User ${currentUser.name} signed out of workspace`,
          'info'
        );
      }
    } catch (e) {
      // ignore
    }

    try {
      sessionStorage.removeItem('dolphin_is_authenticated');
      sessionStorage.removeItem('dolphin_current_session');
      sessionStorage.removeItem('session_last_activity');
      localStorage.removeItem('dolphin_is_authenticated');
      saveToStorage('dolphin_is_authenticated', false);
    } catch (e) {
      console.warn('Logout error', e);
    }

    setIsAuthenticatedState(false);
    setIsActivityDrawerOpen(false);
    setCommandPaletteOpen(false);
    setSelectedProjectId(null);
  }, [currentUser, logActivity]);

  const clearActivityLogs = useCallback(() => {
    setActivityLogs([]);
    saveToStorage('dolphin_logs', []);
  }, []);

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
        secure: emailConfig.outgoingPort === 465 ? true : (emailConfig.outgoingPort === 587 ? false : Boolean(emailConfig.useSSL))
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
    const targetUser = users.find((u) => (u?.email || '').toLowerCase() === String(toEmail || '').toLowerCase());
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

  // Invite User with Domain & Company Association and optional assigned spaces
  const inviteUser = (
    name: string,
    email: string,
    role: User['role'],
    department: string,
    companyId?: string,
    password?: string,
    assignedSpaceIds?: string[]
  ) => {
    if (!canCreateUser(currentUser)) {
      return {
        success: false,
        error: 'Permission denied: Team Members and Viewers cannot create or invite users.'
      };
    }

    const targetComp = companyId ? companies.find((c) => c.id === companyId) : undefined;

    const val = validateDomain(email, companyId);
    if (!val.valid) {
      return { success: false, error: val.error };
    }

    const assignedPassword = (password && password.trim()) || generateSecureCompliantPassword();
    const pwdValidation = validatePasswordPolicy(assignedPassword);
    if (!pwdValidation.isValid) {
      return {
        success: false,
        error: `Password security requirement violation: ${pwdValidation.errors.join(' ')}`
      };
    }

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

    setUsers((prev) => {
      const nextUsers = [...prev, newUser];
      saveToStorage('dolphin_users', nextUsers);
      return nextUsers;
    });
    createUserInFirestore(newUser);

    // Assign spaces to the new user if specified
    if (assignedSpaceIds && assignedSpaceIds.length > 0) {
      setProjects((prev) =>
        prev.map((p) => {
          if (assignedSpaceIds.includes(p.id)) {
            const currentMembers = p.members || [];
            if (!currentMembers.includes(newUser.id)) {
              const updatedMembers = [...currentMembers, newUser.id];
              updateProjectInFirestore(p.id, { members: updatedMembers });
              return { ...p, members: updatedMembers };
            }
          }
          return p;
        })
      );
    }
    
    // Auto-initialize new user's corporate inbox config & welcome email threads
    const { welcomeThreads } = initializeUserInboxOnSignup({
      id: newUser.id,
      email: newUser.email,
      name: newUser.name
    });
    setEmailThreads((prev) => [...welcomeThreads, ...prev]);

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
    const existingUser = users.find((x) => x.id === userId);
    const oldRole = existingUser?.role;

    if (updates.password !== undefined && updates.password !== '') {
      const pwdValidation = validatePasswordPolicy(updates.password);
      if (!pwdValidation.isValid) {
        console.warn('Password update rejected due to complexity failure:', pwdValidation.errors);
        return {
          success: false,
          error: `Password security policy violation: ${pwdValidation.errors.join(' ')}`
        };
      }
    }

    setUsers((prev) => {
      const nextUsers = prev.map((u) => {
        if (u.id === userId) {
          const updated = { ...u, ...updates };
          if (currentUser && currentUser.id === userId) {
            setCurrentUser(updated);
            saveToStorage('dolphin_current_user', updated);
          }
          return updated;
        }
        return u;
      });
      saveToStorage('dolphin_users', nextUsers);
      return nextUsers;
    });

    updateUserInFirestore(userId, updates).catch((err) => {
      console.warn('Could not sync user update to firestore:', err);
    });

    const u = existingUser;
    
    if (updates.password) {
      logActivity(
        'reset user credentials / password',
        u ? `${u.name} (${u.email})` : userId,
        'auth',
        undefined,
        undefined,
        `Password credentials reset for user ${u?.name || userId} by ${currentUser?.name || 'Administrator'}`,
        'warning'
      );
    } else if (updates.role && oldRole && oldRole !== updates.role) {
      logActivity(
        'changed user role',
        u ? `${u.name} (${u.email})` : userId,
        'permission',
        undefined,
        undefined,
        `Role privileges modified from "${oldRole}" to "${updates.role}" by ${currentUser?.name || 'Administrator'}`,
        'warning'
      );
    } else {
      logActivity(
        'updated user profile / role',
        u ? `${u.name} (${u.email})` : userId,
        'permission',
        undefined,
        undefined,
        `Updated attributes: ${Object.keys(updates).join(', ')}${updates.role ? ` (Role: ${updates.role})` : ''}`,
        'info'
      );
    }
  };

  const deleteUser = (userId: string) => {
    if (!canDeleteUser(currentUser)) {
      console.warn('Permission denied: Only Workspace Administrators can remove or deactivate users.');
      return;
    }

    const u = users.find((x) => x.id === userId);

    // Save ID to deleted list in state and localStorage
    setDeletedUserIds((prev) => {
      const next = prev.includes(userId) ? prev : [...prev, userId];
      saveToStorage('dolphin_deleted_user_ids', next);
      return next;
    });

    // Update users state and localStorage
    setUsers((prev) => {
      const updated = prev.filter((x) => x.id !== userId);
      saveToStorage('dolphin_users', updated);
      return updated;
    });

    // Delete from Firestore
    deleteUserFromFirestore(userId);

    if (u) {
      logActivity('deactivated tenant user', `${u.name} (${u.email})`, 'permission', undefined, undefined, 'User account removed from tenant directory', 'warning');
    }
  };

  const syncAllUsersToFirestore = async (): Promise<{ success: boolean; count: number; error?: string }> => {
    try {
      const localUsers = loadFromStorage<User[]>('dolphin_users', users);
      const res = await syncAllLocalUsersToFirestore(localUsers);
      if (res.error) {
        return { success: false, count: res.count, error: res.error };
      }
      logActivity('synced users with cloud database', `Synchronized ${res.count} user profiles from local storage to Firebase Firestore`, 'user');
      return { success: true, count: res.count };
    } catch (err: any) {
      return { success: false, count: 0, error: err?.message || String(err) };
    }
  };

  // Projects / Spaces
  const addProject = (projectData: Omit<Project, 'id' | 'progress' | 'spentBudget'> | Project): Project => {
    if (!canCreateSpace(currentUser)) {
      console.warn('Permission denied: Team Members and Viewers cannot create spaces.');
      return null as any;
    }

    const newProj: Project = {
      ...projectData,
      id: ('id' in projectData && projectData.id) ? projectData.id : `proj_${Date.now()}`,
      progress: ('progress' in projectData && typeof projectData.progress === 'number') ? projectData.progress : 0,
      spentBudget: ('spentBudget' in projectData && typeof projectData.spentBudget === 'number') ? projectData.spentBudget : 0
    };
    setProjects((prev) => [newProj, ...prev]);
    logActivity('created project', newProj.title, 'project', newProj.id);
    createProjectInFirestore(newProj);
    return newProj;
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
    if (!canDeleteSpace(currentUser)) {
      console.warn('Permission denied: Only Workspace Administrators can delete project spaces.');
      return;
    }

    const p = projects.find((x) => x.id === id);
    setProjects((prev) => prev.filter((x) => x.id !== id));
    if (p) {
      logActivity('deleted project', p.title, 'project', id);
    }
    deleteProjectFromFirestore(id);
  };

  // Helper to compute next semver style string
  const computeNextVersion = (currentVer: string = 'v1.0', isMajor: boolean = false): string => {
    const clean = currentVer.replace(/^v/, '');
    const parts = clean.split('.').map((p) => parseInt(p, 10) || 0);
    let major = parts[0] || 1;
    let minor = parts[1] || 0;
    if (isMajor) {
      major += 1;
      minor = 0;
    } else {
      minor += 1;
    }
    return `v${major}.${minor}`;
  };

  // Project Templates
  const saveProjectAsTemplate = (
    projectId: string,
    name: string,
    description?: string,
    category?: Project['category'],
    versionOptions?: {
      targetTemplateId?: string;
      versionNote?: string;
      isMajorVersion?: boolean;
    },
    customFieldIds?: string[],
    cleanupRules?: TemplateCleanupRules
  ): ProjectTemplate => {
    const proj = projects.find((p) => p.id === projectId);
    if (!proj) throw new Error('Project not found');

    const projTasks = tasks.filter((t) => t.projectId === projectId);
    const projTaskIds = new Set(projTasks.map((t) => t.id));
    const projStartDate = new Date(proj.startDate).getTime();

    // Determine custom fields to save with template
    const relevantCustomFieldIds = new Set<string>();
    if (customFieldIds && customFieldIds.length > 0) {
      customFieldIds.forEach((id) => relevantCustomFieldIds.add(id));
    } else {
      // Auto-discover all custom fields used in project tasks, plus any active custom fields
      projTasks.forEach((t) => {
        if (t.customFields) {
          Object.keys(t.customFields).forEach((k) => relevantCustomFieldIds.add(k));
        }
      });
      // Also include general workspace custom fields
      customFields.forEach((cf) => relevantCustomFieldIds.add(cf.id));
    }

    const templateCustomFields: CustomFieldDefinition[] = customFields.filter((cf) =>
      relevantCustomFieldIds.has(cf.id)
    );

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
        description: cleanupRules?.clearDescriptionNotes ? '' : (t.description || ''),
        priority: t.priority,
        estimatedHours: cleanupRules?.resetEstimatedHours ? 0 : (t.estimatedHours || 10),
        tags: cleanupRules?.clearCustomTags ? [] : (t.tags || []),
        dayOffset: isNaN(dayOffset) ? 0 : dayOffset,
        durationDays: isNaN(durationDays) ? 5 : durationDays,
        subtasks: taskSubs,
        customFields: t.customFields ? { ...t.customFields } : {},
        listName: t.listName
      };
    });

    const projDeps = dependencies.filter(
      (d) => projTaskIds.has(d.taskId) && projTaskIds.has(d.dependsOnTaskId)
    );

    const templateDeps: TemplateDependency[] = cleanupRules?.clearDependencies
      ? []
      : projDeps.map((d) => ({
          taskTempId: taskIdToTempId[d.taskId],
          dependsOnTaskTempId: taskIdToTempId[d.dependsOnTaskId],
          type: d.type || 'finish_to_start'
        }));

    const projDueDate = new Date(proj.dueDate).getTime();
    const durationMs = projDueDate - projStartDate;
    const estDurationDays = Math.max(1, Math.round(durationMs / (1000 * 60 * 60 * 24))) || 30;

    const targetId = versionOptions?.targetTemplateId;
    const existingTarget = targetId ? projectTemplates.find((t) => t.id === targetId) : undefined;

    if (existingTarget) {
      // Create new version for existing template
      const currentVersionStr = existingTarget.version || 'v1.0';
      const nextVersionStr = computeNextVersion(currentVersionStr, versionOptions?.isMajorVersion);

      const snapshotRecord: TemplateVersionRecord = {
        id: `vr_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        version: currentVersionStr,
        name: existingTarget.name,
        description: existingTarget.description,
        changeSummary: versionOptions?.versionNote || `Updated template version from space structure (${proj.title})`,
        createdAt: existingTarget.createdAt || new Date().toISOString(),
        createdBy: existingTarget.createdBy || currentUser?.name || 'Workspace User',
        tasksCount: existingTarget.tasks.length,
        dependenciesCount: existingTarget.dependencies.length,
        estimatedBudget: existingTarget.estimatedBudget,
        estimatedDurationDays: existingTarget.estimatedDurationDays,
        tasks: [...existingTarget.tasks],
        dependencies: [...existingTarget.dependencies],
        customFields: existingTarget.customFields ? [...existingTarget.customFields] : undefined,
        defaultCleanupRules: cleanupRules || existingTarget.defaultCleanupRules
      };

      const updatedTemplate: ProjectTemplate = {
        ...existingTarget,
        name: name || existingTarget.name,
        description: description || existingTarget.description,
        category: category || existingTarget.category,
        estimatedBudget: proj.budget || existingTarget.estimatedBudget,
        estimatedDurationDays: estDurationDays,
        version: nextVersionStr,
        tasks: templateTasks,
        dependencies: templateDeps,
        customFields: templateCustomFields,
        lists: proj.lists && proj.lists.length > 0 ? [...proj.lists] : existingTarget.lists,
        defaultCleanupRules: cleanupRules || existingTarget.defaultCleanupRules,
        updatedAt: new Date().toISOString(),
        versionHistory: [snapshotRecord, ...(existingTarget.versionHistory || [])]
      };

      setProjectTemplates((prev) => prev.map((t) => (t.id === targetId ? updatedTemplate : t)));
      logActivity('updated template version', `${updatedTemplate.name} (${nextVersionStr})`, 'project', proj.id);
      return updatedTemplate;
    } else {
      // Brand new template
      const initialVer = 'v1.0';
      const initialRecord: TemplateVersionRecord = {
        id: `vr_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        version: initialVer,
        name: name || `${proj.title} Template`,
        description: description || proj.description || `Template generated from ${proj.title}`,
        changeSummary: versionOptions?.versionNote || 'Initial baseline release saved from project workspace structure.',
        createdAt: new Date().toISOString(),
        createdBy: currentUser?.name || 'Workspace User',
        tasksCount: templateTasks.length,
        dependenciesCount: templateDeps.length,
        estimatedBudget: proj.budget || 100000,
        estimatedDurationDays: estDurationDays,
        tasks: [...templateTasks],
        dependencies: [...templateDeps],
        customFields: templateCustomFields,
        defaultCleanupRules: cleanupRules
      };

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
        updatedAt: new Date().toISOString(),
        sourceProjectId: projectId,
        tasks: templateTasks,
        dependencies: templateDeps,
        customFields: templateCustomFields,
        lists: proj.lists && proj.lists.length > 0 ? [...proj.lists] : ['Planning', 'In Progress', 'Testing', 'Handover'],
        version: initialVer,
        defaultCleanupRules: cleanupRules,
        versionHistory: [initialRecord]
      };

      setProjectTemplates((prev) => [newTemplate, ...prev]);
      logActivity('saved project as template', `${newTemplate.name} (${initialVer})`, 'project', proj.id);
      return newTemplate;
    }
  };

  const createProjectTemplate = (templateData: Omit<ProjectTemplate, 'id' | 'createdAt'>): ProjectTemplate => {
    const id = `tpl_${Date.now()}`;
    const initialVer = templateData.version || 'v1.0';

    const initialRecord: TemplateVersionRecord = {
      id: `vr_${Date.now()}_1`,
      version: initialVer,
      name: templateData.name,
      description: templateData.description,
      changeSummary: 'Initial creation of custom project template.',
      createdAt: new Date().toISOString(),
      createdBy: templateData.createdBy || currentUser?.name || 'Workspace User',
      tasksCount: templateData.tasks.length,
      dependenciesCount: templateData.dependencies.length,
      estimatedBudget: templateData.estimatedBudget,
      estimatedDurationDays: templateData.estimatedDurationDays,
      tasks: [...templateData.tasks],
      dependencies: [...templateData.dependencies],
      customFields: templateData.customFields ? [...templateData.customFields] : undefined,
      defaultCleanupRules: templateData.defaultCleanupRules
    };

    const newTemplate: ProjectTemplate = {
      ...templateData,
      id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: initialVer,
      versionHistory: templateData.versionHistory || [initialRecord]
    };

    setProjectTemplates((prev) => [newTemplate, ...prev]);
    logActivity('created project template', newTemplate.name, 'project');
    return newTemplate;
  };

  const updateProjectTemplate = (id: string, updates: Partial<ProjectTemplate>) => {
    setProjectTemplates((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t))
    );
    logActivity('updated project template', updates.name || id, 'project');
  };

  const duplicateProjectTemplate = (templateId: string): ProjectTemplate => {
    const source = projectTemplates.find((t) => t.id === templateId);
    if (!source) throw new Error('Template not found');

    const newId = `tpl_${Date.now()}_copy`;
    const clonedTemplate: ProjectTemplate = {
      ...source,
      id: newId,
      name: `${source.name} (Copy)`,
      createdBy: currentUser?.name || 'Workspace User',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      usageCount: 0,
      lastUsedAt: undefined,
      tasks: source.tasks.map((t) => ({ ...t, customFields: t.customFields ? { ...t.customFields } : {} })),
      dependencies: source.dependencies.map((d) => ({ ...d })),
      customFields: source.customFields ? [...source.customFields] : [],
      lists: source.lists ? [...source.lists] : [],
      versionHistory: []
    };

    setProjectTemplates((prev) => [clonedTemplate, ...prev]);
    logActivity('duplicated project template', clonedTemplate.name, 'project');
    return clonedTemplate;
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
      versionRecordId?: string;
      cleanupRules?: TemplateCleanupRules;
    }
  ): Project => {
    if (!canCreateSpace(currentUser)) {
      console.warn('Permission denied: Team Members and Viewers cannot instantiate spaces.');
      throw new Error('Permission denied: Team Members and Viewers cannot instantiate spaces.');
    }

    const tpl = projectTemplates.find((t) => t.id === templateId);
    if (!tpl) throw new Error('Template not found');

    let sourceTasks = tpl.tasks;
    let sourceDeps = tpl.dependencies;
    let sourceCustomFields = tpl.customFields;

    if (params.versionRecordId && tpl.versionHistory) {
      const vRecord = tpl.versionHistory.find((v) => v.id === params.versionRecordId);
      if (vRecord) {
        sourceTasks = vRecord.tasks;
        sourceDeps = vRecord.dependencies;
        if (vRecord.customFields) {
          sourceCustomFields = vRecord.customFields;
        }
      }
    }

    // Auto-inject missing custom fields from template into global customFields state
    if (sourceCustomFields && sourceCustomFields.length > 0) {
      setCustomFields((prevCfs) => {
        const existingIds = new Set(prevCfs.map((c) => c.id));
        const existingNames = new Set(prevCfs.map((c) => (c?.name || '').toLowerCase()));
        const toAdd: CustomFieldDefinition[] = [];
        sourceCustomFields?.forEach((cf) => {
          if (cf && !existingIds.has(cf.id) && !existingNames.has((cf.name || '').toLowerCase())) {
            toAdd.push(cf);
          }
        });
        if (toAdd.length === 0) return prevCfs;
        const updated = [...prevCfs, ...toAdd];
        saveToStorage('dolphin_custom_fields', updated);
        return updated;
      });
    }

    const cleanup = params.cleanupRules || tpl.defaultCleanupRules || {};

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
      members: [params.managerId],
      lists: tpl.lists && tpl.lists.length > 0 ? [...tpl.lists] : ['Backlog', 'In Progress', 'Testing', 'Completed']
    };

    const tempIdToNewTaskId: Record<string, string> = {};
    const createdTasks: Task[] = [];
    const createdSubtasks: Subtask[] = [];

    sourceTasks.forEach((tt, idx) => {
      const newTaskId = `task_${Date.now()}_${idx}_${Math.floor(Math.random() * 1000)}`;
      tempIdToNewTaskId[tt.tempId] = newTaskId;

      const tStartMs = projStartMs + (tt.dayOffset || 0) * 24 * 60 * 60 * 1000;
      const tDueMs = tStartMs + (tt.durationDays || 5) * 24 * 60 * 60 * 1000;

      const taskAssignees = cleanup.clearAssignments ? [] : [params.managerId];
      const taskTags = cleanup.clearCustomTags ? [] : (tt.tags || []);
      const taskEstHours = cleanup.resetEstimatedHours ? 0 : (tt.estimatedHours || 10);
      const taskDesc = cleanup.clearDescriptionNotes ? '' : (tt.description || '');

      const newTask: Task = {
        id: newTaskId,
        projectId: newProjId,
        companyId: params.companyId,
        title: tt.title,
        description: taskDesc,
        status: 'To Do',
        priority: tt.priority || 'Medium',
        assigneeIds: taskAssignees,
        reporterId: currentUser.id,
        startDate: new Date(tStartMs).toISOString().split('T')[0],
        dueDate: new Date(tDueMs).toISOString().split('T')[0],
        estimatedHours: taskEstHours,
        loggedHours: 0,
        tags: taskTags,
        subtaskCount: tt.subtasks?.length || 0,
        completedSubtasks: 0,
        dependencies: [],
        predecessors: [],
        customFields: tt.customFields ? { ...tt.customFields } : {},
        listName: tt.listName,
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
            assignedTo: cleanup.clearAssignments ? undefined : params.managerId
          });
        });
      }
    });

    const createdDependencies: TaskDependency[] = [];
    if (!cleanup.clearDependencies) {
      sourceDeps.forEach((td, dIdx) => {
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
    }

    setProjects((prev) => [newProject, ...prev]);
    setAllTasks((prev) => [...createdTasks, ...prev]);
    if (createdSubtasks.length > 0) {
      setSubtasks((prev) => [...createdSubtasks, ...prev]);
    }
    if (createdDependencies.length > 0) {
      setDependencies((prev) => [...createdDependencies, ...prev]);
    }

    const cleanupSummary = Object.entries(cleanup)
      .filter(([_, v]) => v)
      .map(([k]) => k)
      .join(', ');

    logActivity(
      'instantiated project from template',
      `${newProject.title} (${tpl.name}) ${cleanupSummary ? `[Cleanup Rules: ${cleanupSummary}]` : ''}`,
      'project',
      newProject.id
    );

    // Update Template Usage Metrics
    setProjectTemplates((prev) =>
      prev.map((t) => {
        if (t.id !== templateId) return t;
        const newUsage = (t.usageCount || 0) + 1;
        const newTotalSpawned = (t.totalTasksSpawned || 0) + createdTasks.length;
        return {
          ...t,
          usageCount: newUsage,
          lastUsedAt: new Date().toISOString(),
          totalTasksSpawned: newTotalSpawned,
          updatedAt: new Date().toISOString()
        };
      })
    );

    createProjectInFirestore(newProject);

    return newProject;
  };

  const rollbackTemplateVersion = (templateId: string, versionRecordId: string) => {
    setProjectTemplates((prev) =>
      prev.map((tpl) => {
        if (tpl.id !== templateId) return tpl;
        const targetRecord = tpl.versionHistory?.find((r) => r.id === versionRecordId);
        if (!targetRecord) return tpl;

        const currentSnapshot: TemplateVersionRecord = {
          id: `vr_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
          version: tpl.version || 'v1.0',
          name: tpl.name,
          description: tpl.description,
          changeSummary: `Automatic pre-rollback snapshot before restoring ${targetRecord.version}`,
          createdAt: new Date().toISOString(),
          createdBy: currentUser?.name || 'Workspace User',
          tasksCount: tpl.tasks.length,
          dependenciesCount: tpl.dependencies.length,
          estimatedBudget: tpl.estimatedBudget,
          estimatedDurationDays: tpl.estimatedDurationDays,
          tasks: [...tpl.tasks],
          dependencies: [...tpl.dependencies]
        };

        const restoredVersionStr = `${targetRecord.version}-restored`;

        return {
          ...tpl,
          name: targetRecord.name,
          description: targetRecord.description,
          estimatedBudget: targetRecord.estimatedBudget,
          estimatedDurationDays: targetRecord.estimatedDurationDays,
          version: restoredVersionStr,
          tasks: [...targetRecord.tasks],
          dependencies: [...targetRecord.dependencies],
          versionHistory: [currentSnapshot, ...(tpl.versionHistory || [])]
        };
      })
    );
    logActivity('restored template version', `Template ${templateId} rolled back to version record ${versionRecordId}`, 'project');
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
      completedAt: taskData.status === 'Done' ? new Date().toISOString() : undefined,
    };
    setAllTasks((prev) => [newTask, ...prev]);
    logActivity('created task', newTask.title, 'task', newTask.projectId, newTask.id);

    // Dispatch Email Notification to Assignees
    if (newTask.assigneeIds && newTask.assigneeIds.length > 0) {
      const proj = projects.find((p) => p.id === newTask.projectId);
      newTask.assigneeIds.forEach((assigneeId) => {
        const targetUser = users.find((u) => u.id === assigneeId || (u?.email || '').toLowerCase() === String(assigneeId || '').toLowerCase());
        const targetEmail = targetUser?.email || (assigneeId.includes('@') ? assigneeId : undefined);
        if (targetEmail) {
          dispatchEmailNotification({
            toEmail: targetEmail,
            toName: targetUser?.name || targetEmail,
            subject: `New Task Assigned: "${newTask.title}"`,
            body: `Hello ${targetUser?.name || targetEmail},

You have been assigned to task "${newTask.title}" in project "${proj?.title || 'Workspace'}".

Priority: ${newTask.priority}
Start Date: ${newTask.startDate || 'Immediate'}
Due Date: ${newTask.dueDate || 'N/A'}

Task Description:
${newTask.description || 'No detailed description provided.'}

Log in to your workspace dashboard to view full task details and track progress.`,
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

    setAllTasks((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          const completedAtVal = updates.status === 'Done'
            ? (t.completedAt || new Date().toISOString())
            : (updates.status ? undefined : t.completedAt);
          const updated = { ...t, ...updates, updatedAt: new Date().toISOString(), completedAt: completedAtVal };
          if (updates.status && updates.status !== t.status) {
            logActivity(`changed status of task "${t.title}" to`, updates.status, 'task', t.projectId, t.id);

            // Trigger Email Notification if marked Done / Closed
            if (updates.status === 'Done') {
              const proj = projects.find((p) => p.id === t.projectId);
              const manager = users.find((u) => u.id === proj?.managerId) || currentUser;
              const assigneeEmails = (t.assigneeIds || []).map((aid) => {
                const u = users.find((usr) => usr.id === aid || (usr?.email || '').toLowerCase() === String(aid || '').toLowerCase());
                return u?.email || (aid.includes('@') ? aid : null);
              }).filter(Boolean) as string[];
              
              const reporterUser = users.find((u) => u.id === t.reporterId);
              const recipientEmails = Array.from(new Set([manager?.email, reporterUser?.email, ...assigneeEmails, currentUser?.email].filter(Boolean) as string[]));

              recipientEmails.forEach((targetEmail) => {
                const targetUser = users.find((u) => (u?.email || '').toLowerCase() === String(targetEmail || '').toLowerCase());
                dispatchEmailNotification({
                  toEmail: targetEmail,
                  toName: targetUser?.name || targetEmail,
                  subject: `Task Closed & Completed: "${t.title}"`,
                  body: `Hello ${targetUser?.name || targetEmail},

Task "${t.title}" has been officially CLOSED & marked as Completed!

Project: ${proj?.title || 'Workspace'}
Status: Done / Closed
Completed By: ${currentUser?.name || 'Workspace User'} (${currentUser?.email || 'user'})
Completion Date: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}

Dependencies and project progress meters have been updated in the workspace.`,
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
          if (updates.assigneeIds) {
            const oldAssignees = new Set(t.assigneeIds || []);
            const newlyAdded = updates.assigneeIds.filter((aid) => !oldAssignees.has(aid));
            if (newlyAdded.length > 0) {
              const proj = projects.find((p) => p.id === t.projectId);
              newlyAdded.forEach((aid) => {
                const targetUser = users.find((u) => u.id === aid || (u?.email || '').toLowerCase() === String(aid || '').toLowerCase());
                const targetEmail = targetUser?.email || (aid.includes('@') ? aid : undefined);
                if (targetEmail) {
                  dispatchEmailNotification({
                    toEmail: targetEmail,
                    toName: targetUser?.name || targetEmail,
                    subject: `Task Assigned: "${t.title}"`,
                    body: `Hello ${targetUser?.name || targetEmail},

You have been assigned to task "${t.title}" in project "${proj?.title || 'Workspace'}".

Priority: ${t.priority}
Due Date: ${t.dueDate || 'N/A'}

Task Description:
${t.description || 'No detailed description provided.'}

Log into your workspace dashboard to review the task details.`,
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

  const reorderTasks = (newActiveTasks: Task[]) => {
    setAllTasks((prev) => {
      const softDeleted = prev.filter((t) => t.isDeleted);
      return [...newActiveTasks, ...softDeleted];
    });
    logActivity('reordered tasks in Kanban view', 'Updated task priority sequence', 'task');
  };

  // Custom Fields Management
  const addCustomField = (field: Omit<CustomFieldDefinition, 'id'>) => {
    const newField: CustomFieldDefinition = {
      ...field,
      id: `cf_${Date.now()}`
    };
    setCustomFields((prev) => [...prev, newField]);
    logActivity('created custom field', `Created custom field "${newField.name}" (${newField.type})`, 'task');
  };

  const updateCustomField = (id: string, updates: Partial<CustomFieldDefinition>) => {
    setCustomFields((prev) =>
      prev.map((f) => (f.id === id ? { ...f, ...updates } : f))
    );
    logActivity('updated custom field', `Updated custom field configuration`, 'task');
  };

  const deleteCustomField = (id: string) => {
    const target = customFields.find((f) => f.id === id);
    setCustomFields((prev) => prev.filter((f) => f.id !== id));
    if (target) {
      logActivity('deleted custom field', `Deleted custom field "${target.name}"`, 'task');
    }
  };

  // Sprints Management
  const addSprint = (sprintData: Omit<Sprint, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newSprint: Sprint = {
      ...sprintData,
      id: `sprint_${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setSprints((prev) => {
      const updated = [...prev, newSprint];
      saveToStorage('dolphin_sprints', updated);
      return updated;
    });
    logActivity('created sprint', `Created sprint "${newSprint.name}"`, 'project', newSprint.projectId);
    return newSprint;
  };

  const updateSprint = (id: string, updates: Partial<Sprint>) => {
    setSprints((prev) => {
      const updated = prev.map((s) => (s.id === id ? { ...s, ...updates, updatedAt: new Date().toISOString() } : s));
      saveToStorage('dolphin_sprints', updated);
      return updated;
    });
    logActivity('updated sprint', `Updated sprint details`, 'project');
  };

  const deleteSprint = (id: string) => {
    const s = sprints.find((x) => x.id === id);
    setSprints((prev) => {
      const filtered = prev.filter((x) => x.id !== id);
      saveToStorage('dolphin_sprints', filtered);
      return filtered;
    });
    // Move tasks linked to this sprint to backlog
    setAllTasks((prev) => prev.map((t) => (t.sprintId === id ? { ...t, sprintId: null } : t)));
    if (s) {
      logActivity('deleted sprint', `Deleted sprint "${s.name}" (tasks moved to backlog)`, 'project', s.projectId);
    }
  };

  const completeSprint = (id: string, rolloverToSprintId?: string | null) => {
    const sprint = sprints.find((s) => s.id === id);
    if (!sprint) return;

    // Calculate completed points
    const sprintTasks = tasks.filter((t) => t.sprintId === id);
    const completedTasks = sprintTasks.filter((t) => t.status === 'Done');
    const completedPoints = completedTasks.reduce((sum, t) => sum + (t.storyPoints || Math.ceil((t.estimatedHours || 8) / 4)), 0);

    // Update sprint to completed
    updateSprint(id, {
      status: 'completed',
      completedStoryPoints: completedPoints
    });

    // Rollover incomplete tasks to rolloverToSprintId or null (backlog)
    if (rolloverToSprintId !== undefined) {
      setAllTasks((prev) =>
        prev.map((t) => {
          if (t.sprintId === id && t.status !== 'Done') {
            return { ...t, sprintId: rolloverToSprintId || null, updatedAt: new Date().toISOString() };
          }
          return t;
        })
      );
    }

    logActivity('completed sprint', `Sprint "${sprint.name}" completed with ${completedTasks.length}/${sprintTasks.length} tasks finished`, 'project', sprint.projectId);
  };

  const moveTaskToSprint = (taskId: string, sprintId: string | null) => {
    updateTask(taskId, { sprintId });
    const targetSprint = sprintId ? sprints.find((s) => s.id === sprintId) : null;
    const task = allTasks.find((t) => t.id === taskId);
    logActivity(
      'moved task sprint assignment',
      `Moved "${task?.title || taskId}" to ${targetSprint ? `Sprint "${targetSprint.name}"` : 'Backlog'}`,
      'task',
      task?.projectId,
      taskId
    );
  };

  // Soft Delete Task: Instead of permanent deletion, marks task as isDeleted: true with timestamp and deleting user
  const deleteTask = (id: string) => {
    if (!canDeleteTask(currentUser)) {
      console.warn('Permission denied: Team Members cannot delete tasks. Contact your Project Manager or Admin.');
      return;
    }

    const t = allTasks.find((x) => x.id === id);
    const p = t ? projects.find((proj) => proj.id === t.projectId) : null;
    const now = new Date().toISOString();
    const deletedBy = currentUser ? currentUser.id : 'usr_admin';
    const deletedByName = currentUser ? currentUser.name : 'Workspace Admin';

    // Update in-memory allTasks list
    setAllTasks((prev) =>
      prev.map((task) =>
        task.id === id
          ? {
              ...task,
              isDeleted: true,
              deletedAt: now,
              deletedBy,
              deletedByName,
              updatedAt: now
            }
          : task
      )
    );

    if (t) {
      logActivity(
        'deleted task (moved to Recycle Bin)',
        t.title,
        'task',
        t.projectId,
        t.id,
        `Task "${t.title}" (Priority: ${t.priority}, Status: ${t.status}) moved to Recycle Bin by ${deletedByName}. Retained for 30 days before permanent auto-purge.`,
        'warning'
      );
    }
    // Persist soft-delete status to Firestore
    softDeleteTaskInFirestore(id, deletedBy, deletedByName);
  };

  // Restore task from Recycle Bin back to active status
  const restoreTask = (id: string) => {
    const t = allTasks.find((x) => x.id === id);
    const now = new Date().toISOString();

    setAllTasks((prev) =>
      prev.map((task) =>
        task.id === id
          ? {
              ...task,
              isDeleted: false,
              deletedAt: undefined,
              deletedBy: undefined,
              deletedByName: undefined,
              updatedAt: now
            }
          : task
      )
    );

    if (t) {
      logActivity(
        'restored task from Recycle Bin',
        t.title,
        'task',
        t.projectId,
        t.id,
        `Task "${t.title}" restored to active status by ${currentUser?.name || 'Admin'}`,
        'info'
      );
    }
    restoreTaskInFirestore(id);
  };

  // Bulk restore multiple tasks from Recycle Bin
  const bulkRestoreTasks = (ids: string[]) => {
    if (!ids || ids.length === 0) return;
    const now = new Date().toISOString();

    setAllTasks((prev) =>
      prev.map((task) =>
        ids.includes(task.id)
          ? {
              ...task,
              isDeleted: false,
              deletedAt: undefined,
              deletedBy: undefined,
              deletedByName: undefined,
              updatedAt: now
            }
          : task
      )
    );

    ids.forEach((id) => {
      restoreTaskInFirestore(id);
    });

    logActivity(
      'bulk restored tasks from Recycle Bin',
      `${ids.length} task(s) restored to active workspaces`,
      'task',
      undefined,
      undefined,
      `Restored ${ids.length} tasks by ${currentUser?.name || 'Admin'}`,
      'info'
    );
  };

  // Permanent Purge: Admin removes task completely from database
  const purgeTask = (id: string) => {
    const t = allTasks.find((x) => x.id === id);
    setAllTasks((prev) => prev.filter((x) => x.id !== id));
    setSubtasks((prev) => prev.filter((s) => s.taskId !== id));
    setDependencies((prev) => prev.filter((d) => d.taskId !== id && d.dependsOnTaskId !== id));

    if (t) {
      logActivity(
        'permanently purged task',
        t.title,
        'task',
        t.projectId,
        t.id,
        `Task "${t.title}" permanently erased from database by ${currentUser?.name || 'Admin'}`,
        'critical'
      );
    }
    deleteTaskFromFirestore(id);
  };

  // Bulk permanent purge of selected tasks
  const bulkPurgeTasks = (ids: string[]) => {
    if (!ids || ids.length === 0) return;
    setAllTasks((prev) => prev.filter((x) => !ids.includes(x.id)));
    setSubtasks((prev) => prev.filter((s) => !ids.includes(s.taskId)));
    setDependencies((prev) => prev.filter((d) => !ids.includes(d.taskId) && !ids.includes(d.dependsOnTaskId)));

    ids.forEach((id) => {
      deleteTaskFromFirestore(id);
    });

    logActivity(
      'bulk purged tasks from database',
      `${ids.length} task(s) permanently destroyed`,
      'task',
      undefined,
      undefined,
      `Permanently purged ${ids.length} task(s) by ${currentUser?.name || 'Admin'}`,
      'critical'
    );
  };

  // Empty entire Recycle Bin (permanently purge all soft-deleted items)
  const emptyRecycleBin = () => {
    const deleted = allTasks.filter((t) => !!t.isDeleted);
    if (deleted.length === 0) return;
    const deletedIds = deleted.map((t) => t.id);
    bulkPurgeTasks(deletedIds);
  };

  // Auto-purge tasks older than 30 days
  const purgeExpiredTasks = async (): Promise<number> => {
    const purgedIds = await purgeExpiredTasksFromFirestore(allTasks);
    if (purgedIds.length > 0) {
      setAllTasks((prev) => prev.filter((t) => !purgedIds.includes(t.id)));
      setSubtasks((prev) => prev.filter((s) => !purgedIds.includes(s.taskId)));
      setDependencies((prev) => prev.filter((d) => !purgedIds.includes(d.taskId) && !purgedIds.includes(d.dependsOnTaskId)));

      logActivity(
        'auto-purged expired tasks (>30 days)',
        `${purgedIds.length} task(s) permanently cleaned up from Recycle Bin`,
        'system',
        undefined,
        undefined,
        `Purged ${purgedIds.length} expired task documents older than 30 days retention window`,
        'info'
      );
    }
    return purgedIds.length;
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

  const addTaskComment = (taskId: string, content: string) => {
    const newComment: TaskComment = {
      id: `cmt_${Date.now()}`,
      taskId,
      userId: currentUser ? currentUser.id : 'usr_pk',
      userName: currentUser ? currentUser.name : 'Workspace User',
      userAvatar: currentUser ? currentUser.avatar : 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      content,
      createdAt: new Date().toISOString()
    };
    setTaskComments((prev) => [...prev, newComment]);
    logActivity('added task comment', content.slice(0, 30), 'task', undefined, taskId);
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
    setAllTasks((prev) =>
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
      setAllTasks((prev) =>
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
      setAllTasks(currentTasks);
      logActivity(
        'recalculated project timeline (Finish-to-Start)',
        `Auto-adjusted ${adjustedCount} task schedules based on Finish-to-Start dependencies`,
        'task',
        targetProjectId
      );
    }

    return { adjustedCount, updatedTasks: currentTasks };
  };

  const seedDemoTasksForProject = (targetProjectId?: string) => {
    const projId = targetProjectId || selectedProjectId || projects[0]?.id || 'proj_1';
    const proj = projects.find((p) => p.id === projId);
    const compId = proj ? proj.companyId : 'comp_1';

    const todayStr = new Date().toISOString().split('T')[0];
    const in3Days = new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0];
    const in7Days = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];
    const in14Days = new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0];

    const sampleDeliverables = [
      {
        title: `Kickoff & Requirements Discovery for ${proj?.title || 'Project'}`,
        description: 'Establish core scope, stakeholder expectations, deliverable milestones, and team assignments.',
        status: 'Done' as TaskStatus,
        priority: 'High' as Priority,
        assigneeIds: ['usr_pk'],
        reporterId: 'usr_1',
        startDate: todayStr,
        dueDate: in3Days,
        estimatedHours: 12,
        tags: ['Discovery', 'Milestone'],
        isMilestone: true,
        isCriticalPath: true,
      },
      {
        title: 'System Architecture & Technical Design Specification',
        description: 'Define component breakdown, API endpoints, data models, and security compliance standards.',
        status: 'In Progress' as TaskStatus,
        priority: 'Urgent' as Priority,
        assigneeIds: ['usr_ta', 'usr_pk'],
        reporterId: 'usr_1',
        startDate: todayStr,
        dueDate: in7Days,
        estimatedHours: 24,
        tags: ['Architecture', 'Design'],
        isCriticalPath: true,
      },
      {
        title: 'Frontend Component UI & Interactive Wireframes',
        description: 'Design responsive UI views for Kanban, List, and Gantt schedule charts with accessible styling.',
        status: 'To Do' as TaskStatus,
        priority: 'High' as Priority,
        assigneeIds: ['usr_sa'],
        reporterId: 'usr_1',
        startDate: in3Days,
        dueDate: in14Days,
        estimatedHours: 32,
        tags: ['UI/UX', 'Frontend'],
      },
      {
        title: 'Integration Testing & Quality Assurance Review',
        description: 'Perform end-to-end regression testing, validation engine checks, and performance optimizations.',
        status: 'Backlog' as TaskStatus,
        priority: 'Medium' as Priority,
        assigneeIds: ['usr_fz'],
        reporterId: 'usr_1',
        startDate: in7Days,
        dueDate: in14Days,
        estimatedHours: 16,
        tags: ['QA', 'Testing'],
      },
    ];

    sampleDeliverables.forEach((item) => {
      addTask({
        projectId: projId,
        companyId: compId,
        ...item
      });
    });

    logActivity('loaded demo project deliverables', `Added 4 sample tasks to project "${proj?.title || projId}"`, 'project', projId);
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
    localStorage.removeItem('dolphin_active_timer');
  };

  const discardTimer = () => {
    setTimer({
      active: false,
      taskId: null,
      taskTitle: null,
      seconds: 0,
      startTime: null,
    });
    localStorage.removeItem('dolphin_active_timer');
    logActivity('discarded active timer session', 'Stopwatch stopped without saving', 'task');
  };

  const deleteTimeEntry = (id: string) => {
    const target = timeEntries.find((e) => e.id === id);
    if (target) {
      const task = tasks.find((t) => t.id === target.taskId);
      if (task && task.loggedHours) {
        updateTask(task.id, { loggedHours: Math.max(0, Math.round(((task.loggedHours || 0) - target.hours) * 100) / 100) });
      }
      setTimeEntries((prev) => prev.filter((e) => e.id !== id));
      logActivity('deleted time log entry', `${target.hours} hrs`, 'task', target.projectId, target.taskId);
    }
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
        const query = String(et.suggestedAssignee || '').toLowerCase();
        const matched = users.find(
          (u) =>
            (u?.name || '').toLowerCase().includes(query) ||
            (u?.department || '').toLowerCase().includes(query) ||
            (u?.email || '').toLowerCase().includes(query)
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

      setAllTasks((prev) => [newTask, ...prev]);
      createTaskInFirestore(newTask);
      count++;
    });

    logActivity('imported AI tasks', `${count} tasks extracted from PDF/Spec document for "${project.title}"`, 'ai', projectId);
    return count;
  };

  // Background utility: Auto-prune system notifications and task notifications older than 30 days
  const cleanupOldInboxNotifications = useCallback((maxAgeDays: number = 30) => {
    const cutoffTime = Date.now() - maxAgeDays * 24 * 60 * 60 * 1000;
    let archivedCount = 0;
    let deletedCount = 0;

    // 1. Cleanup Email Threads / Task Notifications in Inbox
    setEmailThreads((prev) => {
      let changed = false;
      const updated = prev.map((thread) => {
        if (!thread.timestamp) return thread;
        const threadTime = new Date(thread.timestamp).getTime();

        if (threadTime < cutoffTime) {
          // If in active inbox or sent folder, auto-archive to keep inbox uncluttered
          if (thread.folder === 'inbox' || thread.folder === 'sent') {
            changed = true;
            archivedCount++;
            return { ...thread, folder: 'archived' as const };
          }
          // If already in trash or archived and older than 60 days, auto-delete permanently
          if (thread.folder === 'trash' || (thread.folder === 'archived' && threadTime < Date.now() - 60 * 24 * 60 * 60 * 1000)) {
            changed = true;
            deletedCount++;
            return null;
          }
        }
        return thread;
      }).filter(Boolean) as EmailThread[];

      if (changed) {
        saveToStorage('dolphin_emails', updated);
      }
      return changed ? updated : prev;
    });

    // 2. Cleanup System Notifications older than maxAgeDays
    setNotifications((prev) => {
      const filtered = prev.filter((n) => {
        if (!n.createdAt) return true;
        const createdTime = new Date(n.createdAt).getTime();
        if (createdTime < cutoffTime) {
          deletedCount++;
          return false;
        }
        return true;
      });

      if (filtered.length !== prev.length) {
        saveToStorage('dolphin_notifs', filtered);
      }
      return filtered;
    });

    if (archivedCount > 0 || deletedCount > 0) {
      logActivity(
        'ran background inbox cleanup',
        `Auto-archived ${archivedCount} and deleted ${deletedCount} task notifications/threads older than ${maxAgeDays} days`,
        'system'
      );
    }

    return { archivedCount, deletedCount };
  }, [logActivity]);

  useEffect(() => {
    cleanupOldInboxNotifications(30);
  }, []);

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
    const newNotifsToAdd: Notification[] = [];

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
        const type = isOverdue ? 'overdue' : 'due_reminder';
        const title = isOverdue ? `Overdue Task: ${task.title}` : `Upcoming Due Date: ${task.title}`;
        const message = isOverdue
          ? `Task "${task.title}" was due on ${task.dueDate}. Priority: ${task.priority}.`
          : `Task "${task.title}" is due on ${task.dueDate} (${task.priority} priority).`;

        newNotifsToAdd.push({
          id: `notif_due_${task.id}_${task.dueDate}`,
          userId: currentUser?.id || 'usr_1',
          title,
          message,
          type,
          read: false,
          taskId: task.id,
          projectId: task.projectId,
          createdAt: now.toISOString(),
        });
      }
    });

    if (newNotifsToAdd.length > 0) {
      setNotifications((prev) => {
        const existingTaskIds = new Set(prev.filter((n) => !n.read).map((n) => n.taskId));
        const filteredNew = newNotifsToAdd.filter((n) => n.taskId && !existingTaskIds.has(n.taskId));
        if (filteredNew.length === 0) return prev;
        const updated = [...filteredNew, ...prev];
        saveToStorage('dolphin_notifs', updated);

        // Trigger native browser notification for new alerts
        if (notificationSettings.enableBrowserNotifs && 'Notification' in window && window.Notification.permission === 'granted') {
          try {
            filteredNew.forEach((notif) => {
              new window.Notification(notif.title, {
                body: notif.message,
                icon: '/favicon.ico',
              });
            });
          } catch (e) {
            console.warn('Browser notification trigger warning:', e);
          }
        }

        return updated;
      });
    }
  }, [tasks, snoozedTasks, notificationSettings.leadDays, notificationSettings.enableBrowserNotifs, currentUser?.id]);

  const triggerDailyOverdueCheck = useCallback((forceSend: boolean = false) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const lastCheckDate = localStorage.getItem('dolphin_last_daily_overdue_check_date');

    if (!forceSend && lastCheckDate === todayStr) {
      return { success: true, count: 0, emailsSent: 0, message: 'Daily overdue check already completed today.' };
    }

    const overdueTasks = tasks.filter((t) => {
      if (t.status === 'Done' || !t.dueDate) return false;
      return t.dueDate < todayStr;
    });

    if (overdueTasks.length === 0) {
      saveToStorage('dolphin_last_daily_overdue_check_date', todayStr);
      return { success: true, count: 0, emailsSent: 0, message: 'No overdue tasks found today.' };
    }

    // Group overdue tasks by assigned user email
    const userOverdueMap = new Map<string, { user?: User; tasks: Task[] }>();

    overdueTasks.forEach((task) => {
      const assignees = (task.assigneeIds && task.assigneeIds.length > 0)
        ? task.assigneeIds
        : [currentUser?.id || 'usr_1'];

      assignees.forEach((aid) => {
        const u = users.find((usr) => usr.id === aid || (usr?.email || '').toLowerCase() === String(aid || '').toLowerCase());
        const email = u?.email || (aid.includes('@') ? aid : currentUser?.email || 'dolphingroup786@gmail.com');

        if (!userOverdueMap.has(email)) {
          userOverdueMap.set(email, { user: u, tasks: [] });
        }
        const entry = userOverdueMap.get(email)!;
        if (!entry.tasks.some((t) => t.id === task.id)) {
          entry.tasks.push(task);
        }
      });
    });

    let emailsSent = 0;

    userOverdueMap.forEach(({ user, tasks: userTasks }, recipientEmail) => {
      const recipientName = user?.name || recipientEmail.split('@')[0];
      const taskListText = userTasks
        .map((t) => {
          const proj = projects.find((p) => p.id === t.projectId);
          return `- "${t.title}" | Space: ${proj?.title || 'Workspace'} | Priority: ${t.priority} | Due Date: ${t.dueDate}`;
        })
        .join('\n');

      const bodyText = `Hello ${recipientName},

This is your Daily Overdue Tasks Summary Notification from Dolphin Global Holdings Command Center.

You currently have ${userTasks.length} OVERDUE task(s) requiring immediate attention:

LIST OF OVERDUE TASKS:
${taskListText}

Please log into your workspace dashboard to update task status or adjust target deadlines.`;

      dispatchEmailNotification({
        toEmail: recipientEmail,
        toName: recipientName,
        subject: `Daily Overdue Tasks Alert: ${userTasks.length} Overdue Task(s) Pending`,
        body: bodyText,
        category: 'Overdue Alert',
        relatedTaskId: userTasks[0]?.id,
        relatedProjectId: userTasks[0]?.projectId
      });

      emailsSent++;
    });

    saveToStorage('dolphin_last_daily_overdue_check_date', todayStr);
    logActivity('executed daily overdue tasks email alert', `Dispatched ${emailsSent} overdue notification email(s) for ${overdueTasks.length} overdue task(s)`, 'system');

    return {
      success: true,
      count: overdueTasks.length,
      emailsSent,
      message: `Dispatched ${emailsSent} daily overdue notification email(s) for ${overdueTasks.length} overdue task(s).`
    };
  }, [tasks, users, projects, currentUser?.id, currentUser?.email, dispatchEmailNotification, logActivity]);

  useEffect(() => {
    triggerUpcomingDueCheck();
    if (tasks.length > 0) {
      triggerDailyOverdueCheck(false);
    }
    // Run automated 30-day Recycle Bin purge check on mount and hourly
    purgeExpiredTasks();
    const interval = setInterval(() => {
      triggerUpcomingDueCheck();
    }, 60000);
    const purgeInterval = setInterval(() => {
      purgeExpiredTasks();
    }, 60 * 60 * 1000);
    return () => {
      clearInterval(interval);
      clearInterval(purgeInterval);
    };
  }, []);

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
  const initializeUserInboxForUser = useCallback((user: { id: string; email: string; name: string }) => {
    const { inboxConfig, welcomeThreads } = initializeUserInboxOnSignup(user);
    setUserInboxConfig(inboxConfig);
    setEmailConfig(inboxConfig.emailConfig);
    saveUserInboxConfig(inboxConfig);

    setEmailThreads((prev) => {
      const existingIds = new Set(prev.map((e) => e.id));
      const newWelcome = welcomeThreads.filter((wt) => !existingIds.has(wt.id));
      if (newWelcome.length > 0) {
        return [...newWelcome, ...prev];
      }
      return prev;
    });

    return inboxConfig;
  }, []);

  const updateUserInboxConfig = (updates: Partial<UserInboxConfig>) => {
    setUserInboxConfig((prev) => {
      const next = { ...prev, ...updates };
      saveUserInboxConfig(next);
      if (updates.emailConfig) {
        setEmailConfig(updates.emailConfig);
      }
      return next;
    });
  };

  const updateEmailConfig = (updates: Partial<EmailConfig>) => {
    setEmailConfig((prev) => {
      const next = { ...prev, ...updates };
      setUserInboxConfig((uPrev) => {
        const uNext = { ...uPrev, emailConfig: next };
        saveUserInboxConfig(uNext);
        return uNext;
      });
      return next;
    });
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

    setAllTasks((prev) => [newTask, ...prev]);
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

  const clearEmailThreads = () => {
    setEmailThreads([]);
    localStorage.removeItem('dolphin_emails');
    logActivity('cleared inbox emails', 'Emptied sample email threads', 'system');
  };

  // Clear all old sample data to start fresh with real projects and activities
  const clearAllData = () => {
    setProjects([]);
    setAllTasks([]);
    setSubtasks([]);
    setSprints([]);
    setTaskComments([]);
    setDependencies([]);
    setFiles([]);
    setTimeEntries([]);
    setActivityLogs([]);
    setNotifications([]);
    setEmailThreads([]);
    setSelectedProjectId(null);

    // Clear local storage
    localStorage.removeItem('dolphin_projects');
    localStorage.removeItem('dolphin_tasks');
    localStorage.removeItem('dolphin_subtasks');
    localStorage.removeItem('dolphin_sprints');
    localStorage.removeItem('dolphin_task_comments');
    localStorage.removeItem('dolphin_dependencies');
    localStorage.removeItem('dolphin_files');
    localStorage.removeItem('dolphin_time_entries');
    localStorage.removeItem('dolphin_logs');
    localStorage.removeItem('dolphin_notifs');
    localStorage.removeItem('dolphin_emails');

    // Clear Firestore if connected
    clearAllFirestoreData();

    logActivity('cleared old sample data', 'Workspace reset for fresh real data entry', 'system');
  };

  // Restore all master workspaces, companies, DHT-Ajman projects, and task registries
  const restoreAllWorkspaceData = async () => {
    // 1. Reset all state in memory
    setCompanies(INITIAL_COMPANIES);
    setProjects(INITIAL_PROJECTS);
    setAllTasks(INITIAL_TASKS);
    setSubtasks(INITIAL_SUBTASKS);
    setDependencies(INITIAL_DEPENDENCIES);
    setFiles(INITIAL_FILES);
    setTimeEntries(INITIAL_TIME_ENTRIES);
    setCustomFields(INITIAL_CUSTOM_FIELDS);
    setSprints(INITIAL_SPRINTS);
    setEmailThreads(INITIAL_EMAIL_THREADS);

    const dhtWorkspace = INITIAL_COMPANIES.find((c) => c.id === 'comp_dht') || INITIAL_COMPANIES[3];
    setActiveCompany(dhtWorkspace);
    setSelectedProjectId('proj_dht_akkas');

    // 2. Persist to LocalStorage
    saveToStorage('dolphin_companies', INITIAL_COMPANIES);
    saveToStorage('dolphin_projects', INITIAL_PROJECTS);
    saveToStorage('dolphin_tasks', INITIAL_TASKS);
    saveToStorage('dolphin_subtasks', INITIAL_SUBTASKS);
    saveToStorage('dolphin_dependencies', INITIAL_DEPENDENCIES);
    saveToStorage('dolphin_files', INITIAL_FILES);
    saveToStorage('dolphin_time_entries', INITIAL_TIME_ENTRIES);
    saveToStorage('dolphin_custom_fields', INITIAL_CUSTOM_FIELDS);
    saveToStorage('dolphin_sprints', INITIAL_SPRINTS);
    saveToStorage('dolphin_emails', INITIAL_EMAIL_THREADS);
    saveToStorage('dolphin_active_company', dhtWorkspace);

    // 3. Force populate in Firestore
    try {
      await forceRestoreFirestoreData(
        INITIAL_PROJECTS,
        INITIAL_TASKS,
        INITIAL_FILES,
        INITIAL_USERS,
        INITIAL_COMPANIES
      );
    } catch (err) {
      console.warn('Firestore restore warning:', err);
    }

    logActivity('restored all workspaces', 'Master enterprise workspaces, DHT-Ajman projects, and task registries restored from archive.', 'system');
  };

  return (
    <AppContext.Provider
      value={{
        clearAllData,
        restoreAllWorkspaceData,
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
        syncAllUsersToFirestore,
        validateDomain,
        inviteUser,
        dispatchEmailNotification,
        projects,
        addProject,
        updateProject,
        deleteProject,
        addListToProject,
        projectTemplates,
        saveProjectAsTemplate,
        createProjectTemplate,
        updateProjectTemplate,
        duplicateProjectTemplate,
        instantiateProjectFromTemplate,
        deleteProjectTemplate,
        rollbackTemplateVersion,
        tasks,
        deletedTasks,
        allTasks,
        subtasks,
        taskComments,
        dependencies,
        addTask,
        updateTask,
        reorderTasks,
        deleteTask,
        restoreTask,
        bulkRestoreTasks,
        purgeTask,
        bulkPurgeTasks,
        emptyRecycleBin,
        purgeExpiredTasks,
        addSubtask,
        toggleSubtask,
        addTaskComment,
        addDependency,
        removeDependency,
        recalculateProjectTimeline,
        seedDemoTasksForProject,
        customFields,
        addCustomField,
        updateCustomField,
        deleteCustomField,
        sprints,
        addSprint,
        updateSprint,
        deleteSprint,
        completeSprint,
        moveTaskToSprint,
        timer,
        startTimer,
        stopTimer,
        discardTimer,
        logTimeManual,
        deleteTimeEntry,
        timeEntries,
        files,
        addFile,
        uploadFileVersion,
        revertFileVersion,
        deleteFile,
        importTasksFromAI,
        activityLogs,
        logActivity,
        clearActivityLogs,
        isActivityDrawerOpen,
        setIsActivityDrawerOpen,
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
        triggerDailyOverdueCheck,
        automations,
        toggleAutomation,
        addAutomation,
        emailThreads,
        emailConfig,
        userInboxConfig,
        updateEmailConfig,
        updateUserInboxConfig,
        initializeUserInboxForUser,
        linkEmailToTask,
        unlinkEmailFromTask,
        convertEmailToTask,
        sendEmailReply,
        composeNewEmail,
        toggleStarEmail,
        toggleUnreadEmail,
        deleteEmailThread,
        clearEmailThreads,
        cleanupOldInboxNotifications,
        activeTab,
        setActiveTab,
        selectedProjectId,
        setSelectedProjectId,
        selectedListFilter,
        setSelectedListFilter,
        searchQuery,
        setSearchQuery,
        isCommandPaletteOpen,
        setCommandPaletteOpen,
        toggleCommandPalette,
        isAuthenticated,
        setIsAuthenticated,
        logout,
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
