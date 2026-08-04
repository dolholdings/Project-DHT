import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut, User as FirebaseUser } from 'firebase/auth';
import { auth, googleProvider, testFirestoreConnection, handleFirestoreError, OperationType } from '../lib/firebase';
import firebaseConfig from '../../firebase-applet-config.json';
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
  APPROVED_DOMAINS,
  CompanyDomain,
  TaskStatus
} from '../types';

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
import {
  createProjectInFirestore,
  updateProjectInFirestore,
  deleteProjectFromFirestore,
  createTaskInFirestore,
  updateTaskInFirestore,
  deleteTaskFromFirestore,
  subscribeToProjects,
  subscribeToTasks,
  seedInitialFirestoreData,
} from '../services/dataService';

interface TimerState {
  active: boolean;
  taskId: string | null;
  taskTitle: string | null;
  seconds: number;
  startTime: number | null;
}

interface AppContextType {
  // Auth & Company
  currentUser: User;
  setCurrentUser: (user: User) => void;
  activeCompany: Company;
  setActiveCompany: (company: Company) => void;
  companies: Company[];
  addCompany: (company: Omit<Company, 'id'>) => Company;
  users: User[];
  
  // Domain Validation
  validateDomain: (email: string, targetCompanyId?: string) => { valid: boolean; error?: string; domain?: string; isDolphinDomain?: boolean; registeredCompany?: Company };
  inviteUser: (name: string, email: string, role: User['role'], department: string, companyId: string) => { success: boolean; error?: string };

  // Projects
  projects: Project[];
  addProject: (project: Omit<Project, 'id' | 'progress' | 'spentBudget'>) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  
  // Tasks & Subtasks
  tasks: Task[];
  subtasks: Subtask[];
  dependencies: TaskDependency[];
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'loggedHours'>) => Task;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  addSubtask: (taskId: string, title: string, assignedTo?: string) => void;
  toggleSubtask: (subtaskId: string) => void;
  addDependency: (taskId: string, dependsOnTaskId: string) => boolean;
  removeDependency: (depId: string) => void;

  // Time Tracking
  timer: TimerState;
  startTimer: (taskId: string, taskTitle: string) => void;
  stopTimer: (description?: string) => void;
  logTimeManual: (taskId: string, hours: number, description: string, date?: string) => void;
  timeEntries: TimeEntry[];

  // Files & AI
  files: ProjectFile[];
  addFile: (file: Omit<ProjectFile, 'id' | 'uploadedAt'>) => void;
  importTasksFromAI: (extractedTasks: any[], projectId: string) => number;

  // Logs & Notifications & Rules
  activityLogs: ActivityLog[];
  logActivity: (action: string, target: string, type?: ActivityLog['type'], projectId?: string, taskId?: string) => void;
  notifications: Notification[];
  markNotificationRead: (id: string) => void;
  automations: AutomationRule[];
  toggleAutomation: (id: string) => void;
  addAutomation: (rule: Omit<AutomationRule, 'id'>) => void;

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

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [companies, setCompanies] = useState<Company[]>(() => loadFromStorage('dolphin_companies', INITIAL_COMPANIES));
  const [activeCompany, setActiveCompany] = useState<Company>(() => loadFromStorage('dolphin_active_company', INITIAL_COMPANIES[0]));
  const [users, setUsers] = useState<User[]>(() => loadFromStorage('dolphin_users', INITIAL_USERS));
  const [currentUser, setCurrentUser] = useState<User>(() => loadFromStorage('dolphin_current_user', INITIAL_USERS[0]));

  const [projects, setProjects] = useState<Project[]>(() => loadFromStorage('dolphin_projects', INITIAL_PROJECTS));
  const [tasks, setTasks] = useState<Task[]>(() => loadFromStorage('dolphin_tasks', INITIAL_TASKS));
  const [subtasks, setSubtasks] = useState<Subtask[]>(() => loadFromStorage('dolphin_subtasks', INITIAL_SUBTASKS));
  const [dependencies, setDependencies] = useState<TaskDependency[]>(() => loadFromStorage('dolphin_dependencies', INITIAL_DEPENDENCIES));
  const [files, setFiles] = useState<ProjectFile[]>(() => loadFromStorage('dolphin_files', INITIAL_FILES));
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>(() => loadFromStorage('dolphin_time_entries', INITIAL_TIME_ENTRIES));
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>(() => loadFromStorage('dolphin_logs', INITIAL_LOGS));
  const [notifications, setNotifications] = useState<Notification[]>(() => loadFromStorage('dolphin_notifs', INITIAL_NOTIFICATIONS));
  const [automations, setAutomations] = useState<AutomationRule[]>(() => loadFromStorage('dolphin_automations', INITIAL_AUTOMATIONS));

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
    seedInitialFirestoreData(INITIAL_PROJECTS, INITIAL_TASKS);

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

    return () => {
      unsubscribeAuth();
      unsubscribeProjects();
      unsubscribeTasks();
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

  // Domain Validation helper (Dolphin internal domains + registered partner company domains)
  const validateDomain = (email: string, targetCompanyId?: string) => {
    if (!email || !email.includes('@')) {
      return { valid: false, error: 'Please enter a valid email address.' };
    }
    const domain = email.toLowerCase().trim().split('@')[1];
    
    // Check core Dolphin Whitelist
    const isDolphinDomain = APPROVED_DOMAINS.includes(domain);

    // Check registered company domains
    const registeredCompany = companies.find(
      (c) => c.domain.toLowerCase() === domain || (targetCompanyId && c.id === targetCompanyId)
    );

    if (isDolphinDomain || registeredCompany) {
      return { valid: true, domain, isDolphinDomain, registeredCompany };
    }

    return {
      valid: false,
      domain,
      isDolphinDomain: false,
      error: `Access Denied: Email domain '@${domain}' is not authorized. You can register ${domain} under Company Governance to grant project access.`
    };
  };

  // Invite User with Domain & Company Association
  const inviteUser = (name: string, email: string, role: User['role'], department: string, companyId: string) => {
    const targetComp = companies.find((c) => c.id === companyId);

    const val = validateDomain(email, companyId);
    if (!val.valid) {
      return { success: false, error: val.error };
    }

    const newUser: User = {
      id: `usr_${Date.now()}`,
      name,
      email,
      role,
      companyId: targetComp ? targetComp.id : activeCompany.id,
      avatar: `https://images.unsplash.com/photo-${1500000000000 + Math.floor(Math.random() * 1000000)}?auto=format&fit=crop&q=80&w=150`,
      department: department || (targetComp?.isExternal ? 'External Collaborator' : 'Engineering'),
      hourlyRate: role === 'Admin' ? 200 : role === 'Project Manager' ? 120 : 90,
      maxWeeklyHours: 40,
      status: 'Active'
    };

    setUsers((prev) => [...prev, newUser]);
    logActivity('invited user', `${name} (${email}) to ${targetComp?.name || activeCompany.name}`, 'user');
    
    // Trigger notification
    const newNotif: Notification = {
      id: `notif_${Date.now()}`,
      userId: currentUser.id,
      title: 'User Invited',
      message: `${name} (${email}) was invited to collaborate for ${targetComp?.name || activeCompany.name}.`,
      type: 'assignment',
      read: false,
      createdAt: new Date().toISOString()
    };
    setNotifications((prev) => [newNotif, ...prev]);

    return { success: true };
  };

  // Logging Activity
  const logActivity = (
    action: string,
    target: string,
    type: ActivityLog['type'] = 'task',
    projectId?: string,
    taskId?: string
  ) => {
    const newLog: ActivityLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      companyId: activeCompany.id,
      projectId,
      taskId,
      userId: currentUser.id,
      userName: currentUser.name,
      userAvatar: currentUser.avatar,
      action,
      target,
      timestamp: new Date().toISOString(),
      type
    };
    setActivityLogs((prev) => [newLog, ...prev]);
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

    // Check Automation Rules
    automations.forEach((rule) => {
      if (rule.active && rule.trigger === 'task_created') {
        logActivity('triggered automation', `"${rule.name}" on task "${newTask.title}"`, 'automation');
      }
    });

    createTaskInFirestore(newTask);
    return newTask;
  };

  const updateTask = (id: string, updates: Partial<Task>) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          const updated = { ...t, ...updates, updatedAt: new Date().toISOString() };
          if (updates.status && updates.status !== t.status) {
            logActivity(`changed status of task "${t.title}" to`, updates.status, 'task', t.projectId, t.id);

            // Check automation triggers
            automations.forEach((rule) => {
              if (rule.active && rule.trigger === 'status_changed') {
                logActivity('triggered automation', `Rule "${rule.name}" triggered by status change to ${updates.status}`, 'automation');
              }
            });
          }
          return updated;
        }
        return t;
      })
    );
    updateTaskInFirestore(id, updates);
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

  // Dependencies
  const addDependency = (taskId: string, dependsOnTaskId: string) => {
    if (taskId === dependsOnTaskId) return false;
    // Check circular dependency
    const isCircular = dependencies.some(
      (d) => d.taskId === dependsOnTaskId && d.dependsOnTaskId === taskId
    );
    if (isCircular) return false;

    const newDep: TaskDependency = {
      id: `dep_${Date.now()}`,
      taskId,
      dependsOnTaskId,
      type: 'finish_to_start',
    };
    setDependencies((prev) => [...prev, newDep]);
    logActivity('added dependency link between tasks', `${taskId} -> ${dependsOnTaskId}`, 'task');
    return true;
  };

  const removeDependency = (depId: string) => {
    setDependencies((prev) => prev.filter((d) => d.id !== depId));
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

  // Files
  const addFile = (fileData: Omit<ProjectFile, 'id' | 'uploadedAt'>) => {
    const newFile: ProjectFile = {
      ...fileData,
      id: `file_${Date.now()}`,
      uploadedAt: new Date().toISOString(),
    };
    setFiles((prev) => [newFile, ...prev]);
    logActivity('uploaded document', newFile.name, 'task', newFile.projectId);
  };

  // AI Task Import from Gemini PDF/Document Extraction
  const importTasksFromAI = (extractedTasks: any[], projectId: string) => {
    let count = 0;
    const project = projects.find((p) => p.id === projectId);
    if (!project) return 0;

    extractedTasks.forEach((et) => {
      const newTask: Task = {
        id: `task_ai_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
        projectId,
        companyId: project.companyId,
        title: et.title || 'AI Task',
        description: et.description || 'Imported via Gemini AI Document Extraction',
        status: (et.status as TaskStatus) || 'To Do',
        priority: (et.priority as Task['priority']) || 'Medium',
        assigneeIds: [currentUser.id],
        reporterId: currentUser.id,
        startDate: new Date().toISOString().split('T')[0],
        dueDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
        estimatedHours: et.estimatedHours || 20,
        loggedHours: 0,
        tags: et.tags || ['AI-Extracted', 'Gemini'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setTasks((prev) => [newTask, ...prev]);
      count++;
    });

    logActivity('imported AI tasks', `${count} tasks extracted from PDF/Spec document for "${project.title}"`, 'ai', projectId);
    return count;
  };

  // Notifications
  const markNotificationRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

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

  return (
    <AppContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        activeCompany,
        setActiveCompany,
        companies,
        addCompany,
        users,
        validateDomain,
        inviteUser,
        projects,
        addProject,
        updateProject,
        deleteProject,
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
        timer,
        startTimer,
        stopTimer,
        logTimeManual,
        timeEntries,
        files,
        addFile,
        importTasksFromAI,
        activityLogs,
        logActivity,
        notifications,
        markNotificationRead,
        automations,
        toggleAutomation,
        addAutomation,
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
