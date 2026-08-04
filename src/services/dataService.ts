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
import { Project, Task } from '../types';

const PROJECTS_COLLECTION = 'projects';
const TASKS_COLLECTION = 'tasks';

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

// Seed initial data into Firestore if collection is empty
export async function seedInitialFirestoreData(initialProjects: Project[], initialTasks: Task[]): Promise<void> {
  try {
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
  } catch (error) {
    console.warn('Could not seed initial Firestore data automatically:', error);
  }
}
