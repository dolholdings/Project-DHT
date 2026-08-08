import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Project, Task, ProjectFile, User } from '../types';

const PROJECTS_COLLECTION = 'projects';
const TASKS_COLLECTION = 'tasks';
const FILES_COLLECTION = 'files';
const USERS_COLLECTION = 'users';

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
    await setDoc(docRef, project);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `projects/${project.id}`);
  }
}

export async function updateProjectInFirestore(id: string, updates: Partial<Project>): Promise<void> {
  const docRef = doc(db, PROJECTS_COLLECTION, id);
  try {
    await updateDoc(docRef, updates);
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
    await setDoc(docRef, task);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `tasks/${task.id}`);
  }
}

export async function updateTaskInFirestore(id: string, updates: Partial<Task>): Promise<void> {
  const docRef = doc(db, TASKS_COLLECTION, id);
  try {
    await updateDoc(docRef, updates);
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
    await setDoc(docRef, file);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `files/${file.id}`);
  }
}

export async function updateFileInFirestore(id: string, updates: Partial<ProjectFile>): Promise<void> {
  const docRef = doc(db, FILES_COLLECTION, id);
  try {
    await updateDoc(docRef, updates);
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
    await setDoc(docRef, user);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `users/${user.id}`);
  }
}

export async function updateUserInFirestore(id: string, updates: Partial<User>): Promise<void> {
  const docRef = doc(db, USERS_COLLECTION, id);
  try {
    await updateDoc(docRef, updates);
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

// Seed initial data into Firestore if collection is empty
export async function seedInitialFirestoreData(
  initialProjects: Project[],
  initialTasks: Task[],
  initialFiles: ProjectFile[] = [],
  initialUsers: User[] = []
): Promise<void> {
  try {
    const existingUsers = await fetchUsersFromFirestore();
    if (existingUsers.length === 0 && initialUsers.length > 0) {
      for (const u of initialUsers) {
        await createUserInFirestore(u);
      }
    }
    const existingProjects = await fetchProjectsFromFirestore();
    if (existingProjects.length === 0) {
      for (const p of initialProjects) {
        await createProjectInFirestore(p);
      }
    }
    const existingTasks = await fetchTasksFromFirestore();
    if (existingTasks.length === 0) {
      for (const t of initialTasks) {
        await createTaskInFirestore(t);
      }
    }
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
