import { TaskStatus } from '../types';

/**
 * Normalizes any string representation of a status into standard TaskStatus enum values:
 * 'Backlog' | 'To Do' | 'In Progress' | 'In Review' | 'Done'
 */
export const normalizeTaskStatus = (rawStatus: string | undefined | null): TaskStatus => {
  if (!rawStatus) return 'To Do';
  const clean = String(rawStatus).trim().toLowerCase();

  if (clean === 'done' || clean === 'completed' || clean === 'complete' || clean === 'closed' || clean === 'finished') {
    return 'Done';
  }
  if (clean.includes('review') || clean.includes('qa') || clean.includes('audit')) {
    return 'In Review';
  }
  if (
    clean.includes('prog') ||
    clean.includes('doing') ||
    clean.includes('active') ||
    clean.includes('working') ||
    clean.includes('wip') ||
    clean === 'in-progress'
  ) {
    return 'In Progress';
  }
  if (clean === 'backlog' || clean === 'deferred' || clean === 'later' || clean === 'draft') {
    return 'Backlog';
  }
  return 'To Do';
};

/**
 * Standardized status badge styling across Table, Kanban, Timeline, Activity, etc.
 * - To Do / Backlog = Gray / Slate
 * - In Progress = Blue / Teal
 * - In Review = Amber / Yellow
 * - Done / Completed = Emerald Green
 */
export const getStatusBadgeStyle = (status: TaskStatus | string, isLight: boolean = false): string => {
  const norm = normalizeTaskStatus(status);
  switch (norm) {
    case 'Done':
      return isLight
        ? 'bg-emerald-100 text-emerald-800 border-emerald-300 font-bold'
        : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-bold';
    case 'In Review':
      return isLight
        ? 'bg-amber-100 text-amber-800 border-amber-300 font-bold'
        : 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-bold';
    case 'In Progress':
      return isLight
        ? 'bg-sky-100 text-[#0773BB] border-sky-300 font-extrabold'
        : 'bg-sky-500/20 text-sky-300 border-sky-500/40 font-extrabold';
    case 'To Do':
      return isLight
        ? 'bg-slate-200 text-slate-800 border-slate-300 font-medium'
        : 'bg-slate-500/20 text-slate-300 border-slate-500/40 font-medium';
    case 'Backlog':
    default:
      return isLight
        ? 'bg-slate-100 text-slate-600 border-slate-200 font-medium'
        : 'bg-slate-600/20 text-slate-400 border-slate-600/40 font-medium';
  }
};

/**
 * Standardized status indicator dot colors.
 */
export const getStatusDotColor = (status: TaskStatus | string): string => {
  const norm = normalizeTaskStatus(status);
  switch (norm) {
    case 'Done':
      return 'bg-emerald-400 shadow-sm shadow-emerald-400/50';
    case 'In Review':
      return 'bg-amber-400 shadow-sm shadow-amber-400/50';
    case 'In Progress':
      return 'bg-sky-400 shadow-sm shadow-sky-400/50';
    case 'To Do':
      return 'bg-slate-400 shadow-sm shadow-slate-400/50';
    case 'Backlog':
    default:
      return 'bg-slate-500 shadow-sm shadow-slate-500/50';
  }
};

/**
 * Standardized header accent border for Kanban columns or card headers.
 */
export const getStatusHeaderAccent = (status: TaskStatus | string): string => {
  const norm = normalizeTaskStatus(status);
  switch (norm) {
    case 'Done':
      return 'border-t-2 border-t-emerald-500';
    case 'In Review':
      return 'border-t-2 border-t-amber-500';
    case 'In Progress':
      return 'border-t-2 border-t-[#0773BB]';
    case 'To Do':
      return 'border-t-2 border-t-slate-400';
    case 'Backlog':
    default:
      return 'border-t-2 border-t-slate-500';
  }
};

/**
 * Standardized text color class for status labels.
 */
export const getStatusTextColor = (status: TaskStatus | string, isLight: boolean = false): string => {
  const norm = normalizeTaskStatus(status);
  switch (norm) {
    case 'Done':
      return isLight ? 'text-emerald-700' : 'text-emerald-400';
    case 'In Review':
      return isLight ? 'text-amber-700' : 'text-amber-400';
    case 'In Progress':
      return isLight ? 'text-[#0773BB]' : 'text-sky-300';
    case 'To Do':
    case 'Backlog':
    default:
      return isLight ? 'text-slate-700' : 'text-slate-300';
  }
};
