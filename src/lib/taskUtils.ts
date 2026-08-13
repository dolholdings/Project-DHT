import { Task } from '../types';

/**
 * Checks if a task title is a generic ID like 't_1', 't_2', 't-123', 'tsk_1', 'task_1', or purely numeric.
 */
export function isGenericTaskId(titleStr?: string | null): boolean {
  if (!titleStr) return true;
  const clean = String(titleStr).trim().toLowerCase();
  return (
    !clean ||
    /^t[_\s-]*\d+$/i.test(clean) ||
    /^tsk[_\s-]*\d+$/i.test(clean) ||
    /^task[_\s-]*\d+$/i.test(clean) ||
    /^\d+$/.test(clean)
  );
}

/**
 * Returns a meaningful title for displaying a task.
 * If the task title is generic (like 't_1' or 't_2') and a description exists,
 * it showcases the task description (or short description) as the main display title.
 */
export function getDisplayTaskTitle(task: Partial<Task> | null | undefined): string {
  if (!task) return 'Untitled Task';
  const rawTitle = (task.title || '').trim();
  const rawDesc = (task.description || '').trim();

  if (isGenericTaskId(rawTitle) && rawDesc) {
    return rawDesc;
  }

  return rawTitle || rawDesc || 'Untitled Task';
}

/**
 * Returns secondary subtext or description for a task card or row.
 * If the task title was generic (e.g. 't_1') and the description was showcased as the title,
 * this returns the original task ID tag (e.g. 'ID: t_1') so ID context is preserved.
 */
export function getTaskSubtext(task: Partial<Task> | null | undefined): string {
  if (!task) return '';
  const rawTitle = (task.title || '').trim();
  const rawDesc = (task.description || '').trim();

  if (isGenericTaskId(rawTitle) && rawDesc) {
    return rawTitle ? `ID: ${rawTitle}` : '';
  }

  return rawDesc;
}
