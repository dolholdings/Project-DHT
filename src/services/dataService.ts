import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import {
  Project,
  Task,
  ProjectFile,
  User,
  Company,
  Subtask,
  TaskComment,
  TaskDependency,
  TimeEntry,
  CustomFieldDefinition,
  Sprint,
  ActivityLog,
  Notification,
  AutomationRule,
  EmailThread,
  ProjectTemplate
} from '../types';

const COMPANIES_COLLECTION = 'companies';
const PROJECTS_COLLECTION = 'projects';
const TASKS_COLLECTION = 'tasks';
const SUBTASKS_COLLECTION = 'subtasks';
const TASK_COMMENTS_COLLECTION = 'task_comments';
const DEPENDENCIES_COLLECTION = 'dependencies';
const FILES_COLLECTION = 'files';
const USERS_COLLECTION = 'users';
const TIME_ENTRIES_COLLECTION = 'time_entries';
const CUSTOM_FIELDS_COLLECTION = 'custom_fields';
const SPRINTS_COLLECTION = 'sprints';
const ACTIVITY_LOGS_COLLECTION = 'activity_logs';
const NOTIFICATIONS_COLLECTION = 'notifications';
const AUTOMATIONS_COLLECTION = 'automations';
const EMAIL_THREADS_COLLECTION = 'email_threads';
const PROJECT_TEMPLATES_COLLECTION = 'project_templates';
const SETTINGS_COLLECTION = 'settings';
const BRANDING_DOC_ID = 'branding';
const AUTH_DOMAINS_DOC_ID = 'auth_domains';

// ==================== SANITIZATION FOR FIRESTORE ====================

export function sanitizeForFirestore<T>(data: T): T {
  if (data === null || data === undefined) {
    return null as any;
  }
  if (Array.isArray(data)) {
    return data.map((item) => sanitizeForFirestore(item)) as unknown as T;
  }
  if (typeof data === 'object' && !(data instanceof Date)) {
    const cleaned: Record<string, any> = {};
    for (const [key, value] of Object.entries(data as Record<string, any>)) {
      if (value !== undefined) {
        cleaned[key] = sanitizeForFirestore(value);
      }
    }
    return cleaned as T;
  }
  return data;
}

// ==================== COMPANIES CRUD ====================

export async function fetchCompaniesFromFirestore(): Promise<Company[]> {
  try {
    const colRef = collection(db, COMPANIES_COLLECTION);
    const snapshot = await getDocs(colRef);
    const companies: Company[] = [];
    snapshot.forEach((docSnap) => {
      companies.push({ id: docSnap.id, ...docSnap.data() } as Company);
    });
    return companies;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, COMPANIES_COLLECTION);
    return [];
  }
}

export function subscribeToCompanies(onUpdate: (companies: Company[]) => void, onError?: (error: unknown) => void) {
  const colRef = collection(db, COMPANIES_COLLECTION);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const companies: Company[] = [];
      snapshot.forEach((docSnap) => {
        companies.push({ id: docSnap.id, ...docSnap.data() } as Company);
      });
      onUpdate(companies);
    },
    (error) => {
      const msg = error instanceof Error ? error.message : String(error);
      if (msg.includes('closing') || msg.includes('hidden') || msg.includes('offline')) {
        console.warn('Firestore companies snapshot notice:', msg);
        return;
      }
      console.warn('Firestore companies snapshot error:', error);
      if (onError) onError(error);
    }
  );
}

export async function createCompanyInFirestore(company: Company): Promise<void> {
  const docRef = doc(db, COMPANIES_COLLECTION, company.id);
  try {
    await setDoc(docRef, sanitizeForFirestore(company));
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `companies/${company.id}`);
  }
}

export async function updateCompanyInFirestore(id: string, updates: Partial<Company>): Promise<void> {
  const docRef = doc(db, COMPANIES_COLLECTION, id);
  try {
    await updateDoc(docRef, sanitizeForFirestore(updates));
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `companies/${id}`);
  }
}

export async function deleteCompanyFromFirestore(id: string): Promise<void> {
  const docRef = doc(db, COMPANIES_COLLECTION, id);
  try {
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `companies/${id}`);
  }
}

// ==================== PROJECTS CRUD ====================

export async function fetchProjectsFromFirestore(): Promise<Project[]> {
  try {
    const colRef = collection(db, PROJECTS_COLLECTION);
    const snapshot = await getDocs(colRef);
    const projects: Project[] = [];
    snapshot.forEach((docSnap) => {
      projects.push({ id: docSnap.id, ...docSnap.data() } as Project);
    });
    return projects;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, PROJECTS_COLLECTION);
    return [];
  }
}

export function subscribeToProjects(onUpdate: (projects: Project[]) => void, onError?: (error: unknown) => void) {
  const colRef = collection(db, PROJECTS_COLLECTION);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const projects: Project[] = [];
      snapshot.forEach((docSnap) => {
        projects.push({ id: docSnap.id, ...docSnap.data() } as Project);
      });
      onUpdate(projects);
    },
    (error) => {
      const msg = error instanceof Error ? error.message : String(error);
      if (msg.includes('closing') || msg.includes('hidden') || msg.includes('offline')) {
        console.warn('Firestore projects snapshot notice:', msg);
        return;
      }
      console.warn('Firestore projects snapshot error:', error);
      try {
        handleFirestoreError(error, OperationType.LIST, PROJECTS_COLLECTION);
      } catch (e) {
        // error logged & thrown
      }
      if (onError) onError(error);
    }
  );
}

export async function createProjectInFirestore(project: Project): Promise<void> {
  const docRef = doc(db, PROJECTS_COLLECTION, project.id);
  try {
    await setDoc(docRef, sanitizeForFirestore(project));
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `projects/${project.id}`);
  }
}

export async function updateProjectInFirestore(id: string, updates: Partial<Project>): Promise<void> {
  const docRef = doc(db, PROJECTS_COLLECTION, id);
  try {
    await updateDoc(docRef, sanitizeForFirestore(updates));
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `projects/${id}`);
  }
}

export async function deleteProjectFromFirestore(id: string): Promise<void> {
  const docRef = doc(db, PROJECTS_COLLECTION, id);
  try {
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `projects/${id}`);
  }
}

// ==================== TASKS CRUD ====================

export async function fetchTasksFromFirestore(): Promise<Task[]> {
  try {
    const colRef = collection(db, TASKS_COLLECTION);
    const snapshot = await getDocs(colRef);
    const tasks: Task[] = [];
    snapshot.forEach((docSnap) => {
      tasks.push({ id: docSnap.id, ...docSnap.data() } as Task);
    });
    return tasks;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, TASKS_COLLECTION);
    return [];
  }
}

export function subscribeToTasks(onUpdate: (tasks: Task[]) => void, onError?: (error: unknown) => void) {
  const colRef = collection(db, TASKS_COLLECTION);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const tasks: Task[] = [];
      snapshot.forEach((docSnap) => {
        tasks.push({ id: docSnap.id, ...docSnap.data() } as Task);
      });
      onUpdate(tasks);
    },
    (error) => {
      const msg = error instanceof Error ? error.message : String(error);
      if (msg.includes('closing') || msg.includes('hidden') || msg.includes('offline')) {
        console.warn('Firestore tasks snapshot notice:', msg);
        return;
      }
      console.warn('Firestore tasks snapshot error:', error);
      if (onError) onError(error);
    }
  );
}

export async function createTaskInFirestore(task: Task): Promise<void> {
  const docRef = doc(db, TASKS_COLLECTION, task.id);
  try {
    await setDoc(docRef, sanitizeForFirestore(task));
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `tasks/${task.id}`);
  }
}

export async function updateTaskInFirestore(id: string, updates: Partial<Task>): Promise<void> {
  const docRef = doc(db, TASKS_COLLECTION, id);
  try {
    await updateDoc(docRef, sanitizeForFirestore(updates));
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `tasks/${id}`);
  }
}

export async function softDeleteTaskInFirestore(
  id: string,
  deletedBy: string,
  deletedByName?: string
): Promise<void> {
  const docRef = doc(db, TASKS_COLLECTION, id);
  try {
    await updateDoc(
      docRef,
      sanitizeForFirestore({
        isDeleted: true,
        deletedAt: new Date().toISOString(),
        deletedBy,
        deletedByName: deletedByName || 'Administrator',
        updatedAt: new Date().toISOString()
      })
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `tasks/${id}`);
  }
}

export async function restoreTaskInFirestore(id: string): Promise<void> {
  const docRef = doc(db, TASKS_COLLECTION, id);
  try {
    await updateDoc(
      docRef,
      sanitizeForFirestore({
        isDeleted: false,
        deletedAt: '',
        deletedBy: '',
        deletedByName: '',
        updatedAt: new Date().toISOString()
      })
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `tasks/${id}`);
  }
}

export async function deleteTaskFromFirestore(id: string): Promise<void> {
  const docRef = doc(db, TASKS_COLLECTION, id);
  try {
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `tasks/${id}`);
  }
}

export async function purgeExpiredTasksFromFirestore(tasksList: Task[]): Promise<string[]> {
  const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
  const now = Date.now();
  const purgedIds: string[] = [];

  for (const t of tasksList) {
    if (t.isDeleted && t.deletedAt) {
      const delTime = new Date(t.deletedAt).getTime();
      if (!isNaN(delTime) && now - delTime >= THIRTY_DAYS_MS) {
        try {
          await deleteTaskFromFirestore(t.id);
          purgedIds.push(t.id);
        } catch (e) {
          console.warn(`Failed to purge expired task ${t.id}:`, e);
        }
      }
    }
  }

  return purgedIds;
}

// ==================== FILES & VERSION HISTORY CRUD ====================

export async function fetchFilesFromFirestore(): Promise<ProjectFile[]> {
  try {
    const colRef = collection(db, FILES_COLLECTION);
    const snapshot = await getDocs(colRef);
    const files: ProjectFile[] = [];
    snapshot.forEach((docSnap) => {
      files.push({ id: docSnap.id, ...docSnap.data() } as ProjectFile);
    });
    return files;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, FILES_COLLECTION);
    return [];
  }
}

export function subscribeToFiles(onUpdate: (files: ProjectFile[]) => void, onError?: (error: unknown) => void) {
  const colRef = collection(db, FILES_COLLECTION);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const files: ProjectFile[] = [];
      snapshot.forEach((docSnap) => {
        files.push({ id: docSnap.id, ...docSnap.data() } as ProjectFile);
      });
      onUpdate(files);
    },
    (error) => {
      const msg = error instanceof Error ? error.message : String(error);
      if (msg.includes('closing') || msg.includes('hidden') || msg.includes('offline')) {
        console.warn('Firestore files snapshot notice:', msg);
        return;
      }
      console.warn('Firestore files snapshot error:', error);
      if (onError) onError(error);
    }
  );
}

export async function createFileInFirestore(file: ProjectFile): Promise<void> {
  const docRef = doc(db, FILES_COLLECTION, file.id);
  try {
    await setDoc(docRef, sanitizeForFirestore(file));
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `files/${file.id}`);
  }
}

export async function updateFileInFirestore(id: string, updates: Partial<ProjectFile>): Promise<void> {
  const docRef = doc(db, FILES_COLLECTION, id);
  try {
    await updateDoc(docRef, sanitizeForFirestore(updates));
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `files/${id}`);
  }
}

export async function deleteFileFromFirestore(id: string): Promise<void> {
  const docRef = doc(db, FILES_COLLECTION, id);
  try {
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `files/${id}`);
  }
}

// ==================== USERS CRUD ====================

export async function fetchUsersFromFirestore(): Promise<User[]> {
  try {
    const colRef = collection(db, USERS_COLLECTION);
    const snapshot = await getDocs(colRef);
    const users: User[] = [];
    snapshot.forEach((docSnap) => {
      users.push({ id: docSnap.id, ...docSnap.data() } as User);
    });
    return deduplicateUserList(users);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, USERS_COLLECTION);
    return [];
  }
}

export function deduplicateUserList(usersList: (User | undefined | null)[]): User[] {
  const mapByEmail = new Map<string, User>();

  for (const raw of usersList) {
    if (!raw || !raw.email) continue;
    const cleanEmail = String(raw.email).trim().toLowerCase();
    if (!cleanEmail) continue;

    const existing = mapByEmail.get(cleanEmail);
    if (!existing) {
      const isRawDeleted = Boolean(raw.isDeleted);
      mapByEmail.set(cleanEmail, {
        ...raw,
        email: cleanEmail,
        password: raw.password ? String(raw.password).trim() : undefined,
        status: isRawDeleted ? 'Offline' : (raw.status || 'Active'),
        isDeleted: isRawDeleted
      });
    } else {
      // Merge records:
      // If either record is explicitly marked as deleted, preserve deletion unless explicitly restored with isDeleted === false
      const isDeleted = (raw.isDeleted === true || existing.isDeleted === true) && !(raw.isDeleted === false && raw.deletedAt === '');
      const deletedAt = isDeleted ? (raw.deletedAt || existing.deletedAt || new Date().toISOString()) : undefined;
      const deletedBy = isDeleted ? (raw.deletedBy || existing.deletedBy || 'admin') : undefined;
      const deletedByName = isDeleted ? (raw.deletedByName || existing.deletedByName || 'Administrator') : undefined;

      const mergedPassword = (raw.password && String(raw.password).trim()) || (existing.password && String(existing.password).trim()) || undefined;
      const status = isDeleted ? 'Offline' : (raw.status || existing.status || 'Active');
      
      // Prefer initial ID like usr_ciro_campos over random timestamp IDs
      const isRawInitial = String(raw.id || '').startsWith('usr_') && !String(raw.id || '').match(/^usr_\d{10,}/);
      const isExistingInitial = String(existing.id || '').startsWith('usr_') && !String(existing.id || '').match(/^usr_\d{10,}/);
      const primaryId = isExistingInitial ? existing.id : (isRawInitial ? raw.id : (existing.id || raw.id));

      mapByEmail.set(cleanEmail, {
        ...existing,
        ...raw,
        id: primaryId,
        email: cleanEmail,
        name: raw.name || existing.name,
        role: raw.role || existing.role,
        department: raw.department || existing.department,
        companyId: raw.companyId || existing.companyId,
        allowedCompanyIds: raw.allowedCompanyIds !== undefined ? raw.allowedCompanyIds : existing.allowedCompanyIds,
        companyAccessScope: raw.companyAccessScope !== undefined ? raw.companyAccessScope : existing.companyAccessScope,
        isSuperAdmin: raw.isSuperAdmin !== undefined ? raw.isSuperAdmin : existing.isSuperAdmin,
        avatar: raw.avatar || existing.avatar,
        password: mergedPassword,
        status,
        isDeleted,
        deletedAt,
        deletedBy,
        deletedByName,
        isEmailVerified: true
      });
    }
  }

  return Array.from(mapByEmail.values());
}

export function subscribeToUsers(onUpdate: (users: User[]) => void, onError?: (error: unknown) => void) {
  const colRef = collection(db, USERS_COLLECTION);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const users: User[] = [];
      snapshot.forEach((docSnap) => {
        users.push({ id: docSnap.id, ...docSnap.data() } as User);
      });
      const cleanUsers = deduplicateUserList(users);
      onUpdate(cleanUsers);
    },
    (error) => {
      const msg = error instanceof Error ? error.message : String(error);
      if (msg.includes('closing') || msg.includes('hidden') || msg.includes('offline')) {
        console.warn('Firestore users snapshot notice:', msg);
        return;
      }
      console.warn('Firestore users snapshot error:', error);
      if (onError) onError(error);
    }
  );
}

export async function createUserInFirestore(user: User): Promise<void> {
  const cleanEmail = (user.email || '').trim().toLowerCase();
  const docRef = doc(db, USERS_COLLECTION, user.id);
  try {
    await setDoc(docRef, sanitizeForFirestore({
      ...user,
      email: cleanEmail,
      updatedAt: new Date().toISOString()
    }), { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `users/${user.id}`);
  }
}

export async function updateUserInFirestore(id: string, updates: Partial<User>): Promise<void> {
  const docRef = doc(db, USERS_COLLECTION, id);
  try {
    const cleanUpdates = { ...updates };
    if (cleanUpdates.email) {
      cleanUpdates.email = cleanUpdates.email.trim().toLowerCase();
    }
    if (cleanUpdates.password) {
      cleanUpdates.password = cleanUpdates.password.trim();
    }
    await setDoc(docRef, sanitizeForFirestore({
      ...cleanUpdates,
      updatedAt: new Date().toISOString()
    }), { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `users/${id}`);
  }
}

export async function saveUserPasswordInFirestore(userId: string, newPassword: string): Promise<void> {
  const docRef = doc(db, USERS_COLLECTION, userId);
  try {
    await setDoc(
      docRef,
      sanitizeForFirestore({
        password: newPassword.trim(),
        updatedAt: new Date().toISOString()
      }),
      { merge: true }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `users/${userId}`);
  }
}

export async function softDeleteUserInFirestore(
  id: string,
  deletedBy: string,
  deletedByName?: string
): Promise<void> {
  const docRef = doc(db, USERS_COLLECTION, id);
  try {
    await updateDoc(
      docRef,
      sanitizeForFirestore({
        isDeleted: true,
        deletedAt: new Date().toISOString(),
        deletedBy,
        deletedByName: deletedByName || 'Administrator',
        status: 'Offline'
      })
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `users/${id}`);
  }
}

export async function softDeleteUserInFirestoreByEmail(
  email: string,
  deletedBy: string,
  deletedByName?: string
): Promise<void> {
  const cleanEmail = String(email || '').trim().toLowerCase();
  if (!cleanEmail) return;
  try {
    const colRef = collection(db, USERS_COLLECTION);
    const snapshot = await getDocs(colRef);
    for (const docSnap of snapshot.docs) {
      const data = docSnap.data();
      if (data && data.email && String(data.email).trim().toLowerCase() === cleanEmail) {
        await updateDoc(
          docSnap.ref,
          sanitizeForFirestore({
            isDeleted: true,
            deletedAt: new Date().toISOString(),
            deletedBy,
            deletedByName: deletedByName || 'Administrator',
            status: 'Offline'
          })
        );
      }
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `users/email/${email}`);
  }
}

export async function restoreUserInFirestore(id: string): Promise<void> {
  const docRef = doc(db, USERS_COLLECTION, id);
  try {
    await updateDoc(
      docRef,
      sanitizeForFirestore({
        isDeleted: false,
        deletedAt: '',
        deletedBy: '',
        deletedByName: '',
        status: 'Active'
      })
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `users/${id}`);
  }
}

export async function restoreUserInFirestoreByEmail(email: string): Promise<void> {
  const cleanEmail = String(email || '').trim().toLowerCase();
  if (!cleanEmail) return;
  try {
    const colRef = collection(db, USERS_COLLECTION);
    const snapshot = await getDocs(colRef);
    for (const docSnap of snapshot.docs) {
      const data = docSnap.data();
      if (data && data.email && String(data.email).trim().toLowerCase() === cleanEmail) {
        await updateDoc(
          docSnap.ref,
          sanitizeForFirestore({
            isDeleted: false,
            deletedAt: '',
            deletedBy: '',
            deletedByName: '',
            status: 'Active'
          })
        );
      }
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `users/email/${email}`);
  }
}

export async function deleteUserFromFirestore(id: string): Promise<void> {
  const docRef = doc(db, USERS_COLLECTION, id);
  try {
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `users/${id}`);
  }
}

export async function deleteUserFromFirestoreByEmail(email: string): Promise<void> {
  const cleanEmail = String(email || '').trim().toLowerCase();
  if (!cleanEmail) return;
  try {
    const colRef = collection(db, USERS_COLLECTION);
    const snapshot = await getDocs(colRef);
    for (const docSnap of snapshot.docs) {
      const data = docSnap.data();
      if (data && data.email && String(data.email).trim().toLowerCase() === cleanEmail) {
        await deleteDoc(docSnap.ref);
      }
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `users/email/${email}`);
  }
}

export async function purgeExpiredUsersFromFirestore(usersList: User[]): Promise<string[]> {
  const ONE_HUNDRED_EIGHTY_DAYS_MS = 180 * 24 * 60 * 60 * 1000;
  const now = Date.now();
  const purgedIds: string[] = [];

  for (const u of usersList) {
    if (u.isDeleted && u.deletedAt) {
      const delTime = new Date(u.deletedAt).getTime();
      if (!isNaN(delTime) && now - delTime >= ONE_HUNDRED_EIGHTY_DAYS_MS) {
        try {
          await deleteUserFromFirestore(u.id);
          purgedIds.push(u.id);
        } catch (err) {
          console.warn(`Failed to auto-purge expired user ${u.id}:`, err);
        }
      }
    }
  }

  return purgedIds;
}

// Clean and deduplicate all users in Firestore and synchronize canonical records
export async function cleanAndDeduplicateFirestoreUsers(localUsers: User[] = []): Promise<{
  removedCount: number;
  unifiedUsers: User[];
  error?: string;
}> {
  try {
    const rawSnapshotUsers = await fetchUsersFromFirestore();
    const combinedCandidates = [...rawSnapshotUsers, ...localUsers];
    
    // Group all documents by clean email
    const emailToDocs = new Map<string, User[]>();
    for (const u of combinedCandidates) {
      if (!u || !u.email) continue;
      const cleanEmail = String(u.email).trim().toLowerCase();
      if (!cleanEmail) continue;
      
      const existingList = emailToDocs.get(cleanEmail) || [];
      existingList.push(u);
      emailToDocs.set(cleanEmail, existingList);
    }

    let removedCount = 0;
    const unifiedUsers: User[] = [];

    for (const [cleanEmail, docs] of emailToDocs.entries()) {
      if (docs.length === 0) continue;

      // Select canonical ID: prefer initial ID (e.g., usr_superadmin_dgh, usr_ciro_campos)
      let canonicalDoc = docs.find((d) => String(d.id || '').startsWith('usr_') && !String(d.id || '').match(/^usr_\d{10,}/)) || docs[0];

      // Merge data across duplicate documents
      const mergedPassword = docs.find((d) => d.password && String(d.password).trim() !== '')?.password?.trim();
      const isAnyExplicitDeleted = docs.some((d) => d.isDeleted === true);
      const isAnyExplicitActive = docs.some((d) => d.isDeleted === false && d.status === 'Active' && !d.deletedAt);
      const isDeleted = isAnyExplicitDeleted && !isAnyExplicitActive;

      const latestName = docs.find((d) => d.name && d.name.trim() !== '')?.name || canonicalDoc.name;
      const latestRole = docs.find((d) => d.role && d.role.trim() !== '')?.role || canonicalDoc.role;
      const latestDept = docs.find((d) => d.department && d.department.trim() !== '')?.department || canonicalDoc.department;
      const latestCompanyId = docs.find((d) => d.companyId && d.companyId.trim() !== '')?.companyId || canonicalDoc.companyId;
      const latestAvatar = docs.find((d) => d.avatar && d.avatar.trim() !== '')?.avatar || canonicalDoc.avatar;

      const unifiedUser: User = {
        ...canonicalDoc,
        id: canonicalDoc.id,
        email: cleanEmail,
        name: latestName,
        role: latestRole,
        department: latestDept,
        companyId: latestCompanyId,
        avatar: latestAvatar,
        password: mergedPassword || canonicalDoc.password,
        status: isDeleted ? 'Offline' : (canonicalDoc.status || 'Active'),
        isDeleted,
        deletedAt: isDeleted ? (docs.find((d) => d.deletedAt)?.deletedAt || new Date().toISOString()) : undefined,
        deletedBy: isDeleted ? (docs.find((d) => d.deletedBy)?.deletedBy || 'admin') : undefined,
        deletedByName: isDeleted ? (docs.find((d) => d.deletedByName)?.deletedByName || 'Administrator') : undefined,
        isEmailVerified: true
      };

      // Write canonical user
      const canonicalRef = doc(db, USERS_COLLECTION, canonicalDoc.id);
      await setDoc(canonicalRef, sanitizeForFirestore({
        ...unifiedUser,
        updatedAt: new Date().toISOString()
      }), { merge: true });

      // Delete all other duplicate document IDs for this email
      for (const d of docs) {
        if (d.id && d.id !== canonicalDoc.id) {
          try {
            await deleteUserFromFirestore(d.id);
            removedCount++;
          } catch (e) {
            console.warn(`Could not delete duplicate user doc ${d.id}:`, e);
          }
        }
      }

      unifiedUsers.push(unifiedUser);
    }

    return { removedCount, unifiedUsers };
  } catch (error: any) {
    console.warn('Error during user deduplication and cleanup:', error);
    return {
      removedCount: 0,
      unifiedUsers: deduplicateUserList(localUsers),
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

// Sync all users from local cache / state into Firebase Firestore
export async function syncAllLocalUsersToFirestore(localUsers: User[]): Promise<{ count: number; error?: string }> {
  try {
    const cleanUsers = deduplicateUserList(localUsers);
    let count = 0;
    for (const user of cleanUsers) {
      if (!user || !user.id || !user.email) continue;
      const docRef = doc(db, USERS_COLLECTION, user.id);
      await setDoc(docRef, sanitizeForFirestore({
        ...user,
        email: user.email.trim().toLowerCase(),
        password: user.password ? user.password.trim() : undefined,
        updatedAt: new Date().toISOString()
      }), { merge: true });
      count++;
    }
    return { count };
  } catch (error: any) {
    console.warn('Error syncing all local users to Firestore:', error);
    return { count: 0, error: error instanceof Error ? error.message : String(error) };
  }
}

// Clear all projects and tasks from Firestore for clean fresh workspace
export async function clearAllFirestoreData(): Promise<void> {
  try {
    const existingProjects = await fetchProjectsFromFirestore();
    for (const p of existingProjects) {
      await deleteProjectFromFirestore(p.id);
    }
    const existingTasks = await fetchTasksFromFirestore();
    for (const t of existingTasks) {
      await deleteTaskFromFirestore(t.id);
    }
    const existingFiles = await fetchFilesFromFirestore();
    for (const f of existingFiles) {
      await deleteFileFromFirestore(f.id);
    }
    const existingUsers = await fetchUsersFromFirestore();
    for (const u of existingUsers) {
      await deleteUserFromFirestore(u.id);
    }
  } catch (error) {
    console.warn('Could not clear Firestore data:', error);
  }
}

// Force restore all initial data into Firestore immediately
export async function forceRestoreFirestoreData(
  initialProjects: Project[],
  initialTasks: Task[],
  initialFiles: ProjectFile[] = [],
  initialUsers: User[] = [],
  initialCompanies: Company[] = []
): Promise<void> {
  try {
    for (const c of initialCompanies) {
      await createCompanyInFirestore(c);
    }
    for (const u of initialUsers) {
      await createUserInFirestore(u);
    }
    for (const p of initialProjects) {
      await createProjectInFirestore(p);
    }
    for (const t of initialTasks) {
      await createTaskInFirestore(t);
    }
    for (const f of initialFiles) {
      await createFileInFirestore(f);
    }
  } catch (error) {
    console.warn('Error during forceRestoreFirestoreData:', error);
  }
}

// Seed initial data into Firestore if collection is empty or missing key entities
export async function seedInitialFirestoreData(
  initialProjects: Project[],
  initialTasks: Task[],
  initialFiles: ProjectFile[] = [],
  initialUsers: User[] = [],
  initialCompanies: Company[] = [],
  initialSubtasks: Subtask[] = [],
  initialDependencies: TaskDependency[] = [],
  initialCustomFields: CustomFieldDefinition[] = [],
  initialTemplates: ProjectTemplate[] = [],
  initialSprints: Sprint[] = []
): Promise<void> {
  try {
    // 1. Companies / Workspaces seeding
    if (initialCompanies.length > 0) {
      const existingCompanies = await fetchCompaniesFromFirestore();
      for (const ic of initialCompanies) {
        if (!existingCompanies.some((c) => c.id === ic.id || c.code === ic.code || (c.domain && ic.domain && c.domain === ic.domain))) {
          await createCompanyInFirestore(ic);
        }
      }
    }

    // 2. Users seeding & deduplication
    await cleanAndDeduplicateFirestoreUsers(initialUsers);
    const existingUsers = await fetchUsersFromFirestore();
    if (initialUsers.length > 0) {
      for (const iu of initialUsers) {
        const existing = existingUsers.find(
          (u) => (u?.email && iu?.email && u.email.toLowerCase() === iu.email.toLowerCase()) || (u && iu && u.id === iu.id)
        );
        if (!existing) {
          await createUserInFirestore(iu);
        } else if (!existing.password && iu.password) {
          await updateUserInFirestore(existing.id, { password: iu.password });
        }
      }
    }

    // 3. Projects seeding (ensure DHT-Ajman projects and all initial projects exist)
    const existingProjects = await fetchProjectsFromFirestore();
    for (const ip of initialProjects) {
      if (!existingProjects.some((p) => p.id === ip.id || p.code === ip.code)) {
        await createProjectInFirestore(ip);
      }
    }

    // 4. Tasks seeding
    const existingTasks = await fetchTasksFromFirestore();
    for (const it of initialTasks) {
      if (!existingTasks.some((t) => t.id === it.id)) {
        await createTaskInFirestore(it);
      }
    }

    // 5. Files seeding
    const existingFiles = await fetchFilesFromFirestore();
    if (existingFiles.length === 0 && initialFiles.length > 0) {
      for (const f of initialFiles) {
        await createFileInFirestore(f);
      }
    }

    // 6. Subtasks seeding
    if (initialSubtasks.length > 0) {
      const existingSubtasks = await fetchSubtasksFromFirestore();
      if (existingSubtasks.length === 0) {
        for (const st of initialSubtasks) {
          await createSubtaskInFirestore(st);
        }
      }
    }

    // 7. Dependencies seeding
    if (initialDependencies.length > 0) {
      const existingDeps = await fetchDependenciesFromFirestore();
      if (existingDeps.length === 0) {
        for (const d of initialDependencies) {
          await createDependencyInFirestore(d);
        }
      }
    }

    // 8. Custom Fields seeding
    if (initialCustomFields.length > 0) {
      const existingFields = await fetchCustomFieldsFromFirestore();
      if (existingFields.length === 0) {
        for (const cf of initialCustomFields) {
          await createCustomFieldInFirestore(cf);
        }
      }
    }

    // 9. Project Templates seeding
    if (initialTemplates.length > 0) {
      const existingTpls = await fetchProjectTemplatesFromFirestore();
      if (existingTpls.length === 0) {
        for (const tpl of initialTemplates) {
          await createProjectTemplateInFirestore(tpl);
        }
      }
    }

    // 10. Sprints seeding
    if (initialSprints.length > 0) {
      const existingSprints = await fetchSprintsFromFirestore();
      if (existingSprints.length === 0) {
        for (const sp of initialSprints) {
          await createSprintInFirestore(sp);
        }
      }
    }
  } catch (error) {
    console.warn('Could not seed initial Firestore data automatically:', error);
  }
}

// ==================== BRANDING & LOGO SETTINGS CRUD ====================

export async function fetchBrandingSettingsFromFirestore(): Promise<any | null> {
  try {
    const docRef = doc(db, SETTINGS_COLLECTION, BRANDING_DOC_ID);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data();
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `${SETTINGS_COLLECTION}/${BRANDING_DOC_ID}`);
    return null;
  }
}

export async function saveBrandingSettingsToFirestore(settings: any): Promise<void> {
  const docRef = doc(db, SETTINGS_COLLECTION, BRANDING_DOC_ID);
  try {
    await setDoc(docRef, sanitizeForFirestore({
      ...settings,
      updatedAt: new Date().toISOString()
    }), { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${SETTINGS_COLLECTION}/${BRANDING_DOC_ID}`);
  }
}

export function subscribeToBrandingSettings(
  onUpdate: (settings: any) => void,
  onError?: (error: unknown) => void
) {
  const docRef = doc(db, SETTINGS_COLLECTION, BRANDING_DOC_ID);
  return onSnapshot(
    docRef,
    (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        onUpdate(data);
      }
    },
    (error) => {
      const msg = error instanceof Error ? error.message : String(error);
      if (msg.includes('closing') || msg.includes('hidden') || msg.includes('offline')) {
        console.warn('Firestore branding snapshot notice:', msg);
        return;
      }
      console.warn('Firestore branding snapshot error:', error);
      if (onError) onError(error);
    }
  );
}

// ==================== SUBTASKS CRUD ====================

export async function fetchSubtasksFromFirestore(): Promise<Subtask[]> {
  try {
    const colRef = collection(db, SUBTASKS_COLLECTION);
    const snapshot = await getDocs(colRef);
    const subtasks: Subtask[] = [];
    snapshot.forEach((docSnap) => {
      subtasks.push({ id: docSnap.id, ...docSnap.data() } as Subtask);
    });
    return subtasks;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, SUBTASKS_COLLECTION);
    return [];
  }
}

export function subscribeToSubtasks(onUpdate: (subtasks: Subtask[]) => void, onError?: (error: unknown) => void) {
  const colRef = collection(db, SUBTASKS_COLLECTION);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const subtasks: Subtask[] = [];
      snapshot.forEach((docSnap) => {
        subtasks.push({ id: docSnap.id, ...docSnap.data() } as Subtask);
      });
      onUpdate(subtasks);
    },
    (error) => {
      const msg = error instanceof Error ? error.message : String(error);
      if (msg.includes('closing') || msg.includes('hidden') || msg.includes('offline')) return;
      console.warn('Firestore subtasks snapshot error:', error);
      if (onError) onError(error);
    }
  );
}

export async function createSubtaskInFirestore(subtask: Subtask): Promise<void> {
  const docRef = doc(db, SUBTASKS_COLLECTION, subtask.id);
  try {
    await setDoc(docRef, sanitizeForFirestore(subtask));
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `subtasks/${subtask.id}`);
  }
}

export async function updateSubtaskInFirestore(id: string, updates: Partial<Subtask>): Promise<void> {
  const docRef = doc(db, SUBTASKS_COLLECTION, id);
  try {
    await updateDoc(docRef, sanitizeForFirestore(updates));
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `subtasks/${id}`);
  }
}

export async function deleteSubtaskFromFirestore(id: string): Promise<void> {
  const docRef = doc(db, SUBTASKS_COLLECTION, id);
  try {
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `subtasks/${id}`);
  }
}

// ==================== TASK COMMENTS CRUD ====================

export async function fetchTaskCommentsFromFirestore(): Promise<TaskComment[]> {
  try {
    const colRef = collection(db, TASK_COMMENTS_COLLECTION);
    const snapshot = await getDocs(colRef);
    const comments: TaskComment[] = [];
    snapshot.forEach((docSnap) => {
      comments.push({ id: docSnap.id, ...docSnap.data() } as TaskComment);
    });
    return comments;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, TASK_COMMENTS_COLLECTION);
    return [];
  }
}

export function subscribeToTaskComments(onUpdate: (comments: TaskComment[]) => void, onError?: (error: unknown) => void) {
  const colRef = collection(db, TASK_COMMENTS_COLLECTION);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const comments: TaskComment[] = [];
      snapshot.forEach((docSnap) => {
        comments.push({ id: docSnap.id, ...docSnap.data() } as TaskComment);
      });
      onUpdate(comments);
    },
    (error) => {
      const msg = error instanceof Error ? error.message : String(error);
      if (msg.includes('closing') || msg.includes('hidden') || msg.includes('offline')) return;
      console.warn('Firestore comments snapshot error:', error);
      if (onError) onError(error);
    }
  );
}

export async function createTaskCommentInFirestore(comment: TaskComment): Promise<void> {
  const docRef = doc(db, TASK_COMMENTS_COLLECTION, comment.id);
  try {
    await setDoc(docRef, sanitizeForFirestore(comment));
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `task_comments/${comment.id}`);
  }
}

export async function deleteTaskCommentFromFirestore(id: string): Promise<void> {
  const docRef = doc(db, TASK_COMMENTS_COLLECTION, id);
  try {
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `task_comments/${id}`);
  }
}

// ==================== TASK DEPENDENCIES CRUD ====================

export async function fetchDependenciesFromFirestore(): Promise<TaskDependency[]> {
  try {
    const colRef = collection(db, DEPENDENCIES_COLLECTION);
    const snapshot = await getDocs(colRef);
    const deps: TaskDependency[] = [];
    snapshot.forEach((docSnap) => {
      deps.push({ id: docSnap.id, ...docSnap.data() } as TaskDependency);
    });
    return deps;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, DEPENDENCIES_COLLECTION);
    return [];
  }
}

export function subscribeToDependencies(onUpdate: (deps: TaskDependency[]) => void, onError?: (error: unknown) => void) {
  const colRef = collection(db, DEPENDENCIES_COLLECTION);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const deps: TaskDependency[] = [];
      snapshot.forEach((docSnap) => {
        deps.push({ id: docSnap.id, ...docSnap.data() } as TaskDependency);
      });
      onUpdate(deps);
    },
    (error) => {
      const msg = error instanceof Error ? error.message : String(error);
      if (msg.includes('closing') || msg.includes('hidden') || msg.includes('offline')) return;
      console.warn('Firestore dependencies snapshot error:', error);
      if (onError) onError(error);
    }
  );
}

export async function createDependencyInFirestore(dependency: TaskDependency): Promise<void> {
  const docRef = doc(db, DEPENDENCIES_COLLECTION, dependency.id);
  try {
    await setDoc(docRef, sanitizeForFirestore(dependency));
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `dependencies/${dependency.id}`);
  }
}

export async function deleteDependencyFromFirestore(id: string): Promise<void> {
  const docRef = doc(db, DEPENDENCIES_COLLECTION, id);
  try {
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `dependencies/${id}`);
  }
}

// ==================== TIME ENTRIES CRUD ====================

export async function fetchTimeEntriesFromFirestore(): Promise<TimeEntry[]> {
  try {
    const colRef = collection(db, TIME_ENTRIES_COLLECTION);
    const snapshot = await getDocs(colRef);
    const entries: TimeEntry[] = [];
    snapshot.forEach((docSnap) => {
      entries.push({ id: docSnap.id, ...docSnap.data() } as TimeEntry);
    });
    return entries;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, TIME_ENTRIES_COLLECTION);
    return [];
  }
}

export function subscribeToTimeEntries(onUpdate: (entries: TimeEntry[]) => void, onError?: (error: unknown) => void) {
  const colRef = collection(db, TIME_ENTRIES_COLLECTION);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const entries: TimeEntry[] = [];
      snapshot.forEach((docSnap) => {
        entries.push({ id: docSnap.id, ...docSnap.data() } as TimeEntry);
      });
      onUpdate(entries);
    },
    (error) => {
      const msg = error instanceof Error ? error.message : String(error);
      if (msg.includes('closing') || msg.includes('hidden') || msg.includes('offline')) return;
      console.warn('Firestore time_entries snapshot error:', error);
      if (onError) onError(error);
    }
  );
}

export async function createTimeEntryInFirestore(entry: TimeEntry): Promise<void> {
  const docRef = doc(db, TIME_ENTRIES_COLLECTION, entry.id);
  try {
    await setDoc(docRef, sanitizeForFirestore(entry));
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `time_entries/${entry.id}`);
  }
}

export async function deleteTimeEntryFromFirestore(id: string): Promise<void> {
  const docRef = doc(db, TIME_ENTRIES_COLLECTION, id);
  try {
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `time_entries/${id}`);
  }
}

// ==================== CUSTOM FIELDS CRUD ====================

export async function fetchCustomFieldsFromFirestore(): Promise<CustomFieldDefinition[]> {
  try {
    const colRef = collection(db, CUSTOM_FIELDS_COLLECTION);
    const snapshot = await getDocs(colRef);
    const fields: CustomFieldDefinition[] = [];
    snapshot.forEach((docSnap) => {
      fields.push({ id: docSnap.id, ...docSnap.data() } as CustomFieldDefinition);
    });
    return fields;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, CUSTOM_FIELDS_COLLECTION);
    return [];
  }
}

export function subscribeToCustomFields(onUpdate: (fields: CustomFieldDefinition[]) => void, onError?: (error: unknown) => void) {
  const colRef = collection(db, CUSTOM_FIELDS_COLLECTION);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const fields: CustomFieldDefinition[] = [];
      snapshot.forEach((docSnap) => {
        fields.push({ id: docSnap.id, ...docSnap.data() } as CustomFieldDefinition);
      });
      onUpdate(fields);
    },
    (error) => {
      const msg = error instanceof Error ? error.message : String(error);
      if (msg.includes('closing') || msg.includes('hidden') || msg.includes('offline')) return;
      console.warn('Firestore custom_fields snapshot error:', error);
      if (onError) onError(error);
    }
  );
}

export async function createCustomFieldInFirestore(field: CustomFieldDefinition): Promise<void> {
  const docRef = doc(db, CUSTOM_FIELDS_COLLECTION, field.id);
  try {
    await setDoc(docRef, sanitizeForFirestore(field));
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `custom_fields/${field.id}`);
  }
}

export async function updateCustomFieldInFirestore(id: string, updates: Partial<CustomFieldDefinition>): Promise<void> {
  const docRef = doc(db, CUSTOM_FIELDS_COLLECTION, id);
  try {
    await updateDoc(docRef, sanitizeForFirestore(updates));
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `custom_fields/${id}`);
  }
}

export async function deleteCustomFieldFromFirestore(id: string): Promise<void> {
  const docRef = doc(db, CUSTOM_FIELDS_COLLECTION, id);
  try {
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `custom_fields/${id}`);
  }
}

// ==================== SPRINTS CRUD ====================

export async function fetchSprintsFromFirestore(): Promise<Sprint[]> {
  try {
    const colRef = collection(db, SPRINTS_COLLECTION);
    const snapshot = await getDocs(colRef);
    const sprints: Sprint[] = [];
    snapshot.forEach((docSnap) => {
      sprints.push({ id: docSnap.id, ...docSnap.data() } as Sprint);
    });
    return sprints;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, SPRINTS_COLLECTION);
    return [];
  }
}

export function subscribeToSprints(onUpdate: (sprints: Sprint[]) => void, onError?: (error: unknown) => void) {
  const colRef = collection(db, SPRINTS_COLLECTION);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const sprints: Sprint[] = [];
      snapshot.forEach((docSnap) => {
        sprints.push({ id: docSnap.id, ...docSnap.data() } as Sprint);
      });
      onUpdate(sprints);
    },
    (error) => {
      const msg = error instanceof Error ? error.message : String(error);
      if (msg.includes('closing') || msg.includes('hidden') || msg.includes('offline')) return;
      console.warn('Firestore sprints snapshot error:', error);
      if (onError) onError(error);
    }
  );
}

export async function createSprintInFirestore(sprint: Sprint): Promise<void> {
  const docRef = doc(db, SPRINTS_COLLECTION, sprint.id);
  try {
    await setDoc(docRef, sanitizeForFirestore(sprint));
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `sprints/${sprint.id}`);
  }
}

export async function updateSprintInFirestore(id: string, updates: Partial<Sprint>): Promise<void> {
  const docRef = doc(db, SPRINTS_COLLECTION, id);
  try {
    await updateDoc(docRef, sanitizeForFirestore(updates));
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `sprints/${id}`);
  }
}

export async function deleteSprintFromFirestore(id: string): Promise<void> {
  const docRef = doc(db, SPRINTS_COLLECTION, id);
  try {
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `sprints/${id}`);
  }
}

// ==================== ACTIVITY & AUDIT LOGS CRUD ====================

export async function fetchActivityLogsFromFirestore(): Promise<ActivityLog[]> {
  try {
    const colRef = collection(db, ACTIVITY_LOGS_COLLECTION);
    const snapshot = await getDocs(colRef);
    const logs: ActivityLog[] = [];
    snapshot.forEach((docSnap) => {
      logs.push({ id: docSnap.id, ...docSnap.data() } as ActivityLog);
    });
    return logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, ACTIVITY_LOGS_COLLECTION);
    return [];
  }
}

export function subscribeToActivityLogs(onUpdate: (logs: ActivityLog[]) => void, onError?: (error: unknown) => void) {
  const colRef = collection(db, ACTIVITY_LOGS_COLLECTION);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const logs: ActivityLog[] = [];
      snapshot.forEach((docSnap) => {
        logs.push({ id: docSnap.id, ...docSnap.data() } as ActivityLog);
      });
      const sorted = logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      onUpdate(sorted);
    },
    (error) => {
      const msg = error instanceof Error ? error.message : String(error);
      if (msg.includes('closing') || msg.includes('hidden') || msg.includes('offline')) return;
      console.warn('Firestore activity_logs snapshot error:', error);
      if (onError) onError(error);
    }
  );
}

export async function createActivityLogInFirestore(log: ActivityLog): Promise<void> {
  const docRef = doc(db, ACTIVITY_LOGS_COLLECTION, log.id);
  try {
    await setDoc(docRef, sanitizeForFirestore(log));
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `activity_logs/${log.id}`);
  }
}

// ==================== NOTIFICATIONS CRUD ====================

export async function fetchNotificationsFromFirestore(): Promise<Notification[]> {
  try {
    const colRef = collection(db, NOTIFICATIONS_COLLECTION);
    const snapshot = await getDocs(colRef);
    const notifs: Notification[] = [];
    snapshot.forEach((docSnap) => {
      notifs.push({ id: docSnap.id, ...docSnap.data() } as Notification);
    });
    return notifs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, NOTIFICATIONS_COLLECTION);
    return [];
  }
}

export function subscribeToNotifications(onUpdate: (notifs: Notification[]) => void, onError?: (error: unknown) => void) {
  const colRef = collection(db, NOTIFICATIONS_COLLECTION);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const notifs: Notification[] = [];
      snapshot.forEach((docSnap) => {
        notifs.push({ id: docSnap.id, ...docSnap.data() } as Notification);
      });
      const sorted = notifs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      onUpdate(sorted);
    },
    (error) => {
      const msg = error instanceof Error ? error.message : String(error);
      if (msg.includes('closing') || msg.includes('hidden') || msg.includes('offline')) return;
      console.warn('Firestore notifications snapshot error:', error);
      if (onError) onError(error);
    }
  );
}

export async function createNotificationInFirestore(notif: Notification): Promise<void> {
  const docRef = doc(db, NOTIFICATIONS_COLLECTION, notif.id);
  try {
    await setDoc(docRef, sanitizeForFirestore(notif));
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `notifications/${notif.id}`);
  }
}

export async function updateNotificationInFirestore(id: string, updates: Partial<Notification>): Promise<void> {
  const docRef = doc(db, NOTIFICATIONS_COLLECTION, id);
  try {
    await updateDoc(docRef, sanitizeForFirestore(updates));
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `notifications/${id}`);
  }
}

export async function deleteNotificationFromFirestore(id: string): Promise<void> {
  const docRef = doc(db, NOTIFICATIONS_COLLECTION, id);
  try {
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `notifications/${id}`);
  }
}

// ==================== AUTOMATIONS CRUD ====================

export async function fetchAutomationsFromFirestore(): Promise<AutomationRule[]> {
  try {
    const colRef = collection(db, AUTOMATIONS_COLLECTION);
    const snapshot = await getDocs(colRef);
    const automations: AutomationRule[] = [];
    snapshot.forEach((docSnap) => {
      automations.push({ id: docSnap.id, ...docSnap.data() } as AutomationRule);
    });
    return automations;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, AUTOMATIONS_COLLECTION);
    return [];
  }
}

export function subscribeToAutomations(onUpdate: (automations: AutomationRule[]) => void, onError?: (error: unknown) => void) {
  const colRef = collection(db, AUTOMATIONS_COLLECTION);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const automations: AutomationRule[] = [];
      snapshot.forEach((docSnap) => {
        automations.push({ id: docSnap.id, ...docSnap.data() } as AutomationRule);
      });
      onUpdate(automations);
    },
    (error) => {
      const msg = error instanceof Error ? error.message : String(error);
      if (msg.includes('closing') || msg.includes('hidden') || msg.includes('offline')) return;
      console.warn('Firestore automations snapshot error:', error);
      if (onError) onError(error);
    }
  );
}

export async function createAutomationInFirestore(rule: AutomationRule): Promise<void> {
  const docRef = doc(db, AUTOMATIONS_COLLECTION, rule.id);
  try {
    await setDoc(docRef, sanitizeForFirestore(rule));
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `automations/${rule.id}`);
  }
}

export async function updateAutomationInFirestore(id: string, updates: Partial<AutomationRule>): Promise<void> {
  const docRef = doc(db, AUTOMATIONS_COLLECTION, id);
  try {
    await updateDoc(docRef, sanitizeForFirestore(updates));
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `automations/${id}`);
  }
}

export async function deleteAutomationFromFirestore(id: string): Promise<void> {
  const docRef = doc(db, AUTOMATIONS_COLLECTION, id);
  try {
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `automations/${id}`);
  }
}

// ==================== EMAIL THREADS CRUD ====================

export async function fetchEmailThreadsFromFirestore(): Promise<EmailThread[]> {
  try {
    const colRef = collection(db, EMAIL_THREADS_COLLECTION);
    const snapshot = await getDocs(colRef);
    const threads: EmailThread[] = [];
    snapshot.forEach((docSnap) => {
      threads.push({ id: docSnap.id, ...docSnap.data() } as EmailThread);
    });
    return threads.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, EMAIL_THREADS_COLLECTION);
    return [];
  }
}

export function subscribeToEmailThreads(onUpdate: (threads: EmailThread[]) => void, onError?: (error: unknown) => void) {
  const colRef = collection(db, EMAIL_THREADS_COLLECTION);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const threads: EmailThread[] = [];
      snapshot.forEach((docSnap) => {
        threads.push({ id: docSnap.id, ...docSnap.data() } as EmailThread);
      });
      const sorted = threads.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      onUpdate(sorted);
    },
    (error) => {
      const msg = error instanceof Error ? error.message : String(error);
      if (msg.includes('closing') || msg.includes('hidden') || msg.includes('offline')) return;
      console.warn('Firestore email_threads snapshot error:', error);
      if (onError) onError(error);
    }
  );
}

export async function createEmailThreadInFirestore(thread: EmailThread): Promise<void> {
  const docRef = doc(db, EMAIL_THREADS_COLLECTION, thread.id);
  try {
    await setDoc(docRef, sanitizeForFirestore(thread));
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `email_threads/${thread.id}`);
  }
}

export async function updateEmailThreadInFirestore(id: string, updates: Partial<EmailThread>): Promise<void> {
  const docRef = doc(db, EMAIL_THREADS_COLLECTION, id);
  try {
    await updateDoc(docRef, sanitizeForFirestore(updates));
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `email_threads/${id}`);
  }
}

export async function deleteEmailThreadFromFirestore(id: string): Promise<void> {
  const docRef = doc(db, EMAIL_THREADS_COLLECTION, id);
  try {
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `email_threads/${id}`);
  }
}

// ==================== PROJECT TEMPLATES CRUD ====================

export async function fetchProjectTemplatesFromFirestore(): Promise<ProjectTemplate[]> {
  try {
    const colRef = collection(db, PROJECT_TEMPLATES_COLLECTION);
    const snapshot = await getDocs(colRef);
    const templates: ProjectTemplate[] = [];
    snapshot.forEach((docSnap) => {
      templates.push({ id: docSnap.id, ...docSnap.data() } as ProjectTemplate);
    });
    return templates;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, PROJECT_TEMPLATES_COLLECTION);
    return [];
  }
}

export function subscribeToProjectTemplates(onUpdate: (templates: ProjectTemplate[]) => void, onError?: (error: unknown) => void) {
  const colRef = collection(db, PROJECT_TEMPLATES_COLLECTION);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const templates: ProjectTemplate[] = [];
      snapshot.forEach((docSnap) => {
        templates.push({ id: docSnap.id, ...docSnap.data() } as ProjectTemplate);
      });
      onUpdate(templates);
    },
    (error) => {
      const msg = error instanceof Error ? error.message : String(error);
      if (msg.includes('closing') || msg.includes('hidden') || msg.includes('offline')) return;
      console.warn('Firestore project_templates snapshot error:', error);
      if (onError) onError(error);
    }
  );
}

export async function createProjectTemplateInFirestore(template: ProjectTemplate): Promise<void> {
  const docRef = doc(db, PROJECT_TEMPLATES_COLLECTION, template.id);
  try {
    await setDoc(docRef, sanitizeForFirestore(template));
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `project_templates/${template.id}`);
  }
}

export async function updateProjectTemplateInFirestore(id: string, updates: Partial<ProjectTemplate>): Promise<void> {
  const docRef = doc(db, PROJECT_TEMPLATES_COLLECTION, id);
  try {
    await updateDoc(docRef, sanitizeForFirestore(updates));
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `project_templates/${id}`);
  }
}

export async function deleteProjectTemplateFromFirestore(id: string): Promise<void> {
  const docRef = doc(db, PROJECT_TEMPLATES_COLLECTION, id);
  try {
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `project_templates/${id}`);
  }
}

// ==================== AUTHORIZED DOMAINS CRUD ====================

export async function fetchAuthorizedDomainsFromFirestore(): Promise<string[] | null> {
  try {
    const docRef = doc(db, SETTINGS_COLLECTION, AUTH_DOMAINS_DOC_ID);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data().domains || [];
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `${SETTINGS_COLLECTION}/${AUTH_DOMAINS_DOC_ID}`);
    return null;
  }
}

export async function saveAuthorizedDomainsToFirestore(domains: string[]): Promise<void> {
  const docRef = doc(db, SETTINGS_COLLECTION, AUTH_DOMAINS_DOC_ID);
  try {
    await setDoc(docRef, sanitizeForFirestore({
      domains,
      updatedAt: new Date().toISOString()
    }), { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${SETTINGS_COLLECTION}/${AUTH_DOMAINS_DOC_ID}`);
  }
}

export function subscribeToAuthorizedDomains(onUpdate: (domains: string[]) => void, onError?: (error: unknown) => void) {
  const docRef = doc(db, SETTINGS_COLLECTION, AUTH_DOMAINS_DOC_ID);
  return onSnapshot(
    docRef,
    (docSnap) => {
      if (docSnap.exists()) {
        const domains = docSnap.data().domains;
        if (Array.isArray(domains)) {
          onUpdate(domains);
        }
      }
    },
    (error) => {
      const msg = error instanceof Error ? error.message : String(error);
      if (msg.includes('closing') || msg.includes('hidden') || msg.includes('offline')) return;
      console.warn('Firestore auth_domains snapshot error:', error);
      if (onError) onError(error);
    }
  );
}
