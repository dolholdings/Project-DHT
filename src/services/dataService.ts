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
import { Project, Task, ProjectFile, User, Company } from '../types';

const COMPANIES_COLLECTION = 'companies';
const PROJECTS_COLLECTION = 'projects';
const TASKS_COLLECTION = 'tasks';
const FILES_COLLECTION = 'files';
const USERS_COLLECTION = 'users';
const SETTINGS_COLLECTION = 'settings';
const BRANDING_DOC_ID = 'branding';

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
    return users;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, USERS_COLLECTION);
    return [];
  }
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
      onUpdate(users);
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
  const docRef = doc(db, USERS_COLLECTION, user.id);
  try {
    await setDoc(docRef, sanitizeForFirestore(user));
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `users/${user.id}`);
  }
}

export async function updateUserInFirestore(id: string, updates: Partial<User>): Promise<void> {
  const docRef = doc(db, USERS_COLLECTION, id);
  try {
    await updateDoc(docRef, sanitizeForFirestore(updates));
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `users/${id}`);
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
  initialCompanies: Company[] = []
): Promise<void> {
  try {
    // 1. Companies / Workspaces seeding
    if (initialCompanies.length > 0) {
      const existingCompanies = await fetchCompaniesFromFirestore();
      for (const ic of initialCompanies) {
        if (!existingCompanies.some((c) => c.id === ic.id || c.code === ic.code || c.domain === ic.domain)) {
          await createCompanyInFirestore(ic);
        }
      }
    }

    // 2. Users seeding
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
    const existingUsers = await fetchUsersFromFirestore();
    for (const u of existingUsers) {
      if (legacyEmails.includes(u.email.toLowerCase())) {
        await deleteUserFromFirestore(u.id);
      }
    }

    const remainingUsers = await fetchUsersFromFirestore();
    if (initialUsers.length > 0) {
      for (const iu of initialUsers) {
        const existing = remainingUsers.find((u) => u.email.toLowerCase() === iu.email.toLowerCase() || u.id === iu.id);
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
