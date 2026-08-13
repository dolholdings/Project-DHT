import { Task } from '../types';

/**
 * Checks if a task title or string is a generic ID like 't_1', 't-123', 'task_1786549541753_27', 'T-1786549541753_27', or purely numeric/timestamp.
 */
export function isGenericTaskId(str?: string | null): boolean {
  if (!str) return true;
  const clean = String(str).trim().toLowerCase();
  return (
    !clean ||
    /^(t|tsk|task)[_\s-]*\d+([_\s-]\d+)*$/i.test(clean) ||
    /^(t|tsk|task)[_\s-]*[a-f0-9-]+$/i.test(clean) ||
    /^\d+([_\s-]\d+)*$/.test(clean) ||
    /^id:\s*/i.test(clean)
  );
}

/**
 * Returns a meaningful title for displaying a task.
 * If the task title is generic (like 't_1' or 'T-1786549541753_27') and a description exists,
 * it showcases the task description as the main display title. Otherwise returns a clean fallback.
 */
export function getDisplayTaskTitle(task: Partial<Task> | null | undefined): string {
  if (!task) return 'New Task';
  const rawTitle = (task.title || '').trim();
  const rawDesc = (task.description || '').trim();

  // If title is a generic ID string like 'T-1786549541753_27' or 'task_178...'
  if (isGenericTaskId(rawTitle)) {
    if (rawDesc && !isGenericTaskId(rawDesc) && !/^imported from csv/i.test(rawDesc)) {
      return rawDesc;
    }
    return 'New Task';
  }

  return rawTitle || (rawDesc && !isGenericTaskId(rawDesc) ? rawDesc : 'New Task');
}

/**
 * Returns secondary subtext or description for a task card or row.
 * Filters out generic fallback strings and raw ID numbers.
 */
export function getTaskSubtext(task: Partial<Task> | null | undefined): string {
  if (!task) return '';
  const rawDesc = (task.description || '').trim();

  if (
    !rawDesc ||
    isGenericTaskId(rawDesc) ||
    /^imported from csv/i.test(rawDesc) ||
    /^imported from cvs/i.test(rawDesc)
  ) {
    return '';
  }

  // Avoid duplicating description if description is already displayed as the main title
  const mainTitle = getDisplayTaskTitle(task);
  if (mainTitle.toLowerCase() === rawDesc.toLowerCase()) {
    return '';
  }

  return rawDesc;
}

